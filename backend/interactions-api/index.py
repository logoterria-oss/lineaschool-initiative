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
            return True, full_name, _norm_phone(str(s_phone or ''))
        if name_key and _norm_name(full_name) == name_key:
            return True, full_name, _norm_phone(str(s_phone or ''))

    # 2. Одно слово из MAX → совпадение по любому слову ФИО сотрудника (если он один такой)
    if name_key and ' ' not in name_key:
        candidates = [
            (fn, ph) for fn, ph in rows
            if name_key in set(_norm_name(fn).split(' '))
        ]
        if len(candidates) == 1:
            return True, candidates[0][0], _norm_phone(str(candidates[0][1] or ''))

    return False, None, None


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


def _first_phone(obj) -> str:
    '''Первый валидный 11-значный телефон из записи CRM.'''
    found = set()
    _collect_phones(obj, found)
    # _collect_phones возвращает set — берём любой стабильно (по сортировке)
    for p in sorted(found):
        return p
    return ''


def _search_crm_contacts(cur, query: str, limit: int = 20):
    '''Поиск контактов для нового диалога:
    - сотрудники школы (наша таблица staff),
    - педагоги CRM,
    - клиенты и лиды CRM (по ФИО родителя legal_name или ребёнка name).

    Возвращает список: [{phone, parent, child, status, statusLabel}].
    Только записи с телефоном.
    '''
    q = _norm_name(query)
    if len(q) < 2:
        return []
    out = []
    seen = set()

    def _add(phone, name, child, status):
        ph = _norm_phone(str(phone or ''))
        if len(ph) != 11 or ph in seen:
            return
        seen.add(ph)
        out.append({
            'phone': ph,
            'parent': _standardize_name(name) or None,
            'child': _standardize_name(child) or None,
            'status': status,
            'statusLabel': STATUS_LABELS.get(status),
        })

    # 1. Наши сотрудники (Список сотрудников)
    try:
        cur.execute("SELECT full_name, phone FROM staff")
        for full_name, phone in cur.fetchall():
            if q in _norm_name(full_name):
                _add(phone, full_name, None, 'staff')
                if len(out) >= limit:
                    return out
    except Exception:
        pass

    token = _s20_token()

    # 2. Педагоги CRM
    try:
        emp = _s20_post('/v2api/1/teacher/index', {'page': 0, 'pageSize': 200}, token, 30)
        for u in emp.get('items', []):
            if q in _norm_name(u.get('name')):
                _add(u.get('phone'), u.get('name'), None, 'teacher')
                if len(out) >= limit:
                    return out
    except Exception:
        pass

    # 3. Клиенты и лиды CRM (родитель/ребёнок)
    for is_study, status in ((1, 'client'), (0, 'lead')):
        try:
            data = _s20_post(
                '/v2api/1/customer/index',
                {'is_study': is_study, 'removed': 0, 'page': 0, 'pageSize': 100, 'name': query},
                token, 30,
            )
        except Exception:
            data = {}
        for c in data.get('items', []):
            child = c.get('name') or ''
            parent = c.get('legal_name') or ''
            if q not in _norm_name(f"{child} {parent}"):
                continue
            _add(_first_phone(c), parent, child, status)
            if len(out) >= limit:
                return out
    return out


def _resolve_crm(cur, phone: str, display_name: Optional[str] = None):
    '''Определяет собеседника по телефону/ФИО.

    В S20 карточка ученика хранит name (ребёнок) и legal_name (родитель),
    а phone карточки — это телефон РОДИТЕЛЯ. В 99.9% пишет именно родитель.

    Возвращает кортеж (status, name, label, child_name):
      status     — client / lead / teacher / staff / unknown
      name       — ФИО собеседника (родителя/педагога/сотрудника)
      label      — подпись для плашки
      child_name — ФИО ученика (если собеседник — родитель), иначе None
    '''
    name_key = _norm_name(display_name)
    has_phone = len(phone) == 11
    disp = _standardize_name(display_name)
    known_phone = phone if has_phone else None

    # 0. Наши сотрудники (руководители, админы, педагоги из «Списка сотрудников»)
    try:
        ok, nm, staff_phone = _match_staff(cur, phone, name_key)
        if ok:
            return 'staff', _standardize_name(nm), STATUS_LABELS['staff'], None, (staff_phone or known_phone)
    except Exception:
        pass

    if not has_phone and not name_key:
        return 'unknown', None, None, None, known_phone

    token = _s20_token()

    # 1. Педагоги CRM
    try:
        emp = _s20_post('/v2api/1/teacher/index', {'page': 0, 'pageSize': 200}, token, 30)
        for u in emp.get('items', []):
            u_phone = _norm_phone(str(u.get('phone') or ''))
            if has_phone and u_phone == phone:
                return 'teacher', _standardize_name(u.get('name')), STATUS_LABELS['teacher'], None, (u_phone or known_phone)
            if name_key and _norm_name(u.get('name')) == name_key:
                return 'teacher', _standardize_name(u.get('name')), STATUS_LABELS['teacher'], None, (u_phone or known_phone)
    except Exception:
        pass

    # 2. Карточки учеников (is_study=1 — клиент) и лидов (is_study=0) — по телефону.
    #    Телефон в карточке = телефон родителя → собеседник это родитель ученика.
    if has_phone:
        for is_study, status in ((1, 'client'), (0, 'lead')):
            try:
                data = _s20_post(
                    '/v2api/1/customer/index',
                    {'is_study': is_study, 'removed': 0, 'page': 0, 'pageSize': 50, 'phone': '+' + phone},
                    token, 30,
                )
                for c in data.get('items', []):
                    all_ph = set()
                    _collect_phones(c, all_ph)
                    if phone not in all_ph:
                        continue
                    child = _standardize_name(c.get('name'))
                    parent = _standardize_name(c.get('legal_name')) or disp
                    # Собеседник — родитель; ребёнок = карточка ученика.
                    return status, parent, STATUS_LABELS[status], child, (phone or known_phone)
            except Exception:
                pass

    return 'unknown', None, None, None, known_phone


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
        "d.last_time, d.crm_status, d.crm_name, d.crm_label, d.child_name, "
        "(SELECT text FROM interaction_messages m WHERE m.dialog_id = d.id "
        "ORDER BY m.created_at DESC LIMIT 1), "
        "d.channel, d.tg_username "
        "FROM interaction_dialogs d WHERE d.hidden = false "
        "ORDER BY d.last_time DESC NULLS LAST"
    )
    out = []
    for r in cur.fetchall():
        crm_status = r[8]
        # Имя: приоритет — стандартизированное имя из CRM, затем имя из MAX, затем chat_id.
        display_name = r[9] or _standardize_name(r[2]) or r[1]
        channel = r[13] or 'max'
        out.append({
            'id': r[0], 'chatId': r[1], 'clientName': display_name, 'phone': r[3] or '',
            'assignee': r[4] or 'Не назначен', 'status': r[5], 'unread': r[6],
            'lastTime': r[7].isoformat() if r[7] else None, 'preview': r[12] or '',
            'channels': [channel],
            'channel': channel,
            'tgUsername': r[14],
            'crmStatus': crm_status,
            'crmLabel': r[10] or STATUS_LABELS.get(crm_status or '', None),
            'childName': r[11],
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


def _send_tg(text: str, tg_chat_id=None, tg_username=None, phone=None) -> Dict[str, Any]:
    '''Отправка сообщения в Telegram через Wappi (отдельный профиль).'''
    token = os.environ['WAPPI_API_TOKEN']
    profile_id = os.environ.get('WAPPI_TG_PROFILE_ID', '')
    if not profile_id:
        return {'ok': False, 'error': 'no_tg_profile', 'message': 'Не настроен профиль Telegram (WAPPI_TG_PROFILE_ID)'}
    url = f"{WAPPI_BASE}/tapi/sync/message/send?" + urllib.parse.urlencode({'profile_id': profile_id})

    msg = {'body': text}
    chat = str(tg_chat_id or '').strip()
    uname = str(tg_username or '').strip().lstrip('@')
    ph = str(phone or '').strip()
    if chat:
        msg['recipient'] = chat
    elif uname:
        msg['recipient'] = '@' + uname
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
        print(f"WAPPI TG send OK msg={msg} resp={json.dumps(data, ensure_ascii=False)[:500]}")
        return {'ok': True, 'response': data}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8', 'ignore')
        print(f"WAPPI TG send HTTP {e.code} msg={msg} body={err_body[:500]}")
        return {'ok': False, 'status': e.code, 'error': err_body}
    except Exception as e:
        print(f"WAPPI TG send FAILED msg={msg} err={e}")
        return {'ok': False, 'error': str(e)}


def _staff_phone_by_name(cur, full_name: str) -> Optional[str]:
    '''Телефон активного сотрудника по «Фамилия Имя» (без отчества и роли).'''
    key = ' '.join((full_name or '').replace('(', ' ').split()[:2]).strip().lower()
    if not key:
        return None
    cur.execute(
        "SELECT phone FROM staff WHERE status = 'active' "
        "AND lower(regexp_replace(full_name, '\\s+', ' ', 'g')) LIKE %s "
        "ORDER BY id LIMIT 1",
        (key + '%',),
    )
    row = cur.fetchone()
    return row[0] if row else None


def _notify_staff(cur, full_name: Optional[str], text: str) -> None:
    '''Отправляет сотруднику служебное уведомление в Max на его телефон.'''
    if not full_name or full_name == 'Не назначен':
        return
    phone = _staff_phone_by_name(cur, full_name)
    if not phone:
        print(f"NOTIFY skip: no phone for staff={full_name}")
        return
    try:
        res = _send_max(text, phone=phone)
        print(f"NOTIFY staff={full_name} phone={phone} ok={res.get('ok')}")
    except Exception as e:
        print(f"NOTIFY FAILED staff={full_name} err={e}")


def _notify_new_message(cur, dialog_id: int, channel_label: str) -> None:
    '''Уведомляет ответственного о новом входящем сообщении от клиента.'''
    cur.execute(
        "SELECT assignee, COALESCE(client_name, 'клиент') FROM interaction_dialogs WHERE id = %s",
        (dialog_id,),
    )
    row = cur.fetchone()
    if not row:
        return
    assignee, client = row[0], row[1]
    _notify_staff(cur, assignee, f'Новое сообщение от {client} в {channel_label}')


def _upsert_tg_dialog(cur, tg_chat_id: str, name: Optional[str],
                      username: Optional[str], phone: Optional[str] = None) -> int:
    '''Находит/создаёт Telegram-диалог.

    Чтобы не плодить дубли, ищем существующий диалог того же человека
    в таком порядке: по tg_chat_id → по tg_username → по телефону.
    Если нашли по username/телефону — дописываем tg_chat_id, чтобы
    следующие входящие сразу попадали в этот же диалог.
    '''
    uname = (username or '').lstrip('@') or None
    ph = phone if (phone and len(phone) == 11) else None

    # 1. Точное совпадение по tg_chat_id
    cur.execute("SELECT id FROM interaction_dialogs WHERE tg_chat_id = %s", (tg_chat_id,))
    row = cur.fetchone()
    if row:
        return row[0]

    # 2. По username (у диалога может ещё не быть tg_chat_id)
    if uname:
        cur.execute(
            "SELECT id FROM interaction_dialogs "
            "WHERE lower(tg_username) = lower(%s) ORDER BY id LIMIT 1",
            (uname,),
        )
        row = cur.fetchone()
        if row:
            cur.execute("UPDATE interaction_dialogs SET tg_chat_id = %s WHERE id = %s", (tg_chat_id, row[0]))
            return row[0]

    # 3. По телефону
    if ph:
        cur.execute(
            "SELECT id FROM interaction_dialogs WHERE phone = %s ORDER BY id LIMIT 1",
            (ph,),
        )
        row = cur.fetchone()
        if row:
            cur.execute(
                "UPDATE interaction_dialogs SET tg_chat_id = %s, "
                "tg_username = COALESCE(tg_username, %s) WHERE id = %s",
                (tg_chat_id, uname, row[0]),
            )
            return row[0]

    # 4. Новый диалог
    cur.execute(
        "INSERT INTO interaction_dialogs (channel, chat_id, client_name, tg_chat_id, tg_username, phone) "
        "VALUES ('telegram', %s, %s, %s, %s, %s) RETURNING id",
        (tg_chat_id, name, tg_chat_id, uname, ph),
    )
    return cur.fetchone()[0]


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

        if method == 'GET' and action == 'crm-search':
            q = params.get('q', '').strip()
            try:
                results = _search_crm_contacts(cur, q)
            except Exception as e:
                print(f"CRM search error: {e}")
                results = []
            return _resp(200, {'results': results})

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
                # Только Фамилия и Имя (без отчества).
                short_name = ' '.join((full_name or '').split()[:2])
                names.append(f"{short_name} ({title})")
            return _resp(200, {'assignees': names})

        if method == 'GET' and action == 'resolve-crm':
            dialog_id = int(params.get('dialog_id', '0'))
            force = params.get('force') == '1'
            cur.execute(
                "SELECT chat_id, phone, crm_status, crm_label, crm_checked_at, client_name, child_name "
                "FROM interaction_dialogs WHERE id = %s",
                (dialog_id,),
            )
            row = cur.fetchone()
            if not row:
                return _resp(404, {'error': 'dialog_not_found'})
            chat_id, phone, cached_status, cached_label, checked_at, client_name, cached_child = row
            if cached_status and not force:
                return _resp(200, {
                    'crmStatus': cached_status,
                    'crmLabel': cached_label or STATUS_LABELS.get(cached_status, None),
                    'childName': cached_child,
                    'cached': True,
                })
            resolved_phone = _phone_from_chat(chat_id, phone)
            status, name, label, child, crm_phone = _resolve_crm(cur, resolved_phone, client_name)
            # Телефон для «Способов связи»: сначала номер из карточки CRM,
            # затем номер из chat_id (если это реальный номер, а не id чата MAX).
            store_phone = None
            if crm_phone and len(_norm_phone(str(crm_phone))) == 11:
                store_phone = _norm_phone(str(crm_phone))
            elif len(resolved_phone) == 11:
                store_phone = resolved_phone
            # Имя из CRM/сотрудников прописываем ТОЛЬКО если нашли контакт.
            cur.execute(
                "UPDATE interaction_dialogs SET crm_status = %s, crm_name = COALESCE(%s, crm_name), "
                "crm_label = %s, child_name = %s, "
                "phone = COALESCE(NULLIF(phone, ''), %s), crm_checked_at = now() WHERE id = %s",
                (status, name, label, child, store_phone, dialog_id),
            )
            conn.commit()
            return _resp(200, {
                'crmStatus': status,
                'crmLabel': label or STATUS_LABELS.get(status, None),
                'crmName': name,
                'childName': child,
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

        # Входящий вебхук от Wappi (Telegram). URL этого вебхука указывается
        # в настройках TG-профиля Wappi: ?action=tg-webhook
        if method == 'POST' and action == 'tg-webhook':
            msg = body.get('message') or body.get('payload') or body
            if isinstance(body.get('messages'), (list, dict)):
                m = body['messages']
                msg = (m[0] if isinstance(m, list) and m else m) if not isinstance(m, dict) else m

            wh_type = msg.get('wh_type') or ''
            if wh_type == 'delivery_status' or msg.get('status') in ('error', 'sent', 'delivered'):
                return _resp(200, {'ok': True, 'skipped': 'delivery_status'})

            from_me = bool(msg.get('fromMe') or msg.get('from_me'))
            tg_chat_id = str(msg.get('chat_id') or msg.get('chatId') or msg.get('from') or '')
            text = msg.get('body') or msg.get('text') or msg.get('caption') or ''
            name = (
                msg.get('senderName') or msg.get('sender_name')
                or msg.get('chatName') or msg.get('pushName')
            )
            username = (
                msg.get('senderUsername') or msg.get('username')
                or msg.get('contact_username') or ''
            )
            phone = _norm_phone(msg.get('senderPhone') or msg.get('phone') or '')
            if not tg_chat_id or from_me:
                return _resp(200, {'ok': True, 'skipped': 'no_key_or_from_me'})
            dialog_id = _upsert_tg_dialog(cur, tg_chat_id, name, (username or None), (phone or None))
            cur.execute(
                "INSERT INTO interaction_messages (dialog_id, direction, channel, text) "
                "VALUES (%s, 'in', 'telegram', %s)",
                (dialog_id, text),
            )
            cur.execute(
                "UPDATE interaction_dialogs SET unread = unread + 1, last_time = now(), "
                "client_name = COALESCE(client_name, %s), "
                "tg_username = COALESCE(%s, tg_username), "
                "phone = COALESCE(NULLIF(%s, ''), phone) WHERE id = %s",
                (name, (username or None), phone, dialog_id),
            )
            conn.commit()
            _notify_new_message(cur, dialog_id, 'Telegram')
            conn.commit()
            return _resp(200, {'ok': True})

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
            _notify_new_message(cur, dialog_id, 'Max')
            conn.commit()
            return _resp(200, {'ok': True})

        # Создание нового диалога из CRM (инициатива сотрудника)
        if method == 'POST' and action == 'create-dialog':
            phone = _norm_phone(body.get('phone'))
            if len(phone) != 11:
                return _resp(400, {'error': 'bad_phone', 'message': 'Некорректный телефон'})
            parent = (body.get('parent') or '').strip() or None
            child = (body.get('child') or '').strip() or None
            crm_status = body.get('status') or None
            crm_label = STATUS_LABELS.get(crm_status or '', None)
            display = parent or child or phone

            # Диалог идентифицируем по телефону (chat_id). Если уже есть — вернём его.
            cur.execute(
                "SELECT id FROM interaction_dialogs WHERE channel = 'max' AND chat_id = %s",
                (phone,))
            existing = cur.fetchone()
            if existing:
                dialog_id = existing[0]
                cur.execute(
                    "UPDATE interaction_dialogs SET crm_name = COALESCE(%s, crm_name), "
                    "child_name = COALESCE(%s, child_name), crm_status = COALESCE(%s, crm_status), "
                    "crm_label = COALESCE(%s, crm_label), phone = %s, hidden = false, crm_checked_at = now() "
                    "WHERE id = %s",
                    (parent, child, crm_status, crm_label, phone, dialog_id))
            else:
                cur.execute(
                    "INSERT INTO interaction_dialogs "
                    "(channel, chat_id, client_name, phone, crm_name, child_name, "
                    "crm_status, crm_label, crm_checked_at, last_time) "
                    "VALUES ('max', %s, %s, %s, %s, %s, %s, %s, now(), now()) RETURNING id",
                    (phone, display, phone, parent, child, crm_status, crm_label))
                dialog_id = cur.fetchone()[0]
            conn.commit()
            return _resp(200, {'ok': True, 'dialog_id': dialog_id})

        # Отправка исходящего сообщения
        if method == 'POST' and action == 'send':
            dialog_id = int(body.get('dialog_id'))
            text = (body.get('text') or '').strip()
            author = body.get('author') or 'Сотрудник'
            if not text:
                return _resp(400, {'error': 'empty_text'})
            cur.execute(
                "SELECT chat_id, max_chat_id, max_user_id, phone, channel, tg_chat_id, tg_username "
                "FROM interaction_dialogs WHERE id = %s",
                (dialog_id,))
            row = cur.fetchone()
            if not row:
                return _resp(404, {'error': 'dialog_not_found'})
            chat_id, max_chat_id, max_user_id, phone, channel, tg_chat_id, tg_username = row
            channel = channel or 'max'

            if channel == 'telegram':
                wappi_result = _send_tg(
                    text=text,
                    tg_chat_id=tg_chat_id or None,
                    tg_username=tg_username or None,
                    phone=phone or None,
                )
                if not wappi_result.get('ok'):
                    return _resp(502, {
                        'ok': False,
                        'error': 'wappi_failed',
                        'message': wappi_result.get('message') or 'Telegram не принял сообщение',
                        'wappi': wappi_result,
                    })
                cur.execute(
                    "INSERT INTO interaction_messages (dialog_id, direction, channel, text, author) "
                    "VALUES (%s, 'out', 'telegram', %s, %s)",
                    (dialog_id, text, author),
                )
                cur.execute("UPDATE interaction_dialogs SET last_time = now() WHERE id = %s", (dialog_id,))
                conn.commit()
                return _resp(200, {'ok': True, 'wappi': wappi_result})

            # chat_id, равный телефону (диалог создан из CRM) — это НЕ идентификатор
            # чата MAX. В таком случае отправляем по номеру (recipient).
            chat_is_phone = _norm_phone(chat_id) == _norm_phone(phone) and len(_norm_phone(phone)) == 11
            real_chat = max_chat_id or ('' if chat_is_phone else chat_id)
            real_user = max_user_id or ('' if chat_is_phone else chat_id)
            wappi_result = _send_max(
                max_chat_id=real_chat or None,
                max_user_id=real_user or None,
                phone=phone or (_norm_phone(chat_id) if chat_is_phone else None),
                text=text,
            )
            if wappi_result.get('ok') and not max_chat_id and real_chat:
                cur.execute(
                    "UPDATE interaction_dialogs SET max_chat_id = %s WHERE id = %s",
                    (str(real_chat), dialog_id))
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
            cur.execute("SELECT assignee, COALESCE(client_name, 'клиент') FROM interaction_dialogs WHERE id = %s", (dialog_id,))
            prev = cur.fetchone()
            prev_assignee = prev[0] if prev else None
            client = prev[1] if prev else 'клиент'
            cur.execute("UPDATE interaction_dialogs SET assignee = %s WHERE id = %s", (assignee, dialog_id))
            conn.commit()
            if assignee != 'Не назначен' and assignee != prev_assignee:
                _notify_staff(cur, assignee, f'Вам передали чат с {client}')
                conn.commit()
            return _resp(200, {'ok': True})

        # Ручное сохранение способов связи (телефон для Max, @username для Telegram)
        if method == 'POST' and action == 'set-contacts':
            dialog_id = int(body.get('dialog_id'))
            phone = _norm_phone(body.get('phone') or '')
            store_phone = phone if len(phone) == 11 else None
            username = (body.get('tgUsername') or '').strip().lstrip('@') or None
            cur.execute(
                "UPDATE interaction_dialogs SET "
                "phone = COALESCE(%s, phone), "
                "tg_username = COALESCE(%s, tg_username) WHERE id = %s",
                (store_phone, username, dialog_id),
            )
            conn.commit()
            return _resp(200, {'ok': True, 'phone': store_phone, 'tgUsername': username})

        # Смена мессенджера, через который ведётся переписка в этом диалоге
        if method == 'POST' and action == 'set-channel':
            dialog_id = int(body.get('dialog_id'))
            channel = (body.get('channel') or '').strip()
            if channel not in ('max', 'telegram'):
                return _resp(400, {'error': 'bad_channel'})
            cur.execute("UPDATE interaction_dialogs SET channel = %s WHERE id = %s", (channel, dialog_id))
            conn.commit()
            return _resp(200, {'ok': True, 'channel': channel})

        return _resp(400, {'error': 'unknown_action'})
    finally:
        conn.close()