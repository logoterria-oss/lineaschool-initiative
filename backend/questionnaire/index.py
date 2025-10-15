"""
Business: Save parent questionnaire data to database
Args: event with POST request containing questionnaire form data
Returns: Success/error response
"""

import json
import os
import psycopg2
from typing import Dict, Any


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
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
                    parent_name, parent_phone, parent_email,
                    child_name, birth_date, grade,
                    education_type, aoop_required, aoop_variant,
                    school_start_age, kindergarten,
                    prenatal_development, neurological_disorders,
                    hearing_vision_disorders, chronic_diseases,
                    speech_environment, previous_specialists,
                    speech_therapist_conclusion, neuropsychologist_conclusion,
                    defectologist_conclusion, dominant_hand
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                RETURNING id
            """, (
                body_data.get('parentName'),
                body_data.get('parentPhone'),
                body_data.get('parentEmail'),
                body_data.get('childName'),
                body_data.get('birthDate'),
                body_data.get('grade'),
                body_data.get('educationType'),
                body_data.get('aoopRequired'),
                body_data.get('aoopVariant'),
                body_data.get('schoolStartAge'),
                body_data.get('kindergarten'),
                body_data.get('prenatalDevelopment'),
                body_data.get('neurologicalDisorders'),
                body_data.get('hearingVisionDisorders'),
                body_data.get('chronicDiseases'),
                body_data.get('speechEnvironment'),
                json.dumps(body_data.get('previousSpecialists', [])),
                body_data.get('speechTherapistConclusion'),
                body_data.get('neuropsychologistConclusion'),
                body_data.get('defectologistConclusion'),
                body_data.get('dominantHand')
            ))
            
            questionnaire_id = cur.fetchone()[0]
            conn.commit()
            
            cur.close()
            conn.close()
            
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
            params = event.get('queryStringParameters', {})
            
            dsn = os.environ.get('DATABASE_URL')
            conn = psycopg2.connect(dsn)
            cur = conn.cursor()
            
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