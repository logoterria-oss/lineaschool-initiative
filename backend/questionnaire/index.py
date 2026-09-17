"""
Business: Save parent questionnaire data to database
Args: event with POST request containing questionnaire form data
Returns: Success/error response
"""

import json
import os
import re
import urllib.request
import psycopg2
from typing import Dict, Any, Optional

from form_hook import form_payload, mark_hook_result, norm_phone, send_form_hook

# API «Окна взаимодействия» — туда передаём заполненную анкету,
# чтобы она сразу легла в карточку диалога с этим родителем.
INTERACTION_API_URL = 'https://functions.poehali.dev/67e8d62d-902a-4e5e-9862-d18395a730b1'


def service_key_ok(event: Dict[str, Any]) -> bool:
    '''Служебные запросы окна ходят с тем же ключом, что и хук броней.'''
    key = os.environ.get('INTERACTION_SERVICE_KEY')
    if not key:
        return False
    headers = event.get('headers') or {}
    got = ''
    for name, value in headers.items():
        if str(name).lower() == 'x-service-key':
            got = str(value or '')
            break
    return bool(got) and got == key


def fetch_questionnaire(cur, questionnaire_id: int) -> Dict[str, Any]:
    '''Читаем сохранённую анкету целиком — отдаём ровно то, что лежит в базе.'''
    cur.execute('SELECT * FROM parent_questionnaire WHERE id = %s', (questionnaire_id,))
    row = cur.fetchone()
    if not row:
        return {}
    columns = [desc[0] for desc in cur.description]
    result = dict(zip(columns, row))
    if result.get('previous_specialists'):
        try:
            result['previous_specialists'] = json.loads(result['previous_specialists'])
        except (ValueError, TypeError):
            pass
    return result


def push_to_interaction(data: Dict[str, Any]) -> None:
    '''Передаём анкету в «Окно взаимодействия». Молча, чтобы не ломать отправку.'''
    phone = norm_phone(str(data.get('parent_phone') or ''))
    if not phone:
        return
    payload = json.dumps({
        'action': 'questionnaire',
        'phone': phone,
        'questionnaire_id': data.get('id'),
        'parent_name': data.get('parent_name'),
        'child_name': data.get('child_name'),
        'parent_email': data.get('parent_email'),
        'city': data.get('city'),
        'city_region': data.get('city_region'),
        'city_timezone': data.get('city_timezone'),
        'created_at': str(data.get('created_at') or ''),
        'answers': {k: (str(v) if hasattr(v, 'isoformat') else v) for k, v in data.items()},
    }, ensure_ascii=False, default=str).encode('utf-8')
    req = urllib.request.Request(
        f'{INTERACTION_API_URL}?action=questionnaire',
        data=payload,
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=5):
        pass


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Service-Key',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method == 'POST':
        try:
            body_data = json.loads(event.get('body', '{}'))
            
            # Connect to database
            dsn = os.environ.get('DATABASE_URL')
            conn = psycopg2.connect(dsn)
            cur = conn.cursor()
            
            # Insert questionnaire data
            cur.execute("""
                INSERT INTO parent_questionnaire (
                    parent_name, parent_phone, parent_email, city,
                    city_region, city_timezone,
                    child_name, birth_date, grade,
                    education_type, aoop_required, aoop_variant,
                    school_start_age, kindergarten,
                    prenatal_development, prenatal_no_features,
                    early_development, early_dev_no_features,
                    neurological_disorders, neurological_none,
                    hearing_vision_disorders, hearing_vision_none,
                    chronic_diseases, chronic_none,
                    speech_environment, speech_env_none,
                    previous_specialists,
                    speech_therapist_conclusion, speech_therapist_current,
                    neuropsychologist_conclusion, neuropsychologist_current,
                    defectologist_conclusion, defectologist_current,
                    other_specialist_name, other_specialist_current,
                    dominant_hand
                ) VALUES (
                    %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                RETURNING id
            """, (
                body_data.get('parentName'),
                body_data.get('parentPhone'),
                body_data.get('parentEmail'),
                body_data.get('city'),
                body_data.get('cityRegion'),
                body_data.get('cityTimezone'),
                body_data.get('childName'),
                body_data.get('birthDate'),
                body_data.get('grade'),
                body_data.get('educationType'),
                body_data.get('aoopRequired'),
                body_data.get('aoopVariant'),
                body_data.get('schoolStartAge'),
                body_data.get('kindergarten'),
                body_data.get('prenatalDevelopment'),
                body_data.get('prenatalNoFeatures', False),
                body_data.get('earlyDevelopment'),
                body_data.get('earlyDevNoFeatures', False),
                body_data.get('neurologicalDisorders'),
                body_data.get('neurologicalNone', False),
                body_data.get('hearingVisionDisorders'),
                body_data.get('hearingVisionNone', False),
                body_data.get('chronicDiseases'),
                body_data.get('chronicNone', False),
                body_data.get('speechEnvironment'),
                body_data.get('speechEnvNone', False),
                json.dumps(body_data.get('previousSpecialists', [])),
                body_data.get('speechTherapistConclusion'),
                body_data.get('speechTherapistCurrent', False),
                body_data.get('neuropsychologistConclusion'),
                body_data.get('neuropsychologistCurrent', False),
                body_data.get('defectologistConclusion'),
                body_data.get('defectologistCurrent', False),
                body_data.get('otherSpecialistName'),
                body_data.get('otherSpecialistCurrent', False),
                body_data.get('dominantHand')
            ))
            
            questionnaire_id = cur.fetchone()[0]
            conn.commit()

            # Передаём анкету в «Окно взаимодействия» — до закрытия соединения,
            # чтобы отдать полную запись из базы, а не только присланные поля.
            saved = fetch_questionnaire(cur, questionnaire_id)
            cur.close()

            # Хук в «Окно взаимодействия»: сотрудник сразу видит ссылку на анкету
            # в чате клиента. Не дошло — анкета останется в ?action=feed&status=new.
            try:
                hook_result = send_form_hook(saved)
                mark_hook_result(conn, questionnaire_id, hook_result)
            except Exception as e:
                print(f'form-hook failed: {e}')

            conn.close()

            try:
                push_to_interaction(saved)
            except Exception:
                pass

            try:
                import urllib.request
                import urllib.error
                
                notify_url = 'https://functions.poehali.dev/957d6d4e-5dc3-4156-a1b0-94574bf07719'
                notify_data = json.dumps({'questionnaire_id': questionnaire_id}).encode('utf-8')
                notify_req = urllib.request.Request(
                    notify_url,
                    data=notify_data,
                    headers={'Content-Type': 'application/json'}
                )
                
                with urllib.request.urlopen(notify_req, timeout=5) as response:
                    pass
            except Exception:
                pass

            # Обновляем примечание лида в CRM: добавляем город + часовой пояс
            try:
                import urllib.request

                crm_city_url = 'https://functions.poehali.dev/27be949a-2324-46cd-b3fa-f72058a31ddc'
                crm_payload = json.dumps({
                    'phone': body_data.get('parentPhone', ''),
                    'city': body_data.get('city', ''),
                    'region': body_data.get('cityRegion', ''),
                    'timezone': body_data.get('cityTimezone', ''),
                    'childName': body_data.get('childName', ''),
                    'parentName': body_data.get('parentName', ''),
                }).encode('utf-8')
                crm_req = urllib.request.Request(
                    crm_city_url,
                    data=crm_payload,
                    headers={'Content-Type': 'application/json'}
                )
                with urllib.request.urlopen(crm_req, timeout=25) as response:
                    pass
            except Exception:
                pass
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'id': questionnaire_id, 'message': 'Анкета успешно сохранена'})
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
    
    if method == 'GET':
        try:
            params = event.get('queryStringParameters', {}) or {}

            # Страховочная выгрузка для «Окна взаимодействия»: если хук не дошёл,
            # окно само забирает анкеты. status=new — те, что ещё не забирали.
            if params.get('action') == 'feed':
                if not service_key_ok(event):
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json'},
                        'body': json.dumps({'error': 'unauthorized'}),
                    }

                status = params.get('status') or 'new'
                dsn = os.environ.get('DATABASE_URL')
                conn = psycopg2.connect(dsn)
                cur = conn.cursor()

                where = 'WHERE interaction_sent_at IS NULL' if status == 'new' else ''
                cur.execute(f"""
                    SELECT id, parent_name, child_name, parent_phone
                    FROM parent_questionnaire
                    {where}
                    ORDER BY id
                    LIMIT 200
                """)
                columns = [desc[0] for desc in cur.description]
                forms = [form_payload(dict(zip(columns, row))) for row in cur.fetchall()]

                # Отдали — значит забрали: помечаем, чтобы не приходили повторно.
                if status == 'new' and forms:
                    cur.execute(
                        """
                        UPDATE parent_questionnaire
                        SET interaction_sent_at = CURRENT_TIMESTAMP
                        WHERE id = ANY(%s)
                        """,
                        ([int(f['id']) for f in forms],),
                    )
                    conn.commit()

                cur.close()
                conn.close()

                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'forms': forms}, ensure_ascii=False),
                }

            dsn = os.environ.get('DATABASE_URL')
            conn = psycopg2.connect(dsn)
            cur = conn.cursor()
            
            # Анкета по телефону родителя — так «Окно взаимодействия»
            # подтягивает анкету к нужному диалогу.
            if params.get('phone'):
                wanted = norm_phone(params.get('phone'))
                cur.execute("""
                    SELECT * FROM parent_questionnaire
                    ORDER BY created_at DESC
                """)
                columns = [desc[0] for desc in cur.description]
                found = None
                for row in cur.fetchall():
                    rec = dict(zip(columns, row))
                    if norm_phone(str(rec.get('parent_phone') or '')) == wanted:
                        found = rec
                        break
                cur.close()
                conn.close()

                if not found:
                    return {
                        'statusCode': 404,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'message': 'Анкета не найдена'})
                    }

                if found.get('previous_specialists'):
                    try:
                        found['previous_specialists'] = json.loads(found['previous_specialists'])
                    except (ValueError, TypeError):
                        pass

                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps(found, default=str)
                }

            # Get all responses
            if params.get('all') == 'true':
                cur.execute("""
                    SELECT id, child_name, parent_name, parent_phone, parent_email, 
                           birth_date, grade, created_at
                    FROM parent_questionnaire
                    ORDER BY created_at DESC
                """)
                
                rows = cur.fetchall()
                columns = [desc[0] for desc in cur.description]
                results = [dict(zip(columns, row)) for row in rows]
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps(results, default=str)
                }
            
            # Get single response by ID
            if params.get('id'):
                cur.execute("""
                    SELECT * FROM parent_questionnaire
                    WHERE id = %s
                """, (params.get('id'),))
                
                row = cur.fetchone()
                
                if row:
                    columns = [desc[0] for desc in cur.description]
                    result = dict(zip(columns, row))
                    
                    if result.get('previous_specialists'):
                        result['previous_specialists'] = json.loads(result['previous_specialists'])
                    
                    cur.close()
                    conn.close()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps(result, default=str)
                    }
                else:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 404,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'message': 'Данные не найдены'})
                    }
            
            # Search by child name
            child_name = params.get('childName', '')
            
            if not child_name:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'childName parameter required'})
                }
            
            cur.execute("""
                SELECT * FROM parent_questionnaire
                WHERE LOWER(child_name) LIKE LOWER(%s)
                ORDER BY created_at DESC
                LIMIT 1
            """, (f'%{child_name}%',))
            
            row = cur.fetchone()
            
            if row:
                columns = [desc[0] for desc in cur.description]
                result = dict(zip(columns, row))
                
                if result.get('previous_specialists'):
                    result['previous_specialists'] = json.loads(result['previous_specialists'])
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps(result, default=str)
                }
            else:
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'message': 'Данные не найдены'})
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
    
    if method == 'DELETE':
        try:
            params = event.get('queryStringParameters', {})
            response_id = params.get('id')
            
            if not response_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'id parameter required'})
                }
            
            dsn = os.environ.get('DATABASE_URL')
            conn = psycopg2.connect(dsn)
            cur = conn.cursor()
            
            cur.execute("DELETE FROM parent_questionnaire WHERE id = %s", (response_id,))
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'message': 'Анкета удалена'})
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
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Method not allowed'})
    }