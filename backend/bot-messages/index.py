'''
Business: Управление текстами сообщений бота
Args: event with httpMethod (GET/PUT), body for updates
Returns: JSON с текстами сообщений
'''
import json
import os
from typing import Dict, Any
import psycopg2

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'}),
            'isBase64Encoded': False
        }
    
    try:
        if method == 'GET':
            conn = psycopg2.connect(dsn)
            try:
                cur = conn.cursor()
                cur.execute(
                    """
                    SELECT message_key, message_text, description 
                    FROM t_p93118852_lineaschool_initiati.bot_messages
                    ORDER BY id
                    """
                )
                rows = cur.fetchall()
                
                messages = {}
                for row in rows:
                    messages[row[0]] = {
                        'text': row[1],
                        'description': row[2]
                    }
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'messages': messages}),
                    'isBase64Encoded': False
                }
            finally:
                if conn:
                    conn.close()
        
        elif method == 'PUT':
            body_str = event.get('body', '{}')
            data = json.loads(body_str)
            
            message_key = data.get('message_key')
            message_text = data.get('message_text')
            
            if not message_key or not message_text:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing message_key or message_text'}),
                    'isBase64Encoded': False
                }
            
            conn = psycopg2.connect(dsn)
            try:
                cur = conn.cursor()
                cur.execute(
                    """
                    UPDATE t_p93118852_lineaschool_initiati.bot_messages
                    SET message_text = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE message_key = %s
                    RETURNING message_key, message_text, description
                    """,
                    (message_text, message_key)
                )
                row = cur.fetchone()
                conn.commit()
                cur.close()
                
                if not row:
                    conn.close()
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Message not found'}),
                        'isBase64Encoded': False
                    }
                
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'message_key': row[0],
                        'message_text': row[1],
                        'description': row[2]
                    }),
                    'isBase64Encoded': False
                }
            finally:
                if conn:
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
