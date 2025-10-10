'''
Business: Admin API for managing dictations from Telegram bot
Args: event with httpMethod, body (action, id, notes)
Returns: List of dictations or update status
'''
import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
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
            cur.execute(
                "SELECT * FROM t_p93118852_lineaschool_initiati.dictations "
                "ORDER BY created_at DESC"
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
                    'photo_url': d['photo_url'],
                    'annotated_image': d.get('annotated_image'),
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
                annotated_image = body_data.get('annotated_image')
                
                cur.execute(
                    "UPDATE t_p93118852_lineaschool_initiati.dictations "
                    "SET annotated_image = %s "
                    "WHERE id = %s",
                    (annotated_image, dictation_id)
                )
                conn.commit()
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
                notes = body_data.get('notes', '')
                annotated_image = body_data.get('annotated_image')
                
                cur.execute(
                    "UPDATE t_p93118852_lineaschool_initiati.dictations "
                    "SET status = 'checked', diagnostician_notes = %s, "
                    "annotated_image = %s, checked_at = CURRENT_TIMESTAMP "
                    "WHERE id = %s",
                    (notes, annotated_image, dictation_id)
                )
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