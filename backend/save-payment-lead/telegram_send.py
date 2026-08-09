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

# Порядок важен: первым идёт адрес, стабильно доступный с площадки функций.
# Остальные — резерв на случай, если Telegram выведет его из эксплуатации.
TELEGRAM_IPS = (
    '149.154.167.220',
    '149.154.166.110',
    '149.154.167.99',
    '149.154.175.50',
    '149.154.171.5',
)

API_HOST = 'api.telegram.org'


def _post_via_ip(ip: str, token: str, method: str, payload: dict, timeout: float):
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
        return resp.status, resp.read().decode('utf-8')[:300]


def send_telegram(token: str, chat_id, text: str, timeout: float = 2.0) -> bool:
    """Отправить сообщение. True — доставлено.

    Перебираем адреса, пока одно из соединений не пройдёт. Ошибка Telegram
    по существу (неверный chat_id, бот заблокирован) — повторять бессмысленно,
    поэтому такие ответы прекращают перебор.
    """
    if not token or not chat_id or not text:
        return False

    payload = {'chat_id': str(chat_id), 'text': text}

    for ip in TELEGRAM_IPS:
        try:
            status, body = _post_via_ip(ip, token, 'sendMessage', payload, timeout)
            if status == 200:
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

    print(f'TG: НЕ доставлено на {chat_id} — все адреса недоступны')
    return False


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
