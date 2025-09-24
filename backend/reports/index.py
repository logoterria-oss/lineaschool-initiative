import json
import os
import secrets
from datetime import datetime
from typing import Dict, Any, Optional, List
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: Управление логопедическими заключениями с парольной защитой
    Args: event - dict с httpMethod, headers, body; context - объект с request_id
    Returns: HTTP response dict
    """
    method: str = event.get('httpMethod', 'GET')
    
    # Обработка CORS OPTIONS запроса
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Password, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    # Получение пароля из заголовков
    headers = event.get('headers', {})
    password = headers.get('X-Auth-Password') or headers.get('x-auth-password')
    
    # Парольная защита (пароль: 426874)
    if password != '426874':
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Неверный пароль'})
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
            'isBase64Encoded': False,
            'body': json.dumps({'error': f'Ошибка подключения к БД: {str(e)}'})
        }
    
    try:
        if method == 'GET':
            return get_reports(cursor)
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            return create_report(cursor, conn, body_data)
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            params = event.get('queryStringParameters', {})
            report_id = params.get('id')
            return update_report(cursor, conn, report_id, body_data)
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            report_id = params.get('id')
            return delete_report(cursor, conn, report_id)
        else:
            return {
                'statusCode': 405,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Метод не поддерживается'})
            }
    
    finally:
        cursor.close()
        conn.close()

def get_reports(cursor) -> Dict[str, Any]:
    """Получить все заключения"""
    cursor.execute("""
        SELECT id, student_name, student_age, date_of_examination, 
               therapist_name, diagnosis, recommendations, report_content,
               access_token, created_at, updated_at
        FROM speech_therapy_reports 
        ORDER BY created_at DESC
    """)
    
    reports = cursor.fetchall()
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps([dict(report) for report in reports], default=str)
    }

def create_report(cursor, conn, data: Dict[str, Any]) -> Dict[str, Any]:
    """Создать новое заключение"""
    # Генерация уникального токена для доступа
    access_token = secrets.token_urlsafe(32)
    
    cursor.execute("""
        INSERT INTO speech_therapy_reports 
        (student_name, student_age, date_of_examination, therapist_name, 
         diagnosis, recommendations, report_content, access_token)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id, access_token
    """, (
        data.get('student_name'),
        data.get('student_age'),
        data.get('date_of_examination'),
        data.get('therapist_name'),
        data.get('diagnosis'),
        data.get('recommendations'),
        data.get('report_content'),
        access_token
    ))
    
    result = cursor.fetchone()
    conn.commit()
    
    return {
        'statusCode': 201,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({
            'id': result['id'],
            'access_token': result['access_token'],
            'message': 'Заключение создано успешно'
        })
    }

def update_report(cursor, conn, report_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Обновить заключение"""
    if not report_id:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'ID заключения обязателен'})
        }
    
    cursor.execute("""
        UPDATE speech_therapy_reports 
        SET student_name = %s, student_age = %s, date_of_examination = %s,
            therapist_name = %s, diagnosis = %s, recommendations = %s,
            report_content = %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
        RETURNING id
    """, (
        data.get('student_name'),
        data.get('student_age'),
        data.get('date_of_examination'),
        data.get('therapist_name'),
        data.get('diagnosis'),
        data.get('recommendations'),
        data.get('report_content'),
        report_id
    ))
    
    result = cursor.fetchone()
    if not result:
        return {
            'statusCode': 404,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Заключение не найдено'})
        }
    
    conn.commit()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({'message': 'Заключение обновлено успешно'})
    }

def delete_report(cursor, conn, report_id: str) -> Dict[str, Any]:
    """Удалить заключение"""
    if not report_id:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'ID заключения обязателен'})
        }
    
    cursor.execute("DELETE FROM speech_therapy_reports WHERE id = %s RETURNING id", (report_id,))
    result = cursor.fetchone()
    
    if not result:
        return {
            'statusCode': 404,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Заключение не найдено'})
        }
    
    conn.commit()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({'message': 'Заключение удалено успешно'})
    }