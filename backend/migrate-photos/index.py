'''
Business: One-time migration - download photos from Telegram and save file_id for future use
Args: event with queryStringParameters.dictation_id - optional, migrate specific or all
Returns: Migration status
'''
import json
import os
from typing import Dict, Any
import urllib.request
import psycopg2
from psycopg2.extras import RealDictCursor

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
        bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
        db_url = os.environ.get('DATABASE_URL')
        
        if not bot_token:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Bot token not configured'}),
                'isBase64Encoded': False
            }
        
        try:
            conn = psycopg2.connect(db_url)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Get all dictations
            cur.execute(
                "SELECT id, photo_file_id FROM t_p93118852_lineaschool_initiati.dictations "
                "ORDER BY created_at DESC"
            )
            dictations = cur.fetchall()
            
            results = []
            
            for dictation in dictations:
                dictation_id = dictation['id']
                file_id = dictation['photo_file_id']
                
                print(f'Checking dictation {dictation_id} with file_id {file_id}')
                
                # Try to get file info from Telegram
                try:
                    get_file_url = f'https://api.telegram.org/bot{bot_token}/getFile?file_id={file_id}'
                    
                    with urllib.request.urlopen(get_file_url) as response:
                        result = json.loads(response.read().decode('utf-8'))
                        
                        if result.get('ok'):
                            results.append({
                                'dictation_id': dictation_id,
                                'status': 'file_id_valid',
                                'file_id': file_id
                            })
                            print(f'✅ Dictation {dictation_id}: file_id is valid')
                        else:
                            results.append({
                                'dictation_id': dictation_id,
                                'status': 'file_id_invalid',
                                'error': result.get('description', 'Unknown error')
                            })
                            print(f'❌ Dictation {dictation_id}: file_id is invalid - {result.get("description")}')
                            
                except Exception as e:
                    results.append({
                        'dictation_id': dictation_id,
                        'status': 'error',
                        'error': str(e)
                    })
                    print(f'❌ Dictation {dictation_id}: error - {str(e)}')
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'total': len(results),
                    'results': results
                }),
                'isBase64Encoded': False
            }
            
        except Exception as e:
            print(f'Database error: {str(e)}')
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': str(e)}),
                'isBase64Encoded': False
            }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
