import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: Список учеников с пройденной первичной диагностикой
              для автоподстановки в форме промежуточной диагностики
    Args: event - dict с httpMethod
          context - объект с request_id
    Returns: HTTP response dict со списком учеников (name, birthDate, grade, examDate)
    """
    method: str = event.get('httpMethod', 'GET')

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

    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }

    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'], connect_timeout=5)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Берём самое свежее первичное заключение по каждому ребёнку
        cursor.execute("""
            SELECT DISTINCT ON (student_name)
                   id,
                   student_name,
                   date_of_examination,
                   form_data::jsonb ->> 'childName'  AS child_name,
                   form_data::jsonb ->> 'birthDate'  AS birth_date,
                   form_data::jsonb ->> 'grade'      AS grade,
                   form_data::jsonb ->> 'wordUnderstanding'    AS word_understanding,
                   form_data::jsonb ->> 'complexConstructions' AS complex_constructions,
                   form_data::jsonb ->> 'phonematicPerception' AS phonematic_perception,
                   form_data::jsonb ->> 'grammaticalStructure' AS grammatical_structure,
                   form_data::jsonb -> 'motorRealization'  AS motor_realization,
                   form_data::jsonb -> 'connectedSpeech'   AS connected_speech,
                   form_data::jsonb -> 'languageAnalysis'  AS language_analysis,
                   form_data::jsonb -> 'dysgraphiaTypes'   AS dysgraphia_types,
                   form_data::jsonb -> 'speechDisorders'   AS speech_disorders,
                   form_data::jsonb -> 'dyslexiaTypes'     AS dyslexia_types,
                   form_data::jsonb -> 'brainSyndromes'    AS brain_syndromes,
                   form_data::jsonb ->> 'soundProductionType'  AS sound_production_type,
                   form_data::jsonb -> 'languageAnalysisTypes' AS language_analysis_types,
                   form_data::jsonb ->> 'readingSpeed'         AS reading_speed,
                   form_data::jsonb ->> 'readingComprehension' AS reading_comprehension,
                   form_data::jsonb ->> 'dysgraphicErrors'     AS dysgraphic_errors,
                   form_data::jsonb ->> 'dysorthographicErrors' AS dysorthographic_errors
            FROM t_p93118852_lineaschool_initiati.speech_therapy_reports
            WHERE COALESCE(diag_type, 'primary') = 'primary'
            ORDER BY student_name, date_of_examination DESC, id DESC
        """)

        rows = cursor.fetchall()

        def as_list(v):
            if isinstance(v, list):
                return [str(x) for x in v]
            return []

        students = []
        for r in rows:
            name = (r.get('child_name') or r.get('student_name') or '').strip()
            if not name:
                continue
            students.append({
                'id': r['id'],
                'name': name,
                'birthDate': r.get('birth_date') or '',
                'grade': r.get('grade') or '',
                'examDate': r['date_of_examination'].isoformat() if r['date_of_examination'] else None,
                'primary': {
                    'wordUnderstanding': r.get('word_understanding') or '',
                    'complexConstructions': r.get('complex_constructions') or '',
                    'phonematicPerception': r.get('phonematic_perception') or '',
                    'grammaticalStructure': r.get('grammatical_structure') or '',
                    'motorRealization': as_list(r.get('motor_realization')),
                    'connectedSpeech': as_list(r.get('connected_speech')),
                    'languageAnalysis': as_list(r.get('language_analysis')),
                    'dysgraphiaTypes': as_list(r.get('dysgraphia_types')),
                    'speechDisorders': as_list(r.get('speech_disorders')),
                    'dyslexiaTypes': as_list(r.get('dyslexia_types')),
                    'brainSyndromes': as_list(r.get('brain_syndromes')),
                    'soundProductionType': r.get('sound_production_type') or '',
                    'languageAnalysisTypes': as_list(r.get('language_analysis_types')),
                    'readingSpeed': r.get('reading_speed') or '',
                    'readingComprehension': r.get('reading_comprehension') or '',
                    'dysgraphicErrors': r.get('dysgraphic_errors') or '',
                    'dysorthographicErrors': r.get('dysorthographic_errors') or '',
                },
            })

        students.sort(key=lambda s: s['name'].lower())

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'students': students}, ensure_ascii=False),
            'isBase64Encoded': False
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': f'Ошибка сервера: {str(e)}'}),
            'isBase64Encoded': False
        }

    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()