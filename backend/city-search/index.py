"""
Поиск населённых пунктов РФ через Dadata API (база ФИАС). v2
Возвращает список городов, сёл, ПГТ, деревень с часовым поясом.
"""

import json
import os
import urllib.request
import urllib.error


def handler(event: dict, context) -> dict:
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    params = event.get('queryStringParameters') or {}
    query = (params.get('q') or '').strip()

    if not query or len(query) < 2:
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps([])
        }

    api_key = os.environ.get('DADATA_API_KEY', '')
    if not api_key:
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': 'DADATA_API_KEY not configured'})
        }

    payload = json.dumps({
        'query': query,
        'count': 20,
        'from_bound': {'value': 'city'},
        'to_bound': {'value': 'settlement'},
        'locations': [{'country': 'Россия'}],
        'restrict_value': False,
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': f'Token {api_key}',
        }
    )

    with urllib.request.urlopen(req, timeout=5) as resp:
        data = json.loads(resp.read().decode('utf-8'))

    results = []
    seen = set()
    for item in data.get('suggestions', []):
        d = item.get('data', {})

        # Берём settlement если есть, иначе city
        settlement = d.get('settlement_with_type') or ''
        city = d.get('city_with_type') or ''
        region = d.get('region_with_type') or ''

        name = settlement or city
        if not name or name in seen:
            continue
        seen.add(name)

        # Определяем часовой пояс из данных Dadata
        tz_offset = None
        tz_name = d.get('timezone') or ''
        # timezone в Dadata: "UTC+3", "UTC+5", etc.
        if tz_name.startswith('UTC'):
            try:
                utc_offset = int(tz_name.replace('UTC', '').replace('+', ''))
                msk_offset = utc_offset - 3
                tz_offset = msk_offset
            except Exception:
                pass

        if tz_offset is None:
            tz_label = ''
        elif tz_offset == 0:
            tz_label = 'МСК+0'
        elif tz_offset > 0:
            tz_label = f'МСК+{tz_offset}'
        else:
            tz_label = f'МСК{tz_offset}'

        label = name
        if region and region.lower() not in name.lower():
            label = f'{name}, {region}'

        results.append({
            'name': name,
            'label': label,
            'timezone': tz_offset,
            'timezone_label': tz_label,
            'region': region,
        })

    return {
        'statusCode': 200,
        'headers': cors_headers,
        'body': json.dumps(results, ensure_ascii=False)
    }