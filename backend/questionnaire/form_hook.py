"""
Отправка заполненных анкет в «Окно взаимодействия».

Окно живёт в отдельном проекте со своей базой, поэтому общаемся с ним по HTTP.
Хук передаёт ссылку на анкету и контакты клиента — по ним окно кладёт анкету
в уже существующий чат, а не плодит дубли. Повторная отправка той же анкеты
безопасна: окно узнаёт её по id и просто обновляет карточку.
"""

import json
import os
import re
import time
import urllib.error
import urllib.request
from typing import Any, Dict, Optional

FORM_HOOK_URL = (
    'https://functions.poehali.dev/67e8d62d-902a-4e5e-9862-d18395a730b1?action=form-hook'
)

# Постоянная ссылка на просмотр анкеты — по ней сотрудник открывает ответы.
FORM_VIEW_BASE = 'https://lineaschool.ru/anketa'

FORM_TITLE = 'Анкета нейродиагностики'

# Три попытки с нарастающей паузой: сеть моргнула — отправим ещё раз,
# окно лежит — оставим анкету в выгрузке ?action=feed&status=new.
HOOK_ATTEMPTS = 3
HOOK_RETRY_DELAYS = (1, 3)
HOOK_TIMEOUT = 6


def norm_phone(raw: Optional[str]) -> str:
    """Телефон в едином виде 7XXXXXXXXXX — по нему окно находит диалог."""
    digits = re.sub(r'\D', '', raw or '')
    if len(digits) == 11 and digits[0] == '8':
        digits = '7' + digits[1:]
    if len(digits) == 10:
        digits = '7' + digits
    return digits


def form_payload(row: Dict[str, Any]) -> Dict[str, Any]:
    """Одно и то же тело и для хука, и для выгрузки — окну проще разбирать."""
    phone = norm_phone(str(row.get('parent_phone') or ''))
    return {
        'id': str(row.get('id') or ''),
        'url': f"{FORM_VIEW_BASE}/{row.get('id')}",
        'title': FORM_TITLE,
        'parentName': row.get('parent_name') or '',
        'childName': row.get('child_name') or '',
        'phone': f'+{phone}' if phone else '',
    }


def _post_once(payload: Dict[str, Any], key: str) -> Dict[str, Any]:
    req = urllib.request.Request(
        FORM_HOOK_URL,
        data=json.dumps(payload, ensure_ascii=False).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'X-Service-Key': key},
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=HOOK_TIMEOUT) as resp:
        body = json.loads(resp.read().decode() or '{}')
        return {'ok': resp.status == 200, 'status': resp.status, 'response': body}


def send_form_hook(row: Dict[str, Any]) -> Dict[str, Any]:
    """Шлём анкету в окно. До трёх попыток, ошибки не роняют отправку анкеты."""
    key = os.environ.get('INTERACTION_SERVICE_KEY')
    if not key:
        print('form-hook: INTERACTION_SERVICE_KEY не задан')
        return {'ok': False, 'error': 'no_service_key'}

    payload = form_payload(row)
    if not payload['url'] or not row.get('id'):
        return {'ok': False, 'error': 'no_url'}

    last: Dict[str, Any] = {'ok': False, 'error': 'not_sent'}
    for attempt in range(1, HOOK_ATTEMPTS + 1):
        try:
            last = _post_once(payload, key)
            if last['ok']:
                dialog_id = (last.get('response') or {}).get('dialogId')
                print(f"form-hook -> 200 dialogId={dialog_id} (попытка {attempt})")
                return {'ok': True, 'dialogId': dialog_id, 'attempts': attempt}
            last = {'ok': False, 'error': f"http_{last['status']}", 'attempts': attempt}
        except urllib.error.HTTPError as e:
            text = e.read().decode(errors='replace')[:300]
            last = {'ok': False, 'error': f'HTTP {e.code}: {text}', 'attempts': attempt}
        except Exception as e:
            last = {'ok': False, 'error': str(e), 'attempts': attempt}

        print(f"form-hook: попытка {attempt} не удалась — {last.get('error')}")
        if attempt < HOOK_ATTEMPTS:
            time.sleep(HOOK_RETRY_DELAYS[min(attempt - 1, len(HOOK_RETRY_DELAYS) - 1)])

    return last


def mark_hook_result(conn, questionnaire_id: int, result: Dict[str, Any]) -> None:
    """Запоминаем исход отправки: недоставленные анкеты отдаём в feed."""
    try:
        cur = conn.cursor()
        if result.get('ok'):
            cur.execute(
                """
                UPDATE parent_questionnaire
                SET interaction_sent_at = CURRENT_TIMESTAMP,
                    interaction_dialog_id = %s,
                    interaction_attempts = interaction_attempts + %s,
                    interaction_error = NULL
                WHERE id = %s
                """,
                (result.get('dialogId'), result.get('attempts') or 1, questionnaire_id),
            )
        else:
            cur.execute(
                """
                UPDATE parent_questionnaire
                SET interaction_attempts = interaction_attempts + %s,
                    interaction_error = %s
                WHERE id = %s
                """,
                (result.get('attempts') or 1, str(result.get('error'))[:500], questionnaire_id),
            )
        conn.commit()
        cur.close()
    except Exception as e:
        print(f'form-hook: не смог записать статус — {e}')
