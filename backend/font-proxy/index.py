import base64
import urllib.request

# Noto Sans с поддержкой кириллицы — через jsDelivr (CORS-friendly CDN)
FONTS = {
    'normal': 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Regular.ttf',
    'bold':   'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Bold.ttf',
}

_cache = {}


def handler(event: dict, context) -> dict:
    """Проксирует TTF-шрифт Noto Sans с кириллицей в base64 для jsPDF.
    Параметр: style = normal | bold"""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': '',
        }

    params = event.get('queryStringParameters') or {}
    style = params.get('style', 'normal')

    if style not in FONTS:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': '{"error": "unknown style"}',
        }

    if style not in _cache:
        url = FONTS[style]
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = resp.read()
        _cache[style] = base64.b64encode(data).decode('ascii')

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=86400',
        },
        'body': '{"b64":"' + _cache[style] + '"}',
    }
