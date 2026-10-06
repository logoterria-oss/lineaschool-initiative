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
    corr = adapt_corrections(cur, "avans")

    for sc in SCENARIOS:
        coef = float(c[f"avans_coef_{sc}"])
        annual_fc = annual * coef
        rows = []
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
            rows.append([m, prev_y, direct, seasonal, diff, final])
        k = anchor_factor(c, sc, hist[-1]["month_id"], fact.get(hist[-1]["month_id"]), first, rows[0][5] if rows else 0)
        for i, (m, prev_y, direct, seasonal, diff, final) in enumerate(rows):
            ki = anchor_fade(c, k, i)
            direct = direct * ki if direct is not None else None
            seasonal, final = seasonal * ki, final * ki
            # Адаптация (Промт 13): к модельному прогнозу прибавляем накопленные корректировки по факту.
            c_m = corr.get((m, ""), 0.0)
            final = max(round(final) + c_m, 0)
            cur.execute(
                f"INSERT INTO {S}.fm_avans_forecast (month_id, scenario, avans_prev_year, coef, "
                "forecast_direct, forecast_seasonal, diff_pct, forecast_final, correction, calculated_at) "
                "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,now()) ON CONFLICT (month_id, scenario) DO UPDATE SET "
                "avans_prev_year=EXCLUDED.avans_prev_year, coef=EXCLUDED.coef, "
                "forecast_direct=EXCLUDED.forecast_direct, forecast_seasonal=EXCLUDED.forecast_seasonal, "
                "diff_pct=EXCLUDED.diff_pct, forecast_final=EXCLUDED.forecast_final, "
                "correction=EXCLUDED.correction, calculated_at=now()",
                (
                    m, sc, prev_y, coef,
                    round(direct) if direct is not None else None,
                    round(seasonal),
                    round(diff * 100, 4) if diff is not None else None,
                    round(final),
                    c_m,
                ),
            )
    snapshot_forecasts(cur)


def anchor_factor(c, sc, last_month, last_value, first_month, first_forecast):
    """Привязка к последнему закрытому месяцу: в месяцы осеннего роста прогноз первого месяца
    не ниже последнего факта × (1 + рост сценария). Если ниже — возвращаем множитель,
    который затем затухает по anchor_fade."""
    months = str(c.get("anchor_months") or "")
    if not last_value or not first_forecast or str(int(first_month[5:7])) not in months.replace(" ", "").split(","):
        return 1.0
    if add_months(last_month, 1) != first_month:
        return 1.0
    growth = float(c.get(f"anchor_growth_pct_{sc}") or 0) / 100
    target = float(last_value) * (1 + growth)
    return max(1.0, target / float(first_forecast))


def anchor_fade(c, k, i):
    """Поправка привязки затухает: полная в первом прогнозном месяце, линейно до нуля
    за anchor_fade_months месяцев — дальше работает обычная модель «прошлый год × рост»."""
    fade = max(int(float(c.get("anchor_fade_months") or 3)), 1)
    return 1 + (k - 1) * max(0.0, 1 - i / fade)


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
    ensure_adaptation(cur, conn, c)
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
    # Факт строим от МОДЕЛЬНОГО аванса (без адаптационной поправки аванса): у факта своя обратная связь,
    # иначе одно и то же отклонение аванса учлось бы в факте дважды.
    cur.execute(f"SELECT month_id, scenario, forecast_final, correction FROM {S}.fm_avans_forecast")
    av_fc = [dict(r) for r in cur.fetchall()]
    corr = adapt_corrections(cur, "fact")
    cur.execute(f"DELETE FROM {S}.fm_fact_forecast")
    closed_facts = [h for h in fact_history(cur) if h["closed"]]
    last_fact = closed_facts[-1] if closed_facts else None
    calc = {}
    for r in av_fc:
        m, sc = r["month_id"], r["scenario"]
        num = int(m[5:7])
        av = float(r["forecast_final"]) - float(r["correction"] or 0)
        coef = coefs[num]
        direct = av * coef
        seasonal = annual * float(c[f"avans_coef_{sc}"]) * shares[num] / 100
        diff = abs(direct - seasonal) / direct if direct else 0
        final = (direct + seasonal) / 2 if diff > threshold else direct
        calc.setdefault(sc, []).append([m, av, coef, direct, seasonal, diff, final])
    for sc, rows in calc.items():
        rows.sort(key=lambda x: x[0])
        k = 1.0
        if last_fact and rows:
            k = anchor_factor(c, sc, last_fact["month_id"], last_fact["fact"], rows[0][0], rows[0][6])
        for i, (m, av, coef, direct, seasonal, diff, final) in enumerate(rows):
            ki = anchor_fade(c, k, i)
            direct, seasonal, final = direct * ki, seasonal * ki, final * ki
            c_m = corr.get((m, ""), 0.0)
            final = max(round(final) + c_m, 0)
            cur.execute(
                f"INSERT INTO {S}.fm_fact_forecast (month_id, scenario, fact_prev_year, avans_forecast, coef, "
                "fact_direct, fact_seasonal, diff_pct, fact_final, correction, calculated_at) "
                "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,now())",
                (m, sc, fact_by_month.get(add_months(m, -12)), round(av), round(coef, 6),
                 round(direct), round(seasonal), round(diff * 100, 4), round(final), c_m),
            )
    snapshot_forecasts(cur)


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
    ensure_adaptation(cur, conn, c)
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


def resolve_variable_pct(rows, month, corr_rows=()):
    """Свой процент месяца (отчёт или override). Иначе прогноз = опорное значение + адаптационные поправки.
    Опора — первый месяц из отчёта (или более поздний ручной override); последующие отчёты
    влияют на прогноз только через адаптацию: прогноз + (факт − прогноз) × K (Промт 13).
    Возвращает (процент, источник, поправка)."""
    own = next((r for r in rows if r["month_id"] == month), None)
    if own:
        return float(own["variable_pct"]), own["source"], 0.0
    prev = [r for r in rows if r["month_id"] < month]
    if not prev:
        return None, None, 0.0
    reports = [r for r in prev if r["source"] == "report"]
    overrides = [r for r in prev if r["source"] == "override"]
    anchor = reports[0] if reports else prev[0]
    if overrides and overrides[-1]["month_id"] > anchor["month_id"]:
        anchor = overrides[-1]
    corr = sum(cv for (t, lm, cv) in corr_rows if t == month and lm >= anchor["month_id"])
    vp = min(max(float(anchor["variable_pct"]) + corr, 0.0), 100.0)
    return round(vp, 4), "last", round(corr, 4)


def recalc_revenue(cur, c):
    acq = float(c.get("acquiring_pct") or 0)
    pcts = variable_pcts(cur)
    cur.execute(
        f"SELECT ac.month_id, l.month_id AS log_month, ac.correction FROM {S}.fm_adaptation_corrections ac "
        f"JOIN {S}.fm_adaptation_log l ON l.id = ac.source_log_id WHERE ac.metric = 'variable_pct'"
    )
    vp_corr = [(r["month_id"], r["log_month"], float(r["correction"])) for r in cur.fetchall()]
    cur.execute(f"SELECT month_id, scenario, forecast_final FROM {S}.fm_avans_forecast")
    avans = {(r["month_id"], r["scenario"]): float(r["forecast_final"]) for r in cur.fetchall()}
    cur.execute(f"SELECT month_id, scenario, fact_final FROM {S}.fm_fact_forecast")
    fact = {(r["month_id"], r["scenario"]): float(r["fact_final"]) for r in cur.fetchall()}
    cur.execute(f"DELETE FROM {S}.fm_revenue_monthly")
    for key, av in avans.items():
        if key not in fact:
            continue
        m, sc = key
        vp, src, vp_c = resolve_variable_pct(pcts, m, vp_corr)
        if vp is None:
            continue
        revenue = av * (1 - acq / 100)
        # Переменный % берём целиком — как в отчёте маржинальности (с эквайрингом).
        var_amount = fact[key] * vp / 100
        cur.execute(
            f"INSERT INTO {S}.fm_revenue_monthly (month_id, scenario, avans, fact, acquiring_pct, revenue, "
            "variable_pct, variable_pct_net, variable_pct_source, variable_amount, margin_amount, "
            "variable_pct_correction, calculated_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,now())",
            (m, sc, round(av), round(fact[key]), acq, round(revenue), vp, None, src,
             round(var_amount), round(fact[key]) - round(var_amount), vp_c),
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
#  • активные ученики — уникальные ученики с занятиями за месяц (CRM, «Маржинальность урока»);
#  • всего занятий и наполняемость групп — «Маржинальность урока» (margin_unit_cache);
#  • уроков на ученика = посещения (каждый ребёнок на групповом отдельно) / активные ученики.
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
        # Все занятия кроме тестовых и диагностик, любого педагога; только оплаченные места
        # (пришёл или пропуск со списанием). Блок stats считает «Маржинальность урока».
        # Если блока stats ещё нет (месяц посчитан старой версией отчёта) — берём прежние поля.
        f"SELECT month, computed_at, "
        f"COALESCE((payload->'stats'->>'individual_lessons')::int + (payload->'stats'->>'group_lessons')::int, "
        f"  (payload->'individual'->>'lessons')::int + (payload->'group'->>'lessons')::int) AS lessons, "
        f"COALESCE((payload->'stats'->>'group_paid')::numeric / NULLIF((payload->'stats'->>'group_lessons')::int, 0), "
        f"  (payload->'group'->>'avg_group_size')::numeric) AS fill, "
        f"COALESCE((payload->'stats'->>'individual_paid')::int + (payload->'stats'->>'group_paid')::int, "
        f"  (payload->'individual'->>'paid_units')::int + (payload->'group'->>'paid_units')::int) AS visits, "
        f"(payload->'stats'->>'students')::int AS students_total "
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
            # Активные = уникальные ученики хотя бы с одним проведённым занятием за месяц (CRM).
            # Срез последней недели — только запасной вариант: он проседает на праздниках и каникулах.
            "active_students": mr["students_total"] if mr and mr["students_total"] else active.get(m),
            "total_lessons": mr["lessons"] if mr else None,
            "avg_group_fill": round(float(mr["fill"]), 2) if mr and mr["fill"] is not None else None,
            "visits": mr["visits"] if mr else None,
            "crm_students": bool(mr and mr["students_total"]),
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
    live = students_from_reports(cur, months)

    rows = []
    for m in reversed(months):
        # Закрытия нет: каждый месяц всегда считается заново из CRM.
        rep = live[m]
        active, lessons, fill = rep["active_students"], rep["total_lessons"], rep["avg_group_fill"]
        rows.append({
            "month_id": m,
            "active_students": active,
            "total_lessons": lessons,
            "avg_lessons_per_student": _lessons_per_student(rep["visits"], active)
            if rep["visits"] else _lessons_per_student(lessons, active),
            "avg_group_fill": float(fill) if fill is not None else None,
            "source": "report",
            "lessons_source": "report",
            "closed": False,
            "note": "",
            "updated_at": rep["report_at"],
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
    ensure_adaptation(cur, conn, c)  # отчёт маржинальности за прошедший месяц → адаптация переменного %
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
    fx_corr = adapt_corrections(cur, "fixed_expense", "new_item")
    fx_snaps, cur_m = [], current_month()

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
            note = (o or {}).get("note") or None
            if o and not it["is_fixed"]:
                amount, src = float(o["amount"]), "manual"
            elif not it["is_fixed"]:
                # Адаптация (Промт 13): к значению по умолчанию — поправка по факту; ручной ввод месяца важнее.
                a_c = fx_corr.get((m, iid), 0.0)
                if a_c:
                    amount, src = max(amount + a_c, 0), "adapted"
                    note = f"адаптация {'+' if a_c > 0 else '−'}{_r(abs(a_c)):,} ₽".replace(",", " ")
                if it.get("new_since") and it["new_since"] <= m and src != "adapted":
                    note = note or "новая статья, по аналогии"
            # Снимок прогноза: будущие месяцы, а текущий — пока в него не ввели факт.
            if not it["is_fixed"] and (m > cur_m or (m == cur_m and not o)):
                fx_snaps.append((m, iid, amount))
            put(iid, m, amount, src, note)

        tot = {sc: sum(r["values"][m][sc] for r in rows.values() if m in r["values"]) for sc in SCENARIOS}
        designers = rows.get("designers", {}).get("values", {}).get(m, {}).get("base", 0)
        totals[m] = {
            "total": tot,
            "total_wo_designers": {sc: tot[sc] - designers for sc in SCENARIOS},
            "ano": _r(ano.get(m, 0)),
            "total_with_ano": {sc: tot[sc] + _r(ano.get(m, 0)) for sc in SCENARIOS},
        }

    # Прогноз ручных статей запоминаем, пока месяц в будущем: в текущем месяце туда уже вводят факт.
    if fx_snaps:
        execute_values(
            cur,
            f"INSERT INTO {S}.fm_forecast_snapshots (month_id, metric, item_id, scenario, value, updated_at) VALUES %s "
            "ON CONFLICT (month_id, metric, item_id, scenario) DO UPDATE SET value = EXCLUDED.value, updated_at = now() "
            "WHERE fm_forecast_snapshots.value <> EXCLUDED.value",
            [(m, "fixed_expense", iid, "base", round(float(a), 4), datetime.datetime.utcnow()) for m, iid, a in fx_snaps],
        )

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
    # Переключатель дашборда: принудительный режим для текущего и будущих месяцев (история не трогается).
    g = c.get("tax_regime_global")
    if g in ("usn", "patent") and m >= current_month():
        return g
    start = c.get("start_patent_month") or "2026-12"
    return (c.get("tax_regime_default_after") or "patent") if m >= start else (c.get("tax_regime_default_before") or "usn")


def calc_taxes(cur, fixed_done=False):
    c = constants(cur)
    if not fixed_done:
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

# ---------------- ВЫПЛАТА СОБСТВЕННИКУ ----------------
# От ПОСТУПЛЕНИЙ (аванс − эквайринг), 10 % по умолчанию. % и ручная сумма — помесячно.
# Ручная сумма > % × поступления. Это отток в Cash Flow, но НЕ расход в P&L и не влияет на налоги.


def calc_payouts(cur, conn, fresh=False):
    if not fresh:
        get_revenue(cur, conn)  # гарантирует свежие поступления
    c = constants(cur)
    default_pct = float(c.get("payout_pct_default") or 10)
    target = float(c.get("payout_target_monthly") or 250000)
    cur.execute(f"SELECT month_id, scenario, avans, revenue FROM {S}.fm_revenue_monthly ORDER BY month_id")
    rev = {}
    for r in cur.fetchall():
        rev.setdefault(r["month_id"], {})[r["scenario"]] = (float(r["avans"]), float(r["revenue"]))
    cur.execute(f"SELECT month_id, payout_pct_override, payout_manual FROM {S}.fm_monthly_inputs")
    inp = {r["month_id"]: r for r in cur.fetchall()}

    rows, db = [], []
    for m in sorted(rev):
        i = inp.get(m) or {}
        pct = float(i["payout_pct_override"]) if i.get("payout_pct_override") is not None else default_pct
        manual = float(i["payout_manual"]) if i.get("payout_manual") is not None else None
        row = {"month_id": m, "payout_pct": pct, "pct_source": "manual" if i.get("payout_pct_override") is not None else "default",
               "payout_manual": manual, "values": {}}
        for sc in SCENARIOS:
            if sc not in rev[m]:
                continue
            av, revenue = rev[m][sc]
            calc = round(revenue * pct / 100)
            final = round(manual) if manual is not None else calc
            row["values"][sc] = {"avans": round(av), "revenue": round(revenue), "payout_amount": calc, "payout_final": final}
            db.append((m, sc, revenue, pct, calc, manual, final, "manual" if manual is not None else "calculated"))
        rows.append(row)

    cur.execute(f"DELETE FROM {S}.fm_payouts_monthly")
    if db:
        execute_values(
            cur,
            f"INSERT INTO {S}.fm_payouts_monthly (month_id, scenario, revenue, payout_pct, payout_amount, payout_manual, payout_final, source) VALUES %s",
            db,
        )
    conn.commit()

    summary = {}
    for sc in SCENARIOS:
        vals = [(r["month_id"], r["values"][sc]) for r in rows if sc in r["values"]]
        if not vals:
            continue
        finals = [v["payout_final"] for _, v in vals]
        total = sum(finals)
        avg = total / len(finals)
        mx = max(vals, key=lambda x: x[1]["payout_final"])
        mn = min(vals, key=lambda x: x[1]["payout_final"])
        rev_total = sum(v["revenue"] for _, v in vals)
        summary[sc] = {
            "avans": sum(v["avans"] for _, v in vals), "revenue": rev_total, "payout": total,
            "avg": round(avg), "max": {"month_id": mx[0], "amount": mx[1]["payout_final"]},
            "min": {"month_id": mn[0], "amount": mn[1]["payout_final"]},
            "gap_monthly": round(avg - target), "gap_year": round(total - target * len(finals)),
            "pct_needed": round(target * len(finals) / rev_total * 100, 1) if rev_total else None,
            "revenue_needed_monthly": round(target / (default_pct / 100)) if default_pct else None,
        }
    return {
        "ok": True,
        "current_month": current_month(),
        "active_scenario": c.get("avans_scenario_active") or "base",
        "acquiring_pct": c.get("acquiring_pct"),
        "default_pct": default_pct,
        "target_monthly": target,
        "rows": rows,
        "summary": summary,
    }


def set_payout(cur, conn, body):
    """Процент выплаты (payout_pct) и/или ручная сумма (payout_manual) на месяц; null — по умолчанию."""
    month = str(body.get("month") or "")
    if not _month_ok(cur, month):
        return resp(400, {"error": "Нет такого месяца"})
    sets = {}
    for key, col, hi in (("payout_pct", "payout_pct_override", 100), ("payout_manual", "payout_manual", None)):
        if key not in body:
            continue
        v = body[key]
        if v is None or v == "":
            sets[col] = None
            continue
        try:
            v = round(float(v), 4 if hi else 2)
        except (TypeError, ValueError):
            return resp(400, {"error": "Значение должно быть числом"})
        if v < 0 or (hi and v > hi):
            return resp(400, {"error": "Процент от 0 до 100, сумма не меньше 0"})
        sets[col] = v
    if not sets:
        return resp(400, {"error": "Нечего сохранять"})
    cur.execute(f"INSERT INTO {S}.fm_monthly_inputs (month_id) VALUES (%s) ON CONFLICT (month_id) DO NOTHING", (month,))
    for col, v in sets.items():
        cur.execute(f"UPDATE {S}.fm_monthly_inputs SET {col} = %s, updated_at = now() WHERE month_id = %s", (v, month))
    conn.commit()
    return resp(200, {"ok": True})

# ---------------- РАЗОВЫЕ РАСХОДЫ ----------------
# Нерегулярные траты, только ручной ввод, по умолчанию 0. Учитываются в месяце возникновения:
# уменьшают EBITDA (P&L) и чистый поток (Cash Flow). На авансы, налоги, кредит, выплату не влияют.


def one_time_totals(cur):
    cur.execute(f"SELECT month_id, sum(amount) AS total FROM {S}.fm_one_time_expenses GROUP BY month_id")
    return {r["month_id"]: round(float(r["total"]), 2) for r in cur.fetchall()}


def get_one_time(cur):
    cur.execute(f"SELECT id, label FROM {S}.fm_one_time_categories ORDER BY sort")
    cats = [dict(r) for r in cur.fetchall()]
    cur.execute(
        f"SELECT id, month_id, name, amount, category, comment, source, created_at, updated_at "
        f"FROM {S}.fm_one_time_expenses ORDER BY month_id DESC, id"
    )
    items = [dict(r) for r in cur.fetchall()]
    cur.execute(f"SELECT id FROM {S}.fm_months ORDER BY id")
    months = [r["id"] for r in cur.fetchall()]
    return {"ok": True, "current_month": current_month(), "categories": cats, "items": items,
            "months": months, "by_month": one_time_totals(cur)}


def _one_time_fields(cur, body):
    month = str(body.get("month_id") or "")
    cur.execute(f"SELECT 1 FROM {S}.fm_months WHERE id = %s", (month,))
    if not cur.fetchone():
        raise ValueError("Нет такого месяца")
    name = str(body.get("name") or "").strip()[:255]
    if not name:
        raise ValueError("Укажите название")
    try:
        amount = round(float(body.get("amount")), 2)
    except (TypeError, ValueError):
        raise ValueError("Сумма должна быть числом")
    if amount <= 0:
        raise ValueError("Сумма должна быть больше нуля")
    cat = str(body.get("category") or "other")
    cur.execute(f"SELECT 1 FROM {S}.fm_one_time_categories WHERE id = %s", (cat,))
    if not cur.fetchone():
        raise ValueError("Нет такой категории")
    return month, name, amount, cat, str(body.get("comment") or "").strip()[:1000]


def save_one_time(cur, conn, body):
    try:
        f = _one_time_fields(cur, body)
    except ValueError as e:
        return resp(400, {"error": str(e)})
    item_id = body.get("id")
    if item_id:
        cur.execute(
            f"UPDATE {S}.fm_one_time_expenses SET month_id=%s, name=%s, amount=%s, category=%s, comment=%s, "
            "updated_at=now() WHERE id=%s RETURNING id",
            (*f, int(item_id)),
        )
        if not cur.fetchone():
            return resp(404, {"error": "Расход не найден"})
    else:
        cur.execute(
            f"INSERT INTO {S}.fm_one_time_expenses (month_id, name, amount, category, comment) "
            "VALUES (%s,%s,%s,%s,%s) RETURNING id",
            f,
        )
        item_id = cur.fetchone()["id"]
    conn.commit()
    return resp(200, {"ok": True, "id": int(item_id)})


def delete_one_time(cur, conn, body):
    try:
        item_id = int(body.get("id"))
    except (TypeError, ValueError):
        return resp(400, {"error": "Нужен id"})
    cur.execute(f"DELETE FROM {S}.fm_one_time_expenses WHERE id = %s", (item_id,))
    conn.commit()
    return resp(200, {"ok": True})

# ---------------- P&L ----------------
# Accrual: выручка = ФАКТ (не авансы). Переменные = факт × переменный %.
# EBITDA = валовая − постоянные − АНО − разовые. Чистая = EBITDA − проценты по кредиту − налог.
# Тело кредита и выплата собственнику в P&L НЕ входят (только в Cash Flow).

PNL_FIELDS = ("revenue", "variable", "gross_profit", "fixed", "ano", "one_time", "ebitda", "interest", "tax", "net_profit")


def calc_pnl(cur, conn):
    get_revenue(cur, conn)
    c = constants(cur)
    fixed = calc_fixed(cur)
    taxes = calc_taxes(cur, fixed_done=True)
    tax = {(r["month_id"], sc): r["values"][sc]["tax_net"] for r in taxes["rows"] for sc in SCENARIOS}
    regime = {r["month_id"]: r["regime"] for r in taxes["rows"]}
    ano = {r["month_id"]: r["total"] for r in ano_rows(cur)}
    one_time = one_time_totals(cur)
    option = c.get("credit_option_default") if c.get("credit_option_default") in CREDIT_OPTIONS else "6m"
    interest = {r["month_id"]: r["interest"] for r in credit_schedule_calc(c, option)}

    cur.execute(f"SELECT month_id, scenario, fact, variable_pct, variable_amount FROM {S}.fm_revenue_monthly ORDER BY month_id")
    rows, db = {}, []
    for r in cur.fetchall():
        m, sc = r["month_id"], r["scenario"]
        rev, var = float(r["fact"]), float(r["variable_amount"])
        gross = rev - var
        fx = float(((fixed["totals"].get(m) or {}).get("total") or {}).get(sc) or 0)
        an, ot = float(ano.get(m, 0)), float(one_time.get(m, 0))
        ebitda = gross - fx - an - ot
        it, tx = float(interest.get(m, 0)), float(tax.get((m, sc), 0))
        v = {"revenue": rev, "variable": var, "gross_profit": gross, "fixed": fx, "ano": an, "one_time": ot,
             "ebitda": ebitda, "interest": it, "tax": tx, "net_profit": ebitda - it - tx}
        v = {k: round(x, 2) for k, x in v.items()}
        row = rows.setdefault(m, {"month_id": m, "variable_pct": float(r["variable_pct"]), "tax_regime": regime.get(m), "values": {}})
        row["values"][sc] = v
        db.append((m, sc, *[v[k] for k in PNL_FIELDS]))

    cur.execute(f"DELETE FROM {S}.fm_pnl_monthly")
    if db:
        execute_values(
            cur,
            f"INSERT INTO {S}.fm_pnl_monthly (month_id, scenario, {', '.join(PNL_FIELDS)}) VALUES %s",
            db,
        )
    conn.commit()
    out_rows = [rows[m] for m in sorted(rows)]
    annual = {sc: {k: round(sum(r["values"][sc][k] for r in out_rows if sc in r["values"]), 2) for k in PNL_FIELDS}
              for sc in SCENARIOS}
    return {
        "ok": True,
        "current_month": current_month(),
        "active_scenario": c.get("avans_scenario_active") or "base",
        "credit_option": option,
        "rows": out_rows,
        "annual": annual,
    }

# ---------------- АДАПТИВНОЕ ПРОГНОЗИРОВАНИЕ (Промт 13) ----------------
# История не пересчитывается — корректируется только будущее:
#   скорр. прогноз = прогноз + (факт − прогноз) × K.
# Пока месяц в будущем, его прогноз запоминается (fm_forecast_snapshots). После закрытия месяца
# снимок замораживается и сравнивается с фактом; поправка (отклонение × K) записывается
# в fm_adaptation_corrections на каждый будущий месяц и прибавляется при расчёте прогноза.
# Адаптируются: авансы, факт, переменный %, постоянные статьи с ручным вводом (только систематическое
# отклонение N мес подряд) и новые неопределённости (первые 3 месяца — помесячно).
# НЕ адаптируются: кредит, налоги, АНО, выплата собственнику, фиксированные статьи справочника.

ADAPT_FIRST_MONTH = "2026-09"
ADAPT_METRICS = ("avans", "fact", "variable_pct", "fixed_expense", "new_item")
NEW_ITEM_MONTHS = 3


def adapt_corrections(cur, *metrics):
    cur.execute(
        f"SELECT month_id, item_id, sum(correction) AS s FROM {S}.fm_adaptation_corrections "
        "WHERE metric = ANY(%s) GROUP BY 1, 2",
        (list(metrics),),
    )
    return {(r["month_id"], r["item_id"]): float(r["s"]) for r in cur.fetchall()}


def save_snapshot(cur, month, metric, item, scenario, value):
    cur.execute(
        f"INSERT INTO {S}.fm_forecast_snapshots (month_id, metric, item_id, scenario, value, updated_at) "
        "VALUES (%s,%s,%s,%s,%s,now()) ON CONFLICT (month_id, metric, item_id, scenario) DO UPDATE SET "
        "value = EXCLUDED.value, updated_at = now() WHERE fm_forecast_snapshots.value <> EXCLUDED.value",
        (month, metric, item, scenario, round(float(value), 4)),
    )


def snapshot_forecasts(cur):
    """Запоминаем текущий прогноз по ещё не наступившим/идущим месяцам. Прошедшие месяцы не трогаем."""
    cm = current_month()
    for metric, table, col in (("avans", "fm_avans_forecast", "forecast_final"), ("fact", "fm_fact_forecast", "fact_final")):
        cur.execute(
            f"INSERT INTO {S}.fm_forecast_snapshots (month_id, metric, item_id, scenario, value, updated_at) "
            f"SELECT month_id, %s, '', scenario, {col}, now() FROM {S}.{table} WHERE month_id >= %s "
            "ON CONFLICT (month_id, metric, item_id, scenario) DO UPDATE SET value = EXCLUDED.value, updated_at = now() "
            "WHERE fm_forecast_snapshots.value <> EXCLUDED.value",
            (metric, cm),
        )
    cur.execute(
        f"INSERT INTO {S}.fm_forecast_snapshots (month_id, metric, item_id, scenario, value, updated_at) "
        f"SELECT month_id, 'variable_pct', '', 'base', variable_pct, now() FROM {S}.fm_revenue_monthly "
        "WHERE month_id >= %s AND scenario = 'base' AND variable_pct_source = 'last' "
        "ON CONFLICT (month_id, metric, item_id, scenario) DO UPDATE SET value = EXCLUDED.value, updated_at = now() "
        "WHERE fm_forecast_snapshots.value <> EXCLUDED.value",
        (cm,),
    )


def _future_months(cur, after):
    cur.execute(f"SELECT id FROM {S}.fm_months WHERE id > %s ORDER BY id", (after,))
    return [r["id"] for r in cur.fetchall()]


def adapt_decide(c, metric, forecast, actual, force=False):
    """Чистая формула: (отклонение, отклонение %, поправка, статус)."""
    k = float(c.get("adapt_k") if c.get("adapt_k") is not None else 0.5)
    dev = actual - forecast
    dev_pct = abs(dev) / abs(forecast) * 100 if forecast else None
    if metric == "variable_pct":
        small = abs(dev) < float(c.get("adapt_min_deviation_pp") or 0)
    else:
        small = dev_pct is not None and dev_pct < float(c.get("adapt_min_deviation_pct") or 0)
    if (small and not force) or k == 0 or dev == 0:
        return dev, dev_pct, 0.0, "skipped"
    return dev, dev_pct, dev * k, "applied"


def adapt_log(cur, c, month, metric, item, scenario, forecast, actual, source="auto", note="", force=False):
    k = float(c.get("adapt_k") if c.get("adapt_k") is not None else 0.5)
    dev, dev_pct, corr, status = adapt_decide(c, metric, forecast, actual, force)
    future = _future_months(cur, month)
    applied_to = f"{future[0]} – {future[-1]}" if future and status == "applied" else ""
    if status == "skipped" and not note:
        note = "K = 0" if k == 0 else "Отклонение меньше порога — прогноз не меняем"
    sql = (
        f"INSERT INTO {S}.fm_adaptation_log (month_id, metric, item_id, scenario, forecast, actual, deviation, "
        "deviation_pct, correction, applied_to, k_coef, status, source, note) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) "
    )
    if source == "auto":
        sql += "ON CONFLICT (month_id, metric, item_id) WHERE source = 'auto' DO NOTHING "
    cur.execute(sql + "RETURNING id", (
        month, metric, item, scenario, round(forecast, 4), round(actual, 4), round(dev, 4),
        round(dev_pct, 4) if dev_pct is not None else None, round(corr, 4), applied_to, k, status, source, note,
    ))
    row = cur.fetchone()
    if not row or status != "applied":
        return False
    execute_values(
        cur,
        f"INSERT INTO {S}.fm_adaptation_corrections (month_id, metric, item_id, correction, source_log_id) VALUES %s",
        [(m, metric, item, round(corr, 4), row["id"]) for m in future],
    )
    return True


def _snapshots(cur, metric, scenario):
    cur.execute(
        f"SELECT month_id, item_id, value FROM {S}.fm_forecast_snapshots WHERE metric = %s AND scenario = %s",
        (metric, scenario),
    )
    return {(r["month_id"], r["item_id"]): float(r["value"]) for r in cur.fetchall()}


def _logged(cur):
    cur.execute(f"SELECT month_id, metric, item_id FROM {S}.fm_adaptation_log WHERE source = 'auto'")
    return {(r["month_id"], r["metric"], r["item_id"]) for r in cur.fetchall()}


def fixed_actuals(cur, items, snaps, passed):
    """Факт ручной статьи за прошедший месяц: введённая сумма, иначе — прогноз (значит, отклонения нет)."""
    cur.execute(f"SELECT month_id, expense_id, amount FROM {S}.fm_expense_monthly")
    ovr = {(r["month_id"], r["expense_id"]): float(r["amount"]) for r in cur.fetchall()}
    out = {}
    for iid in items:
        for m in passed:
            if (m, iid) in snaps:
                out[(m, iid)] = (snaps[(m, iid)], ovr.get((m, iid), snaps[(m, iid)]))
    return out


def run_pending_adaptation(cur, c):
    """Сравнить закрытые месяцы с запомненным прогнозом и записать поправки. Возвращает изменённые метрики."""
    sc = c.get("avans_scenario_active") or "base"
    cm = current_month()
    logged = _logged(cur)
    changed = set()

    # 1–2. Авансы и факт
    for metric, table, col in (("avans", "fm_avans_monthly", "avans"), ("fact", "fm_fact_monthly", "fact")):
        snaps = _snapshots(cur, metric, sc)
        cur.execute(f"SELECT month_id, {col} AS v FROM {S}.{table} WHERE closed AND month_id >= %s ORDER BY month_id",
                    (ADAPT_FIRST_MONTH,))
        for r in cur.fetchall():
            m = r["month_id"]
            if (m, metric, "") in logged or (m, "") not in snaps:
                continue
            if adapt_log(cur, c, m, metric, "", sc, snaps[(m, "")], float(r["v"])):
                changed.add(metric)

    # 3. Переменный % (факт — отчёт «Маржинальность урока» за прошедший месяц)
    snaps = _snapshots(cur, "variable_pct", "base")
    for r in variable_pcts(cur):
        m = r["month_id"]
        if r["source"] != "report" or m >= cm or (m, "variable_pct", "") in logged or (m, "") not in snaps:
            continue
        if adapt_log(cur, c, m, "variable_pct", "", "base", snaps[(m, "")], float(r["variable_pct"])):
            changed.add("variable_pct")

    # 4–5. Постоянные статьи с ручным вводом и новые неопределённости
    cur.execute(f"SELECT id, new_since FROM {S}.fm_expense_items WHERE category = 'fixed' AND NOT is_fixed")
    items = {r["id"]: r["new_since"] for r in cur.fetchall()}
    snaps = _snapshots(cur, "fixed_expense", "base")
    cur.execute(f"SELECT id FROM {S}.fm_months WHERE id >= %s AND id < %s ORDER BY id", (FIXED_FIRST_MONTH, cm))
    passed = [r["id"] for r in cur.fetchall()]
    acts = fixed_actuals(cur, items, snaps, passed)
    n_sys = int(c.get("adapt_systematic_months") or 3)
    min_pct = float(c.get("adapt_min_deviation_pct") or 0)
    cur.execute(f"SELECT item_id, max(month_id) AS m FROM {S}.fm_adaptation_log "
                "WHERE metric IN ('fixed_expense','new_item') GROUP BY 1")
    last_log = {r["item_id"]: r["m"] for r in cur.fetchall()}
    for iid, new_since in items.items():
        months = [m for m in passed if (m, iid) in acts]
        new_end = add_months(new_since, NEW_ITEM_MONTHS) if new_since else None
        for m in months:
            if new_since and new_since <= m < new_end:
                if (m, "new_item", iid) in logged:
                    continue
                f, a = acts[(m, iid)]
                if adapt_log(cur, c, m, "new_item", iid, "base", f, a, note="Новая статья: прогноз по аналогии"):
                    changed.add("fixed")
                last_log[iid] = m
                continue
            lim = max(last_log.get(iid) or "", add_months(new_end, -1) if new_end else "")
            win = [add_months(m, -i) for i in range(n_sys)]
            if (m, "fixed_expense", iid) in logged or any(w <= lim or (w, iid) not in acts for w in win):
                continue
            devs = [acts[(w, iid)][1] - acts[(w, iid)][0] for w in win]
            pcts = [abs(d) / acts[(w, iid)][0] * 100 if acts[(w, iid)][0] else 100 for d, w in zip(devs, win)]
            if not (all(d > 0 for d in devs) or all(d < 0 for d in devs)) or min(pcts) < min_pct:
                continue
            f = sum(acts[(w, iid)][0] for w in win) / n_sys
            a = sum(acts[(w, iid)][1] for w in win) / n_sys
            if adapt_log(cur, c, m, "fixed_expense", iid, "base", f, a,
                         note=f"Систематическое отклонение {n_sys} мес подряд: {win[-1]} – {win[0]}"):
                changed.add("fixed")
            last_log[iid] = m
    return changed


def recalc_chain(cur, c):
    recalc(cur, c)
    recalc_fact(cur, c)
    recalc_revenue(cur, c)


def ensure_adaptation(cur, conn, c=None):
    c = c or constants(cur)
    snapshot_forecasts(cur)
    changed = run_pending_adaptation(cur, c)
    if changed & {"avans", "fact", "variable_pct"}:
        recalc_chain(cur, c)
    conn.commit()
    return changed


def get_adaptation(cur, conn):
    c = constants(cur)
    get_revenue(cur, conn)  # гарантирует свежие прогнозы и прогон адаптации
    calc_fixed(cur)  # снимки ручных статей
    ensure_adaptation(cur, conn, c)
    sc = c.get("avans_scenario_active") or "base"
    cm = current_month()
    cur.execute(f"SELECT id, name, amount, new_since FROM {S}.fm_expense_items WHERE category = 'fixed' AND NOT is_fixed ORDER BY sort")
    items = [dict(r) for r in cur.fetchall()]
    names = {i["id"]: i["name"] for i in items}
    cur.execute(f"SELECT * FROM {S}.fm_adaptation_log ORDER BY month_id DESC, id DESC")
    log = [{**dict(r), "item_name": names.get(r["item_id"], "")} for r in cur.fetchall()]

    # Графики: прогноз (снимок) vs факт по прошедшим месяцам + модельный и скорректированный прогноз впереди.
    series = {}
    for metric, hist_t, hist_c, fc_t, fc_c, fc_sc in (
        ("avans", "fm_avans_monthly", "avans", "fm_avans_forecast", "forecast_final", sc),
        ("fact", "fm_fact_monthly", "fact", "fm_fact_forecast", "fact_final", sc),
    ):
        snaps = _snapshots(cur, metric, sc)
        cur.execute(f"SELECT month_id, {hist_c} AS v FROM {S}.{hist_t} WHERE closed AND month_id >= %s ORDER BY month_id",
                    (ADAPT_FIRST_MONTH,))
        pts = []
        for r in cur.fetchall():
            f = snaps.get((r["month_id"], ""))
            a = float(r["v"])
            pts.append({"month_id": r["month_id"], "forecast": f, "actual": a,
                        "deviation_pct": round((a - f) / f * 100, 2) if f else None})
        cur.execute(f"SELECT month_id, {fc_c} AS v, correction FROM {S}.{fc_t} WHERE scenario = %s ORDER BY month_id", (fc_sc,))
        for r in cur.fetchall():
            v, corr = float(r["v"]), float(r["correction"] or 0)
            pts.append({"month_id": r["month_id"], "model": round(v - corr), "corrected": v, "correction": corr})
        series[metric] = pts
    snaps = _snapshots(cur, "variable_pct", "base")
    pts = []
    for r in variable_pcts(cur):
        if r["source"] == "report" and r["month_id"] < cm:
            f = snaps.get((r["month_id"], ""))
            pts.append({"month_id": r["month_id"], "forecast": f, "actual": float(r["variable_pct"]),
                        "deviation_pct": round(float(r["variable_pct"]) - f, 2) if f is not None else None})
    cur.execute(f"SELECT month_id, variable_pct, variable_pct_source, variable_pct_correction FROM {S}.fm_revenue_monthly "
                "WHERE scenario = 'base' ORDER BY month_id")
    for r in cur.fetchall():
        if r["month_id"] < cm and r["variable_pct_source"] == "report":
            continue
        v, corr = float(r["variable_pct"]), float(r["variable_pct_correction"] or 0)
        pts.append({"month_id": r["month_id"], "model": round(v - corr, 4), "corrected": v, "correction": corr,
                    "own": r["variable_pct_source"] != "last"})
    series["variable_pct"] = pts

    # Уведомления
    alert_pct = float(c.get("adapt_alert_pct") or 20)
    n_sys = int(c.get("adapt_systematic_months") or 3)
    alerts = []
    for l in log:
        if l["status"] == "cancelled":
            continue
        dp = float(l["deviation_pct"]) if l["deviation_pct"] is not None else None
        big = dp is not None and dp > alert_pct
        if big and l["month_id"] >= add_months(cm, -2):
            alerts.append({"type": "big_deviation", "log_id": l["id"], "month_id": l["month_id"], "metric": l["metric"],
                           "item_id": l["item_id"], "deviation": l["deviation"], "deviation_pct": l["deviation_pct"]})
        if l["metric"] == "fixed_expense" and l["status"] == "applied":
            alerts.append({"type": "systematic", "log_id": l["id"], "month_id": l["month_id"], "item_id": l["item_id"],
                           "item_name": l["item_name"], "suggested": round(float(l["actual"]))})
    cur.execute(f"SELECT month_id, expense_id, amount FROM {S}.fm_expense_monthly WHERE month_id < %s", (cm,))
    ovr = {(r["month_id"], r["expense_id"]): float(r["amount"]) for r in cur.fetchall()}
    fsnaps = _snapshots(cur, "fixed_expense", "base")
    for it in items:
        if not it["new_since"]:
            continue
        done = [m for m in (add_months(it["new_since"], i) for i in range(NEW_ITEM_MONTHS)) if m < cm]
        vals = [ovr.get((m, it["id"]), fsnaps.get((m, it["id"]))) for m in done]
        vals = [v for v in vals if v is not None]
        if len(done) >= NEW_ITEM_MONTHS and vals:
            alerts.append({"type": "new_item_average", "item_id": it["id"], "item_name": it["name"],
                           "suggested": round(sum(vals) / len(vals)), "months": len(vals)})
        else:
            alerts.append({"type": "new_item", "item_id": it["id"], "item_name": it["name"],
                           "months_done": len(done), "amount": it["amount"]})
    return {
        "ok": True,
        "current_month": cm,
        "active_scenario": sc,
        "params": {
            "k": float(c.get("adapt_k") if c.get("adapt_k") is not None else 0.5),
            "systematic_months": n_sys,
            "min_deviation_pct": float(c.get("adapt_min_deviation_pct") or 0),
            "min_deviation_pp": float(c.get("adapt_min_deviation_pp") or 0),
            "alert_pct": alert_pct,
        },
        "log": log,
        "series": series,
        "alerts": alerts,
        "items": items,
    }


def set_adapt_params(cur, conn, body):
    """Параметры адаптации. reapply=true — пересчитать уже применённые поправки с новым K."""
    keys = {"k": ("adapt_k", 0, 1), "systematic_months": ("adapt_systematic_months", 1, 12),
            "min_deviation_pct": ("adapt_min_deviation_pct", 0, 100), "min_deviation_pp": ("adapt_min_deviation_pp", 0, 100),
            "alert_pct": ("adapt_alert_pct", 0, 1000)}
    upd = {}
    for k, (key, lo, hi) in keys.items():
        if k not in body or body[k] is None or body[k] == "":
            continue
        try:
            v = float(body[k])
        except (TypeError, ValueError):
            return resp(400, {"error": "Значение должно быть числом"})
        if not lo <= v <= hi:
            return resp(400, {"error": f"Допустимо от {lo} до {hi}"})
        upd[key] = v
    if not upd:
        return resp(400, {"error": "Нечего сохранять"})
    for key, v in upd.items():
        cur.execute(f"UPDATE {S}.fm_constants SET value_num = %s, updated_at = now() WHERE key = %s", (v, key))
    if body.get("reapply") and "adapt_k" in upd:
        k = upd["adapt_k"]
        cur.execute(
            f"UPDATE {S}.fm_adaptation_log SET k_coef = %s, correction = deviation * %s WHERE status = 'applied'", (k, k))
        cur.execute(
            f"UPDATE {S}.fm_adaptation_corrections ac SET correction = l.correction "
            f"FROM {S}.fm_adaptation_log l WHERE l.id = ac.source_log_id")
    c = constants(cur)
    recalc_chain(cur, c)
    conn.commit()
    return resp(200, {"ok": True})


def cancel_adaptation(cur, conn, body):
    try:
        log_id = int(body.get("id"))
    except (TypeError, ValueError):
        return resp(400, {"error": "Нужен id"})
    restore = bool(body.get("restore"))
    cur.execute(f"SELECT status FROM {S}.fm_adaptation_log WHERE id = %s", (log_id,))
    row = cur.fetchone()
    if not row:
        return resp(404, {"error": "Запись не найдена"})
    if restore:
        if row["status"] != "cancelled":
            return resp(400, {"error": "Адаптация не отменена"})
        cur.execute(f"SELECT * FROM {S}.fm_adaptation_log WHERE id = %s", (log_id,))
        l = cur.fetchone()
        if float(l["correction"]) == 0:
            return resp(400, {"error": "У записи нет поправки"})
        future = _future_months(cur, l["month_id"])
        cur.execute(f"UPDATE {S}.fm_adaptation_log SET status = 'applied', cancelled_at = NULL WHERE id = %s", (log_id,))
        execute_values(
            cur,
            f"INSERT INTO {S}.fm_adaptation_corrections (month_id, metric, item_id, correction, source_log_id) VALUES %s",
            [(m, l["metric"], l["item_id"], l["correction"], log_id) for m in future],
        )
    else:
        if row["status"] == "cancelled":
            return resp(400, {"error": "Уже отменена"})
        cur.execute(f"DELETE FROM {S}.fm_adaptation_corrections WHERE source_log_id = %s", (log_id,))
        cur.execute(f"UPDATE {S}.fm_adaptation_log SET status = 'cancelled', cancelled_at = now() WHERE id = %s", (log_id,))
    recalc_chain(cur, constants(cur))
    conn.commit()
    return resp(200, {"ok": True})


def adapt_manual(cur, conn, body):
    """Ручная адаптация: прогноз и факт вводит руководитель (например, за месяц без сохранённого прогноза)."""
    month, metric = str(body.get("month") or ""), str(body.get("metric") or "")
    if metric not in ("avans", "fact", "variable_pct"):
        return resp(400, {"error": "Метрика: avans / fact / variable_pct"})
    cur.execute(f"SELECT 1 FROM {S}.fm_months WHERE id = %s", (month,))
    if not cur.fetchone():
        return resp(400, {"error": "Нет такого месяца"})
    try:
        f, a = float(body.get("forecast")), float(body.get("actual"))
    except (TypeError, ValueError):
        return resp(400, {"error": "Прогноз и факт — числа"})
    c = constants(cur)
    adapt_log(cur, c, month, metric, "", c.get("avans_scenario_active") or "base", f, a, source="manual",
              note="Введено вручную", force=bool(body.get("force")))
    recalc_chain(cur, c)
    conn.commit()
    return resp(200, {"ok": True})


def adapt_new_item(cur, conn, body):
    """Новая неопределённость: новая статья (или существующая ручная) с прогнозом по аналогии."""
    month = str(body.get("month") or "")
    if not _month_ok(cur, month):
        return resp(400, {"error": "Нет такого месяца"})
    try:
        amount = round(float(body.get("amount")), 2)
    except (TypeError, ValueError):
        return resp(400, {"error": "Прогноз по аналогии — число"})
    if amount < 0:
        return resp(400, {"error": "Сумма не может быть отрицательной"})
    iid = str(body.get("item_id") or "")
    if iid:
        cur.execute(f"UPDATE {S}.fm_expense_items SET new_since = %s, amount = %s "
                    "WHERE id = %s AND category = 'fixed' AND NOT is_fixed RETURNING id", (month, amount, iid))
        if not cur.fetchone():
            return resp(400, {"error": "Статья не найдена или фиксированная"})
    else:
        name = str(body.get("name") or "").strip()[:120]
        if not name:
            return resp(400, {"error": "Укажите название статьи"})
        cur.execute(f"SELECT coalesce(max(sort), 0) + 1 AS s FROM {S}.fm_expense_items WHERE category = 'fixed' AND sort < 200")
        sort = cur.fetchone()["s"]
        iid = f"new_{int(datetime.datetime.utcnow().timestamp())}"
        cur.execute(
            f"INSERT INTO {S}.fm_expense_items (id, name, category, input_mode, amount, amount_unit, sort, is_fixed, new_since) "
            "VALUES (%s,%s,'fixed','manual',%s,'rub_month',%s,false,%s)",
            (iid, name, amount, sort, month),
        )
    # Прогноз по аналогии на уже идущий месяц тоже запоминаем — через месяц сравним с фактом.
    m, cm = month, current_month()
    while m <= cm:
        cur.execute(f"SELECT 1 FROM {S}.fm_expense_monthly WHERE month_id = %s AND expense_id = %s", (m, iid))
        if not cur.fetchone():
            save_snapshot(cur, m, "fixed_expense", iid, "base", amount)
        m = add_months(m, 1)
    conn.commit()
    return resp(200, {"ok": True, "item_id": iid})


def adapt_set_base(cur, conn, body):
    """Принять предложение: новая база статьи (систематическое отклонение или среднее по новой статье).
    Накопленные поправки статьи гасятся — они уже вошли в новую базу."""
    iid = str(body.get("item_id") or "")
    try:
        amount = round(float(body.get("amount")), 2)
    except (TypeError, ValueError):
        return resp(400, {"error": "Сумма — число"})
    cur.execute(f"UPDATE {S}.fm_expense_items SET amount = %s, new_since = NULL "
                "WHERE id = %s AND category = 'fixed' AND NOT is_fixed RETURNING id", (amount, iid))
    if not cur.fetchone():
        return resp(400, {"error": "Статья не найдена или фиксированная"})
    cur.execute(f"DELETE FROM {S}.fm_adaptation_corrections WHERE item_id = %s AND metric IN ('fixed_expense','new_item')", (iid,))
    cur.execute(
        f"UPDATE {S}.fm_adaptation_log SET status = 'cancelled', cancelled_at = now(), "
        "note = note || ' · вошло в новую базу' WHERE item_id = %s AND metric IN ('fixed_expense','new_item') AND status = 'applied'",
        (iid,),
    )
    conn.commit()
    return resp(200, {"ok": True})

# ---------------- CASH FLOW ----------------
# Кассовый метод: поступления = аванс − эквайринг (не факт). Оттоки: переменные (от факта), постоянные, АНО,
# разовые, налог, проценты + ТЕЛО кредита, выплата собственнику. Остаток копится от стартового 1 100 204,78 ₽.

CF_OUT = ("variable", "fixed", "ano", "one_time", "tax", "interest", "body", "payout")


BANK_LINES = ("revenue", *CF_OUT, "other")


def bank_facts(cur, c):
    """Банковский факт для Cash Flow (с месяца bank_fact_from): суммы по строкам из разнесённых операций
    рабочих счетов. Переводы между своими счетами и «не учитывать» пропускаются. Поступления — со знаком,
    удержания эквайринга уменьшают их; «прочее» и неразнесённое — сальдо (плюс — приток)."""
    start = c.get("bank_fact_from") or "2026-10"
    cur.execute(
        f"SELECT to_char(o.op_date, 'YYYY-MM') AS m, o.category, o.direction, sum(o.amount) AS s, count(*) AS n "
        f"FROM {S}.fm_bank_operations o JOIN {S}.fm_bank_accounts a USING (account) "
        "WHERE a.use_in_cf AND o.category NOT IN ('transfer', 'ignore') AND to_char(o.op_date, 'YYYY-MM') >= %s "
        "GROUP BY 1, 2, 3",
        (start,),
    )
    facts = {}
    for r in cur.fetchall():
        f = facts.setdefault(r["m"], {k: 0.0 for k in BANK_LINES} | {"uncategorized": 0, "ops": 0})
        v = float(r["s"])
        cat = r["category"]
        f["ops"] += int(r["n"])
        if cat == "uncategorized":
            f["uncategorized"] += int(r["n"])
            cat = "other"
        if cat in ("revenue", "other"):
            f[cat] += v if r["direction"] == "in" else -v
        elif cat in CF_OUT:
            f[cat] += v if r["direction"] == "out" else -v
    return start, facts


def bank_start_balance(cur, c, fact_from):
    """Остаток на начало первого месяца банковского факта: ручной итог «остаток на конец» предыдущего месяца,
    иначе остатки по банку на последний день предыдущего месяца, иначе константы модели."""
    prev = add_months(fact_from, -1)
    cur.execute(f"SELECT amount FROM {S}.fm_cashflow_fact_manual WHERE month_id = %s AND line = 'end_balance'", (prev,))
    r = cur.fetchone()
    tb = float(c.get("start_balance_tbank") or 0)
    lk = float(c.get("start_balance_lokobank") or 0)
    if r:
        return {"total": float(r["amount"]), "tbank": None, "lokobank": None, "source": "manual"}
    y, m = int(fact_from[:4]), int(fact_from[5:7])
    day = datetime.date(y, m, 1) - datetime.timedelta(days=1)
    cur.execute(
        f"SELECT a.bank, sum(b.balance_end) AS s FROM {S}.fm_bank_balances b JOIN {S}.fm_bank_accounts a USING (account) "
        "WHERE a.use_in_cf AND b.date = %s GROUP BY a.bank",
        (day,),
    )
    got = {r["bank"]: float(r["s"]) for r in cur.fetchall()}
    src = "bank" if got else "constants"
    tb = got.get("tbank", tb)
    lk = got.get("loko", lk)
    return {"total": tb + lk, "tbank": tb, "lokobank": lk, "source": src,
            "tbank_source": "bank" if "tbank" in got else "constants",
            "lokobank_source": "bank" if "loko" in got else "constants"}


def calc_cashflow(cur, conn):
    pnl = calc_pnl(cur, conn)
    payouts = calc_payouts(cur, conn, fresh=True)
    c = constants(cur)
    option = pnl["credit_option"]
    body = {r["month_id"]: r["body"] for r in credit_schedule_calc(c, option)}
    pay = {(r["month_id"], sc): v["payout_final"] for r in payouts["rows"] for sc, v in r["values"].items()}
    cur.execute(f"SELECT month_id, scenario, revenue FROM {S}.fm_revenue_monthly")
    inflow = {(r["month_id"], r["scenario"]): float(r["revenue"]) for r in cur.fetchall()}
    fact_from, facts = bank_facts(cur, c)
    sb = bank_start_balance(cur, c, fact_from)
    start = sb["total"]
    cm = current_month()

    def month_source(m):
        if m < fact_from or m > cm:
            return "forecast"
        if m < cm:
            return "fact" if m in facts else "forecast"
        return "partial" if m in facts else "forecast"

    pnl_by_month = {r["month_id"]: r for r in pnl["rows"]}
    rows = {r["month_id"]: {"month_id": r["month_id"], "tax_regime": r["tax_regime"], "source": month_source(r["month_id"]),
                            "bank": facts.get(r["month_id"]), "values": {}} for r in pnl["rows"]}
    db, summary = [], {}
    for sc in SCENARIOS:
        bal, total_out, worst, gap = start, 0.0, None, []
        for m in sorted(rows):
            p = pnl_by_month[m]["values"].get(sc)
            if not p:
                continue
            v = {"start_balance": bal, "revenue": inflow.get((m, sc), 0.0),
                 "variable": p["variable"], "fixed": p["fixed"], "ano": p["ano"], "one_time": p["one_time"],
                 "tax": p["tax"], "interest": p["interest"], "body": float(body.get(m, 0)),
                 "payout": float(pay.get((m, sc), 0)), "other": 0.0}
            src, f = rows[m]["source"], facts.get(m)
            if src == "fact":
                # Прошедший месяц — только банк, одинаково для всех сценариев.
                for k in BANK_LINES:
                    v[k] = f[k]
            elif src == "partial":
                # Текущий месяц: по каждой строке факт, если он уже больше прогноза, иначе прогноз (остаток ещё будет).
                for k in ("revenue", *CF_OUT):
                    v[k] = max(f[k], v[k])
                v["other"] = f["other"]
            out = sum(v[k] for k in CF_OUT)
            v["outflow"] = out
            v["net_flow"] = v["revenue"] + v["other"] - out
            v["end_balance"] = bal + v["net_flow"]
            v = {k: round(x, 2) for k, x in v.items()}
            rows[m]["values"][sc] = v
            db.append((m, sc, v["start_balance"], v["revenue"], *[v[k] for k in CF_OUT], v["other"], v["net_flow"], v["end_balance"]))
            bal = v["end_balance"]
            total_out += out
            if worst is None or bal < worst[1]:
                worst = (m, bal)
            if bal < 0:
                gap.append(m)
        vals = [rows[m]["values"][sc] for m in sorted(rows) if sc in rows[m]["values"]]
        summary[sc] = {
            "start_balance": round(start, 2),
            "end_balance": round(bal, 2),
            "min_balance": round(worst[1], 2) if worst else None,
            "min_month": worst[0] if worst else None,
            "gap_months": gap,
            "first_gap_month": gap[0] if gap else None,
            "total_outflow": round(total_out, 2),
            **{k: round(sum(v[k] for v in vals), 2) for k in ("revenue", *CF_OUT, "other", "net_flow")},
        }

    cur.execute(f"DELETE FROM {S}.fm_cashflow_monthly")
    if db:
        execute_values(
            cur,
            f"INSERT INTO {S}.fm_cashflow_monthly (month_id, scenario, start_balance, revenue, {', '.join(CF_OUT)}, other, net_flow, end_balance) VALUES %s",
            db,
        )
    conn.commit()
    return {
        "ok": True,
        "current_month": cm,
        "active_scenario": pnl["active_scenario"],
        "credit_option": option,
        "fact_from": fact_from,
        "start_balance": {"total": round(start, 2),
                          "tbank": round(sb["tbank"], 2) if sb["tbank"] is not None else None,
                          "lokobank": round(sb["lokobank"], 2) if sb["lokobank"] is not None else None,
                          "source": sb["source"], "tbank_source": sb.get("tbank_source"),
                          "lokobank_source": sb.get("lokobank_source"),
                          "date": f"{fact_from}-01", "model_total": float(c.get("start_balance_total") or 0)},
        "rows": [rows[m] for m in sorted(rows)],
        "summary": summary,
    }


# ---------------- ДАШБОРД И УВЕДОМЛЕНИЯ (Промт 15) ----------------
# Дашборд не хранит данные: KPI и графики собираются из уже посчитанных модулей (calc_cashflow обновляет
# всю цепочку P&L/Cash Flow/налоги/выплаты). Уведомления — только в интерфейсе (без писем и задач);
# пересоздаются при каждом открытии, а «скрыто» / «отложено» сохраняется по ключу уведомления.

PRIORITY_ORDER = {"high": 0, "medium": 1, "low": 2}


def _ts(v):
    return v.isoformat() if v else None


def data_sources(cur, c):
    """Статусы источников: ok — свежие, stale — устарели, missing — нет данных, manual — ручной ввод."""
    cm = current_month()
    prev = add_months(cm, -1)
    out = []

    def add(source, label, provides, last, status, note=""):
        out.append({"source": source, "label": label, "provides": provides, "last_updated": last,
                    "status": status, "note": note})

    cur.execute(f"SELECT max(month_id) AS m, max(closed_at) AS t FROM {S}.fm_avans_monthly WHERE closed")
    r = cur.fetchone()
    add("report_avans", "Отчёт «Авансовые доходы»", "Авансы", _ts(r["t"]),
        "ok" if r["m"] and r["m"] >= prev else "stale", f"закрыто по {month_label(r['m'])}" if r["m"] else "")
    cur.execute(f"SELECT max(month_id) AS m, max(closed_at) AS t FROM {S}.fm_fact_monthly WHERE closed")
    r = cur.fetchone()
    add("report_fact", "Отчёт «Фактические доходы»", "Факт", _ts(r["t"]),
        "ok" if r["m"] and r["m"] >= prev else "stale", f"закрыто по {month_label(r['m'])}" if r["m"] else "")
    cur.execute(f"SELECT max(period_month) AS m, max(created_at) AS t FROM {S}.unit_margin_reports")
    r = cur.fetchone()
    if not r["m"]:
        add("report_margin", "Отчёт «Маржинальность урока»", "Маржинальность (переменный %)", None, "missing",
            "расчёт не сохранён — в прогнозе последний известный процент")
    else:
        add("report_margin", "Отчёт «Маржинальность урока»", "Маржинальность (переменный %)", _ts(r["t"]),
            "ok" if r["m"] >= prev else "stale", f"последний месяц — {month_label(r['m'])}")
    cur.execute(f"SELECT max(week_start) AS w FROM {S}.student_count_weekly")
    w = cur.fetchone()["w"]
    fresh = w and (msk_today() - w).days <= 10
    add("students", "AlfaCRM → «Динамика учеников»", "Активные ученики", w.isoformat() if w else None,
        "ok" if fresh else ("stale" if w else "missing"), f"последняя неделя с {w.strftime('%d.%m.%Y')}" if w else "")
    cur.execute(f"SELECT count(*) AS n FROM {S}.fm_expense_monthly WHERE source = 'manual'")
    n = cur.fetchone()["n"]
    cur.execute(f"SELECT max(updated_at) AS t FROM {S}.fm_monthly_inputs")
    t = cur.fetchone()["t"]
    add("manual", "Ручной ввод", "Реклама, нейронка, дизайнеры, KPI админов, override", _ts(t), "manual",
        f"{n} ручных сумм по статьям")

    execute_values(
        cur,
        f"INSERT INTO {S}.fm_data_sources (source, label, provides, last_updated, status, note, checked_at) VALUES %s "
        "ON CONFLICT (source) DO UPDATE SET label=EXCLUDED.label, provides=EXCLUDED.provides, "
        "last_updated=EXCLUDED.last_updated, status=EXCLUDED.status, note=EXCLUDED.note, checked_at=now()",
        [(d["source"], d["label"], d["provides"], d["last_updated"], d["status"], d["note"], datetime.datetime.utcnow())
         for d in out],
    )
    return out


def build_notifications(cur, c, cf, sources):
    """Собирает актуальные уведомления по условиям Промта 15."""
    cm = current_month()
    prev = add_months(cm, -1)
    today = msk_today()
    sc = c.get("avans_scenario_active") or "base"
    items = []

    def add(key, type_, priority, message, action):
        items.append({"key": key, "type": type_, "priority": priority, "message": message, "action_url": action})

    # 1. Месяц не закрыт (3+ дня с начала месяца)
    after_day = int(c.get("notify_close_after_day") or 3)
    if today.day >= after_day:
        cur.execute(f"SELECT 1 FROM {S}.fm_avans_monthly WHERE month_id = %s AND closed", (prev,))
        av_ok = bool(cur.fetchone())
        cur.execute(f"SELECT 1 FROM {S}.fm_fact_monthly WHERE month_id = %s AND closed", (prev,))
        f_ok = bool(cur.fetchone())
        missing = [n for n, ok in (("авансы", av_ok), ("факт", f_ok)) if not ok]
        if missing:
            add(f"month_not_closed:{prev}", "month_not_closed", "high",
                f"{month_full(prev)} не закрыт: {', '.join(missing)}. Закрыть?", "close_month")

    # 2. Отклонение факта от прогноза > порога и 6. систематическое отклонение — из журнала адаптации
    alert_pct = float(c.get("adapt_alert_pct") or 20)
    cur.execute(
        f"SELECT l.*, coalesce(i.name, '') AS item_name FROM {S}.fm_adaptation_log l "
        f"LEFT JOIN {S}.fm_expense_items i ON i.id = l.item_id WHERE l.status <> 'cancelled' AND l.month_id >= %s",
        (add_months(cm, -3),),
    )
    labels = {"avans": "авансов", "fact": "факта", "variable_pct": "переменного %", "fixed_expense": "статьи",
              "new_item": "новой статьи"}
    for l in cur.fetchall():
        dp = float(l["deviation_pct"]) if l["deviation_pct"] is not None else None
        if l["metric"] in ("avans", "fact") and dp is not None and dp > alert_pct:
            add(f"deviation:{l['month_id']}:{l['metric']}", "deviation", "medium",
                f"{month_full(l['month_id'])}: отклонение {labels[l['metric']]} от прогноза "
                f"{'+' if float(l['deviation']) > 0 else '−'}{dp:.1f}% (больше {alert_pct:.0f}%).", "adaptation")
        if l["metric"] == "fixed_expense" and l["status"] == "applied":
            add(f"systematic:{l['month_id']}:{l['item_id']}", "systematic", "medium",
                f"«{l['item_name']}»: систематическое отклонение {int(c.get('adapt_systematic_months') or 3)} мес подряд — "
                "стоит изменить базовый прогноз.", "adaptation")

    # 3. Изменение переменного процента > 5 п.п. (месяц к месяцу по данным отчёта/ручным)
    pp = float(c.get("notify_variable_pp") or 5)
    vps = variable_pcts(cur)
    for a, b in zip(vps, vps[1:]):
        d = float(b["variable_pct"]) - float(a["variable_pct"])
        if abs(d) > pp:
            add(f"variable_pct:{b['month_id']}", "variable_pct", "medium",
                f"Переменный % за {month_label(b['month_id'])} изменился на {'+' if d > 0 else '−'}{abs(d):.2f} п.п. "
                f"({float(a['variable_pct']):.2f}% → {float(b['variable_pct']):.2f}%).", "revenue")

    # 4. Кассовый разрыв (активный сценарий)
    s = cf["summary"].get(sc) or {}
    if s.get("gap_months"):
        g = s["gap_months"]
        add(f"cash_gap:{sc}:{g[0]}", "cash_gap", "high",
            f"Кассовый разрыв ({SC_LABEL_RU.get(sc, sc)} сценарий): остаток в минусе {month_full(g[0]).lower()} – "
            f"{month_full(g[-1]).lower()}, дно {_rub(s['min_balance'])} ({month_full(s['min_month']).lower()}).", "cashflow")

    # 5. Кредит: риск просрочки — платёж месяца есть, а остатка на начало месяца не хватает на него,
    #    либо подходит дата платежа.
    option = c.get("credit_option_default") if c.get("credit_option_default") in CREDIT_OPTIONS else "6m"
    sched = {r["month_id"]: r for r in credit_schedule_calc(c, option)}
    pay = sched.get(cm)
    if pay and pay["status"] == "active":
        day = int(c.get("credit_payment_day") or 17)
        row = next((r for r in cf["rows"] if r["month_id"] == cm), None)
        start_bal = ((row or {}).get("values", {}).get(sc) or {}).get("start_balance")
        risk = round(float(c.get("credit_penalty_risk") or 0))
        if start_bal is not None and start_bal < pay["total"]:
            add(f"credit_risk:{cm}", "credit_overdue", "high",
                f"Риск просрочки кредита: платёж {_rub(pay['total'])} до {day:02d}.{cm[5:]} больше остатка на начало месяца "
                f"({_rub(start_bal)}). Штраф ~{_rub(risk)}.", "credit")
        elif 0 <= day - today.day <= 3:
            add(f"credit_due:{cm}", "credit_overdue", "high",
                f"Платёж по кредиту {_rub(pay['total'])} — до {day:02d}.{cm[5:]}. При просрочке штраф ~{_rub(risk)}.", "credit")

    # 7. Маржинальность не сохранена
    m = next((x for x in sources if x["source"] == "report_margin"), None)
    if m and m["status"] != "ok":
        add(f"margin_missing:{prev}", "margin_missing", "low",
            f"Отчёт «Маржинальность урока» за {month_label(prev)} не сохранён — переменный % взят из последнего известного месяца.",
            "revenue")

    # 8. Новая неопределённость
    cur.execute(f"SELECT id, name, new_since FROM {S}.fm_expense_items WHERE new_since IS NOT NULL")
    for r in cur.fetchall():
        add(f"new_item:{r['id']}", "new_item", "low",
            f"«{r['name']}» — новая статья без истории (с {month_label(r['new_since'])}), прогноз по аналогии.", "adaptation")
    return items


SC_LABEL_RU = {"min": "минимальный", "base": "базовый", "opt": "оптимистичный"}
MONTHS_FULL = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь",
               "Ноябрь", "Декабрь"]


def month_full(m):
    return f"{MONTHS_FULL[int(m[5:7]) - 1]} {m[:4]}"


def _rub(v):
    v = round(float(v))
    return ("−" if v < 0 else "") + f"{abs(v):,}".replace(",", " ") + " ₽"


def sync_notifications(cur, items):
    keys = [i["key"] for i in items]
    if items:
        execute_values(
            cur,
            f"INSERT INTO {S}.fm_notifications (key, type, priority, message, action_url) VALUES %s "
            "ON CONFLICT (key) DO UPDATE SET type=EXCLUDED.type, priority=EXCLUDED.priority, message=EXCLUDED.message, "
            "action_url=EXCLUDED.action_url, active=true, updated_at=now()",
            [(i["key"], i["type"], i["priority"], i["message"], i["action_url"]) for i in items],
        )
    cur.execute(f"UPDATE {S}.fm_notifications SET active = false WHERE active AND NOT (key = ANY(%s))", (keys,))
    cur.execute(
        f"SELECT * FROM {S}.fm_notifications WHERE active AND dismissed_at IS NULL "
        "AND (snoozed_until IS NULL OR snoozed_until < now())"
    )
    rows = [dict(r) for r in cur.fetchall()]
    rows.sort(key=lambda r: (PRIORITY_ORDER.get(r["priority"], 3), r["created_at"]))
    cur.execute(f"SELECT count(*) AS n FROM {S}.fm_notifications WHERE active AND (dismissed_at IS NOT NULL OR snoozed_until >= now())")
    return rows, cur.fetchone()["n"]


def get_dashboard(cur, conn):
    cf = calc_cashflow(cur, conn)  # пересчёт всей цепочки: прогнозы → P&L → Cash Flow
    c = constants(cur)
    sc = c.get("avans_scenario_active") or "base"
    cm = current_month()
    option = cf["credit_option"]

    cur.execute(f"SELECT month_id, scenario, avans, fact, revenue, variable_amount, margin_amount FROM {S}.fm_revenue_monthly")
    rev = {(r["month_id"], r["scenario"]): r for r in cur.fetchall()}
    cur.execute(f"SELECT * FROM {S}.fm_pnl_monthly")
    pnl = {(r["month_id"], r["scenario"]): r for r in cur.fetchall()}
    months = [r["month_id"] for r in cf["rows"]]

    kpi = {}
    for s in SCENARIOS:
        f = lambda k, src: round(sum(float((src.get((m, s)) or {}).get(k) or 0) for m in months))
        sm = cf["summary"].get(s) or {}
        kpi[s] = {
            "avans": f("avans", rev), "fact": f("fact", rev), "revenue": f("revenue", rev),
            "margin": f("margin_amount", rev), "net_profit": f("net_profit", pnl), "payout": round(sm.get("payout") or 0),
            "end_balance": round(sm.get("end_balance") or 0), "min_balance": round(sm.get("min_balance") or 0),
            "min_month": sm.get("min_month"), "gap_months": sm.get("gap_months") or [],
        }
    credit = credit_summary(credit_schedule_calc(c, option))

    series = []
    for i, m in enumerate(months):
        cfr = cf["rows"][i]["values"]
        row = {"month_id": m}
        for s in SCENARIOS:
            r, p = rev.get((m, s)) or {}, pnl.get((m, s)) or {}
            row[s] = {
                "avans": float(r.get("avans") or 0), "fact": float(r.get("fact") or 0),
                "margin": float(r.get("margin_amount") or 0), "end_balance": (cfr.get(s) or {}).get("end_balance"),
                "revenue_pnl": float(p.get("revenue") or 0), "gross_profit": float(p.get("gross_profit") or 0),
                "ebitda": float(p.get("ebitda") or 0), "net_profit": float(p.get("net_profit") or 0),
            }
        series.append(row)

    # Расходы по категориям (оттоки Cash Flow за период, активный сценарий)
    s = cf["summary"].get(sc) or {}
    expenses = [{"key": k, "value": round(s.get(k) or 0)} for k in CF_OUT]

    # Ручные вводы: что переопределено руками
    cur.execute(
        f"SELECT e.month_id, e.expense_id, e.amount, i.name FROM {S}.fm_expense_monthly e "
        f"JOIN {S}.fm_expense_items i ON i.id = e.expense_id WHERE e.source = 'manual' ORDER BY e.month_id"
    )
    manual_expenses = [dict(r) for r in cur.fetchall()]
    cur.execute(
        f"SELECT * FROM {S}.fm_monthly_inputs WHERE ruo_replacements IS NOT NULL OR admin_shifts_override IS NOT NULL "
        "OR admin_rate_override IS NOT NULL OR payout_pct_override IS NOT NULL OR payout_manual IS NOT NULL "
        "OR tax_regime_override IS NOT NULL ORDER BY month_id"
    )
    manual_inputs = [dict(r) for r in cur.fetchall()]
    cur.execute(f"SELECT month_id, variable_pct FROM {S}.fm_variable_pct_monthly WHERE source = 'override' ORDER BY month_id")
    manual_vp = [dict(r) for r in cur.fetchall()]
    cur.execute(f"SELECT s.staff_id, s.month_id, s.rate_override, f.name FROM {S}.fm_staff_monthly s "
                f"JOIN {S}.fm_staff f ON f.id = s.staff_id WHERE s.rate_override IS NOT NULL ORDER BY s.month_id")
    manual_staff = [dict(r) for r in cur.fetchall()]
    cur.execute(f"SELECT id, name, amount, is_fixed FROM {S}.fm_expense_items WHERE category = 'fixed' AND NOT is_fixed ORDER BY sort")
    editable_items = [dict(r) for r in cur.fetchall()]

    sources = data_sources(cur, c)
    notif, hidden = sync_notifications(cur, build_notifications(cur, c, cf, sources))

    to_close = {
        "avans": months_to_close(history(cur)),
        "fact": fact_months_to_close(fact_history(cur)),
    }
    cur.execute(f"SELECT max(calculated_at) AS t FROM {S}.fm_cashflow_monthly")
    last = cur.fetchone()["t"]
    tg = c.get("tax_regime_global") if c.get("tax_regime_global") in ("usn", "patent") else "auto"
    cur.execute(
        f"UPDATE {S}.fm_dashboard_state SET last_updated=%s, current_month=%s, active_scenario=%s, "
        "active_tax_regime=%s, active_credit_option=%s WHERE id = 1",
        (last, cm, sc, tg, option),
    )
    conn.commit()
    return {
        "ok": True,
        "last_updated": last,
        "current_month": cm,
        "prev_month": add_months(cm, -1),
        "active_scenario": sc,
        "tax_regime": tg,
        "tax_regime_now": tax_regime_default(c, cm),
        "start_patent_month": c.get("start_patent_month") or "2026-12",
        "credit_option": option,
        "credit": {**credit, "option": option},
        "months": months,
        "kpi": kpi,
        "series": series,
        "expenses": expenses,
        "start_balance": cf["start_balance"],
        "manual": {"expenses": manual_expenses, "inputs": manual_inputs, "variable_pct": manual_vp,
                   "staff": manual_staff, "items": editable_items},
        "sources": sources,
        "notifications": notif,
        "hidden_notifications": hidden,
        "to_close": to_close,
        "near_zero": float(c.get("scenario_near_zero_rub") or 100000),
    }


def notification_action(cur, conn, body):
    """dismiss — скрыть, snooze — отложить на 3 дня, read — прочитано, restore — вернуть все скрытые."""
    act = body.get("op")
    if act == "restore":
        cur.execute(f"UPDATE {S}.fm_notifications SET dismissed_at = NULL, snoozed_until = NULL WHERE active")
        conn.commit()
        return resp(200, {"ok": True})
    try:
        nid = int(body.get("id"))
    except (TypeError, ValueError):
        return resp(400, {"error": "Нужен id уведомления"})
    sql = {
        "dismiss": "dismissed_at = now()",
        "snooze": "snoozed_until = now() + interval '3 days'",
        "read": "read_at = coalesce(read_at, now())",
    }.get(act)
    if not sql:
        return resp(400, {"error": "Действие: dismiss / snooze / read / restore"})
    cur.execute(f"UPDATE {S}.fm_notifications SET {sql} WHERE id = %s", (nid,))
    conn.commit()
    return resp(200, {"ok": True})


def set_tax_regime_global(cur, conn, body):
    v = body.get("regime")
    if v not in ("auto", "usn", "patent"):
        return resp(400, {"error": "Режим: auto / usn / patent"})
    cur.execute(f"UPDATE {S}.fm_constants SET value_text = %s, updated_at = now() WHERE key = 'tax_regime_global'", (v,))
    conn.commit()
    return resp(200, {"ok": True})


def close_students_prev(cur, conn):
    """Для кнопки «Закрыть месяц»: ученики за прошлый месяц по отчётам (если ещё не закрыт)."""
    prev = add_months(current_month(), -1)
    cur.execute(f"SELECT closed FROM {S}.fm_students_monthly WHERE month_id = %s", (prev,))
    r = cur.fetchone()
    if r and r["closed"]:
        return resp(200, {"ok": True, "already": True})
    return close_students(cur, conn, {"month": prev})


# ---------------- СЦЕНАРИИ И ЧУВСТВИТЕЛЬНОСТЬ (Промт 14) ----------------
# Сценарии считаются одновременно, а не переключаются. Сначала полная модель обновляет все модули
# (calc_cashflow), затем из неё собираются «входы» месяца, и лёгкая модель в памяти пересчитывает цепочку
# аванс → факт → поступления → переменные → бонус РУО → налог → P&L → Cash Flow для любого набора параметров.
# Без изменений параметров лёгкая модель даёт ровно те же цифры, что вкладки P&L и Cash Flow.
#
# Экономика параметров:
#  • коэф. роста — прогноз аванса строится тем же алгоритмом (прямой × коэф. / сезонный, порог), факт — от него;
#  • цена ±x % — аванс и факт × (1 + x); уроков столько же, поэтому ЗП педагогов в рублях не меняется,
#    растёт только эквайринг (3,19 % от прибавки);
#  • ученики N — аванс, факт и переменные × N / текущее число учеников (больше уроков — больше ЗП);
#  • реклама — статья «Реклама» заменяется суммой сценария во всех месяцах прогноза;
#  • педагоги в найм — +60 000 ₽/мес за человека к постоянным (оклад + страховые 30 % + отпускные 12,5 %),
#    страховые уменьшают налог как взносы в СФ;
#  • кредит 6/12 мес и % выплаты собственнику — как в модулях «Кредит» и «Выплата».

SC_METRICS = ("avans", "fact", "revenue", "variable", "gross_profit", "fixed", "ano", "one_time", "ebitda",
              "interest", "tax", "net_profit", "payout", "body", "net_flow", "end_balance")
SC_MONTHLY_METRICS = ("avans", "net_profit", "ebitda", "net_flow", "end_balance")


def _avans_model(c, hist, shares, annual, corr, months, coef):
    """Прогноз аванса для произвольного коэффициента — тот же алгоритм, что recalc(), но без записи в БД."""
    fact = {h["month_id"]: float(h["avans"]) for h in hist}
    threshold = float(c.get("avans_seasonal_threshold_pct") or 15) / 100
    out = {}
    for m in months:
        prev_y = fact.get(add_months(m, -12))
        seasonal = annual * coef * shares[int(m[5:7])] / 100
        if prev_y is None:
            final = seasonal
        else:
            direct = prev_y * coef
            diff = abs(direct - seasonal) / direct if direct else 0
            final = (direct + seasonal) / 2 if diff > threshold else direct
        c_m = corr.get((m, ""), 0.0)
        out[m] = (max(round(final) + c_m, 0), c_m)
    return out


def scenario_inputs(cur, conn):
    """Собирает помесячные входы, общие для всех сценариев. Полный пересчёт Cash Flow занимает почти весь
    лимит времени функции, поэтому здесь — только обновление прогнозов (если устарели) и постоянных расходов,
    остальное читается из таблиц модулей."""
    get_revenue(cur, conn)
    c = constants(cur)
    fixed = calc_fixed(cur)  # заодно обновляет страховые сотрудников (вычет налога)
    conn.commit()
    cur.execute(f"SELECT DISTINCT month_id FROM {S}.fm_revenue_monthly ORDER BY month_id")
    months = [r["month_id"] for r in cur.fetchall()]

    self_m = float(c.get("fixed_self_contributions_2026") or 0) / 12
    cur.execute(f"SELECT month_id, sum(insurance) AS ins FROM {S}.fm_staff_monthly_payments WHERE scenario = 'base' GROUP BY 1")
    sf_emp = {r["month_id"]: float(r["ins"]) for r in cur.fetchall()}
    cur.execute(f"SELECT month_id, tax_regime_override, payout_pct_override, payout_manual FROM {S}.fm_monthly_inputs")
    m_inputs = {r["month_id"]: r for r in cur.fetchall()}
    cur.execute(f"SELECT month_id, scenario, end_balance FROM {S}.fm_cashflow_monthly ORDER BY month_id")
    cf_end = {}
    for r in cur.fetchall():
        cf_end[r["scenario"]] = float(r["end_balance"])

    hist = [h for h in history(cur) if h["closed"]]
    window = [h for h in hist if not h["exclude_from_seasonality"]][-12:]
    # Доли и коэффициенты — без округления, как их получает recalc()/recalc_fact() в момент расчёта.
    av_annual = sum(float(h["avans"]) for h in window)
    if c.get("seasonality_method") == "exp":
        cur.execute(f"SELECT month_num, share_pct FROM {S}.fm_seasonality")
        av_shares = {r["month_num"]: float(r["share_pct"]) for r in cur.fetchall()}
    else:
        av_shares = {int(h["month_id"][5:7]): float(h["avans"]) / av_annual * 100 for h in window}
    facts = [h for h in fact_history(cur) if h["closed"] and not h["exclude_from_seasonality"]]
    av_by_m = {h["month_id"]: float(h["avans"]) for h in hist}
    f_window = [h for h in facts if h["month_id"] in av_by_m][-12:]
    f_annual = sum(float(h["fact"]) for h in f_window)
    f_shares = {int(h["month_id"][5:7]): float(h["fact"]) / f_annual * 100 for h in f_window}
    f_coefs = {int(h["month_id"][5:7]): (float(h["fact"]) / av_by_m[h["month_id"]] if av_by_m[h["month_id"]] else 0)
               for h in f_window}

    cur.execute(f"SELECT DISTINCT ON (month_id) month_id, variable_pct FROM {S}.fm_revenue_monthly ORDER BY month_id")
    vp = {r["month_id"]: float(r["variable_pct"]) for r in cur.fetchall()}
    cur.execute(f"SELECT bonus_pct FROM {S}.fm_staff WHERE id = 'ruo_zinchenko'")
    ruo = cur.fetchone() or {}
    rows_fx = {r["key"]: r for r in fixed["rows"]}
    ano = {r["month_id"]: r["total"] for r in ano_rows(cur)}
    one_time = one_time_totals(cur)
    default_payout = float(c.get("payout_pct_default") or 10)

    month_in = {}
    for m in months:
        bonus_base = rows_fx["ruo_bonus"]["values"].get(m, {}).get("base", 0)
        fx_total = ((fixed["totals"].get(m) or {}).get("total") or {}).get("base", 0)
        mi = m_inputs.get(m) or {}
        month_in[m] = {
            "vp": vp.get(m, 0.0),
            "fixed_ex_bonus": float(fx_total) - float(bonus_base),
            "advertising": float(rows_fx.get("advertising", {}).get("values", {}).get(m, {}).get("base", 0)),
            "regime": mi.get("tax_regime_override") or tax_regime_default(c, m),
            "sf": sf_emp.get(m, 0.0) + self_m,
            "ano": float(ano.get(m, 0)),
            "one_time": float(one_time.get(m, 0)),
            "payout_pct": float(mi["payout_pct_override"]) if mi.get("payout_pct_override") is not None else default_payout,
            "payout_manual": float(mi["payout_manual"]) if mi.get("payout_manual") is not None else None,
        }
    return {
        "c": c,
        "months": months,
        "hist": hist,
        "av_shares": av_shares,
        "av_annual": av_annual,
        "av_corr": adapt_corrections(cur, "avans"),
        "f_shares": f_shares,
        "f_coefs": f_coefs,
        "f_annual": f_annual,
        "f_corr": adapt_corrections(cur, "fact"),
        "bonus_pct": float(ruo.get("bonus_pct") or 0.5) / 100,
        "month": month_in,
        "start_balance": bank_start_balance(cur, c, c.get("bank_fact_from") or "2026-10")["total"],
        "credit_default": c.get("credit_option_default") if c.get("credit_option_default") in CREDIT_OPTIONS else "6m",
        "price": float(c.get("avg_subscription_price") or 15000),
        "students": int(c.get("students_current") or 42),
        "teacher_cost": float(c.get("teacher_hire_monthly_cost") or 60000),
        "cashflow_end": cf_end,
    }


def run_model(inp, p):
    """Лёгкая модель: один сценарий → помесячные P&L/Cash Flow и годовые итоги. p — параметры сценария."""
    c = inp["c"]
    months = inp["months"]
    coef = float(p.get("growth_coef") or 1.4)
    k_price = 1 + float(p.get("price_change_pct") or 0) / 100
    k_stud = (float(p["students"]) / inp["students"]) if p.get("students") else 1.0
    acq = float(c.get("acquiring_pct") or 0) / 100
    ads = p.get("advertising")
    teachers = int((p.get("staff_changes") or {}).get("teachers") or 0)
    option = p.get("credit_option") if p.get("credit_option") in CREDIT_OPTIONS else inp["credit_default"]
    payout_pct = p.get("payout_pct")
    threshold = float(c.get("avans_seasonal_threshold_pct") or 15) / 100

    usn_pct = float(c.get("tax_usn_pct") or 6) / 100
    patent_m = float(c.get("patent_cost_year") or 78300) / 12
    max_ded = float(c.get("max_deduction_pct") or 50) / 100
    ins_pct = float(c.get("insurance_pct") or 30) / 100
    vac_pct = float(c.get("vacation_reserve_pct") or 12.5) / 100
    t_cost = inp["teacher_cost"] * teachers
    t_ins = t_cost / (1 + ins_pct + vac_pct) * ins_pct  # страховые педагогов — в вычет налога

    credit = {r["month_id"]: r for r in credit_schedule_calc(c, option)}
    av = _avans_model(c, inp["hist"], inp["av_shares"], inp["av_annual"], inp["av_corr"], months, coef)

    bal, monthly, worst = inp["start_balance"], [], None
    for m in months:
        mi = inp["month"][m]
        num = int(m[5:7])
        avans_raw, av_c = av[m]
        # Факт — от модельного аванса (без поправки аванса), как в recalc_fact().
        model_av = avans_raw - av_c
        direct = model_av * inp["f_coefs"].get(num, 0)
        seasonal = inp["f_annual"] * coef * inp["f_shares"].get(num, 0) / 100
        diff = abs(direct - seasonal) / direct if direct else 0
        fact_raw = (direct + seasonal) / 2 if diff > threshold else direct
        fact_raw = max(round(fact_raw) + inp["f_corr"].get((m, ""), 0.0), 0)

        k = k_price * k_stud
        avans = round(avans_raw * k)
        fact = round(fact_raw * k)
        var_base = round(fact_raw * k_stud) * mi["vp"] / 100
        # Цена меняет только выручку: ЗП педагогов за урок та же, эквайринг растёт с суммой.
        variable = round(var_base + (fact - round(fact_raw * k_stud)) * acq)
        revenue_in = avans * (1 - acq)
        gross = fact - variable

        fixed = mi["fixed_ex_bonus"] + _r(avans * inp["bonus_pct"]) + t_cost
        if ads is not None:
            fixed += float(ads) - mi["advertising"]
        ebitda = gross - fixed - mi["ano"] - mi["one_time"]

        cr = credit.get(m) or {"interest": 0, "body": 0}
        sf = mi["sf"] + t_ins
        gross_tax = avans * usn_pct if mi["regime"] == "usn" else patent_m
        tax = _c2(max(gross_tax - sf, gross_tax * (1 - max_ded)))
        net = ebitda - cr["interest"] - tax

        if payout_pct is not None:
            payout = round(round(revenue_in) * float(payout_pct) / 100)
        elif mi["payout_manual"] is not None:
            payout = round(float(mi["payout_manual"]))
        else:
            payout = round(round(revenue_in) * mi["payout_pct"] / 100)
        outflow = variable + fixed + mi["ano"] + mi["one_time"] + tax + cr["interest"] + cr["body"] + payout
        net_flow = round(revenue_in) - outflow
        bal += net_flow
        if worst is None or bal < worst[1]:
            worst = (m, bal)
        monthly.append({
            "month_id": m, "avans": avans, "fact": fact, "revenue": round(revenue_in), "variable": variable,
            "gross_profit": gross, "fixed": round(fixed, 2), "ano": mi["ano"], "one_time": mi["one_time"],
            "ebitda": round(ebitda, 2), "interest": cr["interest"], "tax": tax, "net_profit": round(net, 2),
            "payout": payout, "body": cr["body"], "net_flow": round(net_flow, 2), "end_balance": round(bal, 2),
        })
    annual = {k: round(sum(r[k] for r in monthly), 2) for k in SC_METRICS if k != "end_balance"}
    annual["end_balance"] = round(bal, 2)
    annual["min_balance"] = round(worst[1], 2) if worst else None
    annual["min_month"] = worst[0] if worst else None
    annual["gap_months"] = [r["month_id"] for r in monthly if r["end_balance"] < 0]
    annual["credit_option"] = option
    return {"annual": annual, "monthly": monthly}


def scenario_rows(cur):
    cur.execute(f"SELECT * FROM {S}.fm_scenarios ORDER BY sort, created_at")
    out = []
    for r in cur.fetchall():
        d = dict(r)
        for k in ("growth_coef", "price_change_pct", "advertising_override", "payout_pct"):
            if d[k] is not None:
                d[k] = float(d[k])
        out.append(d)
    return out


def scenario_params(s):
    return {"growth_coef": s["growth_coef"], "price_change_pct": s["price_change_pct"],
            "students": s.get("students_override"), "advertising": s["advertising_override"],
            "staff_changes": s["staff_changes"] or {}, "credit_option": s["credit_option"],
            "payout_pct": s["payout_pct"]}


def build_sensitivity(inp, base_coefs):
    """Плотные сетки по 4 параметрам × 3 базовых сценария: слайдер в интерфейсе просто выбирает точку."""
    price = inp["price"]
    grids = {
        "price": [12000 + 500 * i for i in range(13)],
        "students": list(range(35, 101)),
        "advertising": [30000 + 5000 * i for i in range(25)],
        "staff": [0, 1, 2, 3, 4],
    }
    tables = {}
    for param, values in grids.items():
        res = {}
        for sc, coef in base_coefs.items():
            pts = []
            for v in values:
                p = {"growth_coef": coef}
                if param == "price":
                    p["price_change_pct"] = (v / price - 1) * 100
                elif param == "students":
                    p["students"] = v
                elif param == "advertising":
                    p["advertising"] = v
                else:
                    p["staff_changes"] = {"teachers": v}
                a = run_model(inp, p)["annual"]
                pts.append({"value": v, "net_profit": a["net_profit"], "end_balance": a["end_balance"],
                            "ebitda": a["ebitda"], "min_balance": a["min_balance"]})
            res[sc] = pts
        tables[param] = {"values": values, "results": res}
    return tables


def get_scenarios(cur, conn):
    inp = scenario_inputs(cur, conn)
    c = inp["c"]
    scs = scenario_rows(cur)
    base_coefs = {sc: float(c[f"avans_coef_{sc}"]) for sc in SCENARIOS}
    # Встроенные сценарии всегда берут коэффициенты из констант модели.
    for s in scs:
        if s["is_builtin"] and s["id"] in base_coefs:
            s["growth_coef"] = base_coefs[s["id"]]

    results, db = {}, []
    for s in scs:
        r = run_model(inp, scenario_params(s))
        results[s["id"]] = r
        for k in SC_METRICS:
            db.append((s["id"], k, "annual", r["annual"][k]))
        for row in r["monthly"]:
            for k in SC_MONTHLY_METRICS:
                db.append((s["id"], k, row["month_id"], row[k]))
    cur.execute(f"DELETE FROM {S}.fm_scenario_results")
    execute_values(cur, f"INSERT INTO {S}.fm_scenario_results (scenario_id, metric, period, value) VALUES %s",
                   db, page_size=1000)

    sens = build_sensitivity(inp, base_coefs)
    for param, t in sens.items():
        cur.execute(
            f"INSERT INTO {S}.fm_sensitivity_tables (id, parameter, \"values\", results, calculated_at) "
            "VALUES (%s,%s,%s,%s,now()) ON CONFLICT (id) DO UPDATE SET \"values\"=EXCLUDED.\"values\", "
            "results=EXCLUDED.results, calculated_at=now()",
            (param, param, json.dumps(t["values"]), json.dumps(t["results"])),
        )
    conn.commit()

    # Сверка: лёгкая модель без изменений = вкладка Cash Flow (защита от расхождения двух расчётов).
    # Сравниваем с последним сохранённым расчётом вкладки Cash Flow.
    cf = inp["cashflow_end"]
    check = {sc: {"cashflow_end_balance": cf[sc],
                  "model_end_balance": results[sc]["annual"]["end_balance"],
                  "diff": round(results[sc]["annual"]["end_balance"] - cf[sc], 2)}
             for sc in SCENARIOS if sc in cf and sc in results}
    return {
        "ok": True,
        "current_month": current_month(),
        "active_scenario": c.get("avans_scenario_active") or "base",
        "months": inp["months"],
        "scenarios": scs,
        "results": results,
        "sensitivity": sens,
        "base_params": {
            "price": inp["price"], "students": inp["students"], "teacher_cost": inp["teacher_cost"],
            "advertising": round(next(iter(inp["month"].values()))["advertising"]) if inp["month"] else 0,
            "credit_option": inp["credit_default"], "payout_pct": float(c.get("payout_pct_default") or 10),
            "near_zero": float(c.get("scenario_near_zero_rub") or 100000),
        },
        "check": check,
    }


def save_scenario(cur, conn, body):
    name = str(body.get("name") or "").strip()[:120]
    if not name:
        return resp(400, {"error": "Нужно название сценария"})
    sid = str(body.get("id") or "")
    cur.execute(f"SELECT is_builtin FROM {S}.fm_scenarios WHERE id = %s", (sid,))
    ex = cur.fetchone()
    if ex and ex["is_builtin"]:
        return resp(400, {"error": "Базовые сценарии меняются через коэффициенты модели"})

    def num(key, lo=None, hi=None, integer=False):
        v = body.get(key)
        if v is None or v == "":
            return None
        v = int(v) if integer else float(v)
        if (lo is not None and v < lo) or (hi is not None and v > hi):
            raise ValueError(key)
        return v

    try:
        coef = num("growth_coef", 0.5, 3) or 1.4
        price = num("price_change_pct", -90, 300) or 0
        students = num("students_override", 1, 1000, True)
        ads = num("advertising_override", 0, 10_000_000)
        payout = num("payout_pct", 0, 100)
        teachers = int((body.get("staff_changes") or {}).get("teachers") or 0)
        if teachers < 0 or teachers > 50:
            raise ValueError("teachers")
    except (TypeError, ValueError):
        return resp(400, {"error": "Проверьте значения: коэф. 0,5–3, цена −90…+300 %, выплата 0–100 %, педагогов 0–50"})
    credit = body.get("credit_option") if body.get("credit_option") in CREDIT_OPTIONS else None
    note = str(body.get("note") or "")[:300]
    staff = json.dumps({"teachers": teachers})
    if ex:
        cur.execute(
            f"UPDATE {S}.fm_scenarios SET name=%s, growth_coef=%s, price_change_pct=%s, students_override=%s, "
            "advertising_override=%s, staff_changes=%s, credit_option=%s, payout_pct=%s, note=%s, updated_at=now() WHERE id=%s",
            (name, coef, price, students, ads, staff, credit, payout, note, sid),
        )
    else:
        sid = "u_" + datetime.datetime.utcnow().strftime("%y%m%d%H%M%S%f")[:16]
        cur.execute(
            f"INSERT INTO {S}.fm_scenarios (id, name, growth_coef, price_change_pct, students_override, "
            "advertising_override, staff_changes, credit_option, payout_pct, note, sort) "
            f"VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,(SELECT coalesce(max(sort),10)+1 FROM {S}.fm_scenarios))",
            (sid, name, coef, price, students, ads, staff, credit, payout, note),
        )
    conn.commit()
    return resp(200, {"ok": True, "id": sid})


def delete_scenario(cur, conn, body):
    sid = str(body.get("id") or "")
    cur.execute(f"SELECT is_builtin FROM {S}.fm_scenarios WHERE id = %s", (sid,))
    r = cur.fetchone()
    if not r:
        return resp(404, {"error": "Сценарий не найден"})
    if r["is_builtin"]:
        return resp(400, {"error": "Базовые сценарии удалить нельзя"})
    cur.execute(f"DELETE FROM {S}.fm_scenario_results WHERE scenario_id = %s", (sid,))
    cur.execute(f"DELETE FROM {S}.fm_scenarios WHERE id = %s", (sid,))
    conn.commit()
    return resp(200, {"ok": True})


def handler(event: dict, context) -> dict:
    """Финмодель: GET ?action=avans|fact|revenue|students|fixed|credit|ano|taxes|payouts|one_time|pnl|cashflow|adaptation|scenarios|dashboard — история, сезонность, прогноз; POST avans_close / fact_close / set_variable_pct / set_students / close_students / set_fixed_expense / set_month_inputs / set_staff_rate / set_staff_month_rate / set_scenario / set_credit_option / set_ano / set_tax_regime / set_payout / save_one_time / delete_one_time / set_adapt_params / cancel_adaptation / adapt_manual / adapt_new_item / adapt_set_base / save_scenario / delete_scenario / notification / set_tax_regime_global / close_students_prev / recalc."""
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
            if action == "payouts":
                return resp(200, calc_payouts(cur, conn))
            if action == "one_time":
                return resp(200, get_one_time(cur))
            if action == "pnl":
                return resp(200, calc_pnl(cur, conn))
            if action == "cashflow":
                return resp(200, calc_cashflow(cur, conn))
            if action == "adaptation":
                return resp(200, get_adaptation(cur, conn))
            if action == "scenarios":
                return resp(200, get_scenarios(cur, conn))
            if action == "dashboard":
                return resp(200, get_dashboard(cur, conn))
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
            if action == "save_one_time":
                return save_one_time(cur, conn, body)
            if action == "delete_one_time":
                return delete_one_time(cur, conn, body)
            if action == "set_payout":
                return set_payout(cur, conn, body)
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
            if action == "set_adapt_params":
                return set_adapt_params(cur, conn, body)
            if action == "cancel_adaptation":
                return cancel_adaptation(cur, conn, body)
            if action == "adapt_manual":
                return adapt_manual(cur, conn, body)
            if action == "adapt_new_item":
                return adapt_new_item(cur, conn, body)
            if action == "adapt_set_base":
                return adapt_set_base(cur, conn, body)
            if action == "notification":
                return notification_action(cur, conn, body)
            if action == "set_tax_regime_global":
                return set_tax_regime_global(cur, conn, body)
            if action == "close_students_prev":
                return close_students_prev(cur, conn)
            if action == "save_scenario":
                return save_scenario(cur, conn, body)
            if action == "delete_scenario":
                return delete_scenario(cur, conn, body)
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