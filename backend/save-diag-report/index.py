import json
import os
import secrets
from typing import Dict, Any
from datetime import datetime
import psycopg2

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: Сохранение логопедического заключения в БД
    Args: event - dict с httpMethod, body (JSON с данными заключения)
          context - объект с request_id
    Returns: HTTP response dict с id созданного заключения
    """
    method: str = event.get('httpMethod', 'POST')
    
    # Обработка CORS OPTIONS запроса
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
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
    
    # Парсим body
    try:
        body_data = json.loads(event.get('body', '{}'))
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Неверный формат JSON'}),
            'isBase64Encoded': False
        }
    
    # Извлекаем данные
    student_name = body_data.get('student_name', 'Не указано')
    student_age = body_data.get('student_age')
    date_of_examination = body_data.get('date_of_examination', datetime.now().date().isoformat())
    therapist_name = body_data.get('therapist_name', 'Логопед')
    diagnosis = body_data.get('diagnosis', '')
    recommendations = body_data.get('recommendations', '')
    report_content = body_data.get('report_content', '')
    form_data = body_data.get('form_data', {})
    diag_type = body_data.get('diag_type', 'primary')
    if diag_type not in ('primary', 'interim'):
        diag_type = 'primary'
    
    # Если пришёл report_id — обновляем существующее заключение,
    # иначе создаём новое. Так работает кнопка «Изменить» в админке.
    raw_id = body_data.get('report_id')
    try:
        report_id = int(raw_id) if raw_id not in (None, '') else None
    except (TypeError, ValueError):
        report_id = None

    # Генерируем токен доступа
    access_token = secrets.token_urlsafe(32)

    SCHEMA = 't_p93118852_lineaschool_initiati'

    def gen_public_code(cur) -> str:
        """6-значный код для публичной ссылки. Подбираем свободный."""
        for _ in range(50):
            code = ''.join(secrets.choice('0123456789') for _ in range(6))
            cur.execute(
                f"SELECT 1 FROM {SCHEMA}.speech_therapy_reports WHERE public_code = %s",
                (code,)
            )
            if not cur.fetchone():
                return code
        return ''.join(secrets.choice('0123456789') for _ in range(6))
    
    # Подключение к базе данных
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'], connect_timeout=5)
        cursor = conn.cursor()

        if report_id:
            # Обновляем запись, сохраняя прежний токен доступа,
            # чтобы уже разосланные ссылки на заключение продолжали работать
            cursor.execute("""
                UPDATE t_p93118852_lineaschool_initiati.speech_therapy_reports
                SET student_name = %s,
                    student_age = %s,
                    date_of_examination = %s,
                    therapist_name = %s,
                    diagnosis = %s,
                    recommendations = %s,
                    report_content = %s,
                    form_data = %s,
                    diag_type = %s,
                    updated_at = NOW()
                WHERE id = %s AND archived_at IS NULL
                RETURNING id, access_token, public_code
            """, (
                student_name,
                student_age,
                date_of_examination,
                therapist_name,
                diagnosis,
                recommendations,
                report_content,
                json.dumps(form_data),
                diag_type,
                report_id
            ))
            row = cursor.fetchone()
            if not row:
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
            conn.commit()
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'id': row[0],
                    'access_token': row[1],
                    'public_code': row[2],
                    'updated': True,
                    'message': f'Заключение #{row[0]} обновлено'
                }),
                'isBase64Encoded': False
            }

        # Новым заключениям выдаём короткий код для публичной ссылки
        public_code = gen_public_code(cursor)

        # Вставляем запись в таблицу
        cursor.execute("""
            INSERT INTO t_p93118852_lineaschool_initiati.speech_therapy_reports 
            (student_name, student_age, date_of_examination, therapist_name, 
             diagnosis, recommendations, report_content, form_data, access_token, diag_type, public_code, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            RETURNING id
        """, (
            student_name,
            student_age,
            date_of_examination,
            therapist_name,
            diagnosis,
            recommendations,
            report_content,
            json.dumps(form_data),
            access_token,
            diag_type,
            public_code
        ))
        
        result = cursor.fetchone()
        new_id = result[0]
        
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'id': new_id,
                'access_token': access_token,
                'public_code': public_code,
                'message': f'Заключение #{new_id} успешно сохранено'
            }),
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
            'body': json.dumps({
                'success': False,
                'error': f'Ошибка сохранения: {str(e)}'
            }),
            'isBase64Encoded': False
        }
    
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()