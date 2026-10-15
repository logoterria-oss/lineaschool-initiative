"""
Отправка новых лидов с сайта в «Окно взаимодействия».

Окно живёт в отдельном проекте, общаемся с ним по HTTP — так же, как
с анкетами и оплатами. Окно само рассылает уведомление сотрудникам из
списка notify. Повторная отправка того же лида безопасна: окно узнаёт
его по leadId и не дублирует уведомление.
"""

import json
import os
import re
import time
import urllib.error
import urllib.request
from typing import Any, Dict, Optional

import psycopg2

LEAD_HOOK_URL = (
    'https://functions.poehali.dev/67e8d62d-902a-4e5e-9862-d18395a730b1?action=lead-hook'
)

# Кому окно присылает уведомление о новом лиде. Сотрудников окно
# сопоставляет по телефону (7XXXXXXXXXX).
LEAD_NOTIFY = [
    {'name': 'Абраменко Виктория', 'phone': '79236251611'},
    {'name': 'Зинченко Ирина', 'phone': '79879500712'},
    {'name': 'Хорунжева Анна', 'phone': '79277601832'},
]

HOOK_ATTEMPTS = 3
HOOK_RETRY_DELAYS = (1, 2)
HOOK_TIMEOUT = 5

# Такое же правило, как в «Списке лидов»: тестовые заявки никуда не шлём
TEST_RE = re.compile(r'(^|[^а-яёa-z0-9])(тест(ов(ый|ая|ое|ые))?|test)([^а-яёa-z0-9]|$)')
NOT_TEST_SQL = (
    "NOT (concat_ws(' ', parent_name, student_name, contact) ~ "
    "'(^|[^А-ЯЁа-яёA-Za-z0-9])([Тт][Ее][Сс][Тт]([Оо][Вв]([Ыы][Йй]|[Аа][Яя]|[Оо][Ее]|[Ыы][Ее]))?|[Tt][Ee][Ss][Tt])([^А-ЯЁа-яёA-Za-z0-9]|$)')"
)


def is_test_lead(*parts: Optional[str]) -> bool:
    return bool(TEST_RE.search(' '.join(p or '' for p in parts).lower()))


def norm_phone(raw: Optional[str]) -> str:
    digits = re.sub(r'\D', '', raw or '')
    if len(digits) == 11 and digits[0] == '8':
        digits = '7' + digits[1:]
    if len(digits) == 10:
        digits = '7' + digits
    return digits[:11]


def service_key_ok(event: Dict[str, Any]) -> bool:
    key = os.environ.get('INTERACTION_SERVICE_KEY')
    if not key:
        return False
    for name, value in (event.get('headers') or {}).items():
        if str(name).lower() == 'x-service-key':
            return str(value or '') == key
    return False


def lead_payload(row: Dict[str, Any]) -> Dict[str, Any]:
    """Одно и то же тело и для хука, и для выгрузки."""
    phone = norm_phone(str(row.get('phone') or row.get('contact') or ''))
    created = row.get('created_at')
    return {
        # leadId — ключ: по нему окно не шлёт уведомление дважды
        'leadId': str(row.get('id') or ''),
        'kind': 'new_lead',
        'title': 'Новая запись на диагностику',
        # Готовый текст уведомления — тот же, что раньше приходил в Telegram
        'text': row.get('notify_text') or '',
        'parentName': row.get('parent_name') or '',
        'childName': row.get('student_name') or '',
        'phone': f'+{phone}' if phone else '',
        'telegram': row.get('telegram') or '',
        'createdAt': created.isoformat() if hasattr(created, 'isoformat') else created,
        'notify': LEAD_NOTIFY,
    }


def _post_once(payload: Dict[str, Any], key: str) -> Dict[str, Any]:
    req = urllib.request.Request(
        LEAD_HOOK_URL,
        data=json.dumps(payload, ensure_ascii=False).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'X-Service-Key': key},
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=HOOK_TIMEOUT) as resp:
        body = json.loads(resp.read().decode() or '{}')
        return {'ok': resp.status == 200, 'status': resp.status, 'response': body}


def send_lead_hook(row: Dict[str, Any]) -> Dict[str, Any]:
    """Шлём лид в окно. Ошибки не роняют приём заявки."""
    key = os.environ.get('INTERACTION_SERVICE_KEY')
    if not key:
        print('lead-hook: INTERACTION_SERVICE_KEY не задан')
        return {'ok': False, 'error': 'no_service_key'}

    payload = lead_payload(row)
    last: Dict[str, Any] = {'ok': False, 'error': 'not_sent'}
    for attempt in range(1, HOOK_ATTEMPTS + 1):
        try:
            last = _post_once(payload, key)
            if last['ok']:
                print(f"lead-hook -> 200 leadId={payload['leadId']} (попытка {attempt})")
                return {'ok': True, 'attempts': attempt}
            last = {'ok': False, 'error': f"http_{last['status']}", 'attempts': attempt}
        except urllib.error.HTTPError as e:
            text = e.read().decode(errors='replace')[:300]
            last = {'ok': False, 'error': f'HTTP {e.code}: {text}', 'attempts': attempt}
            # Окно не принимает хук (ключ/обработчик) — повторы не помогут,
            # лид останется в feed
            if e.code in (401, 403, 404):
                print(f'lead-hook: окно отклонило хук ({e.code})')
                return last
        except Exception as e:
            last = {'ok': False, 'error': str(e), 'attempts': attempt}

        print(f"lead-hook: попытка {attempt} не удалась — {last.get('error')}")
        if attempt < HOOK_ATTEMPTS:
            time.sleep(HOOK_RETRY_DELAYS[min(attempt - 1, len(HOOK_RETRY_DELAYS) - 1)])
    return last


def mark_lead_hook(lead_id: int, result: Dict[str, Any]) -> None:
    """Запоминаем исход: недоставленные лиды окно заберёт из feed."""
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = True
        cur = conn.cursor()
        attempts = int(result.get('attempts') or 1)
        if result.get('ok'):
            cur.execute(
                "UPDATE leads SET interaction_sent_at = CURRENT_TIMESTAMP, "
                f"interaction_attempts = interaction_attempts + {attempts}, "
                f"interaction_error = NULL WHERE id = {int(lead_id)}"
            )
        else:
            err = str(result.get('error') or '')[:500].replace("'", "''")
            cur.execute(
                f"UPDATE leads SET interaction_attempts = interaction_attempts + {attempts}, "
                f"interaction_error = '{err}' WHERE id = {int(lead_id)}"
            )
        cur.close()
        conn.close()
    except Exception as e:
        print(f'lead-hook: не смог записать статус — {e}')


def lead_feed(status: str) -> Dict[str, Any]:
    """Страховочная выгрузка: status=new — лиды, уведомление о которых ещё не дошло.
    Отданные помечаются доставленными, повторно не придут."""
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    cur = conn.cursor()
    where = 'AND interaction_sent_at IS NULL' if status == 'new' else ''
    cur.execute(
        "SELECT id, parent_name, student_name, contact, notify_text, created_at "
        f"FROM leads WHERE source = 'site' AND notify_text IS NOT NULL AND {NOT_TEST_SQL} {where} "
        "ORDER BY id DESC LIMIT 100"
    )
    cols = [d[0] for d in cur.description]
    rows = [dict(zip(cols, r)) for r in cur.fetchall()]
    leads = [lead_payload(r) for r in rows]
    if status == 'new' and rows:
        ids = ', '.join(str(int(r['id'])) for r in rows)
        cur.execute(f"UPDATE leads SET interaction_sent_at = CURRENT_TIMESTAMP WHERE id IN ({ids})")
    cur.close()
    conn.close()
    return {'leads': leads}


CONTACTED_STATUS = 'Списались в "Окне" (ответ не получен)'


def mark_first_message(body: Dict[str, Any]) -> Dict[str, Any]:
    """Окно написало лиду первое сообщение: запоминаем кто и когда.
    Статус обработки меняем, только если лид ещё не обработан (пустой статус)."""
    try:
        lead_id = int(body.get('leadId') or 0)
    except (TypeError, ValueError):
        lead_id = 0
    if lead_id <= 0:
        return {'status': 400, 'body': {'ok': False, 'error': 'leadId required'}}
    by = str(body.get('processedBy') or '')[:200].replace("'", "''")
    sent_raw = str(body.get('sentAt') or '')
    sent_sql = 'CURRENT_TIMESTAMP'
    if sent_raw:
        try:
            from datetime import datetime
            datetime.fromisoformat(sent_raw.replace('Z', '+00:00'))
            sent_sql = "'" + sent_raw.replace("'", "") + "'::timestamptz"
        except ValueError:
            pass
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(
        "UPDATE leads SET "
        f"first_message_at = COALESCE(first_message_at, {sent_sql}), "
        f"first_message_by = COALESCE(NULLIF(first_message_by, ''), NULLIF('{by}', '')), "
        "status_changed_at = CASE WHEN COALESCE(TRIM(processing_status), '') = '' "
        "THEN CURRENT_TIMESTAMP ELSE status_changed_at END, "
        "processing_status = CASE WHEN COALESCE(TRIM(processing_status), '') = '' "
        f"THEN '{CONTACTED_STATUS}' ELSE processing_status END, "
        f"updated_at = CURRENT_TIMESTAMP WHERE id = {lead_id} RETURNING processing_status"
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        return {'status': 404, 'body': {'ok': False, 'error': 'lead not found'}}
    print(f'first-message: leadId={lead_id} by={by!r} status={row[0]!r}')
    return {'status': 200, 'body': {'ok': True}}
