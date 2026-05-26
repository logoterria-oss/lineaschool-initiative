import os
import json
import re
import requests
import psycopg2
from psycopg2.extras import RealDictCursor

S20_HOST = "https://11086.s20.online"
S20_EMAIL = "abram.viktoriya.00@mail.ru"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
}

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"


def db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def make_session(cookies: dict = None) -> requests.Session:
    s = requests.Session()
    s.headers.update({
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Language": "ru-RU,ru;q=0.9",
    })
    if cookies:
        for k, v in cookies.items():
            s.cookies.set(k, v)
    return s


def handler(event: dict, context) -> dict:
    """Сессионный логин в S20 CRM с поддержкой 2FA. Хранит cookies в БД."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    mode = params.get("mode", "status")

    try:
        if mode == "step1":
            return step1()
        if mode == "step2":
            return step2()
        if mode == "fetch_graph":
            return fetch_graph(int(params.get("teacher_id", 2)))
        if mode == "status":
            return status()
        if mode == "atomic":
            return atomic_login()
        if mode == "use_browser_cookie":
            return use_browser_cookie()
        return {"statusCode": 400, "headers": CORS,
                "body": json.dumps({"error": "unknown mode"})}
    except Exception as e:
        return {"statusCode": 500, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"error": str(e)}, ensure_ascii=False)}


def status() -> dict:
    conn = db()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT is_authenticated, updated_at FROM s20_session ORDER BY id DESC LIMIT 1")
        row = cur.fetchone()
    conn.close()
    if not row:
        return _json({"authenticated": False, "msg": "Нет сессии. Сделай step1"})
    return _json({
        "authenticated": bool(row["is_authenticated"]),
        "updated_at": str(row["updated_at"]),
    })


def step1() -> dict:
    """Логин/пароль → сервер шлёт код 2FA на почту. Сохраняем сессию в БД."""
    email = os.environ.get("S20_ADMIN_EMAIL", S20_EMAIL)
    password = os.environ.get("S20_ADMIN_PASSWORD", "")
    if not password:
        return _json({"error": "S20_ADMIN_PASSWORD не задан"}, 400)

    s = make_session()
    page = s.get(f"{S20_HOST}/login", timeout=10)
    csrf_m = re.search(r'name="csrf-token" content="([^"]+)"', page.text)
    csrf = csrf_m.group(1) if csrf_m else ""

    r = s.post(f"{S20_HOST}/login", data={
        "_csrf": csrf,
        "LoginForm[username]": email,
        "LoginForm[password]": password,
        "LoginForm[rememberMe]": "1",
    }, headers={"Referer": f"{S20_HOST}/login", "X-CSRF-Token": csrf,
                "Origin": S20_HOST}, timeout=10, allow_redirects=True)

    body = r.text
    new_csrf_m = re.search(r'name="csrf-token" content="([^"]+)"', body)
    new_csrf = new_csrf_m.group(1) if new_csrf_m else csrf
    inputs = re.findall(r'<input[^>]+name="([^"]+)"', body)
    has_2fa = "Login2FAForm[code]" in inputs

    conn = db()
    with conn.cursor() as cur:
        cur.execute("DELETE FROM s20_session")
        cur.execute("INSERT INTO s20_session (cookies, csrf, is_authenticated) VALUES (%s, %s, FALSE)",
                    (json.dumps(dict(s.cookies)), new_csrf))
        conn.commit()
    conn.close()

    return _json({
        "ok": True, "step": 1, "needs_2fa": has_2fa,
        "msg": "Код отправлен на почту. Сохрани его в секрет S20_AUTH_CODE и вызови mode=step2",
    })


def step2() -> dict:
    """Подставляем код 2FA, используя cookies из БД."""
    code = os.environ.get("S20_AUTH_CODE", "").strip()
    if not code:
        return _json({"error": "Нужен секрет S20_AUTH_CODE с кодом из письма"}, 400)

    conn = db()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT cookies, csrf FROM s20_session ORDER BY id DESC LIMIT 1")
        row = cur.fetchone()
    conn.close()
    if not row:
        return _json({"error": "Сначала вызови step1"}, 400)

    s = make_session(json.loads(row["cookies"]))
    csrf = row["csrf"]

    r = s.post(f"{S20_HOST}/login", data={
        "_csrf": csrf,
        "Login2FAForm[code]": code,
        "Login2FAForm[rememberMe]": "1",
    }, headers={"Referer": f"{S20_HOST}/login", "X-CSRF-Token": csrf,
                "Origin": S20_HOST}, timeout=10, allow_redirects=True)

    body = r.text
    inputs = re.findall(r'<input[^>]+name="([^"]+)"', body)
    still_login = "LoginForm[username]" in inputs or "Login2FAForm[code]" in inputs

    if not still_login:
        conn = db()
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE s20_session SET cookies = %s, is_authenticated = TRUE, updated_at = NOW()",
                (json.dumps(dict(s.cookies)),))
            conn.commit()
        conn.close()
        return _json({
            "ok": True, "step": 2, "authenticated": True,
            "final_url": r.url,
            "msg": "Сессия сохранена! Дёргай mode=fetch_graph&teacher_id=2 чтобы вытянуть график",
        })

    text = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', body, flags=re.DOTALL)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return _json({
        "ok": False, "step": 2, "authenticated": False,
        "final_url": r.url, "preview": text[:600],
        "msg": "Код не подошёл/истёк. Повтори step1 и заново S20_AUTH_CODE.",
    })


def fetch_graph(teacher_id: int) -> dict:
    """Через авторизованную сессию получает страницу педагога и ищет график."""
    conn = db()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT cookies, is_authenticated FROM s20_session ORDER BY id DESC LIMIT 1")
        row = cur.fetchone()
    conn.close()
    if not row or not row["is_authenticated"]:
        return _json({"error": "Нет авторизованной сессии. Сделай step1 и step2"}, 400)

    s = make_session(json.loads(row["cookies"]))
    urls = [
        f"{S20_HOST}/1/teacher/update/id/{teacher_id}",
        f"{S20_HOST}/1/teacher/view/id/{teacher_id}",
        f"{S20_HOST}/1/teacher-graph/index?teacher_id={teacher_id}",
        f"{S20_HOST}/1/cgraph/index?teacher_id={teacher_id}",
        f"{S20_HOST}/1/teacher/graph?id={teacher_id}",
    ]
    results = {}
    for url in urls:
        try:
            r = s.get(url, timeout=8, headers={"X-Requested-With": "XMLHttpRequest"})
            ct = r.headers.get("Content-Type", "")
            text = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', r.text, flags=re.DOTALL)
            text = re.sub(r'<[^>]+>', ' ', text)
            text = re.sub(r'\s+', ' ', text).strip()
            key = url.replace(S20_HOST, "")
            results[key] = {
                "status": r.status_code,
                "ct": ct[:50], "length": len(r.text),
                "has_login_form": "LoginForm" in r.text,
                "has_graph_word": "график" in r.text.lower(),
                "preview": text[:1000],
            }
        except Exception as e:
            results[url.replace(S20_HOST, "")] = str(e)
    return _json(results)


def atomic_login() -> dict:
    """Полный логин в одном запросе:
    1) GET /login → csrf
    2) POST /login (логин+пароль) → редирект на форму 2FA, новые cookies+csrf
    3) Сохраняем сессию И ждём, что пользователь уже подставил код в S20_AUTH_CODE.
       Но т.к. код приходит ТОЛЬКО после шага 2 — атомарно невозможно.
       Вместо этого: делаем step1, ждём 60 сек (пользователь смотрит код), потом step2.
       НЕТ — лучше: делаем step1 и сразу пробуем step2 с текущим S20_AUTH_CODE.
       Это работает если код уже есть от предыдущей попытки и ещё активен.
    """
    debug = {}
    email = os.environ.get("S20_ADMIN_EMAIL", S20_EMAIL)
    password = os.environ.get("S20_ADMIN_PASSWORD", "")
    code = os.environ.get("S20_AUTH_CODE", "").strip()
    if not password or not code:
        return _json({"error": "Нужны S20_ADMIN_PASSWORD и S20_AUTH_CODE"}, 400)

    s = make_session()
    # Шаг 1
    page = s.get(f"{S20_HOST}/login", timeout=10)
    csrf_m = re.search(r'name="csrf-token" content="([^"]+)"', page.text)
    csrf = csrf_m.group(1) if csrf_m else ""
    debug["step1_csrf"] = csrf[:20]
    debug["step1_cookies"] = list(s.cookies.keys())

    r1 = s.post(f"{S20_HOST}/login", data={
        "_csrf": csrf,
        "LoginForm[username]": email,
        "LoginForm[password]": password,
        "LoginForm[rememberMe]": "1",
    }, headers={"Referer": f"{S20_HOST}/login", "X-CSRF-Token": csrf,
                "Origin": S20_HOST}, timeout=10, allow_redirects=True)

    body1 = r1.text
    new_csrf_m = re.search(r'name="csrf-token" content="([^"]+)"', body1)
    csrf2 = new_csrf_m.group(1) if new_csrf_m else csrf
    inputs1 = re.findall(r'<input[^>]+name="([^"]+)"', body1)
    debug["after_step1_inputs"] = inputs1
    debug["after_step1_url"] = r1.url
    debug["after_step1_cookies"] = list(s.cookies.keys())
    debug["step2_csrf"] = csrf2[:20]

    has_2fa = "Login2FAForm[code]" in inputs1
    if not has_2fa:
        return _json({"error": "Сервер не показал форму 2FA", "debug": debug}, 500)

    # Шаг 2 — сразу
    r2 = s.post(f"{S20_HOST}/login", data={
        "_csrf": csrf2,
        "Login2FAForm[code]": code,
        "Login2FAForm[rememberMe]": "1",
    }, headers={"Referer": f"{S20_HOST}/login", "X-CSRF-Token": csrf2,
                "Origin": S20_HOST}, timeout=10, allow_redirects=True)

    body2 = r2.text
    inputs2 = re.findall(r'<input[^>]+name="([^"]+)"', body2)
    still_login = "LoginForm[username]" in inputs2 or "Login2FAForm[code]" in inputs2
    text2 = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', body2, flags=re.DOTALL)
    text2 = re.sub(r'<[^>]+>', ' ', text2)
    text2 = re.sub(r'\s+', ' ', text2).strip()
    debug["after_step2_url"] = r2.url
    debug["after_step2_status"] = r2.status_code
    debug["after_step2_inputs"] = inputs2[:10]
    debug["after_step2_preview"] = text2[:400]
    debug["after_step2_cookies"] = list(s.cookies.keys())

    if not still_login:
        conn = db()
        with conn.cursor() as cur:
            cur.execute("DELETE FROM s20_session")
            cur.execute(
                "INSERT INTO s20_session (cookies, csrf, is_authenticated) VALUES (%s, %s, TRUE)",
                (json.dumps(dict(s.cookies)), csrf2))
            conn.commit()
        conn.close()
        return _json({
            "ok": True, "authenticated": True, "final_url": r2.url,
            "debug": debug,
            "msg": "Сессия сохранена! Дёргай fetch_graph",
        })
    return _json({
        "ok": False, "authenticated": False, "debug": debug,
        "msg": "Код не подошёл/истёк. Получи новый и повтори.",
    }, 200)


def use_browser_cookie() -> dict:
    """Берёт PHPSESSID из секрета S20_BROWSER_PHPSESSID,
    проверяет что это активная сессия (GET /), сохраняет в БД."""
    phpsessid = os.environ.get("S20_BROWSER_PHPSESSID", "").strip()
    if not phpsessid:
        return _json({"error": "S20_BROWSER_PHPSESSID не задан"}, 400)

    s = make_session({"PHPSESSID": phpsessid})
    r = s.get(f"{S20_HOST}/", timeout=10, allow_redirects=True)
    body = r.text

    text = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', body, flags=re.DOTALL)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()

    has_login_form = "LoginForm[username]" in body
    has_2fa_form = "Login2FAForm[code]" in body
    final_url = r.url
    is_logged_in = not has_login_form and not has_2fa_form and r.status_code == 200

    csrf_m = re.search(r'name="csrf-token" content="([^"]+)"', body)
    csrf = csrf_m.group(1) if csrf_m else ""

    debug = {
        "final_url": final_url,
        "status": r.status_code,
        "has_login_form": has_login_form,
        "has_2fa_form": has_2fa_form,
        "cookies_after": list(s.cookies.keys()),
        "preview": text[:400],
        "csrf_len": len(csrf),
    }

    if is_logged_in:
        conn = db()
        with conn.cursor() as cur:
            cur.execute("DELETE FROM s20_session")
            cur.execute(
                "INSERT INTO s20_session (cookies, csrf, is_authenticated) VALUES (%s, %s, TRUE)",
                (json.dumps(dict(s.cookies) or {"PHPSESSID": phpsessid}), csrf))
            conn.commit()
        conn.close()
        return _json({"ok": True, "authenticated": True, "msg": "Сессия из браузера сохранена!", "debug": debug})

    return _json({"ok": False, "authenticated": False,
                  "msg": "Кука не рабочая или истекла. Перелогинься в браузере и скопируй PHPSESSID заново.",
                  "debug": debug}, 200)


def _json(payload: dict, code: int = 200) -> dict:
    return {"statusCode": code,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(payload, ensure_ascii=False)}