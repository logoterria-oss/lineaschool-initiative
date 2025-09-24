import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: Получение списка всех заключений для админской панели
    Args: event - dict с httpMethod, headers; context - объект с request_id  
    Returns: HTTP response dict со списком заключений
    """
    method: str = event.get('httpMethod', 'GET')
    
    # Обработка CORS OPTIONS запроса
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Password',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    # Принимаем только GET запросы
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }
    
    # Проверяем пароль администратора
    headers = event.get('headers', {})
    admin_password = headers.get('X-Auth-Password', headers.get('x-auth-password', ''))
    
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
        
        # Получаем все заключения из новой таблицы
        cursor.execute("""
            SELECT id, student_name, student_age, date_of_examination, therapist_name,
                   diagnosis, recommendations, report_content, access_token, created_at, updated_at
            FROM t_p93118852_lineaschool_initiati.speech_therapy_reports 
            ORDER BY created_at DESC
        """)
        
        results = cursor.fetchall()
        
        # Формируем список заключений для админской панели
        reports = []
        for row in results:
            reports.append({
                'id': row['id'],
                'student_name': row['student_name'],
                'student_age': row['student_age'],
                'date_of_examination': row['date_of_examination'].isoformat() if row['date_of_examination'] else None,
                'therapist_name': row['therapist_name'] or 'Логопед',
                'diagnosis': row['diagnosis'] or 'Логопедическое заключение',
                'recommendations': row['recommendations'] or 'Рекомендации по результатам диагностики',
                'report_content': row['report_content'] or f'Логопедическое заключение для {row["student_name"]}',
                'access_token': row['access_token'] or '',
                'report_link': f'/diag/{row["id"]}',  # Формируем ссылку по ID
                'created_at': row['created_at'].isoformat() if row['created_at'] else None,
                'updated_at': row['updated_at'].isoformat() if row['updated_at'] else None
            })
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(reports),
            'isBase64Encoded': False
        }
    
    except Exception as e:
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