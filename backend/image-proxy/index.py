'''
Business: Proxy for loading Telegram images to avoid CORS issues
Args: event with queryStringParameters.url - image URL to fetch
Returns: Image data with proper headers
'''
import json
import urllib.request
from typing import Dict, Any
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
        image_url = params.get('url')
        
        if not image_url:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing url parameter'}),
                'isBase64Encoded': False
            }
        
        try:
            with urllib.request.urlopen(image_url) as response:
                image_data = response.read()
                content_type = response.headers.get('Content-Type', 'image/jpeg')
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': content_type,
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Credentials': 'true',
                        'Cache-Control': 'public, max-age=86400'
                    },
                    'body': base64.b64encode(image_data).decode('utf-8'),
                    'isBase64Encoded': True
                }
        except Exception as e:
            print(f'Error fetching image: {str(e)}')
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Failed to fetch image: {str(e)}'}),
                'isBase64Encoded': False
            }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }