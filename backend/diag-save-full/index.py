import json
import os
import secrets
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: Сохранение полного заключения с данными формы
    Args: event - dict с httpMethod, body; context - объект с request_id  
    Returns: HTTP response dict с ID сохраненного заключения
    """
    method: str = event.get('httpMethod', 'POST')
    
    # Обработка CORS OPTIONS запроса
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    # Принимаем только POST запросы
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }
    
    # Парсим данные из тела запроса
    try:
        body_data = json.loads(event.get('body', '{}'))
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Некорректный JSON в теле запроса'}),
            'isBase64Encoded': False
        }
    
    # Проверяем обязательные поля
    required_fields = ['form_data', 'student_name', 'date_of_examination']
    for field in required_fields:
        if not body_data.get(field):
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': f'Поле {field} обязательно'}),
                'isBase64Encoded': False
            }
    
    # Генерируем токен доступа
    access_token = secrets.token_urlsafe(32)
    
    # Подключение к базе данных
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Вставка полного заключения в БД
        cursor.execute("""
            INSERT INTO t_p93118852_lineaschool_initiati.speech_therapy_reports 
            (student_name, student_age, date_of_examination, therapist_name, 
             diagnosis, recommendations, report_content, access_token, form_data)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, access_token, created_at
        """, (
            body_data.get('student_name'),
            body_data.get('student_age'),
            body_data.get('date_of_examination'),
            body_data.get('therapist_name', 'Логопед'),
            body_data.get('diagnosis', ''),
            body_data.get('recommendations', ''),
            body_data.get('report_content', ''),
            access_token,
            json.dumps(body_data.get('form_data'))
        ))
        
        result = cursor.fetchone()
        conn.commit()
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'id': result['id'],
                'access_token': result['access_token'],
                'created_at': result['created_at'].isoformat() if result['created_at'] else None
            }),
            'isBase64Encoded': False
        }
    
    except psycopg2.IntegrityError as e:
        if 'conn' in locals():
            conn.rollback()
        return {
            'statusCode': 409,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Ошибка целостности данных: {str(e)}'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        if 'conn' in locals():
            conn.rollback()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'}),
            'isBase64Encoded': False
        }
    
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()