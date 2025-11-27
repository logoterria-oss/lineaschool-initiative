import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import requests

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: Админ-панель для просмотра заключений и управления AI-менеджером
    Args: event - dict с httpMethod, queryStringParameters, body
          context - объект с request_id
    Returns: HTTP response dict
    """
    method: str = event.get('httpMethod', 'GET')
    
    # Обработка CORS OPTIONS запроса
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    # Проверяем пароль администратора только для отчетов
    query_params = event.get('queryStringParameters', {}) or {}
    endpoint = query_params.get('endpoint', 'reports')
    
    if endpoint == 'reports':
        headers = event.get('headers', {})
        admin_password = headers.get('X-Admin-Password', headers.get('x-admin-password', ''))
        
        if admin_password != '426874':
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Неверный пароль администратора'}),
                'isBase64Encoded': False
            }
    
    # Подключение к базе данных
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # REPORTS ENDPOINT - список отчетов
        if endpoint == 'reports' and method == 'GET':
            cursor.execute("""
                SELECT id, student_name, student_age, date_of_examination, 
                       therapist_name, created_at, access_token
                FROM t_p93118852_lineaschool_initiati.speech_therapy_reports 
                ORDER BY created_at DESC
            """)
            
            reports = cursor.fetchall()
            reports_list = []
            for report in reports:
                reports_list.append({
                    'id': report['id'],
                    'student_name': report['student_name'],
                    'student_age': report['student_age'],
                    'date_of_examination': report['date_of_examination'].isoformat() if report['date_of_examination'] else None,
                    'therapist_name': report['therapist_name'],
                    'created_at': report['created_at'].isoformat() if report['created_at'] else None,
                    'report_url': f"/diag/{report['id']}"
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'reports': reports_list, 'total': len(reports_list)}),
                'isBase64Encoded': False
            }
        
        # AI MANAGER ENDPOINTS
        if method == 'GET':
            conversation_id = query_params.get('conversation_id')
            
            if conversation_id:
                cursor.execute(
                    """SELECT id, sender, message_text, sent_at 
                       FROM t_p93118852_lineaschool_initiati.messages 
                       WHERE conversation_id = %s 
                       ORDER BY sent_at ASC""",
                    (conversation_id,)
                )
                messages = [dict(row) for row in cursor.fetchall()]
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'messages': messages}, default=str),
                    'isBase64Encoded': False
                }
            
            cursor.execute(
                """SELECT id, telegram_user_id, first_name, telegram_username, 
                          status, assigned_to, lead_data, created_at, updated_at 
                   FROM t_p93118852_lineaschool_initiati.conversations 
                   WHERE status = 'active' 
                   ORDER BY updated_at DESC 
                   LIMIT 50"""
            )
            conversations = [dict(row) for row in cursor.fetchall()]
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'conversations': conversations}, default=str),
                'isBase64Encoded': False
            }
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'take_control':
                conversation_id = body_data.get('conversation_id')
                cursor.execute(
                    """UPDATE t_p93118852_lineaschool_initiati.conversations 
                       SET assigned_to = 'manual' 
                       WHERE id = %s""",
                    (conversation_id,)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            if action == 'release_control':
                conversation_id = body_data.get('conversation_id')
                cursor.execute(
                    """UPDATE t_p93118852_lineaschool_initiati.conversations 
                       SET assigned_to = 'ai' 
                       WHERE id = %s""",
                    (conversation_id,)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            if action == 'send_message':
                conversation_id = body_data.get('conversation_id')
                message = body_data.get('message')
                
                cursor.execute(
                    """SELECT telegram_username FROM t_p93118852_lineaschool_initiati.conversations 
                       WHERE id = %s""",
                    (conversation_id,)
                )
                conv = cursor.fetchone()
                
                if conv:
                    cursor.execute(
                        """INSERT INTO t_p93118852_lineaschool_initiati.messages 
                           (conversation_id, sender, message_text) 
                           VALUES (%s, 'manual', %s)""",
                        (conversation_id, message)
                    )
                    conn.commit()
                    
                    send_whatsapp_message(conv['telegram_username'], message)
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            if action == 'update_settings':
                settings = body_data.get('settings', {})
                
                for key, value in settings.items():
                    cursor.execute(
                        """INSERT INTO t_p93118852_lineaschool_initiati.admin_settings 
                           (key, value, updated_at) 
                           VALUES (%s, %s, NOW())
                           ON CONFLICT (key) 
                           DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()""",
                        (key, str(value))
                    )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid request'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'}),
            'isBase64Encoded': False
        }
    
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

def send_whatsapp_message(phone: str, message: str):
    instance_id = os.environ.get('GREENAPI_INSTANCE_ID')
    api_token = os.environ.get('GREENAPI_API_TOKEN')
    
    if not instance_id or not api_token:
        return
    
    clean_phone = ''.join(filter(str.isdigit, phone))
    if not clean_phone.startswith('7'):
        clean_phone = '7' + clean_phone
    
    chat_id = f'{clean_phone}@c.us'
    url = f'https://api.green-api.com/waInstance{instance_id}/sendMessage/{api_token}'
    
    try:
        requests.post(url, json={'chatId': chat_id, 'message': message}, timeout=10)
    except Exception as e:
        print(f'WhatsApp sending failed: {str(e)}')