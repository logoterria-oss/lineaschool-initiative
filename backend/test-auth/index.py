import json
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: Простая проверка авторизации для тестирования
    Args: event - dict с httpMethod, headers; context - объект с request_id
    Returns: HTTP response dict
    """
    method: str = event.get('httpMethod', 'GET')
    
    # Обработка CORS OPTIONS запроса
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Password',
                'Access-Control-Max-Age': '86400'
            },
            'isBase64Encoded': False,
            'body': ''
        }
    
    # Получение пароля из заголовков
    headers = event.get('headers', {})
    password = headers.get('X-Auth-Password') or headers.get('x-auth-password')
    
    # Проверка пароля
    if password != '426874':
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'error': 'Неверный пароль',
                'received_password': password,
                'headers': dict(headers)
            })
        }
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({
            'message': 'Авторизация успешна',
            'password': password,
            'method': method,
            'request_id': context.request_id
        })
    }