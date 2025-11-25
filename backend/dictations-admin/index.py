'''
⚠️ КРИТИЧЕСКАЯ ФУНКЦИЯ - НЕ ИЗМЕНЯТЬ БЕЗ НЕОБХОДИМОСТИ

Business: Admin API for managing dictations from Telegram bot
Args: event with httpMethod, body (action, id, notes)
Returns: List of dictations or update status

Ключевой функционал:
- GET ?id=X - возвращает диктант с парсингом markup_data (строки 54-65)
- POST action=save_annotation - сохраняет markup_data и annotated_image (строки 125-175)
- POST action=mark_checked - отмечает диктант как проверенный (строки 187-209)

ВАЖНО:
- При чтении markup_data парсится дважды если это строка внутри JSON (строка 57-65)
- При сохранении markup_data сохраняется как строка без двойного JSON.dumps (строка 133-141)
- mark_checked НЕ трогает markup_data, только меняет статус

Последнее изменение: 13.11.2025
'''
import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    db_url = os.environ.get('DATABASE_URL')
    
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            dictation_id = query_params.get('id')
            
            if dictation_id:
                dictation_id_int = int(dictation_id)
                cur.execute(
                    "SELECT * FROM t_p93118852_lineaschool_initiati.dictations WHERE id = " + str(dictation_id_int)
                )
                d = cur.fetchone()
                
                if not d:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Not found'}),
                        'isBase64Encoded': False
                    }
                
                markup_data = None
                if d.get('markup_data'):
                    try:
                        parsed = json.loads(d['markup_data'])
                        # If it's a string inside JSON, parse again
                        if isinstance(parsed, str):
                            markup_data = json.loads(parsed)
                        else:
                            markup_data = parsed
                    except Exception as e:
                        print(f'Failed to parse markup_data: {e}')
                        pass
                
                result = {
                    'id': d['id'],
                    'telegram_user_id': d['telegram_user_id'],
                    'telegram_username': d['telegram_username'] or '',
                    'child_name': d['child_name'],
                    'photo_file_id': d['photo_file_id'],
                    'photo_url': d['photo_url'],
                    'markup_data': markup_data,
                    'annotated_image': d.get('annotated_image'),
                    'has_annotation': bool(d.get('markup_data')),
                    'status': d['status'],
                    'diagnostician_notes': d['diagnostician_notes'],
                    'created_at': d['created_at'].isoformat() if d['created_at'] else None,
                    'checked_at': d['checked_at'].isoformat() if d['checked_at'] else None,
                    'checked_by': d['checked_by']
                }
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'dictation': result}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "SELECT id, telegram_user_id, telegram_username, child_name, photo_file_id, "
                "CASE WHEN markup_data IS NOT NULL THEN true ELSE false END as has_annotation, "
                "status, LEFT(diagnostician_notes, 200) as diagnostician_notes, created_at, checked_at, checked_by "
                "FROM t_p93118852_lineaschool_initiati.dictations "
                "ORDER BY created_at DESC LIMIT 50"
            )
            dictations = cur.fetchall()
            
            result = []
            for d in dictations:
                result.append({
                    'id': d['id'],
                    'telegram_user_id': d['telegram_user_id'],
                    'telegram_username': d['telegram_username'] or '',
                    'child_name': d['child_name'],
                    'photo_file_id': d['photo_file_id'],
                    'photo_url': None,
                    'has_annotation': d['has_annotation'],
                    'status': d['status'],
                    'diagnostician_notes': d['diagnostician_notes'],
                    'created_at': d['created_at'].isoformat() if d['created_at'] else None,
                    'checked_at': d['checked_at'].isoformat() if d['checked_at'] else None,
                    'checked_by': d['checked_by']
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'dictations': result}),
                'isBase64Encoded': False
            }
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'save_annotation':
                dictation_id = body_data.get('id')
                markup_data_raw = body_data.get('markup_data', '')
                annotated_image_raw = body_data.get('annotated_image', '')
                
                print(f'Saving annotation for ID {dictation_id}')
                print(f'markup_data type: {type(markup_data_raw)}')
                print(f'markup_data length: {len(str(markup_data_raw))}')
                
                # If it's already a JSON string, keep it as is
                # If it's a dict/list, convert to JSON string
                if isinstance(markup_data_raw, str):
                    markup_data = markup_data_raw
                elif isinstance(markup_data_raw, (dict, list)):
                    markup_data = json.dumps(markup_data_raw)
                else:
                    markup_data = str(markup_data_raw)
                
                # Double escape single quotes for SQL
                markup_data_escaped = markup_data.replace("'", "''")
                
                # Escape annotated image
                if isinstance(annotated_image_raw, (dict, list)):
                    annotated_image = json.dumps(annotated_image_raw).replace("'", "''")
                else:
                    annotated_image = str(annotated_image_raw).replace("'", "''")
                
                print(f'Executing UPDATE query')
                dictation_id_int = int(dictation_id)
                query = "UPDATE t_p93118852_lineaschool_initiati.dictations SET markup_data = '" + markup_data_escaped + "', annotated_image = '" + annotated_image + "' WHERE id = " + str(dictation_id_int)
                
                try:
                    cur.execute(query)
                    conn.commit()
                    print(f'UPDATE successful, rows affected: {cur.rowcount}')
                except Exception as e:
                    print(f'UPDATE failed: {str(e)}')
                    print(f'Query was: {query[:200]}...')
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 500,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': f'Database update failed: {str(e)}'}),
                        'isBase64Encoded': False
                    }
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            if action == 'mark_checked':
                dictation_id = body_data.get('id')
                notes = str(body_data.get('notes', '')).replace("'", "''")
                annotated_image_raw = body_data.get('annotated_image', '')
                
                # Convert to string if it's a dict/object
                if isinstance(annotated_image_raw, (dict, list)):
                    annotated_image = json.dumps(annotated_image_raw).replace("'", "''")
                else:
                    annotated_image = str(annotated_image_raw).replace("'", "''")
                
                dictation_id_int = int(dictation_id)
                query = "UPDATE t_p93118852_lineaschool_initiati.dictations SET status = 'checked', diagnostician_notes = '" + notes + "', annotated_image = '" + annotated_image + "', checked_at = CURRENT_TIMESTAMP WHERE id = " + str(dictation_id_int)
                cur.execute(query)
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }