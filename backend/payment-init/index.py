'''
Business: Initialize T-Bank payment and return payment URL
Args: event with httpMethod, body (amount, order, description, receipt)
Returns: HTTP response with PaymentURL
'''
import json
import hashlib
import os
from typing import Dict, Any
import urllib.request
import urllib.error

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
    amount = body_data.get('amount')
    order_id = body_data.get('order')
    description = body_data.get('description', '')
    receipt = body_data.get('receipt', {})
    
    # Get Terminal Key and Password from environment
    terminal_key = os.environ.get('TBANK_TERMINAL_KEY', '1759382115093DEMO')
    password = os.environ.get('TBANK_PASSWORD', 'qnq29pprofckgiwa')
    
    # Prepare request to T-Bank Init API
    init_data = {
        'TerminalKey': terminal_key,
        'Amount': amount,
        'OrderId': order_id,
        'Description': description
    }
    
    # Add receipt if provided and not empty
    if receipt and receipt.get('items'):
        init_data['Receipt'] = receipt
    
    # For DEMO terminal, token is optional
    if terminal_key != '1759382115093DEMO':
        # Calculate token (signature) for production
        token_string = f"{str(amount)}{order_id}{password}{terminal_key}"
        token = hashlib.sha256(token_string.encode()).hexdigest()
        init_data['Token'] = token
    
    # Send request to T-Bank
    url = 'https://securepay.tinkoff.ru/v2/Init'
    req_data = json.dumps(init_data).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=req_data,
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            
            if result.get('Success'):
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'PaymentURL': result.get('PaymentURL')}),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': result.get('Message', 'Payment init failed')}),
                    'isBase64Encoded': False
                }
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        return {
            'statusCode': e.code,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'T-Bank API error: {error_body}'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }