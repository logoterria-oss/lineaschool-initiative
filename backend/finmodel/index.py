"""Финансовая модель: авансовые доходы — история, сезонность, прогноз по трём сценариям."""
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
    recalc(cur, constants(cur))
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


def handler(event: dict, context) -> dict:
    """Финмодель: GET ?action=avans — авансы, сезонность, прогноз; POST avans_close / set_scenario / recalc."""
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
            return resp(400, {"error": "Неизвестное действие"})

        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            action = body.get("action")
            if action == "avans_close":
                return close_month(cur, conn, body)
            if action == "set_scenario":
                return set_scenario(cur, conn, body)
            if action == "recalc":
                recalc(cur, constants(cur))
                conn.commit()
                return resp(200, {"ok": True})
            return resp(400, {"error": "Неизвестное действие"})

        return resp(405, {"error": "Метод не поддерживается"})
    finally:
        conn.close()
