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


ARCHIVE_BUDGET = 1.5
ARCHIVE_BATCH = 20


def _post(payload: Dict[str, Any], key: str, timeout: float) -> bool:
    req = urllib.request.Request(
        LEAD_HOOK_URL,
        data=json.dumps(payload, ensure_ascii=False).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'X-Service-Key': key},
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = json.loads(resp.read().decode() or '{}')
        # Засчитываем, только если «Окно» подтвердило архив именно этого лида
        ok = body.get('ok') is True and body.get('archived') is payload['archived']
        if not ok:
            print(f"lead-archive: окно не подтвердило leadId={payload['leadId']}: {json.dumps(body, ensure_ascii=False)[:300]}")
        return ok
    except urllib.error.HTTPError as e:
        print(f"lead-archive: окно ответило {e.code} — {e.read().decode(errors='replace')[:300]}")
    except Exception as e:
        print(f'lead-archive: не дошло — {e}')
    return False


def sync_archive(cur, lead_id: int = 0) -> Dict[str, Any]:
    """Сообщаем «Окну», какие лиды ушли в архив или вернулись из него.

    Отправляем, пока архив в списке лидов и в «Окне» расходится (archived <> window_archived):
    не дошло сейчас — уйдёт при следующем открытии списка.
    """
    import time
    key = os.environ.get('INTERACTION_SERVICE_KEY')
    if not key:
        return {'sent': 0, 'error': 'no_service_key'}
    where = "COALESCE(archived, FALSE) <> window_archived"
    if lead_id:
        where += f" AND id = {int(lead_id)}"
    cur.execute(
        "SELECT id, parent_name, student_name, contact, archived, archived_at, lead_status, processing_status "
        f"FROM leads WHERE {where} ORDER BY (id = {int(lead_id or 0)}) DESC, archived_at DESC NULLS LAST LIMIT {ARCHIVE_BATCH}"
    )
    rows = cur.fetchall()
    started = time.monotonic()
    sent = 0
    for r in rows:
        left = ARCHIVE_BUDGET - (time.monotonic() - started)
        if left <= 0.2:
            break
        lid, parent, child, contact, archived, archived_at, lead_status, proc = r
        phone = norm_phone(contact)
        payload = {
            'event': 'lead_archived' if archived else 'lead_unarchived',
            'leadId': str(lid),
            'archived': bool(archived),
            'phone': f'+{phone}' if phone else '',
            'contact': contact or '',
            'parentName': parent or '',
            'childName': child or '',
            'reason': lead_status or '',
            'stage': proc or '',
            'archivedAt': archived_at.replace(tzinfo=timezone.utc).isoformat() if archived_at else None,
            'sentAt': datetime.now(timezone.utc).isoformat(),
        }
        if _post(payload, key, min(HOOK_TIMEOUT, left)):
            cur.execute(f"UPDATE leads SET window_archived = {'TRUE' if archived else 'FALSE'} WHERE id = {int(lid)}")
            sent += 1
        else:
            break
    if rows:
        print(f'lead-archive: отправлено {sent} из {len(rows)}')
    return {'sent': sent, 'pending': len(rows) - sent}
