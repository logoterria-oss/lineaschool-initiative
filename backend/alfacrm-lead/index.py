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
    x_app_key = os.environ.get('ALFACRM_X_APP_KEY')
    branch_id = os.environ.get('ALFACRM_BRANCH_ID')
    
    if not api_key or not branch_id or not x_app_key:
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
    
    alfacrm_data = {
        'name': parent_name,
        'phone': phone,
        'branch_ids': [int(branch_id)],
        'note': f'Ребенок: {child_name}\nДата рождения: {child_birth_date}\nTelegram: {telegram}'
    }
    
    api_url = f'https://lineaschool.s20.online/v2api/{branch_id}/customer/create'
    
    request_data = json.dumps(alfacrm_data).encode('utf-8')
    
    req = urllib.request.Request(
        api_url,
        data=request_data,
        headers={
            'Content-Type': 'application/json',
            'X-ALFACRM-TOKEN': api_key,
            'X-APP-KEY': x_app_key
        },
        method='POST'
    )
    
    try:
        print(f'Sending to AlfaCRM: {api_url}')
        print(f'Data: {alfacrm_data}')
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            
            print(f'AlfaCRM Response: {result}')
            
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'success': True,
                    'customer_id': result.get('id'),
                    'message': 'Lead sent to AlfaCRM successfully',
                    'alfacrm_response': result
                }),
                'isBase64Encoded': False
            }
    
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f'AlfaCRM Error {e.code}: {error_body[:500]}')
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': 'AlfaCRM API error',
                'status_code': e.code,
                'details': error_body[:1000]
            }),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        print(f'Exception: {str(e)}')
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': 'Failed to send lead to AlfaCRM',
                'details': str(e)
            }),
            'isBase64Encoded': False
        }