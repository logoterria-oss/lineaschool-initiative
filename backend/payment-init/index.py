'''
Business: Initialize T-Bank payment and return payment URL with real credentials
Args: event with httpMethod, body (amount, order, description, receipt)
Returns: HTTP response with PaymentURL
'''
import json
import hashlib
import os
import ssl
from typing import Dict, Any
import urllib.request
import urllib.error

# Сертификаты Минцифры (Russian Trusted CA). Т-Банк рекомендует доверять им
# для соединений с API эквайринга, иначе при переходе банка на российский УЦ
# серверный запрос Init упадёт с ошибкой TLS.
# https://developer.tbank.ru/eacq/intro/migration-russian-trusted-ca
_RUSSIAN_TRUSTED_CA_URLS = [
    'https://gu-st.ru/content/Other/doc/russiantrustedca.pem',
    'https://gu-st.ru/content/lending/russian_trusted_root_ca_pem.crt',
    'https://gu-st.ru/content/lending/russian_trusted_sub_ca_pem.crt',
]

_ssl_context_cache: Dict[str, Any] = {}


def _build_ssl_context() -> ssl.SSLContext:
    """Готовит TLS-контекст, доверяющий стандартным корням + сертификатам Минцифры.

    Сертификаты Минцифры скачиваются с серверов Госуслуг и добавляются к
    системным доверенным корням. Если загрузка не удалась — используется
    обычный контекст, чтобы оплаты не сломались.
    """
    if 'ctx' in _ssl_context_cache:
        return _ssl_context_cache['ctx']

    ctx = ssl.create_default_context()
    for url in _RUSSIAN_TRUSTED_CA_URLS:
        try:
            with urllib.request.urlopen(url, timeout=5) as resp:
                pem_data = resp.read().decode('utf-8', errors='ignore')
            if 'BEGIN CERTIFICATE' not in pem_data:
                continue
            ctx.load_verify_locations(cadata=pem_data)
            print(f'Russian Trusted CA loaded from {url}')
        except Exception as e:
            print(f'Skip CA {url}: {e}')

    _ssl_context_cache['ctx'] = ctx
    return ctx

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
    
    # Credentials from secrets
    terminal_key = os.environ.get('TBANK_TERMINAL_KEY')
    password = os.environ.get('TBANK_PASSWORD')

    # Срезаем случайные пробелы/переносы строк, которые могли попасть при вставке
    if terminal_key:
        terminal_key = terminal_key.strip()
    if password:
        password = password.strip()

    if not terminal_key or not password:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Платёжный терминал не настроен'}),
            'isBase64Encoded': False
        }
    
    # Prepare request to T-Bank Init API
    init_data = {
        'TerminalKey': terminal_key,
        'Amount': amount,
        'OrderId': order_id,
        'Description': description
    }
    
    # Add receipt if provided
    if receipt and receipt.get('Items'):
        init_data['Receipt'] = receipt
    
    # Calculate token (signature) - all values sorted alphabetically by key
    # Only include: Amount, Description, OrderId, Password, TerminalKey
    token_params = {
        'Amount': amount,  # Use int, not string
        'Description': description,
        'OrderId': order_id,
        'Password': password,
        'TerminalKey': terminal_key
    }
    
    # Sort by key and concatenate values (convert to string only when concatenating)
    sorted_values = ''.join([str(token_params[k]) for k in sorted(token_params.keys())])
    token = hashlib.sha256(sorted_values.encode()).hexdigest()
    init_data['Token'] = token
    
    print(f'Sending to T-Bank: order={order_id}, amount={amount}')
    
    # Send request to T-Bank
    url = 'https://securepay.tinkoff.ru/v2/Init'
    req_data = json.dumps(init_data).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=req_data,
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        ssl_ctx = _build_ssl_context()
        with urllib.request.urlopen(req, context=ssl_ctx) as response:
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