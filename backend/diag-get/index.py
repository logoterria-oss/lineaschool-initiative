import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: Получение заключения по ID из базы данных
    Args: event - dict с httpMethod, queryStringParameters; context - объект с request_id
    Returns: HTTP response dict с данными заключения
    """
    method: str = event.get('httpMethod', 'GET')
    
    # Обработка CORS OPTIONS запроса
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
    
    # Получаем ID заключения из параметров запроса
    query_params = event.get('queryStringParameters', {}) or {}
    report_id = query_params.get('id')
    
    if not report_id:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Параметр id обязателен'}),
            'isBase64Encoded': False
        }
    
    try:
        report_id = int(report_id)
    except ValueError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'ID должен быть числом'}),
            'isBase64Encoded': False
        }
    
    # Подключение к базе данных
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Поиск заключения по ID
        cursor.execute("""
            SELECT id, student_name, student_age, date_of_examination, therapist_name,
                   diagnosis, recommendations, report_content, form_data, created_at
            FROM speech_therapy_reports 
            WHERE id = %s
        """, (report_id,))
        
        result = cursor.fetchone()
        
        if not result:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Заключение не найдено'}),
                'isBase64Encoded': False
            }
        
        # Парсим данные формы
        try:
            form_data = json.loads(result['form_data']) if result['form_data'] else {}
        except json.JSONDecodeError:
            form_data = {}
        
        # Формируем ответ
        response_data = {
            'success': True,
            'report': {
                'id': result['id'],
                'student_name': result['student_name'],
                'student_age': result['student_age'],
                'date_of_examination': result['date_of_examination'].isoformat() if result['date_of_examination'] else None,
                'therapist_name': result['therapist_name'],
                'diagnosis': result['diagnosis'],
                'recommendations': result['recommendations'],
                'report_content': result['report_content'],
                'created_at': result['created_at'].isoformat() if result['created_at'] else None
            },
            'form_data': form_data
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response_data),
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