import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: Админ-панель для просмотра всех логопедических заключений
    Args: event - dict с httpMethod, queryStringParameters
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
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
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
        
        # Получаем все заключения из БД с сортировкой по дате создания
        cursor.execute("""
            SELECT id, student_name, student_age, date_of_examination, 
                   therapist_name, created_at, access_token,
                   COALESCE(diag_type, 'primary') AS diag_type,
                   form_data
            FROM t_p93118852_lineaschool_initiati.speech_therapy_reports 
            ORDER BY created_at DESC
        """)
        
        reports = cursor.fetchall()
        
        # Преобразуем результат в список словарей
        reports_list = []
        for report in reports:
            # Реальное имя диагноста хранится в form_data.logopedist,
            # а therapist_name — служебное значение (обычно "Логопед").
            logopedist = ''
            fd = report.get('form_data')
            if fd:
                try:
                    fd_obj = fd if isinstance(fd, dict) else json.loads(fd)
                    logopedist = (fd_obj.get('logopedist') or '').strip()
                except (json.JSONDecodeError, TypeError, AttributeError):
                    logopedist = ''
            therapist = logopedist or report['therapist_name']
            reports_list.append({
                'id': report['id'],
                'student_name': report['student_name'],
                'student_age': report['student_age'],
                'date_of_examination': report['date_of_examination'].isoformat() if report['date_of_examination'] else None,
                'therapist_name': therapist,
                'diag_type': report.get('diag_type') or 'primary',
                'created_at': report['created_at'].isoformat() if report['created_at'] else None,
                'report_url': f"/diag/{report['id']}"
            })
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'reports': reports_list,
                'total': len(reports_list)
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
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'}),
            'isBase64Encoded': False
        }
    
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()