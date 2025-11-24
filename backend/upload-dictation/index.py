'''
Business: Upload dictation from website (for parents who can't use Telegram bot)
Args: event with POST body containing parent_name, child_name, image (base64)
Returns: Success status with dictation ID
'''
import json
import os
import base64
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
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
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    parent_name = body_data.get('parent_name', '').strip()
    child_name = body_data.get('child_name', '').strip()
    image_base64 = body_data.get('image', '')
    
    if not parent_name or not child_name:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Parent name and child name are required'}),
            'isBase64Encoded': False
        }
    
    if not image_base64:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Image is required'}),
            'isBase64Encoded': False
        }
    
    # Remove data:image/...;base64, prefix if present
    if ',' in image_base64:
        image_base64 = image_base64.split(',', 1)[1]
    
    db_url = os.environ.get('DATABASE_URL')
    
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Insert dictation with status 'pending'
        # telegram_user_id = 0 for website uploads (no Telegram)
        # photo_url stores base64 image
        parent_name_escaped = parent_name.replace("'", "''")
        child_name_escaped = child_name.replace("'", "''")
        image_escaped = image_base64.replace("'", "''")
        
        query = f"""
            INSERT INTO t_p93118852_lineaschool_initiati.dictations 
            (telegram_user_id, telegram_username, parent_name, child_name, photo_file_id, photo_url, status, created_at)
            VALUES 
            (0, 'website', '{parent_name_escaped}', '{child_name_escaped}', 'WEB_UPLOAD', '{image_escaped}', 'pending', NOW())
            RETURNING id
        """
        
        cur.execute(query)
        result = cur.fetchone()
        dictation_id = result['id']
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'dictation_id': dictation_id,
                'message': 'Dictation uploaded successfully'
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        print(f'Database error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Failed to save dictation: {str(e)}'}),
            'isBase64Encoded': False
        }
