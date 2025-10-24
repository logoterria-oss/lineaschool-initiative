'''
Business: Get photo from Telegram by file_id via Bot API
Args: event with queryStringParameters.file_id - Telegram file ID
Returns: Image data with proper headers
'''
import json
import os
from typing import Dict, Any
import urllib.request
import urllib.error
import base64

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
    
    if method == 'GET':
        params = event.get('queryStringParameters', {})
        file_id = params.get('file_id')
        
        if not file_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing file_id parameter'}),
                'isBase64Encoded': False
            }
        
        bot_token = os.environ.get('TELEGRAM_BOT_API_TOKEN')
        
        if not bot_token:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Bot token not configured'}),
                'isBase64Encoded': False
            }
        
        try:
            # Step 1: Get file path from Telegram
            get_file_url = f'https://api.telegram.org/bot{bot_token}/getFile?file_id={file_id}'
            
            print(f'Requesting file_id: {file_id}')
            print(f'Token first 10 chars: {bot_token[:10] if bot_token else "NONE"}')
            print(f'Token length: {len(bot_token) if bot_token else 0}')
            
            with urllib.request.urlopen(get_file_url) as response:
                result = json.loads(response.read().decode('utf-8'))
                
                print(f'Telegram API response: {json.dumps(result)}')
                
                if not result.get('ok'):
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'File not found in Telegram'}),
                        'isBase64Encoded': False
                    }
                
                file_path = result['result']['file_path']
            
            # Step 2: Download the file
            download_url = f'https://api.telegram.org/file/bot{bot_token}/{file_path}'
            
            with urllib.request.urlopen(download_url) as response:
                image_data = response.read()
                content_type = response.headers.get('Content-Type', 'image/jpeg')
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': content_type,
                        'Access-Control-Allow-Origin': '*',
                        'Cache-Control': 'public, max-age=86400'
                    },
                    'body': base64.b64encode(image_data).decode('utf-8'),
                    'isBase64Encoded': True
                }
                
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8')
            print(f'HTTP Error {e.code}: {error_body}')
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'error': f'HTTP Error {e.code}',
                    'details': error_body,
                    'file_id': file_id
                }),
                'isBase64Encoded': False
            }
        except Exception as e:
            print(f'Error fetching Telegram photo: {str(e)}')
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Failed to fetch photo: {str(e)}', 'file_id': file_id}),
                'isBase64Encoded': False
            }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }