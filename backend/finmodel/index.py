"""Финансовая модель: авансовые и фактические доходы — история, сезонность, прогноз по трём сценариям."""
import os
import json
import datetime
from decimal import Decimal

import psycopg2
from psycopg2.extras import RealDictCursor, execute_values

S = "t_p93118852_lineaschool_initiati"
SCENARIOS = ("min", "base", "opt")
MONTHS_RU = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
    "Access-Control-Max-Age": "86400",
}


def resp(code, payload):
    return {
        "statusCode": code,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(payload, ensure_ascii=False, default=_ser),
        "isBase64Encoded": False,
    }


def _ser(v):
    if isinstance(v, Decimal):
        return float(v)
    if isinstance(v, (datetime.date, datetime.datetime)):
        return v.isoformat()
    return str(v)


def add_months(month_id, n):
    y, m = int(month_id[:4]), int(month_id[5:7])
    t = y * 12 + (m - 1) + n
    return f"{t // 12:04d}-{t % 12 + 1:02d}"


def month_label(month_id):
    return f"{MONTHS_RU[int(month_id[5:7]) - 1]} {month_id[:4]}"


def msk_today():
    return (datetime.datetime.utcnow() + datetime.timedelta(hours=3)).date()


def current_month():
    return msk_today().strftime("%Y-%m")


def auth(cur, event):
    h = event.get("headers") or {}
    token = h.get("X-Auth-Token") or h.get("x-auth-token")
    if not token:
        return None
    cur.execute(
        f"SELECT s.id, s.full_name, s.role FROM {S}.staff_sessions ss "
        f"JOIN {S}.staff s ON s.id = ss.staff_id "
        "WHERE ss.token = %s AND ss.expires_at > now() AND s.status = 'active'",
        (token,),
    )
    row = cur.fetchone()
    return dict(row) if row and row["role"] == "head" else None


def constants(cur):
    cur.execute(f"SELECT key, value_num, value_text FROM {S}.fm_constants")
    out = {}
    for r in cur.fetchall():
        out[r["key"]] = float(r["value_num"]) if r["value_num"] is not None else r["value_text"]
    return out


def history(cur):
    cur.execute(
        f"SELECT month_id, avans, source, closed, closed_at, exclude_from_seasonality, note "
        f"FROM {S}.fm_avans_monthly ORDER BY month_id"
    )
    return [dict(r) for r in cur.fetchall()]


def months_to_close(hist):
    """Месяцы, которые уже прошли, но ещё не закрыты (обычно — один прошлый месяц)."""
    closed = {h["month_id"] for h in hist if h["closed"]}
    last_closed = max(closed) if closed else "2026-08"
    prev = add_months(current_month(), -1)
    out, m = [], add_months(last_closed, 1)
    while m <= prev:
        if m not in closed and m >= "2026-09":
            out.append(m)
        m = add_months(m, 1)
    return out


def recalc(cur, c):
    """Пересчёт сезонности (окно 12 закрытых месяцев) и прогноза на горизонт по трём сценариям."""
    hist = [h for h in history(cur) if h["closed"]]
    usable = [h for h in hist if not h["exclude_from_seasonality"]]
    window = usable[-12:]
    if len(window) < 12:
        return
    annual = sum(float(h["avans"]) for h in window)
    period = f"{month_label(window[0]['month_id'])} – {month_label(window[-1]['month_id'])}"
    new_shares = {int(h["month_id"][5:7]): float(h["avans"]) / annual * 100 for h in window}

    if c.get("seasonality_method") == "exp":
        cur.execute(f"SELECT month_num, share_pct FROM {S}.fm_seasonality")
        old = {r["month_num"]: float(r["share_pct"]) for r in cur.fetchall()}
        if len(old) == 12:
            a = float(c.get("seasonality_alpha") or 0.3)
            blended = {k: old[k] * (1 - a) + new_shares[k] * a for k in new_shares}
            total = sum(blended.values())
            new_shares = {k: v / total * 100 for k, v in blended.items()}

    by_num = {int(h["month_id"][5:7]): float(h["avans"]) for h in window}
    for num, share in new_shares.items():
        cur.execute(
            f"INSERT INTO {S}.fm_seasonality (month_num, share_pct, avans, updated_at, source_period) "
            "VALUES (%s, %s, %s, now(), %s) ON CONFLICT (month_num) DO UPDATE SET "
            "share_pct = EXCLUDED.share_pct, avans = EXCLUDED.avans, "
            "updated_at = now(), source_period = EXCLUDED.source_period",
            (num, round(share, 6), by_num[num], period),
        )

    fact = {h["month_id"]: float(h["avans"]) for h in hist}
    horizon = int(c.get("forecast_horizon_months") or 12)
    threshold = float(c.get("avans_seasonal_threshold_pct") or 15) / 100
    first = add_months(hist[-1]["month_id"], 1)
    cur.execute(f"DELETE FROM {S}.fm_avans_forecast WHERE month_id <= %s", (hist[-1]["month_id"],))

    for sc in SCENARIOS:
        coef = float(c[f"avans_coef_{sc}"])
        annual_fc = annual * coef
        for i in range(horizon):
            m = add_months(first, i)
            prev_y = fact.get(add_months(m, -12))
            share = new_shares[int(m[5:7])] / 100
            seasonal = annual_fc * share
            if prev_y is None:
                direct, diff, final = None, None, seasonal
            else:
                direct = prev_y * coef
                diff = abs(direct - seasonal) / direct if direct else 0
                final = (direct + seasonal) / 2 if diff > threshold else direct
            cur.execute(
                f"INSERT INTO {S}.fm_avans_forecast (month_id, scenario, avans_prev_year, coef, "
                "forecast_direct, forecast_seasonal, diff_pct, forecast_final, calculated_at) "
                "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,now()) ON CONFLICT (month_id, scenario) DO UPDATE SET "
                "avans_prev_year=EXCLUDED.avans_prev_year, coef=EXCLUDED.coef, "
                "forecast_direct=EXCLUDED.forecast_direct, forecast_seasonal=EXCLUDED.forecast_seasonal, "
                "diff_pct=EXCLUDED.diff_pct, forecast_final=EXCLUDED.forecast_final, calculated_at=now()",
                (
                    m, sc, prev_y, coef,
                    round(direct) if direct is not None else None,
                    round(seasonal),
                    round(diff * 100, 4) if diff is not None else None,
                    round(final),
                ),
            )


def forecast_stale(cur):
    cur.execute(
        f"SELECT (SELECT max(closed_at) FROM {S}.fm_avans_monthly) AS last_close, "
        f"(SELECT min(calculated_at) FROM {S}.fm_avans_forecast) AS calc, "
        f"(SELECT count(*) FROM {S}.fm_avans_forecast) AS n"
    )
    r = cur.fetchone()
    return r["n"] == 0 or (r["last_close"] and r["calc"] and r["last_close"] > r["calc"])


def get_avans(cur, conn):
    c = constants(cur)
    if forecast_stale(cur):
        recalc(cur, c)
        conn.commit()
    hist = history(cur)
    cur.execute(f"SELECT * FROM {S}.fm_seasonality ORDER BY month_num")
    seas = [dict(r) for r in cur.fetchall()]
    cur.execute(f"SELECT * FROM {S}.fm_avans_forecast ORDER BY month_id, scenario")
    rows = [dict(r) for r in cur.fetchall()]
    forecast = {}
    for r in rows:
        f = forecast.setdefault(r["month_id"], {"month_id": r["month_id"], "avans_prev_year": r["avans_prev_year"]})
        f[r["scenario"]] = r
    return {
        "ok": True,
        "today": msk_today().isoformat(),
        "current_month": current_month(),
        "history": hist,
        "seasonality": seas,
        "seasonality_total_pct": round(sum(float(s["share_pct"]) for s in seas), 4),
        "forecast": list(forecast.values()),
        "active_scenario": c.get("avans_scenario_active") or "base",
        "coefs": {sc: c[f"avans_coef_{sc}"] for sc in SCENARIOS},
        "threshold_pct": c.get("avans_seasonal_threshold_pct"),
        "seasonality_method": c.get("seasonality_method"),
        "to_close": months_to_close(hist),
        "updated_at": max((r["calculated_at"] for r in rows), default=None),
    }


def close_month(cur, conn, body):
    month = str(body.get("month") or "")
    hist = history(cur)
    if month not in months_to_close(hist):
        return resp(400, {"error": f"Месяц {month} нельзя закрыть: он не завершён или уже закрыт"})
    try:
        avans = round(float(body.get("avans")), 2)
    except (TypeError, ValueError):
        return resp(400, {"error": "Нужна сумма авансов"})
    cur.execute(
        f"INSERT INTO {S}.fm_avans_monthly (month_id, avans, source, closed, closed_at, note) "
        "VALUES (%s, %s, 'report', true, now(), 'Отчёт «Авансовые доходы», закрыт автоматически') "
        "ON CONFLICT (month_id) DO NOTHING",
        (month, avans),
    )
    c = constants(cur)
    recalc(cur, c)
    recalc_fact(cur, c)
    conn.commit()
    return resp(200, {"ok": True, "month": month, "avans": avans})


def set_scenario(cur, conn, body):
    sc = body.get("scenario")
    if sc not in SCENARIOS:
        return resp(400, {"error": "Сценарий: min / base / opt"})
    cur.execute(
        f"UPDATE {S}.fm_constants SET value_text = %s, updated_at = now() WHERE key = 'avans_scenario_active'",
        (sc,),
    )
    conn.commit()
    return resp(200, {"ok": True, "active_scenario": sc})


# ---------------- ФАКТИЧЕСКИЕ ДОХОДЫ ----------------
# Факт — заработанное (проведённые уроки), аванс — пришедшие деньги. Хранятся в разных
# таблицах и никогда не смешиваются. Прогноз факта = прогноз аванса × коэф. факт/аванс.


def fact_history(cur):
    cur.execute(
        f"SELECT month_id, fact, source, closed, closed_at, exclude_from_seasonality, note "
        f"FROM {S}.fm_fact_monthly ORDER BY month_id"
    )
    return [dict(r) for r in cur.fetchall()]


def recalc_fact(cur, c):
    """Сезонность факта и коэф. факт/аванс (окно 12 закрытых месяцев), затем прогноз по 3 сценариям."""
    facts = [h for h in fact_history(cur) if h["closed"] and not h["exclude_from_seasonality"]]
    avans = {h["month_id"]: float(h["avans"]) for h in history(cur) if h["closed"]}
    # В окно берём только месяцы, где закрыты и факт, и аванс — иначе коэффициент не посчитать.
    window = [h for h in facts if h["month_id"] in avans][-12:]
    if len(window) < 12:
        return
    annual = sum(float(h["fact"]) for h in window)
    period = f"{month_label(window[0]['month_id'])} – {month_label(window[-1]['month_id'])}"
    shares, coefs = {}, {}
    for h in window:
        num, f = int(h["month_id"][5:7]), float(h["fact"])
        a = avans[h["month_id"]]
        shares[num] = f / annual * 100
        coefs[num] = f / a if a else 0
        cur.execute(
            f"INSERT INTO {S}.fm_seasonality_fact (month_num, share_pct, fact, updated_at, source_period) "
            "VALUES (%s,%s,%s,now(),%s) ON CONFLICT (month_num) DO UPDATE SET share_pct=EXCLUDED.share_pct, "
            "fact=EXCLUDED.fact, updated_at=now(), source_period=EXCLUDED.source_period",
            (num, round(shares[num], 6), f, period),
        )
        cur.execute(
            f"INSERT INTO {S}.fm_fact_coefs (month_num, coef, fact, avans, updated_at, source_period) "
            "VALUES (%s,%s,%s,%s,now(),%s) ON CONFLICT (month_num) DO UPDATE SET coef=EXCLUDED.coef, "
            "fact=EXCLUDED.fact, avans=EXCLUDED.avans, updated_at=now(), source_period=EXCLUDED.source_period",
            (num, round(coefs[num], 6), f, a, period),
        )

    fact_by_month = {h["month_id"]: float(h["fact"]) for h in fact_history(cur) if h["closed"]}
    threshold = float(c.get("avans_seasonal_threshold_pct") or 15) / 100
    cur.execute(f"SELECT month_id, scenario, forecast_final FROM {S}.fm_avans_forecast")
    av_fc = [dict(r) for r in cur.fetchall()]
    cur.execute(f"DELETE FROM {S}.fm_fact_forecast")
    for r in av_fc:
        m, sc = r["month_id"], r["scenario"]
        num = int(m[5:7])
        av = float(r["forecast_final"])
        coef = coefs[num]
        direct = av * coef
        seasonal = annual * float(c[f"avans_coef_{sc}"]) * shares[num] / 100
        diff = abs(direct - seasonal) / direct if direct else 0
        final = (direct + seasonal) / 2 if diff > threshold else direct
        cur.execute(
            f"INSERT INTO {S}.fm_fact_forecast (month_id, scenario, fact_prev_year, avans_forecast, coef, "
            "fact_direct, fact_seasonal, diff_pct, fact_final, calculated_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,now())",
            (m, sc, fact_by_month.get(add_months(m, -12)), round(av), round(coef, 6),
             round(direct), round(seasonal), round(diff * 100, 4), round(final)),
        )


def fact_stale(cur):
    cur.execute(
        f"SELECT (SELECT max(closed_at) FROM {S}.fm_fact_monthly) AS last_close, "
        f"(SELECT max(calculated_at) FROM {S}.fm_avans_forecast) AS avans_calc, "
        f"(SELECT min(calculated_at) FROM {S}.fm_fact_forecast) AS calc, "
        f"(SELECT count(*) FROM {S}.fm_fact_forecast) AS n"
    )
    r = cur.fetchone()
    if r["n"] == 0 or not r["calc"]:
        return True
    return any(t and t > r["calc"] for t in (r["last_close"], r["avans_calc"]))


def get_fact(cur, conn):
    c = constants(cur)
    if forecast_stale(cur):
        recalc(cur, c)
        conn.commit()
    if fact_stale(cur):
        recalc_fact(cur, c)
        conn.commit()
    hist = fact_history(cur)
    cur.execute(f"SELECT * FROM {S}.fm_seasonality_fact ORDER BY month_num")
    seas = [dict(r) for r in cur.fetchall()]
    cur.execute(f"SELECT month_num, share_pct FROM {S}.fm_seasonality ORDER BY month_num")
    seas_avans = {r["month_num"]: r["share_pct"] for r in cur.fetchall()}
    cur.execute(f"SELECT * FROM {S}.fm_fact_coefs ORDER BY month_num")
    coefs = [dict(r) for r in cur.fetchall()]
    cur.execute(f"SELECT * FROM {S}.fm_fact_forecast ORDER BY month_id, scenario")
    rows = [dict(r) for r in cur.fetchall()]
    forecast = {}
    for r in rows:
        f = forecast.setdefault(r["month_id"], {"month_id": r["month_id"], "fact_prev_year": r["fact_prev_year"], "coef": r["coef"]})
        f[r["scenario"]] = r
    avans = {h["month_id"]: h["avans"] for h in history(cur)}
    return {
        "ok": True,
        "current_month": current_month(),
        "history": [{**h, "avans": avans.get(h["month_id"])} for h in hist],
        "seasonality": [{**s, "avans_share_pct": seas_avans.get(s["month_num"])} for s in seas],
        "seasonality_total_pct": round(sum(float(s["share_pct"]) for s in seas), 4),
        "coefs": coefs,
        "forecast": list(forecast.values()),
        "active_scenario": c.get("avans_scenario_active") or "base",
        "growth_coefs": {sc: c[f"avans_coef_{sc}"] for sc in SCENARIOS},
        "threshold_pct": c.get("avans_seasonal_threshold_pct"),
        "to_close": fact_months_to_close(hist),
        "updated_at": max((r["calculated_at"] for r in rows), default=None),
    }


def fact_months_to_close(hist):
    closed = {h["month_id"] for h in hist if h["closed"]}
    last_closed = max(closed) if closed else "2026-08"
    prev = add_months(current_month(), -1)
    out, m = [], add_months(last_closed, 1)
    while m <= prev:
        if m not in closed:
            out.append(m)
        m = add_months(m, 1)
    return out


def close_fact_month(cur, conn, body):
    month = str(body.get("month") or "")
    if month not in fact_months_to_close(fact_history(cur)):
        return resp(400, {"error": f"Месяц {month} нельзя закрыть: он не завершён или уже закрыт"})
    try:
        fact = round(float(body.get("fact")), 2)
    except (TypeError, ValueError):
        return resp(400, {"error": "Нужна сумма факта"})
    if fact <= 0:
        return resp(400, {"error": "Отчёт вернул нулевой факт — месяц не закрыт"})
    cur.execute(
        f"INSERT INTO {S}.fm_fact_monthly (month_id, fact, source, closed, closed_at, note) "
        "VALUES (%s, %s, 'report', true, now(), 'Отчёт «Фактические доходы», закрыт автоматически') "
        "ON CONFLICT (month_id) DO NOTHING",
        (month, fact),
    )
    c = constants(cur)
    recalc(cur, c)
    recalc_fact(cur, c)
    conn.commit()
    return resp(200, {"ok": True, "month": month, "fact": fact})


# ---------------- ПОСТУПЛЕНИЯ И ПЕРЕМЕННЫЕ ----------------
# Поступления = прогноз АВАНСА × (1 − эквайринг) — для Cash Flow и выплаты собственнику.
# Переменные = прогноз ФАКТА × переменный %. Марж. прибыль = ФАКТ − переменные (не от поступлений).
# Переменный % = 100 − средняя маржинальность урока (уже включает зарплату, СФР, отпускные, эквайринг).


MARGIN_FIRST_MONTH = "2026-09"  # раньше чётких данных по маржинальности урока нет


def sync_margin_from_report(cur):
    """Маржинальность берём из сохранённых расчётов «Маржинальности урока» — последний расчёт месяца.
    Ничего не пересчитываем: только переносим готовый процент. Возвращает True, если что-то изменилось."""
    cur.execute(
        f"SELECT DISTINCT ON (period_month) period_month, "
        f"(result->'monthTotals'->>'marginPercent')::numeric AS margin "
        f"FROM {S}.unit_margin_reports "
        f"WHERE period_month >= %s AND result->'monthTotals'->>'marginPercent' IS NOT NULL "
        f"ORDER BY period_month, created_at DESC",
        (MARGIN_FIRST_MONTH,),
    )
    changed = False
    for r in cur.fetchall():
        margin = round(float(r["margin"]), 4)
        cur.execute(
            f"SELECT margin_pct, source FROM {S}.fm_variable_pct_monthly WHERE month_id = %s",
            (r["period_month"],),
        )
        old = cur.fetchone()
        if old and old["source"] == "report" and old["margin_pct"] is not None and float(old["margin_pct"]) == margin:
            continue
        cur.execute(
            f"INSERT INTO {S}.fm_variable_pct_monthly (month_id, variable_pct, margin_pct, source, note, updated_at) "
            "VALUES (%s,%s,%s,'report','Отчёт «Маржинальность урока» → «Средняя маржинальность за месяц»',now()) "
            "ON CONFLICT (month_id) DO UPDATE SET variable_pct = EXCLUDED.variable_pct, margin_pct = EXCLUDED.margin_pct, "
            "source = 'report', note = EXCLUDED.note, updated_at = now()",
            (r["period_month"], round(100 - margin, 4), margin),
        )
        changed = True
    return changed


def variable_pcts(cur):
    cur.execute(f"SELECT * FROM {S}.fm_variable_pct_monthly ORDER BY month_id")
    return [dict(r) for r in cur.fetchall()]


def resolve_variable_pct(rows, month):
    """Свой процент месяца (отчёт или override), иначе — последнее известное значение до этого месяца."""
    own = next((r for r in rows if r["month_id"] == month), None)
    if own:
        return float(own["variable_pct"]), own["source"]
    prev = [r for r in rows if r["month_id"] < month]
    if prev:
        return float(prev[-1]["variable_pct"]), "last"
    return None, None


def recalc_revenue(cur, c):
    acq = float(c.get("acquiring_pct") or 0)
    pcts = variable_pcts(cur)
    cur.execute(f"SELECT month_id, scenario, forecast_final FROM {S}.fm_avans_forecast")
    avans = {(r["month_id"], r["scenario"]): float(r["forecast_final"]) for r in cur.fetchall()}
    cur.execute(f"SELECT month_id, scenario, fact_final FROM {S}.fm_fact_forecast")
    fact = {(r["month_id"], r["scenario"]): float(r["fact_final"]) for r in cur.fetchall()}
    cur.execute(f"DELETE FROM {S}.fm_revenue_monthly")
    for key, av in avans.items():
        if key not in fact:
            continue
        m, sc = key
        vp, src = resolve_variable_pct(pcts, m)
        if vp is None:
            continue
        revenue = av * (1 - acq / 100)
        # Переменный % берём целиком — как в отчёте маржинальности (с эквайрингом).
        var_amount = fact[key] * vp / 100
        cur.execute(
            f"INSERT INTO {S}.fm_revenue_monthly (month_id, scenario, avans, fact, acquiring_pct, revenue, "
            "variable_pct, variable_pct_net, variable_pct_source, variable_amount, margin_amount, calculated_at) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,now())",
            (m, sc, round(av), round(fact[key]), acq, round(revenue), vp, None, src,
             round(var_amount), round(fact[key]) - round(var_amount)),
        )


def revenue_stale(cur):
    cur.execute(
        f"SELECT (SELECT min(calculated_at) FROM {S}.fm_revenue_monthly) AS calc, "
        f"(SELECT count(*) FROM {S}.fm_revenue_monthly) AS n, "
        f"(SELECT count(*) FROM {S}.fm_revenue_monthly WHERE margin_amount <> fact - variable_amount) AS n_old, "
        f"(SELECT max(calculated_at) FROM {S}.fm_fact_forecast) AS fact_calc, "
        f"(SELECT max(updated_at) FROM {S}.fm_variable_pct_monthly) AS pct_upd, "
        f"(SELECT updated_at FROM {S}.fm_constants WHERE key = 'acquiring_pct') AS acq_upd"
    )
    r = cur.fetchone()
    if r["n"] == 0 or not r["calc"] or r["n_old"] > 0:
        return True
    return any(t and t > r["calc"] for t in (r["fact_calc"], r["pct_upd"], r["acq_upd"]))


# ---------------- УЧЕНИКИ И ЗАНЯТИЯ (справочно) ----------------
# Все три показателя уже есть в отчётах админки (вариант А): отдельное подключение AlfaCRM не нужно.
#  • активные ученики — «Динамика учеников» (student_count_weekly, последняя неделя месяца);
#  • всего занятий и наполняемость групп — «Маржинальность урока» (margin_unit_cache);
#  • уроков на ученика = всего занятий / активные ученики.
# В расчёт переменных расходов не входят. Прошедший месяц закрывается руководителем после сверки
# (данными отчётов или вручную); закрытый месяц больше не меняется.

STUDENTS_FIRST_MONTH = "2025-09"


def _lessons_per_student(total, active):
    return round(total / active, 2) if total is not None and active else None


def students_from_reports(cur, months):
    cur.execute(
        f"SELECT DISTINCT ON (to_char(week_start,'YYYY-MM')) to_char(week_start,'YYYY-MM') AS m, active_count "
        f"FROM {S}.student_count_weekly WHERE to_char(week_start,'YYYY-MM') = ANY(%s) "
        f"ORDER BY to_char(week_start,'YYYY-MM'), week_start DESC",
        (months,),
    )
    active = {r["m"]: r["active_count"] for r in cur.fetchall()}
    cur.execute(
        f"SELECT month, computed_at, "
        f"(payload->'individual'->>'lessons')::int + (payload->'group'->>'lessons')::int AS lessons, "
        f"(payload->'group'->>'avg_group_size')::numeric AS fill "
        f"FROM {S}.margin_unit_cache WHERE month = ANY(%s) AND payload ? 'group'",
        (months,),
    )
    margin = {r["month"]: r for r in cur.fetchall()}
    out = {}
    for m in months:
        mr = margin.get(m)
        # Снято до конца месяца — значит неполное.
        complete = bool(mr) and mr["computed_at"].strftime("%Y-%m") > m
        out[m] = {
            "active_students": active.get(m),
            "total_lessons": mr["lessons"] if mr else None,
            "avg_group_fill": float(mr["fill"]) if mr and mr["fill"] is not None else None,
            "report_complete": complete,
            "report_at": mr["computed_at"] if mr else None,
        }
    return out


def get_students(cur, conn):
    cur_m = current_month()
    months, m = [], STUDENTS_FIRST_MONTH
    while m <= cur_m:
        months.append(m)
        m = add_months(m, 1)
    cur.execute(f"SELECT * FROM {S}.fm_students_monthly")
    stored = {r["month_id"]: dict(r) for r in cur.fetchall()}
    live = students_from_reports(cur, months)

    rows = []
    for m in reversed(months):
        s, rep = stored.get(m), live[m]
        if s and s["closed"]:
            rows.append({**s, "state": "closed", "report_complete": True})
            continue
        # Открытый месяц: ручные значения приоритетнее, пустые — из отчётов «на сейчас».
        s = s or {}
        active = s.get("active_students") if s.get("active_students") is not None else rep["active_students"]
        lessons = s.get("total_lessons") if s.get("total_lessons") is not None else rep["total_lessons"]
        fill = s.get("avg_group_fill") if s.get("avg_group_fill") is not None else rep["avg_group_fill"]
        rows.append({
            "month_id": m,
            "active_students": active,
            "total_lessons": lessons,
            "avg_lessons_per_student": _lessons_per_student(lessons, active),
            "avg_group_fill": float(fill) if fill is not None else None,
            "source": s.get("source") or "report",
            "lessons_source": s.get("lessons_source") or "report",
            "closed": False,
            "note": s.get("note") or "",
            "updated_at": s.get("updated_at") or rep["report_at"],
            "state": "current" if m == cur_m else "open",
            "report_complete": rep["report_complete"],
            "has_report": rep["total_lessons"] is not None,
        })
    return {"ok": True, "current_month": cur_m, "rows": rows, "alfa_connection": "not_needed"}


def close_students(cur, conn, body):
    """Закрыть прошедший месяц цифрами отчётов (снятыми после окончания месяца)."""
    month = str(body.get("month") or "")
    if not (STUDENTS_FIRST_MONTH <= month < current_month()):
        return resp(400, {"error": "Закрыть можно только прошедший месяц"})
    cur.execute(f"SELECT closed FROM {S}.fm_students_monthly WHERE month_id = %s", (month,))
    row = cur.fetchone()
    if row and row["closed"]:
        return resp(400, {"error": "Месяц уже закрыт"})
    rep = students_from_reports(cur, [month])[month]
    if not rep["report_complete"] or not rep["active_students"] or rep["total_lessons"] is None:
        return resp(400, {"error": "В отчётах нет полных данных за месяц — обновите «Маржинальность урока» или введите вручную"})
    cur.execute(
        f"INSERT INTO {S}.fm_students_monthly (month_id, active_students, total_lessons, "
        "avg_lessons_per_student, avg_group_fill, source, lessons_source, closed, note, updated_at) "
        "VALUES (%s,%s,%s,%s,%s,'report','report',true,'Закрыт по отчётам',now()) "
        "ON CONFLICT (month_id) DO UPDATE SET active_students=EXCLUDED.active_students, "
        "total_lessons=EXCLUDED.total_lessons, avg_lessons_per_student=EXCLUDED.avg_lessons_per_student, "
        "avg_group_fill=EXCLUDED.avg_group_fill, source='report', lessons_source='report', closed=true, "
        "note=EXCLUDED.note, updated_at=now()",
        (month, rep["active_students"], rep["total_lessons"],
         _lessons_per_student(rep["total_lessons"], rep["active_students"]), rep["avg_group_fill"]),
    )
    conn.commit()
    return resp(200, {"ok": True})


def set_students(cur, conn, body):
    month = str(body.get("month") or "")
    if not (STUDENTS_FIRST_MONTH <= month < current_month()):
        return resp(400, {"error": "Вручную вводятся только прошедшие месяцы"})
    cur.execute(f"SELECT closed FROM {S}.fm_students_monthly WHERE month_id = %s", (month,))
    row = cur.fetchone()
    if row and row["closed"]:
        return resp(400, {"error": "Месяц закрыт — данные больше не меняются"})

    def num(key, cast):
        v = body.get(key)
        if v is None or v == "":
            return None
        try:
            v = cast(float(v))
        except (TypeError, ValueError):
            raise ValueError(key)
        if v < 0:
            raise ValueError(key)
        return v

    try:
        active = num("active_students", int)
        lessons = num("total_lessons", int)
        fill = num("avg_group_fill", lambda x: round(x, 2))
    except ValueError:
        return resp(400, {"error": "Значения должны быть неотрицательными числами"})
    if not active or lessons is None:
        return resp(400, {"error": "Нужны активные ученики (> 0) и всего занятий"})
    cur.execute(
        f"INSERT INTO {S}.fm_students_monthly (month_id, active_students, total_lessons, avg_lessons_per_student, "
        "avg_group_fill, source, lessons_source, closed, note, updated_at) "
        "VALUES (%s,%s,%s,%s,%s,'manual','manual',true,'Введено вручную',now()) "
        "ON CONFLICT (month_id) DO UPDATE SET active_students=EXCLUDED.active_students, "
        "total_lessons=EXCLUDED.total_lessons, avg_lessons_per_student=EXCLUDED.avg_lessons_per_student, "
        "avg_group_fill=EXCLUDED.avg_group_fill, source='manual', lessons_source='manual', closed=true, "
        "note=EXCLUDED.note, updated_at=now()",
        (month, active, lessons, _lessons_per_student(lessons, active), fill),
    )
    conn.commit()
    return resp(200, {"ok": True})


def get_revenue(cur, conn):
    c = constants(cur)
    if sync_margin_from_report(cur):
        conn.commit()
    if forecast_stale(cur):
        recalc(cur, c)
        conn.commit()
    if fact_stale(cur):
        recalc_fact(cur, c)
        conn.commit()
    if revenue_stale(cur):
        recalc_revenue(cur, c)
        conn.commit()
    cur.execute(f"SELECT * FROM {S}.fm_revenue_monthly ORDER BY month_id, scenario")
    rows = [dict(r) for r in cur.fetchall()]
    out = {}
    for r in rows:
        f = out.setdefault(r["month_id"], {"month_id": r["month_id"], "variable_pct": r["variable_pct"],
                                            "variable_pct_source": r["variable_pct_source"]})
        f[r["scenario"]] = r
    return {
        "ok": True,
        "acquiring_pct": c.get("acquiring_pct"),
        "active_scenario": c.get("avans_scenario_active") or "base",
        "variable_pcts": variable_pcts(cur),
        "forecast": list(out.values()),
        "updated_at": max((r["calculated_at"] for r in rows), default=None),
    }


def set_variable_pct(cur, conn, body):
    month = str(body.get("month") or "")
    cur.execute(f"SELECT 1 FROM {S}.fm_months WHERE id = %s", (month,))
    if not cur.fetchone():
        return resp(400, {"error": "Нет такого месяца"})
    cur.execute(f"SELECT source FROM {S}.fm_variable_pct_monthly WHERE month_id = %s", (month,))
    existing = cur.fetchone()
    if existing and existing["source"] == "report":
        return resp(400, {"error": "Маржинальность этого месяца взята из отчёта — её не меняем"})
    if month < MARGIN_FIRST_MONTH:
        return resp(400, {"error": "До сентября 2026 данных по маржинальности нет"})
    raw = body.get("variable_pct")
    if raw is None or raw == "":
        cur.execute(f"DELETE FROM {S}.fm_variable_pct_monthly WHERE month_id = %s AND source = 'override'", (month,))
    else:
        try:
            vp = round(float(raw), 4)
        except (TypeError, ValueError):
            return resp(400, {"error": "Процент должен быть числом"})
        if not 0 <= vp <= 100:
            return resp(400, {"error": "Процент от 0 до 100"})
        cur.execute(
            f"INSERT INTO {S}.fm_variable_pct_monthly (month_id, variable_pct, margin_pct, source, updated_at) "
            "VALUES (%s,%s,%s,'override',now()) ON CONFLICT (month_id) DO UPDATE SET "
            "variable_pct = EXCLUDED.variable_pct, margin_pct = EXCLUDED.margin_pct, updated_at = now()",
            (month, vp, round(100 - vp, 4)),
        )
    recalc_revenue(cur, constants(cur))
    conn.commit()
    return resp(200, {"ok": True})


# ---------------- ПОСТОЯННЫЕ РАСХОДЫ ----------------
# Фиксированные суммы, не % от выручки. Одинаковы во всех сценариях, кроме бонуса РУО (0,5 % от аванса).
# Ставки сотрудников — из справочника fm_staff (+ помесячные override в fm_staff_monthly).
# Реклама, нейронка нерегуляр, дизайнеры — ручной ввод по месяцам (fm_expense_monthly), иначе значение по умолчанию.

FIXED_FIRST_MONTH = "2026-09"
STAFF_ROWS = [("ruo_salary", "ruo_zinchenko"), ("accountant", "accountant"),
              ("targetologist", "targetologist"), ("developer", "developer")]


def _r(v):
    return int(round(float(v) + 1e-9))


def fixed_months(cur):
    cur.execute(f"SELECT max(month_id) AS m FROM {S}.fm_avans_forecast")
    last = (cur.fetchone() or {}).get("m") or add_months(FIXED_FIRST_MONTH, 11)
    out, m = [], FIXED_FIRST_MONTH
    while m <= last:
        out.append(m)
        m = add_months(m, 1)
    return out


def avans_by_month(cur):
    """Аванс для бонуса РУО: закрытый месяц — факт (одинаков во всех сценариях), иначе прогноз сценария."""
    cur.execute(f"SELECT month_id, avans FROM {S}.fm_avans_monthly WHERE closed")
    closed = {r["month_id"]: float(r["avans"]) for r in cur.fetchall()}
    cur.execute(f"SELECT month_id, scenario, forecast_final FROM {S}.fm_avans_forecast")
    out = {}
    for r in cur.fetchall():
        out.setdefault(r["month_id"], {})[r["scenario"]] = float(r["forecast_final"])
    for m, v in closed.items():
        out[m] = {sc: v for sc in SCENARIOS}
    return out, set(closed)


def calc_fixed(cur):
    c = constants(cur)
    ins_pct = float(c.get("insurance_pct") or 30) / 100
    vac_pct = float(c.get("vacation_reserve_pct") or 12.5) / 100
    shifts_default = int(c.get("admin_shifts_default") or 30)
    months = fixed_months(cur)
    avans, closed = avans_by_month(cur)

    cur.execute(f"SELECT * FROM {S}.fm_staff")
    staff = {r["id"]: dict(r) for r in cur.fetchall()}
    cur.execute(f"SELECT * FROM {S}.fm_staff_monthly")
    staff_m = {(r["staff_id"], r["month_id"]): dict(r) for r in cur.fetchall()}
    cur.execute(f"SELECT * FROM {S}.fm_expense_items WHERE category IN ('fixed','ano') ORDER BY sort")
    items = {r["id"]: dict(r) for r in cur.fetchall()}
    cur.execute(f"SELECT * FROM {S}.fm_expense_monthly")
    ovr = {(r["month_id"], r["expense_id"]): dict(r) for r in cur.fetchall()}
    cur.execute(f"SELECT * FROM {S}.fm_monthly_inputs")
    inputs = {r["month_id"]: dict(r) for r in cur.fetchall()}
    ano = {r["month_id"]: r["total"] for r in ano_rows(cur)}

    admins = [s for s in staff.values() if s["role"] == "admin"]
    admin_rate_default = float(admins[0]["rate"]) if admins else 700
    ruo = staff.get("ruo_zinchenko") or {}

    def staff_rate(sid, m):
        o = staff_m.get((sid, m))
        if o and o.get("rate_override") is not None:
            return float(o["rate_override"]), "override", o.get("note") or ""
        return float(staff[sid]["rate"] or 0), "staff", ""

    rows = {}

    def row(key, name, source, group, note=""):
        rows[key] = {"key": key, "name": name, "source": source, "group": group, "note": note,
                     "values": {}, "sources": {}, "notes": {}, "editable": False}
        return rows[key]

    def put(key, m, val, src=None, note=None):
        v = val if isinstance(val, dict) else {sc: val for sc in SCENARIOS}
        rows[key]["values"][m] = {sc: _r(x) for sc, x in v.items()}
        if src:
            rows[key]["sources"][m] = src
        if note:
            rows[key]["notes"][m] = note

    # Порядок строк — как в таблице промта.
    row("ruo_salary", "РУО (оклад)", "staff", "staff", "0,5 ставки")
    row("ruo_bonus", f"РУО (бонус {fmt_pct(ruo.get('bonus_pct') or 0.5)} от аванса)", "calc", "staff")
    row("ruo_replacements", f"РУО (замены, {_r(ruo.get('substitution_rate') or 650)} ₽/урок)", "calc", "staff")
    row("ruo_insurance", "РУО (страховые 30%)", "calc", "staff")
    row("ruo_vacation", "РУО (отпускные 12,5%)", "calc", "staff")
    row("accountant", "Бухгалтер", "staff", "staff", "в чёрную")
    row("targetologist", "Директолог", "staff", "staff")
    row("developer", "Разработчик", "staff", "staff")
    row("admins", "Админы", "staff", "staff", "ставка × смены, 1 админ на смене")
    row("admins_insurance", "Админы (страховые 30%)", "calc", "staff")
    row("admins_vacation", "Админы (отпускные 12,5%)", "calc", "staff")
    for iid, it in items.items():
        if iid in dict(STAFF_ROWS) or it["category"] == "ano":
            continue
        r = row(iid, it["name"], "fixed" if it["is_fixed"] else "manual", "items",
                f"{_r(it['amount'] or 0):,} ₽/год ÷ 12".replace(",", " ") if it["amount_unit"] == "rub_year" else "")
        r["editable"] = not it["is_fixed"]
    rows["ruo_replacements"]["editable"] = True
    rows["admins"]["editable"] = True

    totals, payments = {}, []
    for m in months:
        inp = inputs.get(m) or {}
        # РУО
        base, src, note = staff_rate("ruo_zinchenko", m)
        put("ruo_salary", m, base, src, note)
        bpct = float(ruo.get("bonus_pct") or 0.5) / 100
        av = avans.get(m, {})
        bonus = {sc: (av.get(sc) or 0) * bpct for sc in SCENARIOS}
        put("ruo_bonus", m, bonus, "fact" if m in closed else "forecast")
        repl_n = int(inp.get("ruo_replacements") or 0)
        repl = repl_n * float(ruo.get("substitution_rate") or 650)
        put("ruo_replacements", m, repl, "manual" if inp.get("ruo_replacements") is not None else "default",
            f"{repl_n} ур." if repl_n else None)
        r_ins = base * ins_pct if ruo.get("insurance_applies") else 0
        r_vac = base * vac_pct if ruo.get("vacation_applies") else 0
        put("ruo_insurance", m, r_ins)
        put("ruo_vacation", m, r_vac)
        for sc in SCENARIOS:
            payments.append((m, "ruo_zinchenko", sc, _r(base), _r(r_ins), _r(r_vac), _r(bonus[sc]), _r(repl),
                             _r(base) + _r(r_ins) + _r(r_vac) + _r(bonus[sc]) + _r(repl)))
        # Прочие сотрудники на окладе
        for key, sid in STAFF_ROWS[1:]:
            if sid not in staff:
                continue
            val, src, note = staff_rate(sid, m)
            put(key, m, val, src, note)
            for sc in SCENARIOS:
                payments.append((m, sid, sc, _r(val), 0, 0, 0, 0, _r(val)))
        # Админы: ставка за смену × смены
        a_rate = float(inp["admin_rate_override"]) if inp.get("admin_rate_override") is not None else admin_rate_default
        shifts = int(inp["admin_shifts_override"]) if inp.get("admin_shifts_override") is not None else shifts_default
        a_base = a_rate * shifts
        a_manual = inp.get("admin_rate_override") is not None or inp.get("admin_shifts_override") is not None
        put("admins", m, a_base, "manual" if a_manual else "staff", f"{_r(a_rate)} ₽ × {shifts} смен")
        rows["admins"].setdefault("inputs", {})[m] = {"rate": a_rate, "shifts": shifts}
        a_ins, a_vac = a_base * ins_pct, a_base * vac_pct
        put("admins_insurance", m, a_ins)
        put("admins_vacation", m, a_vac)
        for sc in SCENARIOS:
            payments.append((m, "admins", sc, _r(a_base), _r(a_ins), _r(a_vac), 0, 0,
                             _r(a_base) + _r(a_ins) + _r(a_vac)))
        # Статьи справочника
        for iid, it in items.items():
            if iid not in rows or rows[iid]["group"] != "items":
                continue
            amount = float(it["amount"] or 0)
            if it["amount_unit"] == "rub_year":
                amount = amount / 12
            src = "fixed" if it["is_fixed"] else "default"
            o = ovr.get((m, iid))
            if o and not it["is_fixed"]:
                amount, src = float(o["amount"]), "manual"
            put(iid, m, amount, src, (o or {}).get("note") or None)

        tot = {sc: sum(r["values"][m][sc] for r in rows.values() if m in r["values"]) for sc in SCENARIOS}
        designers = rows.get("designers", {}).get("values", {}).get(m, {}).get("base", 0)
        totals[m] = {
            "total": tot,
            "total_wo_designers": {sc: tot[sc] - designers for sc in SCENARIOS},
            "ano": _r(ano.get(m, 0)),
            "total_with_ano": {sc: tot[sc] + _r(ano.get(m, 0)) for sc in SCENARIOS},
        }

    cur.execute(f"DELETE FROM {S}.fm_staff_monthly_payments")
    if payments:
        execute_values(
            cur,
            f"INSERT INTO {S}.fm_staff_monthly_payments (month_id, staff_id, scenario, base_amount, insurance, "
            "vacation, bonus, replacements, total) VALUES %s",
            payments, page_size=1000,
        )

    staff_list = [
        {"id": s["id"], "name": s["name"], "role": s["role"], "type": s["type"], "rate": s["rate"],
         "rate_unit": s["rate_unit"], "rate_max": s["rate_max"], "insurance_applies": s["insurance_applies"],
         "vacation_applies": s["vacation_applies"], "bonus_pct": s["bonus_pct"], "substitution_rate": s["substitution_rate"]}
        for s in staff.values() if s["role"] != "teacher"
    ]
    return {
        "ok": True,
        "current_month": current_month(),
        "months": months,
        "closed_avans": sorted(closed),
        "active_scenario": c.get("avans_scenario_active") or "base",
        "rows": list(rows.values()),
        "totals": totals,
        "ano": {m: {"amount": _r(ano.get(m, 0))} for m in months},
        "staff": staff_list,
        "insurance_pct": ins_pct * 100,
        "vacation_pct": vac_pct * 100,
        "admin_shifts_default": shifts_default,
    }


def fmt_pct(v):
    return f"{float(v):g}".replace(".", ",") + "%"


def get_fixed(cur, conn):
    c = constants(cur)
    if forecast_stale(cur):
        recalc(cur, c)
    out = calc_fixed(cur)
    conn.commit()
    return out


def _month_ok(cur, month):
    cur.execute(f"SELECT 1 FROM {S}.fm_months WHERE id = %s", (month,))
    return bool(cur.fetchone()) and month >= FIXED_FIRST_MONTH


def set_fixed_expense(cur, conn, body):
    """Ручная сумма статьи за месяц (реклама, нейронка нерегуляр, дизайнеры). amount=null — вернуть по умолчанию."""
    month, eid = str(body.get("month") or ""), str(body.get("expense_id") or "")
    if not _month_ok(cur, month):
        return resp(400, {"error": "Нет такого месяца"})
    cur.execute(f"SELECT is_fixed FROM {S}.fm_expense_items WHERE id = %s AND category = 'fixed'", (eid,))
    it = cur.fetchone()
    if not it:
        return resp(400, {"error": "Нет такой статьи"})
    if it["is_fixed"]:
        return resp(400, {"error": "Статья фиксированная — меняется только в справочнике"})
    raw = body.get("amount")
    if raw is None or raw == "":
        cur.execute(f"DELETE FROM {S}.fm_expense_monthly WHERE month_id = %s AND expense_id = %s", (month, eid))
    else:
        try:
            amount = round(float(raw), 2)
        except (TypeError, ValueError):
            return resp(400, {"error": "Сумма должна быть числом"})
        if amount < 0:
            return resp(400, {"error": "Сумма не может быть отрицательной"})
        cur.execute(
            f"INSERT INTO {S}.fm_expense_monthly (month_id, expense_id, amount, override, source, note) "
            "VALUES (%s,%s,%s,true,'manual','') ON CONFLICT (month_id, expense_id) DO UPDATE SET "
            "amount = EXCLUDED.amount, override = true, source = 'manual'",
            (month, eid, amount),
        )
    conn.commit()
    return resp(200, {"ok": True})


def set_month_inputs(cur, conn, body):
    """Помесячные вводы: замены РУО (кол-во уроков), смены и ставка админов (KPI). null — по умолчанию."""
    month = str(body.get("month") or "")
    if not _month_ok(cur, month):
        return resp(400, {"error": "Нет такого месяца"})
    fields = {"ruo_replacements": int, "admin_shifts_override": int, "admin_rate_override": float}
    sets = {}
    for k, cast in fields.items():
        if k not in body:
            continue
        v = body[k]
        if v is None or v == "":
            sets[k] = None
            continue
        try:
            v = cast(float(v))
        except (TypeError, ValueError):
            return resp(400, {"error": "Значение должно быть числом"})
        if v < 0:
            return resp(400, {"error": "Значение не может быть отрицательным"})
        sets[k] = v
    if not sets:
        return resp(400, {"error": "Нечего сохранять"})
    cur.execute(f"INSERT INTO {S}.fm_monthly_inputs (month_id) VALUES (%s) ON CONFLICT (month_id) DO NOTHING", (month,))
    for k, v in sets.items():
        cur.execute(f"UPDATE {S}.fm_monthly_inputs SET {k} = %s, updated_at = now() WHERE month_id = %s", (v, month))
    conn.commit()
    return resp(200, {"ok": True})


def set_staff_rate(cur, conn, body):
    """Ставка в справочнике сотрудников. Для админов меняется у всех админов сразу."""
    sid = str(body.get("staff_id") or "")
    try:
        rate = round(float(body.get("rate")), 2)
    except (TypeError, ValueError):
        return resp(400, {"error": "Ставка должна быть числом"})
    if rate < 0:
        return resp(400, {"error": "Ставка не может быть отрицательной"})
    cur.execute(f"SELECT role FROM {S}.fm_staff WHERE id = %s", (sid,))
    s = cur.fetchone()
    if not s or s["role"] == "teacher":
        return resp(400, {"error": "Нет такого сотрудника"})
    if s["role"] == "admin":
        cur.execute(f"UPDATE {S}.fm_staff SET rate = %s WHERE role = 'admin'", (rate,))
    else:
        cur.execute(f"UPDATE {S}.fm_staff SET rate = %s WHERE id = %s", (rate, sid))
    conn.commit()
    return resp(200, {"ok": True})


def set_staff_month_rate(cur, conn, body):
    """Разовая ставка сотрудника на конкретный месяц (например, директолог в сентябре). null — по справочнику."""
    sid, month = str(body.get("staff_id") or ""), str(body.get("month") or "")
    if sid not in dict((v, k) for k, v in STAFF_ROWS) or not _month_ok(cur, month):
        return resp(400, {"error": "Нет такого сотрудника или месяца"})
    raw = body.get("rate")
    if raw is None or raw == "":
        cur.execute(f"UPDATE {S}.fm_staff_monthly SET rate_override = NULL WHERE staff_id = %s AND month_id = %s", (sid, month))
    else:
        try:
            rate = round(float(raw), 2)
        except (TypeError, ValueError):
            return resp(400, {"error": "Ставка должна быть числом"})
        if rate < 0:
            return resp(400, {"error": "Ставка не может быть отрицательной"})
        cur.execute(
            f"INSERT INTO {S}.fm_staff_monthly (staff_id, month_id, rate_override, note) VALUES (%s,%s,%s,'Разовая ставка месяца') "
            "ON CONFLICT (staff_id, month_id) DO UPDATE SET rate_override = EXCLUDED.rate_override",
            (sid, month, rate),
        )
    conn.commit()
    return resp(200, {"ok": True})

# ---------------- КРЕДИТ ----------------
# Проценты фиксированные (1,99 % от первоначальной суммы) и не уменьшаются при погашении тела.
# Платятся, пока тело не закрыто. Последний платёж тела — остаток, чтобы сумма тела = сумме кредита.
# Штраф за просрочку — только справочно, в расчёт не входит.

CREDIT_OPTIONS = {"6m": ("credit_body_6m", 6), "12m": ("credit_body_12m", 12)}
CREDIT_HORIZON_END = "2027-12"


def credit_schedule_calc(c, option):
    total = round(float(c.get("credit_total") or 910000))
    interest = round(float(c.get("credit_interest_monthly") or 18109))
    body_key, n = CREDIT_OPTIONS[option]
    body_pm = round(float(c.get(body_key) or 0))
    start = c.get("credit_start_month") or "2026-10"
    rows, left, m, i = [], total, start, 0
    while m <= CREDIT_HORIZON_END:
        if left > 0 and i < n:
            body = left if i == n - 1 else min(body_pm, left)
            left -= body
            rows.append({"month_id": m, "interest": interest, "body": body, "total": interest + body,
                         "balance_after": left, "status": "active", "is_last": left == 0})
        else:
            rows.append({"month_id": m, "interest": 0, "body": 0, "total": 0,
                         "balance_after": 0, "status": "closed", "is_last": False})
        i += 1
        m = add_months(m, 1)
    return rows


def credit_summary(rows):
    paid = [r for r in rows if r["status"] == "active"]
    return {
        "interest": sum(r["interest"] for r in paid),
        "body": sum(r["body"] for r in paid),
        "total": sum(r["total"] for r in paid),
        "monthly": paid[0]["total"] if paid else 0,
        "months": len(paid),
        "close_month": paid[-1]["month_id"] if paid else None,
    }


def recalc_credit(cur, c):
    data = []
    for opt in CREDIT_OPTIONS:
        for r in credit_schedule_calc(c, opt):
            data.append((r["month_id"], opt, r["interest"], r["body"], r["total"], r["balance_after"], r["status"]))
    cur.execute(f"DELETE FROM {S}.fm_credit_schedule")
    execute_values(
        cur,
        f"INSERT INTO {S}.fm_credit_schedule (month_id, option, interest, body, total, balance_after, status) VALUES %s",
        data,
    )


def get_credit(cur, conn):
    c = constants(cur)
    recalc_credit(cur, c)
    conn.commit()
    option = c.get("credit_option_default") if c.get("credit_option_default") in CREDIT_OPTIONS else "6m"
    schedules, summary = {}, {}
    for opt in CREDIT_OPTIONS:
        rows = credit_schedule_calc(c, opt)
        schedules[opt] = rows
        summary[opt] = credit_summary(rows)
    penalty_fee = 990
    penalty_pct = round(float(c.get("credit_total") or 910000) * 0.01)
    return {
        "ok": True,
        "current_month": current_month(),
        "option": option,
        "params": {
            "total": round(float(c.get("credit_total") or 0)),
            "interest_monthly": round(float(c.get("credit_interest_monthly") or 0)),
            "rate_pct": 1.99,
            "body_6m": round(float(c.get("credit_body_6m") or 0)),
            "body_12m": round(float(c.get("credit_body_12m") or 0)),
            "start_month": c.get("credit_start_month") or "2026-10",
            "contract": c.get("credit_contract") or "",
        },
        "penalty_risk": {"amount": round(float(c.get("credit_penalty_risk") or 0)),
                         "fee": penalty_fee, "pct_part": penalty_pct, "period_days": 7},
        "schedules": schedules,
        "summary": summary,
        "diff": {
            "interest": summary["12m"]["interest"] - summary["6m"]["interest"],
            "total": summary["12m"]["total"] - summary["6m"]["total"],
            "monthly": summary["12m"]["monthly"] - summary["6m"]["monthly"],
        },
    }


def set_credit_option(cur, conn, body):
    opt = body.get("option")
    if opt not in CREDIT_OPTIONS:
        return resp(400, {"error": "Вариант погашения: 6m / 12m"})
    cur.execute(
        f"UPDATE {S}.fm_constants SET value_text = %s, updated_at = now() WHERE key = 'credit_option_default'",
        (opt,),
    )
    conn.commit()
    return resp(200, {"ok": True, "option": opt})

# ---------------- АНО ----------------
# Отдельная сущность, но расходы включаются в модель школы отдельной строкой (P&L, Cash Flow).
# В переменные расходы не входит. Ежемесячный платёж и доп. разовые суммы можно поправить вручную.

ANO_FIRST_MONTH = "2026-09"


def ano_rows(cur):
    cur.execute(f"SELECT * FROM {S}.fm_ano ORDER BY month_id")
    out = []
    for r in cur.fetchall():
        one = float(r["one_time"]) + float(r["extra_one_time"] or 0)
        monthly = float(r["monthly_override"]) if r["monthly_override"] is not None else float(r["monthly"])
        manual = r["monthly_override"] is not None or float(r["extra_one_time"] or 0) != 0
        out.append({
            "month_id": r["month_id"],
            "one_time": round(one),
            "one_time_schedule": round(float(r["one_time"])),
            "extra_one_time": round(float(r["extra_one_time"] or 0)),
            "monthly": round(monthly),
            "monthly_schedule": round(float(r["monthly"])),
            "total": round(one + monthly),
            "source": "manual" if manual else "schedule",
            "note": r["note"] or "",
        })
    return out


def get_ano(cur):
    c = constants(cur)
    rows = ano_rows(cur)
    year_from = add_months(c.get("credit_start_month") or "2026-10", -1)
    year = [r for r in rows if r["month_id"] <= add_months(year_from, 12)]
    return {
        "ok": True,
        "current_month": current_month(),
        "include_in_model": (c.get("ano_include_in_model") or "true") == "true",
        "params": {
            "one_time_total": round(float(c.get("ano_one_time_total") or 0)),
            "one_time_sep": round(float(c.get("ano_one_time_sep") or 0)),
            "one_time_oct": round(float(c.get("ano_one_time_oct") or 0)),
            "monthly": round(float(c.get("ano_monthly") or 0)),
            "start_monthly": c.get("ano_start_monthly") or "2026-11",
        },
        "rows": rows,
        "summary": {
            "period": [year[0]["month_id"], year[-1]["month_id"]] if year else None,
            "one_time": sum(r["one_time"] for r in year),
            "monthly": sum(r["monthly"] for r in year),
            "total": sum(r["total"] for r in year),
            "monthly_count": sum(1 for r in year if r["monthly"] > 0),
        },
    }


def set_ano(cur, conn, body):
    """Ручная правка месяца АНО: monthly — ежемесячный платёж (null — по графику), extra — доп. разовая сумма."""
    month = str(body.get("month") or "")
    cur.execute(f"SELECT 1 FROM {S}.fm_ano WHERE month_id = %s", (month,))
    if not cur.fetchone():
        if month < ANO_FIRST_MONTH:
            return resp(400, {"error": "АНО учитывается с сентября 2026"})
        cur.execute(f"SELECT 1 FROM {S}.fm_months WHERE id = %s", (month,))
        if not cur.fetchone():
            return resp(400, {"error": "Нет такого месяца"})
        cur.execute(f"INSERT INTO {S}.fm_ano (month_id) VALUES (%s)", (month,))

    def num(v):
        if v is None or v == "":
            return None
        try:
            v = round(float(v), 2)
        except (TypeError, ValueError):
            raise ValueError
        if v < 0:
            raise ValueError
        return v

    try:
        if "monthly" in body:
            cur.execute(f"UPDATE {S}.fm_ano SET monthly_override = %s WHERE month_id = %s", (num(body["monthly"]), month))
        if "extra" in body:
            cur.execute(f"UPDATE {S}.fm_ano SET extra_one_time = %s WHERE month_id = %s", (num(body["extra"]) or 0, month))
    except ValueError:
        return resp(400, {"error": "Сумма должна быть неотрицательным числом"})
    if "note" in body:
        cur.execute(f"UPDATE {S}.fm_ano SET note = %s WHERE month_id = %s", (str(body["note"] or "")[:200], month))
    conn.commit()
    return resp(200, {"ok": True})

# ---------------- НАЛОГИ ----------------
# УСН 6 % от аванса до перехода, затем патент (78 300 ₽/год = 6 525 ₽/мес, равномерно).
# Налог уменьшается на взносы в СФ (страховые за наёмных + фикс. взносы ИП за себя / 12),
# но не более чем на 50 %: Налог = max(исходный − СФ, исходный × 50 %). Режим месяца можно переопределить.

TAX_FIRST_MONTH = "2026-09"


def _c2(v):
    return round(float(v) + 1e-9, 2)


def tax_regime_default(c, m):
    start = c.get("start_patent_month") or "2026-12"
    return (c.get("tax_regime_default_after") or "patent") if m >= start else (c.get("tax_regime_default_before") or "usn")


def calc_taxes(cur):
    c = constants(cur)
    calc_fixed(cur)  # обновляет fm_staff_monthly_payments — страховые за сотрудников
    months = [m for m in fixed_months(cur) if m >= TAX_FIRST_MONTH]
    avans, closed = avans_by_month(cur)
    cur.execute(f"SELECT month_id, scenario, sum(insurance) AS ins FROM {S}.fm_staff_monthly_payments GROUP BY 1, 2")
    ins = {(r["month_id"], r["scenario"]): float(r["ins"]) for r in cur.fetchall()}
    cur.execute(f"SELECT month_id, tax_regime_override FROM {S}.fm_monthly_inputs WHERE tax_regime_override IS NOT NULL")
    ovr = {r["month_id"]: r["tax_regime_override"] for r in cur.fetchall()}

    usn_pct = float(c.get("tax_usn_pct") or 6) / 100
    patent_year = float(c.get("patent_cost_year") or 78300)
    patent_m = patent_year / 12
    self_year = float(c.get("fixed_self_contributions_2026") or 0)
    self_m = self_year / 12
    max_ded = float(c.get("max_deduction_pct") or 50) / 100

    def one(regime, av, sf):
        base = av if regime == "usn" else patent_m
        gross = base * usn_pct if regime == "usn" else patent_m
        net = max(gross - sf, gross * (1 - max_ded))
        return {"base": _c2(base), "tax_gross": _c2(gross), "tax_net": _c2(net),
                "reduction": _c2(gross - net), "limited": gross - sf < gross * (1 - max_ded)}

    rows, db, compare = [], [], {sc: {"usn": 0.0, "patent": 0.0} for sc in SCENARIOS}
    for m in months:
        regime = ovr.get(m) or tax_regime_default(c, m)
        row = {"month_id": m, "regime": regime, "regime_default": tax_regime_default(c, m),
               "source": "override" if m in ovr else "calculated",
               "avans_source": "fact" if m in closed else "forecast", "values": {}}
        for sc in SCENARIOS:
            av = (avans.get(m) or {}).get(sc) or 0
            emp = ins.get((m, sc), 0)
            sf = emp + self_m
            v = one(regime, av, sf)
            v.update({"social_fund": _c2(sf), "sf_employees": _c2(emp), "sf_self": _c2(self_m)})
            row["values"][sc] = v
            db.append((m, sc, regime, v["base"], v["tax_gross"], v["social_fund"], v["tax_net"], row["source"]))
            for rg in ("usn", "patent"):
                compare[sc][rg] += one(rg, av, sf)["tax_net"]
        rows.append(row)

    cur.execute(f"DELETE FROM {S}.fm_taxes_monthly")
    if db:
        execute_values(
            cur,
            f"INSERT INTO {S}.fm_taxes_monthly (month_id, scenario, regime, base, tax_gross, social_fund, tax_net, source) VALUES %s",
            db,
        )
    return {
        "ok": True,
        "current_month": current_month(),
        "active_scenario": c.get("avans_scenario_active") or "base",
        "rows": rows,
        "params": {
            "usn_pct": usn_pct * 100,
            "patent_year": _c2(patent_year),
            "patent_monthly": _c2(patent_m),
            "self_year": _c2(self_year),
            "self_monthly": _c2(self_m),
            "max_deduction_pct": max_ded * 100,
            "start_patent_month": c.get("start_patent_month") or "2026-12",
            "patent_schedule": c.get("patent_payment_schedule") or "",
        },
        "compare": {sc: {k: _c2(v) for k, v in compare[sc].items()} for sc in SCENARIOS},
        "compare_months": [months[0], months[-1]] if months else None,
    }


def get_taxes(cur, conn):
    c = constants(cur)
    if forecast_stale(cur):
        recalc(cur, c)
    out = calc_taxes(cur)
    conn.commit()
    return out


def set_tax_regime(cur, conn, body):
    month = str(body.get("month") or "")
    regime = body.get("regime")
    if month < TAX_FIRST_MONTH or not _month_ok(cur, month):
        return resp(400, {"error": "Нет такого месяца"})
    if regime not in ("usn", "patent", None, ""):
        return resp(400, {"error": "Режим: usn / patent"})
    cur.execute(f"INSERT INTO {S}.fm_monthly_inputs (month_id) VALUES (%s) ON CONFLICT (month_id) DO NOTHING", (month,))
    cur.execute(
        f"UPDATE {S}.fm_monthly_inputs SET tax_regime_override = %s, updated_at = now() WHERE month_id = %s",
        (regime or None, month),
    )
    conn.commit()
    return resp(200, {"ok": True})


def handler(event: dict, context) -> dict:
    """Финмодель: GET ?action=avans|fact|revenue|students|fixed|credit|ano|taxes — история, сезонность, прогноз; POST avans_close / fact_close / set_variable_pct / set_students / close_students / set_fixed_expense / set_month_inputs / set_staff_rate / set_staff_month_rate / set_scenario / set_credit_option / set_ano / set_tax_regime / recalc."""
    method = event.get("httpMethod", "GET")
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": "", "isBase64Encoded": False}

    conn = psycopg2.connect(os.environ["DATABASE_URL"], connect_timeout=5)
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        if not auth(cur, event):
            return resp(401, {"error": "Доступ только для руководителя"})

        if method == "GET":
            action = (event.get("queryStringParameters") or {}).get("action") or "avans"
            if action == "avans":
                return resp(200, get_avans(cur, conn))
            if action == "fact":
                return resp(200, get_fact(cur, conn))
            if action == "revenue":
                return resp(200, get_revenue(cur, conn))
            if action == "students":
                return resp(200, get_students(cur, conn))
            if action == "fixed":
                return resp(200, get_fixed(cur, conn))
            if action == "credit":
                return resp(200, get_credit(cur, conn))
            if action == "ano":
                return resp(200, get_ano(cur))
            if action == "taxes":
                return resp(200, get_taxes(cur, conn))
            return resp(400, {"error": "Неизвестное действие"})

        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            action = body.get("action")
            if action == "avans_close":
                return close_month(cur, conn, body)
            if action == "set_variable_pct":
                return set_variable_pct(cur, conn, body)
            if action == "fact_close":
                return close_fact_month(cur, conn, body)
            if action == "set_scenario":
                return set_scenario(cur, conn, body)
            if action == "set_tax_regime":
                return set_tax_regime(cur, conn, body)
            if action == "set_ano":
                return set_ano(cur, conn, body)
            if action == "set_credit_option":
                return set_credit_option(cur, conn, body)
            if action == "set_students":
                return set_students(cur, conn, body)
            if action == "close_students":
                return close_students(cur, conn, body)
            if action == "set_fixed_expense":
                return set_fixed_expense(cur, conn, body)
            if action == "set_month_inputs":
                return set_month_inputs(cur, conn, body)
            if action == "set_staff_rate":
                return set_staff_rate(cur, conn, body)
            if action == "set_staff_month_rate":
                return set_staff_month_rate(cur, conn, body)
            if action == "recalc":
                c = constants(cur)
                recalc(cur, c)
                recalc_fact(cur, c)
                recalc_revenue(cur, c)
                conn.commit()
                return resp(200, {"ok": True})
            return resp(400, {"error": "Неизвестное действие"})

        return resp(405, {"error": "Метод не поддерживается"})
    finally:
        conn.close()