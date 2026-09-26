"""
Отправка подтверждённых оплат в «Окно взаимодействия».

Окно живёт в отдельном проекте со своей базой, поэтому общаемся с ним по HTTP.
Хук передаёт факт оплаты и контакты клиента — по ним окно кладёт карточку
в уже существующий чат, а не плодит дубли. Повторная отправка той же оплаты
безопасна: окно узнаёт её по orderId и просто обновляет карточку.

Сделано по образцу questionnaire/form_hook.py — формат карточки общий.
"""

import json
import os
import re
import time
import urllib.error
import urllib.request
from typing import Any, Dict, Optional

PAYMENT_HOOK_URL = (
    'https://functions.poehali.dev/67e8d62d-902a-4e5e-9862-d18395a730b1?action=payment-hook'
)

# Три попытки с нарастающей паузой: сеть моргнула — отправим ещё раз,
# окно лежит — оплата останется в выгрузке ?action=feed&status=new.
HOOK_ATTEMPTS = 3
HOOK_RETRY_DELAYS = (1, 3)
HOOK_TIMEOUT = 6

# Диагностику отличаем от абонемента по названию тарифа: у карточек
# разный заголовок, а у абонемента показываем ещё и состав с ценой.
DIAGNOSTIC_MARKERS = ('диагностик',)


def norm_phone(raw: Optional[str]) -> str:
    """Телефон в едином виде 7XXXXXXXXXX — по нему окно находит диалог."""
    digits = re.sub(r'\D', '', raw or '')
    if len(digits) == 11 and digits[0] == '8':
        digits = '7' + digits[1:]
    if len(digits) == 10:
        digits = '7' + digits
    return digits


def is_diagnostic(plan: Optional[str]) -> bool:
    """Диагностика это или абонемент — решает заголовок карточки в окне."""
    return any(m in (plan or '').lower() for m in DIAGNOSTIC_MARKERS)


def format_amount(amount: Any) -> str:
    """15000 → «15 000 ₽». Копейки показываем только если они есть."""
    try:
        value = float(amount or 0)
    except (TypeError, ValueError):
        return ''
    whole = int(value)
    text = f'{whole:,}'.replace(',', ' ')
    if abs(value - whole) > 0.004:
        text = f'{text},{int(round((value - whole) * 100)):02d}'
    return f'{text} ₽'


def payment_payload(row: Dict[str, Any]) -> Dict[str, Any]:
    """Одно и то же тело и для хука, и для выгрузки — окну проще разбирать."""
    plan = row.get('plan') or ''
    diagnostic = is_diagnostic(plan)
    amount_text = format_amount(row.get('amount'))
    phone = norm_phone(str(row.get('phone') or ''))
    title = 'Оплачена диагностика' if diagnostic else 'Оплачен абонемент'
    paid_at = row.get('paid_at')

    return {
        # orderId — ключ карточки: по нему окно обновляет, а не дублирует
        'orderId': str(row.get('order_id') or ''),
        'kind': 'diagnostic' if diagnostic else 'subscription',
        'title': title,
        # Готовая строка для показа: «Оплачен абонемент 3 урока в неделю — 1 месяц, 17 640 ₽»
        'text': title if diagnostic else f'{title} {plan}, {amount_text}'.strip(),
        'plan': plan,
        'amount': float(row.get('amount') or 0),
        'amountText': amount_text,
        'clientName': row.get('name') or '',
        # Карточка в AlfaCRM, если её удалось подобрать. null — не нашли
        'crmName': row.get('crm_name') or None,
        'phone': f'+{phone}' if phone else '',
        'paidAt': paid_at.isoformat() if hasattr(paid_at, 'isoformat') else (paid_at or None),
        'transactionId': row.get('transaction_id') or None,
    }


def _post_once(payload: Dict[str, Any], key: str) -> Dict[str, Any]:
    req = urllib.request.Request(
        PAYMENT_HOOK_URL,
        data=json.dumps(payload, ensure_ascii=False).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'X-Service-Key': key},
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=HOOK_TIMEOUT) as resp:
        body = json.loads(resp.read().decode() or '{}')
        return {'ok': resp.status == 200, 'status': resp.status, 'response': body}


def send_payment_hook(row: Dict[str, Any]) -> Dict[str, Any]:
    """Шлём оплату в окно. До трёх попыток, ошибки не роняют приём оплаты."""
    key = os.environ.get('INTERACTION_SERVICE_KEY')
    if not key:
        print('payment-hook: INTERACTION_SERVICE_KEY не задан')
        return {'ok': False, 'error': 'no_service_key'}

    payload = payment_payload(row)
    if not payload['orderId']:
        return {'ok': False, 'error': 'no_order_id'}

    last: Dict[str, Any] = {'ok': False, 'error': 'not_sent'}
    for attempt in range(1, HOOK_ATTEMPTS + 1):
        try:
            last = _post_once(payload, key)
            if last['ok']:
                dialog_id = (last.get('response') or {}).get('dialogId')
                print(f"payment-hook -> 200 dialogId={dialog_id} (попытка {attempt})")
                return {'ok': True, 'dialogId': dialog_id, 'attempts': attempt}
            last = {'ok': False, 'error': f"http_{last['status']}", 'attempts': attempt}
        except urllib.error.HTTPError as e:
            text = e.read().decode(errors='replace')[:300]
            last = {'ok': False, 'error': f'HTTP {e.code}: {text}', 'attempts': attempt}
        except Exception as e:
            last = {'ok': False, 'error': str(e), 'attempts': attempt}

        print(f"payment-hook: попытка {attempt} не удалась — {last.get('error')}")
        if attempt < HOOK_ATTEMPTS:
            time.sleep(HOOK_RETRY_DELAYS[min(attempt - 1, len(HOOK_RETRY_DELAYS) - 1)])

    return last


def mark_hook_result(conn, order_id: str, result: Dict[str, Any]) -> None:
    """Запоминаем исход отправки: недоставленные оплаты отдаём в feed."""
    try:
        cur = conn.cursor()
        if result.get('ok'):
            cur.execute(
                """
                UPDATE payment_leads
                SET interaction_sent_at = CURRENT_TIMESTAMP,
                    interaction_dialog_id = %s,
                    interaction_error = NULL
                WHERE order_id = %s
                """,
                (result.get('dialogId'), order_id),
            )
        else:
            cur.execute(
                """
                UPDATE payment_leads
                SET interaction_error = %s
                WHERE order_id = %s
                """,
                (str(result.get('error'))[:500], order_id),
            )
        conn.commit()
        cur.close()
    except Exception as e:
        print(f'payment-hook: не смог записать статус — {e}')
