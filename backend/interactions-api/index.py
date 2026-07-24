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
import urllib.error
import psycopg2

WAPPI_BASE = 'https://wappi.pro'
S20_HOST = 'https://11086.s20.online'
S20_EMAIL = os.environ.get('ALFACRM_EMAIL', 'abram.viktoriya.00@mail.ru')

STATUS_LABELS = {
    'staff': 'Сотрудник школы',
    'teacher': 'Педагог',
    'client': 'Клиент',
    'lead': 'Лид',
    'parent': 'Родитель',
    'unknown': 'Не найден в CRM',
}


def _norm_phone(raw: Optional[str]) -> str:
    digits = re.sub(r'\D', '', raw or '')
    if len(digits) == 11 and digits[0] == '8':
        digits = '7' + digits[1:]
    if len(digits) == 10:
        digits = '7' + digits
    return digits


def _norm_name(raw: Optional[str]) -> str:
    '''Нормализуем ФИО для сравнения: нижний регистр, одиночные пробелы.'''
    return re.sub(r'\s+', ' ', (raw or '').strip().lower())


def _standardize_name(raw: Optional[str]) -> Optional[str]:
    '''Приводим к виду «Имя Фамилия» (первые два слова, с заглавных букв).

    В CRM ФИО чаще хранится как «Фамилия Имя Отчество» — берём Имя и Фамилию.
    Если слов меньше двух — возвращаем как есть (с заглавной).
    '''
    parts = re.sub(r'\s+', ' ', (raw or '').strip()).split(' ')
    parts = [p for p in parts if p]
    if not parts:
        return None
    cap = [p[:1].upper() + p[1:] for p in parts]
    if len(cap) >= 2:
        # CRM-порядок «Фамилия Имя ...» → «Имя Фамилия»
        return f"{cap[1]} {cap[0]}"
    return cap[0]


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


def _match_staff(cur, phone: str, name_key: str):
    '''Ищем в НАШЕЙ таблице сотрудников (Список сотрудников) по телефону или ФИО.

    Логика поиска по имени:
    - точное совпадение полного ФИО;
    - если имя из MAX — одно слово, пробуем совпасть по имени/фамилии сотрудника,
      но только когда такой сотрудник ЕДИНСТВЕННЫЙ (иначе легко ошибиться).
    Возвращает (True, имя) при совпадении, иначе (False, None).
    '''
    cur.execute("SELECT full_name, phone FROM staff")
    rows = cur.fetchall()

    # 1. Телефон / точное ФИО
    for full_name, s_phone in rows:
        if phone and len(phone) == 11 and _norm_phone(str(s_phone or '')) == phone:
            return True, full_name
        if name_key and _norm_name(full_name) == name_key:
            return True, full_name

    # 2. Одно слово из MAX → совпадение по любому слову ФИО сотрудника (если он один такой)
    if name_key and ' ' not in name_key:
        candidates = [
            fn for fn, _ in rows
            if name_key in set(_norm_name(fn).split(' '))
        ]
        if len(candidates) == 1:
            return True, candidates[0]

    return False, None


def _collect_phones(obj, out):
    '''Рекурсивно собираем все телефоноподобные значения из записи CRM.'''
    if isinstance(obj, str):
        d = _norm_phone(obj)
        if len(d) == 11:
            out.add(d)
    elif isinstance(obj, dict):
        for v in obj.values():
            _collect_phones(v, out)
    elif isinstance(obj, list):
        for v in obj:
            _collect_phones(v, out)


def _resolve_crm(cur, phone: str, display_name: Optional[str] = None):
    '''Определяет, кто это: сотрудник школы / педагог / клиент / лид / родитель.

    Ищем по телефону (если известен) и по ФИО (из MAX). Возвращает (status, name, label).
    Если ничего не нашли — ('unknown', None, None), имя в БД НЕ прописываем.
    '''
    name_key = _norm_name(display_name)
    has_phone = len(phone) == 11

    # 0. Наши сотрудники (руководители, админы, педагоги из «Списка сотрудников»)
    try:
        ok, nm = _match_staff(cur, phone, name_key)
        if ok:
            return 'staff', _standardize_name(nm), STATUS_LABELS['staff']
    except Exception:
        pass

    if not has_phone and not name_key:
        return 'unknown', None, None

    token = _s20_token()

    # 1. Педагоги CRM
    try:
        emp = _s20_post('/v2api/1/teacher/index', {'page': 0, 'pageSize': 200}, token, 30)
        for u in emp.get('items', []):
            if has_phone and _norm_phone(str(u.get('phone') or '')) == phone:
                return 'teacher', _standardize_name(u.get('name')), STATUS_LABELS['teacher']
            if name_key and _norm_name(u.get('name')) == name_key:
                return 'teacher', _standardize_name(u.get('name')), STATUS_LABELS['teacher']
    except Exception:
        pass

    # 2. Клиенты (is_study=1) и лиды (is_study=0) — по телефону
    if has_phone:
        for is_study, status in ((1, 'client'), (0, 'lead')):
            try:
                data = _s20_post(
                    '/v2api/1/customer/index',
                    {'is_study': is_study, 'removed': 0, 'page': 0, 'pageSize': 50, 'phone': '+' + phone},
                    token, 30,
                )
                for c in data.get('items', []):
                    own = set()
                    _collect_phones(c.get('phone'), own)
                    if phone in own:
                        return status, _standardize_name(c.get('name')), STATUS_LABELS[status]
                    # Телефон совпал не с основным — значит это родитель/контакт ученика
                    all_ph = set()
                    _collect_phones(c, all_ph)
                    if phone in all_ph:
                        student = _standardize_name(c.get('name'))
                        return 'parent', display_name and _standardize_name(display_name), (
                            f"Родитель: {student}" if student else STATUS_LABELS['parent'])
            except Exception:
                pass

    return 'unknown', None, None


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
        "d.last_time, d.crm_status, d.crm_name, d.crm_label, "
        "(SELECT text FROM interaction_messages m WHERE m.dialog_id = d.id "
        "ORDER BY m.created_at DESC LIMIT 1) "
        "FROM interaction_dialogs d ORDER BY d.last_time DESC NULLS LAST"
    )
    out = []
    for r in cur.fetchall():
        crm_status = r[8]
        # Имя: приоритет — стандартизированное имя из CRM, затем имя из MAX, затем chat_id.
        display_name = r[9] or _standardize_name(r[2]) or r[1]
        out.append({
            'id': r[0], 'chatId': r[1], 'clientName': display_name, 'phone': r[3] or '',
            'assignee': r[4] or 'Не назначен', 'status': r[5], 'unread': r[6],
            'lastTime': r[7].isoformat() if r[7] else None, 'preview': r[11] or '',
            'channels': ['max'],
            'crmStatus': crm_status,
            'crmLabel': r[10] or STATUS_LABELS.get(crm_status or '', None),
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


def _send_max(text: str, max_chat_id=None, max_user_id=None, phone=None) -> Dict[str, Any]:
    token = os.environ['WAPPI_API_TOKEN']
    profile_id = os.environ['WAPPI_PROFILE_ID']
    url = f"{WAPPI_BASE}/maxapi/sync/message/send?" + urllib.parse.urlencode({'profile_id': profile_id})

    msg = {'body': text}
    chat = str(max_chat_id or '').strip()
    uid = str(max_user_id or '').strip()
    ph = str(phone or '').strip()
    if chat:
        msg['chat_id'] = chat
    elif uid and uid.isdigit():
        msg['user_id'] = int(uid)
    elif ph:
        msg['recipient'] = ph
    else:
        return {'ok': False, 'error': 'no_recipient'}
    payload = json.dumps(msg).encode('utf-8')
    req = urllib.request.Request(url, data=payload, method='POST')
    req.add_header('Content-Type', 'application/json')
    req.add_header('Authorization', token)
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            data = json.loads(r.read().decode('utf-8'))
        print(f"WAPPI send OK msg={msg} resp={json.dumps(data, ensure_ascii=False)[:500]}")
        return {'ok': True, 'response': data}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8', 'ignore')
        print(f"WAPPI send HTTP {e.code} msg={msg} body={err_body[:500]}")
        return {'ok': False, 'status': e.code, 'error': err_body}
    except Exception as e:
        print(f"WAPPI send FAILED msg={msg} err={e}")
        return {'ok': False, 'error': str(e)}


def _get_max_chats(limit: int = 200) -> Dict[str, Any]:
    token = os.environ['WAPPI_API_TOKEN']
    profile_id = os.environ['WAPPI_PROFILE_ID']
    url = f"{WAPPI_BASE}/maxapi/sync/chats/get?" + urllib.parse.urlencode(
        {'profile_id': profile_id, 'limit': limit, 'show_all': 'true', 'offset': 0, 'order': 'desc'})
    req = urllib.request.Request(url, method='GET')
    req.add_header('Authorization', token)
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return {'ok': True, 'data': json.loads(r.read().decode('utf-8'))}
    except urllib.error.HTTPError as e:
        return {'ok': False, 'status': e.code, 'error': e.read().decode('utf-8', 'ignore')}
    except Exception as e:
        return {'ok': False, 'error': str(e)}


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

        if method == 'GET' and action == 'max-chats':
            return _resp(200, _get_max_chats())

        if method == 'GET' and action == 'assignees':
            # Список ответственных = зарегистрированные активные сотрудники
            # с доступом к окну взаимодействия (руководители и администраторы).
            cur.execute(
                "SELECT full_name, job_title, role FROM staff "
                "WHERE status = 'active' AND password_hash <> '' "
                "AND role IN ('head', 'admin') ORDER BY role, full_name"
            )
            role_labels = {'head': 'руководитель', 'admin': 'администратор'}

            def _lower_title(t: str) -> str:
                # С маленькой буквы, НО аббревиатуры (РУО, HR и т.п.) не трогаем.
                first = t.split(' ', 1)[0]
                if first.isupper() and len(first) > 1:
                    return t
                return t[:1].lower() + t[1:]

            names = []
            for full_name, job_title, role in cur.fetchall():
                jt = (job_title or '').strip()
                title = _lower_title(jt) if jt else role_labels.get(role, role)
                names.append(f"{full_name} ({title})")
            return _resp(200, {'assignees': names})

        if method == 'GET' and action == 'resolve-crm':
            dialog_id = int(params.get('dialog_id', '0'))
            force = params.get('force') == '1'
            cur.execute(
                "SELECT chat_id, phone, crm_status, crm_label, crm_checked_at, client_name "
                "FROM interaction_dialogs WHERE id = %s",
                (dialog_id,),
            )
            row = cur.fetchone()
            if not row:
                return _resp(404, {'error': 'dialog_not_found'})
            chat_id, phone, cached_status, cached_label, checked_at, client_name = row
            if cached_status and not force:
                return _resp(200, {
                    'crmStatus': cached_status,
                    'crmLabel': cached_label or STATUS_LABELS.get(cached_status, None),
                    'cached': True,
                })
            resolved_phone = _phone_from_chat(chat_id, phone)
            status, name, label = _resolve_crm(cur, resolved_phone, client_name)
            # В phone сохраняем только настоящий 11-значный номер (не chat_id из MAX).
            store_phone = resolved_phone if len(resolved_phone) == 11 else None
            # Имя из CRM/сотрудников прописываем ТОЛЬКО если нашли контакт.
            cur.execute(
                "UPDATE interaction_dialogs SET crm_status = %s, crm_name = COALESCE(%s, crm_name), "
                "crm_label = %s, "
                "phone = COALESCE(NULLIF(phone, ''), %s), crm_checked_at = now() WHERE id = %s",
                (status, name, label, store_phone, dialog_id),
            )
            conn.commit()
            return _resp(200, {
                'crmStatus': status,
                'crmLabel': label or STATUS_LABELS.get(status, None),
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
            if isinstance(body.get('messages'), (list, dict)):
                m = body['messages']
                msg = (m[0] if isinstance(m, list) and m else m) if not isinstance(m, dict) else m

            wh_type = msg.get('wh_type') or ''

            # Служебные статусы доставки — не сообщение, но полезны для chat_id
            if wh_type == 'delivery_status' or msg.get('status') in ('error', 'sent', 'delivered'):
                return _resp(200, {'ok': True, 'skipped': 'delivery_status'})

            from_me = bool(msg.get('fromMe') or msg.get('from_me'))
            # чат для ОТВЕТА
            max_chat_id = str(msg.get('chat_id') or msg.get('chatId') or '')
            # идентификатор пользователя-отправителя
            max_user_id = str(
                msg.get('contact_max_user_id') or msg.get('user_id')
                or msg.get('senderId') or msg.get('sender_id') or msg.get('from') or ''
            )
            key = max_chat_id or max_user_id
            text = msg.get('body') or msg.get('text') or msg.get('caption') or ''
            name = (
                msg.get('senderName') or msg.get('sender_name')
                or msg.get('chatName') or msg.get('pushName')
            )
            if not key or from_me:
                return _resp(200, {'ok': True, 'skipped': 'no_key_or_from_me'})
            dialog_id = _upsert_dialog(cur, key, name, None)
            cur.execute(
                "INSERT INTO interaction_messages (dialog_id, direction, channel, text) "
                "VALUES (%s, 'in', 'max', %s)",
                (dialog_id, text),
            )
            cur.execute(
                "UPDATE interaction_dialogs SET unread = unread + 1, last_time = now(), "
                "client_name = COALESCE(client_name, %s), "
                "max_chat_id = COALESCE(%s, max_chat_id), "
                "max_user_id = COALESCE(%s, max_user_id) WHERE id = %s",
                (name, max_chat_id or None, max_user_id or None, dialog_id),
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
            cur.execute(
                "SELECT chat_id, max_chat_id, max_user_id, phone FROM interaction_dialogs WHERE id = %s",
                (dialog_id,))
            row = cur.fetchone()
            if not row:
                return _resp(404, {'error': 'dialog_not_found'})
            chat_id, max_chat_id, max_user_id, phone = row
            # Для MAX отправка идёт по chat_id = id диалога.
            # Если max_chat_id не заполнен — используем chat_id/user_id как id диалога.
            send_chat_id = max_chat_id or chat_id or max_user_id
            wappi_result = _send_max(
                max_chat_id=send_chat_id,
                max_user_id=max_user_id or chat_id,
                phone=phone,
                text=text,
            )
            if wappi_result.get('ok') and not max_chat_id and send_chat_id:
                cur.execute(
                    "UPDATE interaction_dialogs SET max_chat_id = %s WHERE id = %s",
                    (str(send_chat_id), dialog_id))
            if not wappi_result.get('ok'):
                return _resp(502, {
                    'ok': False,
                    'error': 'wappi_failed',
                    'message': 'Max не принял сообщение',
                    'wappi': wappi_result,
                })
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