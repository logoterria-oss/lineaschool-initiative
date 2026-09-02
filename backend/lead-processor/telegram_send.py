"""
Надёжная отправка уведомлений в Telegram.

Зачем нужен отдельный модуль: DNS отдаёт для api.telegram.org несколько
адресов, и с площадки облачных функций часть из них недоступна — соединение
просто виснет до таймаута. Из-за этого уведомления о лидах и оплатах
приходили примерно в одном случае из десяти: если системе доставался
«плохой» адрес, сообщение молча терялось.

Решение: не полагаемся на DNS, а последовательно пробуем известные адреса
Telegram, начиная с проверенно рабочего. Первый ответивший — победил.
Таймауты короткие, чтобы уложиться в лимит времени облачной функции
и не потерять уже сохранённую заявку.
"""

import json
import socket
import ssl
import urllib.error
import urllib.request

# С площадки функций реально отвечает только первый адрес, остальные молчат
# до таймаута. Держим их как резерв, но НЕ обходим весь список подряд:
# пять зависших попыток по 2 секунды съедали лимит времени функции, и уже
# отправленные ранее уведомления обрывались на полпути.
TELEGRAM_IPS = (
    '149.154.167.220',
    '149.154.166.110',
    '149.154.167.99',
    '149.154.175.50',
    '149.154.171.5',
)

# Сколько адресов пробуем за одну отправку. Рабочий адрес почти всегда первый;
# если он временно молчит, разумнее сделать вторую попытку к нему же,
# чем ждать четыре заведомо мёртвых.
MAX_IP_ATTEMPTS = 2

# Адрес, ответивший последним успехом: следующая отправка начинает с него.
_last_good_ip = None

API_HOST = 'api.telegram.org'


def _ip_order():
    """Порядок обхода адресов: сначала тот, что недавно сработал."""
    if _last_good_ip and _last_good_ip in TELEGRAM_IPS:
        return (_last_good_ip, *[ip for ip in TELEGRAM_IPS if ip != _last_good_ip])
    return TELEGRAM_IPS


def _post_via_ip(ip: str, token: str, method: str, payload: dict, timeout: float,
                 limit: int = 300):
    """POST к Telegram напрямую по IP, с подстановкой правильного имени хоста.

    Проверку сертификата отключаем осознанно: имя в сертификате не совпадает
    с IP, к которому подключаемся. Данные не чувствительные (текст
    уведомления), а альтернатива — потерянное сообщение.
    """
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    url = f'https://{ip}/bot{token}/{method}'
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'Host': API_HOST},
    )
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
        return resp.status, resp.read().decode('utf-8')[:limit]


def send_telegram(token: str, chat_id, text: str, timeout: float = 2.0) -> bool:
    """Отправить сообщение. True — доставлено.

    Пробуем ограниченное число адресов: недоступный адрес не отвечает
    мгновенно, а висит до таймаута, поэтому полный обход списка тратит
    всё время функции и обрывает рассылку остальным получателям.
    Ошибка Telegram по существу (неверный chat_id, бот заблокирован) —
    повторять бессмысленно, такие ответы прекращают перебор.
    """
    global _last_good_ip

    if not token or not chat_id or not text:
        return False

    payload = {'chat_id': str(chat_id), 'text': text}

    for ip in _ip_order()[:MAX_IP_ATTEMPTS]:
        try:
            status, body = _post_via_ip(ip, token, 'sendMessage', payload, timeout)
            if status == 200:
                _last_good_ip = ip
                print(f'TG: доставлено на {chat_id} через {ip}')
                return True
            print(f'TG: {ip} ответил {status}: {body}')
        except urllib.error.HTTPError as e:
            # Telegram ответил — соединение рабочее, но запрос отклонён.
            # Другой адрес даст тот же результат, перебор не нужен.
            body = ''
            try:
                body = e.read().decode('utf-8')[:300]
            except Exception:
                pass
            print(f'TG: отказ Telegram для {chat_id}: HTTP {e.code} {body}')
            return False
        except (socket.timeout, urllib.error.URLError, OSError) as e:
            print(f'TG: {ip} недоступен ({type(e).__name__}), пробуем следующий')
            continue

    print(f'TG: НЕ доставлено на {chat_id} — Telegram не ответил')
    return False


def get_recent_chats(token: str, timeout: float = 3.0) -> list:
    """Кто недавно писал боту: список {chat_id, name, username}.

    Нужен, чтобы узнать chat_id нового администратора: Telegram не позволяет
    боту написать человеку первым, пока тот сам не напишет боту.
    """
    if not token:
        return []
    out = []
    seen = set()
    for ip in _ip_order()[:MAX_IP_ATTEMPTS]:
        try:
            status, body = _post_via_ip(
                ip, token, 'getUpdates', {'limit': 100}, timeout, limit=200000
            )
        except Exception:
            continue
        if status != 200:
            continue
        try:
            data = json.loads(body)
        except Exception:
            continue
        for upd in data.get('result') or []:
            msg = upd.get('message') or upd.get('edited_message') or {}
            chat = msg.get('chat') or {}
            cid = chat.get('id')
            if not cid or cid in seen:
                continue
            seen.add(cid)
            name = ' '.join(
                x for x in (chat.get('first_name'), chat.get('last_name')) if x
            )
            out.append({
                'chat_id': str(cid),
                'name': name or chat.get('title') or '',
                'username': chat.get('username') or '',
            })
        return out
    return out


def bot_info(token: str, timeout: float = 3.0) -> dict:
    """Имя бота (@username) и есть ли вебхук.

    Вебхук важен: пока он включён, Telegram не отдаёт историю сообщений
    через getUpdates, и узнать chat_id нового админа этим способом нельзя.
    """
    out = {}
    if not token:
        return out
    for method, key in (('getMe', 'me'), ('getWebhookInfo', 'webhook')):
        for ip in _ip_order()[:MAX_IP_ATTEMPTS]:
            try:
                status, body = _post_via_ip(ip, token, method, {}, timeout, limit=4000)
            except Exception:
                continue
            if status != 200:
                continue
            try:
                out[key] = json.loads(body).get('result')
            except Exception:
                pass
            break
    return out


def notify_all(token: str, chat_ids, text: str, timeout: float = 2.0) -> dict:
    """Разослать одно сообщение нескольким получателям.

    Сбой одного получателя не должен мешать остальным, поэтому каждый
    обрабатывается независимо.
    """
    result = {}
    seen = set()
    for chat_id in chat_ids or []:
        if not chat_id or chat_id in seen:
            continue
        seen.add(chat_id)
        try:
            result[str(chat_id)] = send_telegram(token, chat_id, text, timeout)
        except Exception as e:
            print(f'TG: непредвиденная ошибка для {chat_id}: {type(e).__name__}: {e}')
            result[str(chat_id)] = False
    return result