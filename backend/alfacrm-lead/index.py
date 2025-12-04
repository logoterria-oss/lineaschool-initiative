import json
import os
from typing import Dict, Any
import urllib.request
import urllib.error
import urllib.parse


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Отправка данных лида в AlfaCRM через форму захвата
    Принимает данные с сайта и отправляет в форму AlfaCRM
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
    
    child_name = body_data.get('childName', '')
    child_birth_date = body_data.get('childBirthDate', '')
    parent_name = body_data.get('parentName', '')
    phone = body_data.get('phone', '')
    telegram = body_data.get('telegram', '')
    
    form_data = {
        'fields[0][value]': child_name,
        'fields[1][value]': child_birth_date,
        'fields[2][value]': parent_name,
        'fields[3][value]': phone,
        'fields[4][value]': telegram
    }
    
    form_url = 'https://11086.s20.online/common/1/form/draw?id=1&lead_source_id=7&baseColor=205EDC&borderRadius=8&css=%2F%2Fcdn.alfacrm.pro%2Flead-form%2Fform.css'
    
    encoded_data = urllib.parse.urlencode(form_data).encode('utf-8')
    
    req = urllib.request.Request(
        form_url,
        data=encoded_data,
        headers={
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0'
        },
        method='POST'
    )
    
    try:
        print(f'Sending to AlfaCRM form: {form_url}')
        print(f'Data: {form_data}')
        
        with urllib.request.urlopen(req) as response:
            response_body = response.read().decode('utf-8')
            
            print(f'AlfaCRM Response: {response_body[:500]}')
            
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'success': True,
                    'message': 'Lead sent to AlfaCRM successfully'
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
                'success': False,
                'error': 'AlfaCRM form error',
                'status_code': e.code
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
                'success': False,
                'error': 'Failed to send lead to AlfaCRM',
                'details': str(e)
            }),
            'isBase64Encoded': False
        }
