import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: Получение логопедического заключения из БД по ID
    Args: event - dict с httpMethod, queryStringParameters (id)
          context - объект с request_id
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
    
    # Получаем ID из параметров запроса
    # Проверяем разные варианты передачи параметров
    query_params = event.get('queryStringParameters')
    params = event.get('params', {})
    
    report_id = None
    if query_params and isinstance(query_params, dict):
        report_id = query_params.get('id')
    elif params and isinstance(params, dict):
        report_id = params.get('id')
    
    if not report_id:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'ID заключения не указан',
                'debug': {
                    'queryStringParameters': query_params,
                    'params': params
                }
            }),
            'isBase64Encoded': False
        }
    
    # Подключение к базе данных
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Получаем заключение из БД
        cursor.execute("""
            SELECT id, student_name, student_age, date_of_examination, 
                   therapist_name, diagnosis, recommendations, report_content, 
                   form_data, access_token, created_at
            FROM t_p93118852_lineaschool_initiati.speech_therapy_reports 
            WHERE id = %s AND archived_at IS NULL
        """, (report_id,))
        
        report = cursor.fetchone()
        
        if not report:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': False,
                    'error': 'Заключение не найдено'
                }),
                'isBase64Encoded': False
            }
        
        # Парсим form_data если это строка
        form_data = report['form_data']
        if isinstance(form_data, str):
            try:
                form_data = json.loads(form_data)
            except json.JSONDecodeError:
                form_data = {}
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'id': report['id'],
                'student_name': report['student_name'],
                'student_age': report['student_age'],
                'date_of_examination': report['date_of_examination'].isoformat() if report['date_of_examination'] else None,
                'therapist_name': report['therapist_name'],
                'diagnosis': report['diagnosis'],
                'recommendations': report['recommendations'],
                'report_content': report['report_content'],
                'form_data': form_data,
                'created_at': report['created_at'].isoformat() if report['created_at'] else None
            }),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False,
                'error': f'Ошибка сервера: {str(e)}'
            }),
            'isBase64Encoded': False
        }
    
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()