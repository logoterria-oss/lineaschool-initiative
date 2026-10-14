"""
Сообщаем «Окну взаимодействия», что с новым лидом списались.

Тот же адрес и ключ, что у хука новых лидов (lead-processor): окно узнаёт
лида по leadId и обновляет его карточку, а не создаёт новую.
"""
import json
import os
import re
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Any, Dict

LEAD_HOOK_URL = (
    'https://functions.poehali.dev/67e8d62d-902a-4e5e-9862-d18395a730b1?action=lead-hook'
)
HOOK_TIMEOUT = 3


def norm_phone(raw: Any) -> str:
    digits = re.sub(r'\D', '', str(raw or ''))
    if len(digits) == 11 and digits[0] == '8':
        digits = '7' + digits[1:]
    if len(digits) == 10:
        digits = '7' + digits
    return digits[:11] if len(digits) >= 11 else ''


def send_contacted(lead: Dict[str, Any], status: str) -> Dict[str, Any]:
    """Шлём окну событие «Списались». Ошибка не мешает сменить статус."""
    key = os.environ.get('INTERACTION_SERVICE_KEY')
    if not key:
        print('lead-contacted: INTERACTION_SERVICE_KEY не задан')
        return {'ok': False, 'error': 'no_service_key'}
    phone = norm_phone(lead.get('contact'))
    payload = {
        'event': 'lead_contacted',
        'leadId': str(lead['id']),
        'kind': 'new_lead',
        'status': 'contacted',
        'statusLabel': status,
        'title': 'Списались с лидом',
        'text': f"Списались с родителем: {lead.get('parent_name') or '—'}"
                f" (ребёнок: {lead.get('student_name') or '—'})",
        'parentName': lead.get('parent_name') or '',
        'childName': lead.get('student_name') or '',
        'phone': f'+{phone}' if phone else '',
        'contact': lead.get('contact') or '',
        'responsible': lead.get('responsible') or '',
        'contactedAt': datetime.now(timezone.utc).isoformat(),
    }
    req = urllib.request.Request(
        LEAD_HOOK_URL,
        data=json.dumps(payload, ensure_ascii=False).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'X-Service-Key': key},
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=HOOK_TIMEOUT) as resp:
            resp.read()
        print(f"lead-contacted -> {resp.status} leadId={payload['leadId']}")
        return {'ok': True}
    except urllib.error.HTTPError as e:
        text = e.read().decode(errors='replace')[:300]
        print(f'lead-contacted: окно ответило {e.code} — {text}')
        return {'ok': False, 'error': f'HTTP {e.code}'}
    except Exception as e:
        print(f'lead-contacted: не дошло — {e}')
        return {'ok': False, 'error': str(e)}
