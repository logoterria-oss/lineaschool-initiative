'''
Business: Save payment lead contact information to database
Args: event with httpMethod, body (name, email, phone, plan, amount, order_id)
Returns: HTTP response with success status
'''
import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
    # Handle CORS
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
    
    # Parse request body
    body_data = json.loads(event.get('body', '{}'))
    name = body_data.get('name')
    email = body_data.get('email')
    phone = body_data.get('phone')
    plan = body_data.get('plan')
    amount = body_data.get('amount')
    order_id = body_data.get('order_id')
    
    print(f'Saving payment lead: {name}, {email}, {phone}, {plan}, {amount}, {order_id}')
    
    # Get database connection string
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database not configured'}),
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        # Insert lead data
        cur.execute(
            "INSERT INTO payment_leads (name, email, phone, plan, amount, order_id, created_at) VALUES (%s, %s, %s, %s, %s, %s, NOW())",
            (name, email, phone, plan, amount, order_id)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        print(f'Lead saved successfully: {order_id}')
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True}),
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
