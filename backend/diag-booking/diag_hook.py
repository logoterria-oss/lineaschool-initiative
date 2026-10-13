"""
Передача записей на диагностику в «Окно взаимодействия».

По образцу броней уроков (slot-bookings → booking-hook): сразу после записи
шлём окну карточку. Окно находит или создаёт чат по телефону родителя,
показывает карточку и уведомляет админов. Повтор безопасен: окно узнаёт
запись по bookingId. При смене статуса шлём то же событие с новым статусом.
Не дошло — запись остаётся в выгрузке ?action=feed&status=new.
"""
import json
import os
import re
import time
import urllib.error
import urllib.request
from typing import Any, Dict

DIAG_HOOK_URL = (
    'https://functions.poehali.dev/67e8d62d-902a-4e5e-9862-d18395a730b1?action=diag-booking-hook'
)

HOOK_ATTEMPTS = 2
HOOK_RETRY_DELAY = 1
HOOK_TIMEOUT = 4

WEEKDAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
STATUS_LABELS = {'new': 'Новая', 'confirmed': 'Подтверждена', 'rejected': 'Отменена'}


def norm_phone(raw: Any) -> str:
    digits = re.sub(r'\D', '', str(raw or ''))
    if len(digits) == 11 and digits[0] == '8':
        digits = '7' + digits[1:]
    if len(digits) == 10:
        digits = '7' + digits
    return digits


def diag_payload(row: Dict[str, Any], event: str = 'diag_booking_created') -> Dict[str, Any]:
    """Одно и то же тело и для хука, и для выгрузки."""
    d = row['slot_date']
    date_ru = d.strftime('%d.%m.%Y')
    weekday = WEEKDAYS[d.weekday()]
    phone = norm_phone(row.get('phone'))
    created = row.get('created_at')
    status = row.get('status') or 'new'
    return {
        'event': event,
        # bookingId — ключ карточки: по нему окно обновляет, а не дублирует
        'bookingId': str(row['id']),
        'kind': 'diagnostic',
        'title': 'Запись на диагностику',
        'text': f"Запись на диагностику: {weekday.lower()}, {date_ru}, {row['time_from']}–{row['time_to']} МСК",
        'status': status,
        'statusLabel': STATUS_LABELS.get(status, status),
        'child': {
            'name': row.get('child_name') or '',
            'birthDate': row.get('child_birth_date') or '',
            'parentName': row.get('parent_name') or '',
            'phone': f'+{phone}' if phone else '',
            'telegram': row.get('telegram') or '',
            'messengers': row.get('messengers') or '',
        },
        'slot': {
            'date': d.isoformat(),
            'dateRu': date_ru,
            'weekday': weekday,
            'timeFrom': row['time_from'],
            'timeTo': row['time_to'],
            'timezone': 'Europe/Moscow',
        },
        'comment': row.get('comment') or '',
        'createdAt': created.isoformat() if hasattr(created, 'isoformat') else created,
    }


def send_diag_hook(row: Dict[str, Any], event: str = 'diag_booking_created') -> Dict[str, Any]:
    """Шлём запись в окно. Ошибки не роняют запись родителя."""
    key = os.environ.get('INTERACTION_SERVICE_KEY')
    if not key:
        print('diag-hook: INTERACTION_SERVICE_KEY не задан')
        return {'ok': False, 'error': 'no_service_key'}
    payload = diag_payload(row, event)
    last: Dict[str, Any] = {'ok': False, 'error': 'not_sent'}
    for attempt in range(1, HOOK_ATTEMPTS + 1):
        req = urllib.request.Request(
            DIAG_HOOK_URL,
            data=json.dumps(payload, ensure_ascii=False).encode('utf-8'),
            headers={'Content-Type': 'application/json', 'X-Service-Key': key},
            method='POST',
        )
        try:
            with urllib.request.urlopen(req, timeout=HOOK_TIMEOUT) as resp:
                body = json.loads(resp.read().decode() or '{}')
            print(f"diag-hook -> {resp.status} bookingId={payload['bookingId']} {event}")
            return {'ok': True, 'attempts': attempt, 'dialogId': body.get('dialogId')}
        except urllib.error.HTTPError as e:
            text = e.read().decode(errors='replace')[:300]
            last = {'ok': False, 'error': f'HTTP {e.code}: {text}', 'attempts': attempt}
            if e.code in (401, 403, 404):
                print(f'diag-hook: окно отклонило хук ({e.code})')
                return last
        except Exception as e:
            last = {'ok': False, 'error': str(e), 'attempts': attempt}
        print(f"diag-hook: попытка {attempt} не удалась — {last.get('error')}")
        if attempt < HOOK_ATTEMPTS:
            time.sleep(HOOK_RETRY_DELAY)
    return last


def mark_diag_hook(cur, booking_id: int, result: Dict[str, Any], schema: str) -> None:
    """Запоминаем исход: недоставленные записи окно заберёт из feed."""
    attempts = int(result.get('attempts') or 1)
    if result.get('ok'):
        cur.execute(
            f"UPDATE {schema}.diag_bookings SET interaction_sent_at = CURRENT_TIMESTAMP, "
            "interaction_attempts = interaction_attempts + %s, interaction_error = NULL, "
            "dialog_id = COALESCE(%s, dialog_id) WHERE id = %s",
            (attempts, result.get('dialogId'), booking_id),
        )
    else:
        cur.execute(
            f"UPDATE {schema}.diag_bookings SET interaction_attempts = interaction_attempts + %s, "
            "interaction_error = %s WHERE id = %s",
            (attempts, str(result.get('error') or '')[:500], booking_id),
        )
