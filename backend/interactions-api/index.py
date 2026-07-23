'''
Business: Окно взаимодействия — приём входящих из MAX (Wappi webhook),
список диалогов, история сообщений и отправка исходящих в MAX.
Args: event (httpMethod, queryStringParameters, body); context.request_id
Returns: JSON диалогов/сообщений либо статус отправки
'''
import json
import os
import re
from typing import Dict, Any, Optional
import urllib.request
import urllib.parse
import psycopg2

WAPPI_BASE = 'https://api.wappi.pro'
S20_HOST = 'https://11086.s20.online'
S20_EMAIL = os.environ.get('ALFACRM_EMAIL', 'abram.viktoriya.00@mail.ru')

STATUS_LABELS = {
    'teacher': 'Педагог',
    'client': 'Клиент',
    'lead': 'Лид',
    'unknown': 'Не найден в CRM',
}


def _norm_phone(raw: Optional[str]) -> str:
    digits = re.sub(r'\D', '', raw or '')
    if len(digits) == 11 and digits[0] == '8':
        digits = '7' + digits[1:]
    if len(digits) == 10:
        digits = '7' + digits
    return digits


def _phone_from_chat(chat_id: str, phone: Optional[str]) -> str:
    p = _norm_phone(phone)
    if len(p) == 11:
        return p
    # В MAX chat_id часто равен номеру телефона
    return _norm_phone(chat_id)


def _s20_headers(token=None) -> Dict[str, str]:
    h = {
        'X-APP-KEY': os.environ['S20_X_APP_KEY'],
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
    if token:
        h['X-ALFACRM-TOKEN'] = token
    return h


def _s20_post(path: str, payload: dict, token=None, timeout: int = 20) -> dict:
    req = urllib.request.Request(
        f"{S20_HOST}{path}",
        data=json.dumps(payload).encode('utf-8'),
        headers=_s20_headers(token),
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode('utf-8'))


def _s20_token() -> str:
    data = _s20_post('/v2api/auth/login', {'email': S20_EMAIL, 'api_key': os.environ['S20_API_KEY']})
    return data['token']


def _resolve_crm(phone: str):
    '''По телефону определяет: педагог / клиент / лид. Возвращает (status, name).'''
    if len(phone) != 11:
        return 'unknown', None
    token = _s20_token()

    # Педагоги
    try:
        emp = _s20_post('/v2api/1/teacher/index', {'page': 0, 'pageSize': 200}, token, 30)
        for u in emp.get('items', []):
            if _norm_phone(str(u.get('phone') or '')) == phone:
                return 'teacher', u.get('name')
    except Exception:
        pass

    # Клиенты (is_study=1) и лиды (is_study=0)
    for is_study, status in ((1, 'client'), (0, 'lead')):
        try:
            data = _s20_post(
                '/v2api/1/customer/index',
                {'is_study': is_study, 'removed': 0, 'page': 0, 'pageSize': 50, 'phone': '+' + phone},
                token, 30,
            )
            for c in data.get('items', []):
                phones = c.get('phone') or []
                if isinstance(phones, str):
                    phones = [phones]
                if any(_norm_phone(str(p)) == phone for p in phones):
                    return status, c.get('name')
        except Exception:
            pass

    return 'unknown', None


def _resp(status: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
            'Access-Control-Max-Age': '86400',
        },
        'body': json.dumps(body, ensure_ascii=False, default=str),
        'isBase64Encoded': False,
    }


def _db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _upsert_dialog(cur, chat_id: str, name: Optional[str], phone: Optional[str]) -> int:
    cur.execute(
        "SELECT id FROM interaction_dialogs WHERE channel = 'max' AND chat_id = %s",
        (chat_id,),
    )
    row = cur.fetchone()
    if row:
        return row[0]
    cur.execute(
        "INSERT INTO interaction_dialogs (channel, chat_id, client_name, phone) "
        "VALUES ('max', %s, %s, %s) RETURNING id",
        (chat_id, name, phone),
    )
    return cur.fetchone()[0]


def _list_dialogs(cur) -> list:
    cur.execute(
        "SELECT d.id, d.chat_id, d.client_name, d.phone, d.assignee, d.status, d.unread, "
        "d.last_time, d.crm_status, d.crm_name, "
        "(SELECT text FROM interaction_messages m WHERE m.dialog_id = d.id "
        "ORDER BY m.created_at DESC LIMIT 1) "
        "FROM interaction_dialogs d ORDER BY d.last_time DESC NULLS LAST"
    )
    out = []
    for r in cur.fetchall():
        crm_status = r[8]
        out.append({
            'id': r[0], 'chatId': r[1], 'clientName': r[9] or r[2] or r[1], 'phone': r[3] or '',
            'assignee': r[4] or 'Не назначен', 'status': r[5], 'unread': r[6],
            'lastTime': r[7].isoformat() if r[7] else None, 'preview': r[10] or '',
            'channels': ['max'],
            'crmStatus': crm_status,
            'crmLabel': STATUS_LABELS.get(crm_status or '', None),
        })
    return out


def _messages(cur, dialog_id: int) -> list:
    cur.execute(
        "SELECT id, direction, channel, text, author, is_transcript, created_at "
        "FROM interaction_messages WHERE dialog_id = %s ORDER BY created_at ASC",
        (dialog_id,),
    )
    return [{
        'id': r[0], 'direction': r[1], 'channel': r[2], 'text': r[3],
        'author': r[4], 'isTranscript': r[5],
        'time': r[6].isoformat() if r[6] else None,
    } for r in cur.fetchall()]


def _send_max(chat_id: str, text: str) -> Dict[str, Any]:
    token = os.environ['WAPPI_API_TOKEN']
    profile_id = os.environ['WAPPI_PROFILE_ID']
    url = f"{WAPPI_BASE}/api/sync/max/message/send?" + urllib.parse.urlencode({'profile_id': profile_id})
    payload = json.dumps({'recipient': chat_id, 'body': text}).encode('utf-8')
    req = urllib.request.Request(url, data=payload, method='POST')
    req.add_header('Content-Type', 'application/json')
    req.add_header('Authorization', token)
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read().decode('utf-8'))


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return _resp(200, {})

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    conn = _db()
    try:
        cur = conn.cursor()

        if method == 'GET' and action == 'dialogs':
            data = _list_dialogs(cur)
            return _resp(200, {'dialogs': data})

        if method == 'GET' and action == 'resolve-crm':
            dialog_id = int(params.get('dialog_id', '0'))
            force = params.get('force') == '1'
            cur.execute(
                "SELECT chat_id, phone, crm_status, crm_checked_at FROM interaction_dialogs WHERE id = %s",
                (dialog_id,),
            )
            row = cur.fetchone()
            if not row:
                return _resp(404, {'error': 'dialog_not_found'})
            chat_id, phone, cached_status, checked_at = row
            if cached_status and not force:
                return _resp(200, {
                    'crmStatus': cached_status,
                    'crmLabel': STATUS_LABELS.get(cached_status, None),
                    'cached': True,
                })
            resolved_phone = _phone_from_chat(chat_id, phone)
            status, name = _resolve_crm(resolved_phone)
            cur.execute(
                "UPDATE interaction_dialogs SET crm_status = %s, crm_name = COALESCE(%s, crm_name), "
                "phone = COALESCE(NULLIF(phone, ''), %s), crm_checked_at = now() WHERE id = %s",
                (status, name, resolved_phone or None, dialog_id),
            )
            conn.commit()
            return _resp(200, {
                'crmStatus': status,
                'crmLabel': STATUS_LABELS.get(status, None),
                'crmName': name,
                'cached': False,
            })

        if method == 'GET' and action == 'messages':
            dialog_id = int(params.get('dialog_id', '0'))
            msgs = _messages(cur, dialog_id)
            cur.execute("UPDATE interaction_dialogs SET unread = 0 WHERE id = %s", (dialog_id,))
            conn.commit()
            return _resp(200, {'messages': msgs})

        body = json.loads(event.get('body') or '{}')

        if method == 'POST':
            print(f"POST action={action} body={json.dumps(body, ensure_ascii=False)[:2000]}")

        # Входящий вебхук от Wappi (MAX)
        is_webhook = action == 'webhook' or 'messages' in body or 'message' in body or body.get('event')
        if method == 'POST' and is_webhook:
            msg = body.get('message') or body.get('payload') or body
            if isinstance(body.get('messages'), list) and body['messages']:
                msg = body['messages'][0]

            from_me = bool(msg.get('fromMe') or msg.get('from_me'))
            chat_id = str(
                msg.get('chatId') or msg.get('chat_id') or msg.get('senderId')
                or msg.get('sender_id') or msg.get('from') or ''
            )
            text = msg.get('body') or msg.get('text') or msg.get('caption') or ''
            name = (
                msg.get('senderName') or msg.get('sender_name')
                or msg.get('chatName') or msg.get('pushName')
            )
            if not chat_id or from_me:
                return _resp(200, {'ok': True, 'skipped': 'no_chat_id_or_from_me'})
            dialog_id = _upsert_dialog(cur, chat_id, name, None)
            cur.execute(
                "INSERT INTO interaction_messages (dialog_id, direction, channel, text) "
                "VALUES (%s, 'in', 'max', %s)",
                (dialog_id, text),
            )
            cur.execute(
                "UPDATE interaction_dialogs SET unread = unread + 1, last_time = now(), "
                "client_name = COALESCE(client_name, %s) WHERE id = %s",
                (name, dialog_id),
            )
            conn.commit()
            return _resp(200, {'ok': True})

        # Отправка исходящего сообщения
        if method == 'POST' and action == 'send':
            dialog_id = int(body.get('dialog_id'))
            text = (body.get('text') or '').strip()
            author = body.get('author') or 'Сотрудник'
            if not text:
                return _resp(400, {'error': 'empty_text'})
            cur.execute("SELECT chat_id FROM interaction_dialogs WHERE id = %s", (dialog_id,))
            row = cur.fetchone()
            if not row:
                return _resp(404, {'error': 'dialog_not_found'})
            chat_id = row[0]
            wappi_result = _send_max(chat_id, text)
            cur.execute(
                "INSERT INTO interaction_messages (dialog_id, direction, channel, text, author) "
                "VALUES (%s, 'out', 'max', %s, %s)",
                (dialog_id, text, author),
            )
            cur.execute("UPDATE interaction_dialogs SET last_time = now() WHERE id = %s", (dialog_id,))
            conn.commit()
            return _resp(200, {'ok': True, 'wappi': wappi_result})

        # Назначение ответственного
        if method == 'POST' and action == 'assign':
            dialog_id = int(body.get('dialog_id'))
            assignee = body.get('assignee') or 'Не назначен'
            cur.execute("UPDATE interaction_dialogs SET assignee = %s WHERE id = %s", (assignee, dialog_id))
            conn.commit()
            return _resp(200, {'ok': True})

        return _resp(400, {'error': 'unknown_action'})
    finally:
        conn.close()