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
    
    print(f'Payment request: amount={amount}, order={order_id}, desc={description}')
    
    # Get Terminal Key and Password from environment
    terminal_key = os.environ.get('TBANK_TERMINAL_KEY', '1759382115093DEMO')
    password = os.environ.get('TBANK_PASSWORD', '_v&Yq26u%%v5C2YG')
    
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
    
    # Calculate token (signature) - all non-empty values sorted alphabetically by key
    token_params = {
        'Amount': str(amount),
        'Description': description,
        'OrderId': order_id,
        'Password': password,
        'TerminalKey': terminal_key
    }
    
    # Sort by key and concatenate values
    sorted_values = ''.join([str(token_params[k]) for k in sorted(token_params.keys())])
    token = hashlib.sha256(sorted_values.encode()).hexdigest()
    init_data['Token'] = token
    
    print(f'Sending to T-Bank: {json.dumps(init_data)}')
    
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
            
            print(f'T-Bank response: {json.dumps(result)}')
            
            if result.get('Success'):
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'PaymentURL': result.get('PaymentURL')}),
                    'isBase64Encoded': False
                }
            else:
                print(f'T-Bank error: {result.get("Message")}, Details: {result.get("Details")}')
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': result.get('Message', 'Payment init failed'), 'details': result.get('Details')}),
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