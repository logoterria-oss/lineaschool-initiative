import json
import os
from typing import Dict, Any
import urllib.request
import urllib.error
import urllib.parse


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Отправка данных лида в AlfaCRM
    Принимает данные формы и создает лида в AlfaCRM
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    
    api_key = os.environ.get('ALFACRM_API_KEY')
    branch_id = os.environ.get('ALFACRM_BRANCH_ID')
    
    if not api_key or not branch_id:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'AlfaCRM credentials not configured'}),
            'isBase64Encoded': False
        }
    
    child_name = body_data.get('childName', '')
    child_birth_date = body_data.get('childBirthDate', '')
    parent_name = body_data.get('parentName', '')
    phone = body_data.get('phone', '')
    telegram = body_data.get('telegram', '')
    
    params = {
        'token': api_key,
        'branch_id': branch_id,
        'name': parent_name,
        'phone': phone,
        'note': f'Ребенок: {child_name}\nДата рождения: {child_birth_date}\nTelegram: {telegram}'
    }
    
    query_string = urllib.parse.urlencode(params)
    api_url = f'https://lineaschool.s20.online/v2api/1/customer/create?{query_string}'
    
    req = urllib.request.Request(
        api_url,
        method='GET'
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'success': True,
                    'customer_id': result.get('id'),
                    'message': 'Lead sent to AlfaCRM successfully'
                }),
                'isBase64Encoded': False
            }
    
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        return {
            'statusCode': e.code,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'error': 'AlfaCRM API error',
                'details': error_body
            }),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'error': 'Failed to send lead to AlfaCRM',
                'details': str(e)
            }),
            'isBase64Encoded': False
        }