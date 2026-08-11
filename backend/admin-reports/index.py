import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = 't_p93118852_lineaschool_initiati'

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
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    # GET — список, DELETE — в корзину, POST — восстановление из корзины
    if method not in ('GET', 'DELETE', 'POST'):
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

        # Удаление заключения — только для руководителя школы (Абраменко Виктория).
        # Личность проверяем по токену сессии, а не по заголовку роли:
        # заголовок можно подделать, живую сессию — нет.
        if method in ('DELETE', 'POST'):
            token = headers.get('X-Auth-Token', headers.get('x-auth-token', ''))
            allowed = False
            who = ''
            if token:
                cursor.execute(
                    f"SELECT s.full_name, s.role, s.status "
                    f"FROM {SCHEMA}.staff_sessions ss "
                    f"JOIN {SCHEMA}.staff s ON s.id = ss.staff_id "
                    f"WHERE ss.token = %s AND ss.expires_at > now()",
                    (token,)
                )
                me = cursor.fetchone()
                if me and me['status'] == 'active' and me['role'] == 'head':
                    who = (me['full_name'] or '').strip()
                    allowed = 'абраменко' in who.lower()

            if not allowed:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Удалять заключения может только руководитель школы Абраменко Виктория'}),
                    'isBase64Encoded': False
                }

            params = event.get('queryStringParameters') or {}
            raw_id = str(params.get('id') or '').strip()
            if not raw_id.isdigit():
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Не указан корректный номер заключения'}),
                    'isBase64Encoded': False
                }

            if method == 'POST':
                # Восстановление из корзины
                cursor.execute(
                    f'UPDATE {SCHEMA}.speech_therapy_reports '
                    f'SET archived_at = NULL, archived_by = NULL WHERE id = %s',
                    (int(raw_id),)
                )
                restored = cursor.rowcount if cursor.rowcount and cursor.rowcount > 0 else 0
                conn.commit()
                cursor.close()
                conn.close()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'restored': restored}),
                    'isBase64Encoded': False
                }

            # Не стираем запись, а прячем в корзину — её можно восстановить
            cursor.execute(
                f'UPDATE {SCHEMA}.speech_therapy_reports '
                f'SET archived_at = NOW(), archived_by = %s '
                f'WHERE id = %s AND archived_at IS NULL',
                (who, int(raw_id))
            )
            deleted = cursor.rowcount if cursor.rowcount and cursor.rowcount > 0 else 0
            conn.commit()
            cursor.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'deleted': deleted}),
                'isBase64Encoded': False
            }

        # Корзина: список заключений, убранных из общего списка
        params = event.get('queryStringParameters') or {}
        if str(params.get('archived') or '') == '1':
            cursor.execute(f"""
                SELECT id, student_name, date_of_examination, therapist_name,
                       COALESCE(diag_type, 'primary') AS diag_type,
                       archived_at, archived_by
                FROM {SCHEMA}.speech_therapy_reports
                WHERE archived_at IS NOT NULL
                ORDER BY archived_at DESC
            """)
            items = []
            for r in cursor.fetchall():
                items.append({
                    'id': r['id'],
                    'student_name': r['student_name'],
                    'date_of_examination': r['date_of_examination'].isoformat() if r['date_of_examination'] else None,
                    'therapist_name': r['therapist_name'],
                    'diag_type': r['diag_type'],
                    'archived_at': r['archived_at'].isoformat() if r['archived_at'] else None,
                    'archived_by': r['archived_by'] or '',
                })
            cursor.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'reports': items, 'count': len(items)}),
                'isBase64Encoded': False
            }

        # Получаем все заключения из БД с сортировкой по дате создания
        # ВАЖНО: form_data целиком не тянем — там лежат фото работ (десятки МБ).
        # Из него нужно единственное поле logopedist, достаём его в самой БД.
        cursor.execute("""
            SELECT id, student_name, student_age, date_of_examination, 
                   therapist_name, created_at, access_token,
                   COALESCE(diag_type, 'primary') AS diag_type,
                   NULLIF(BTRIM(COALESCE(form_data::jsonb ->> 'logopedist', '')), '') AS logopedist
            FROM t_p93118852_lineaschool_initiati.speech_therapy_reports 
            WHERE archived_at IS NULL
            ORDER BY created_at DESC
        """)
        
        reports = cursor.fetchall()
        
        # Преобразуем результат в список словарей
        reports_list = []
        for report in reports:
            # Реальное имя диагноста хранится в form_data.logopedist,
            # а therapist_name — служебное значение (обычно "Логопед").
            therapist = report.get('logopedist') or report['therapist_name']
            dtype = report.get('diag_type') or 'primary'
            # У промежуточной диагностики своя страница заключения
            url_prefix = 'interim_diag' if dtype == 'interim' else 'diag'
            reports_list.append({
                'id': report['id'],
                'student_name': report['student_name'],
                'student_age': report['student_age'],
                'date_of_examination': report['date_of_examination'].isoformat() if report['date_of_examination'] else None,
                'therapist_name': therapist,
                'diag_type': dtype,
                'created_at': report['created_at'].isoformat() if report['created_at'] else None,
                'report_url': f"/{url_prefix}/{report['id']}"
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