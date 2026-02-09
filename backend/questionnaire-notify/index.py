import json
import os
import psycopg2
from datetime import datetime
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

def handler(event: dict, context) -> dict:
    '''Отправка уведомлений в Telegram при заполнении анкеты'''
    
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        body_str = event.get('body', '{}')
        data = json.loads(body_str)
        
        questionnaire_id = data.get('questionnaire_id')
        if not questionnaire_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'questionnaire_id is required'})
            }
        
        db_url = os.environ['DATABASE_URL']
        schema = os.environ['MAIN_DB_SCHEMA']
        bot_token = os.environ['TELEGRAM_BOT_TOKEN']
        admin_chat_id = os.environ['TELEGRAM_ADMIN_CHAT_ID']
        
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        cur.execute(f'''
            SELECT parent_name, parent_phone, parent_email, child_name, 
                   birth_date, grade, created_at
            FROM {schema}.parent_questionnaire
            WHERE id = {questionnaire_id}
        ''')
        
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        if not row:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Questionnaire not found'})
            }
        
        parent_name, parent_phone, parent_email, child_name, birth_date, grade, created_at = row
        
        created_time = created_at.strftime('%d.%m.%Y %H:%M') if created_at else 'не указано'
        
        message = f'''🎓 Новая анкета заполнена!

👤 Родитель: {parent_name}
📱 Телефон: {parent_phone}
📧 Email: {parent_email or "не указан"}

👶 Ребёнок: {child_name}
🎂 Дата рождения: {birth_date or "не указана"}
📚 Класс: {grade or "не указан"}

🕐 Время заполнения: {created_time}
🆔 ID анкеты: {questionnaire_id}'''
        
        telegram_url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
        payload = json.dumps({
            'chat_id': admin_chat_id,
            'text': message,
            'parse_mode': 'HTML'
        }).encode('utf-8')
        
        req = Request(
            telegram_url,
            data=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        with urlopen(req, timeout=10) as response:
            telegram_result = json.loads(response.read().decode('utf-8'))
        
        if not telegram_result.get('ok'):
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Failed to send Telegram notification',
                    'details': telegram_result
                })
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'message': 'Notification sent',
                'questionnaire_id': questionnaire_id
            })
        }
        
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid JSON'})
        }
    except KeyError as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Missing environment variable: {str(e)}'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
