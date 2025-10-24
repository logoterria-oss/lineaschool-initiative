'''
Business: Настройка и проверка вебхука Telegram бота
Args: event with queryStringParameters.action (setWebhook, getWebhookInfo, deleteWebhook)
Returns: JSON с результатом операции
'''
import json
import os
from typing import Dict, Any
import urllib.request
import urllib.error

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    bot_token = os.environ.get('TELEGRAM_BOT_API_TOKEN')
    if not bot_token:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'TELEGRAM_BOT_API_TOKEN not configured'}),
            'isBase64Encoded': False
        }
    
    params = event.get('queryStringParameters', {})
    action = params.get('action', 'getWebhookInfo')
    
    webhook_url = 'https://functions.poehali.dev/1045ce5a-ff9c-4da4-94f5-bcb075b84ac5'
    
    try:
        if action == 'setWebhook':
            # Устанавливаем вебхук
            url = f'https://api.telegram.org/bot{bot_token}/setWebhook?url={webhook_url}'
            with urllib.request.urlopen(url) as response:
                result = json.loads(response.read().decode('utf-8'))
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'action': 'setWebhook',
                        'success': result.get('ok'),
                        'description': result.get('description'),
                        'webhook_url': webhook_url
                    }),
                    'isBase64Encoded': False
                }
        
        elif action == 'deleteWebhook':
            # Удаляем вебхук
            url = f'https://api.telegram.org/bot{bot_token}/deleteWebhook'
            with urllib.request.urlopen(url) as response:
                result = json.loads(response.read().decode('utf-8'))
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'action': 'deleteWebhook',
                        'success': result.get('ok'),
                        'description': result.get('description')
                    }),
                    'isBase64Encoded': False
                }
        
        else:  # getWebhookInfo
            # Получаем информацию о вебхуке
            url = f'https://api.telegram.org/bot{bot_token}/getWebhookInfo'
            with urllib.request.urlopen(url) as response:
                result = json.loads(response.read().decode('utf-8'))
                
                webhook_info = result.get('result', {})
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'action': 'getWebhookInfo',
                        'current_webhook': webhook_info.get('url'),
                        'expected_webhook': webhook_url,
                        'is_configured': webhook_info.get('url') == webhook_url,
                        'pending_update_count': webhook_info.get('pending_update_count', 0),
                        'last_error_date': webhook_info.get('last_error_date'),
                        'last_error_message': webhook_info.get('last_error_message'),
                        'max_connections': webhook_info.get('max_connections'),
                        'full_info': webhook_info
                    }),
                    'isBase64Encoded': False
                }
    
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'error': f'Telegram API error: {e.code}',
                'details': error_body
            }),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
