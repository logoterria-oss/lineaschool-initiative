"""Финансовая модель: авансовые и фактические доходы — история, сезонность, прогноз по трём сценариям."""
import os
import json
import datetime
from decimal import Decimal

import psycopg2
from psycopg2.extras import RealDictCursor

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


def get_revenue(cur, conn):
    c = constants(cur)
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
        return resp(400, {"error": "Процент этого месяца взят из отчёта — его не меняем"})
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


def handler(event: dict, context) -> dict:
    """Финмодель: GET ?action=avans|fact|revenue — история, сезонность, прогноз; POST avans_close / fact_close / set_variable_pct / set_scenario / recalc."""
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