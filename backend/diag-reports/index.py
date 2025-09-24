import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: Сохранение заключений из диагностической формы в БД
    Args: event - dict с httpMethod, body, headers; context - объект с request_id
    Returns: HTTP response dict
    """
    method: str = event.get('httpMethod', 'POST')
    
    # Обработка CORS OPTIONS запроса
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Source',
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
    required_fields = ['student_name', 'diagnosis', 'report_content', 'access_token']
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
    
    # Подключение к базе данных
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cursor = conn.cursor(cursor_factory=RealDictCursor)
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Ошибка подключения к БД: {str(e)}'}),
            'isBase64Encoded': False
        }
    
    try:
        # Создание таблицы если не существует
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS speech_therapy_reports (
                id SERIAL PRIMARY KEY,
                student_name VARCHAR(255) NOT NULL,
                student_age INTEGER,
                date_of_examination DATE,
                therapist_name VARCHAR(255),
                diagnosis TEXT,
                recommendations TEXT,
                report_content TEXT NOT NULL,
                access_token VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Вставка заключения в БД
        cursor.execute("""
            INSERT INTO speech_therapy_reports 
            (student_name, student_age, date_of_examination, therapist_name, 
             diagnosis, recommendations, report_content, access_token)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, access_token
        """, (
            body_data.get('student_name'),
            body_data.get('student_age'),
            body_data.get('date_of_examination'),
            body_data.get('therapist_name', 'Автоматическая диагностика LineaSchool'),
            body_data.get('diagnosis'),
            body_data.get('recommendations'),
            body_data.get('report_content'),
            body_data.get('access_token')
        ))
        
        result = cursor.fetchone()
        conn.commit()
        
        # Формируем публичную ссылку
        public_url = f"https://functions.poehali.dev/90c2b81a-149c-41ae-aaa0-2693751f9619?token={result['access_token']}"
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'id': result['id'],
                'access_token': result['access_token'],
                'public_url': public_url,
                'message': 'Заключение сохранено в базе данных'
            }),
            'isBase64Encoded': False
        }
    
    except psycopg2.IntegrityError:
        conn.rollback()
        return {
            'statusCode': 409,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Заключение с таким токеном уже существует'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Ошибка сохранения: {str(e)}'}),
            'isBase64Encoded': False
        }
    
    finally:
        cursor.close()
        conn.close()