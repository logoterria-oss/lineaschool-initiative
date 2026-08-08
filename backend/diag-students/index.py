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
        conn = psycopg2.connect(os.environ['DATABASE_URL'], connect_timeout=3)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Берём самое свежее первичное заключение по каждому ребёнку
        cursor.execute("""
            WITH latest AS (
                SELECT DISTINCT ON (student_name)
                       id,
                       student_name,
                       date_of_examination,
                       form_data::jsonb AS fd
                FROM t_p93118852_lineaschool_initiati.speech_therapy_reports
                WHERE COALESCE(diag_type, 'primary') = 'primary' AND archived_at IS NULL
                  AND COALESCE(form_data::jsonb ->> 'excludedFromDynamics', 'false') <> 'true'
                ORDER BY student_name, date_of_examination DESC, id DESC
            )
            SELECT id,
                   student_name,
                   date_of_examination,
                   fd ->> 'childName'  AS child_name,
                   fd ->> 'birthDate'  AS birth_date,
                   fd ->> 'grade'      AS grade,
                   fd ->> 'wordUnderstanding'    AS word_understanding,
                   fd ->> 'complexConstructions' AS complex_constructions,
                   fd ->> 'phonematicPerception' AS phonematic_perception,
                   fd ->> 'grammaticalStructure' AS grammatical_structure,
                   fd -> 'motorRealization'  AS motor_realization,
                   fd -> 'connectedSpeech'   AS connected_speech,
                   fd -> 'languageAnalysis'  AS language_analysis,
                   fd -> 'dysgraphiaTypes'   AS dysgraphia_types,
                   fd -> 'speechDisorders'   AS speech_disorders,
                   fd -> 'dyslexiaTypes'     AS dyslexia_types,
                   fd -> 'brainSyndromes'    AS brain_syndromes,
                   fd ->> 'soundProductionType'  AS sound_production_type,
                   fd -> 'languageAnalysisTypes' AS language_analysis_types,
                   fd ->> 'readingSpeed'         AS reading_speed,
                   fd ->> 'readingComprehension' AS reading_comprehension,
                   fd ->> 'dictationWords'       AS dictation_words,
                   fd ->> 'dysgraphicErrors'     AS dysgraphic_errors,
                   fd ->> 'dysorthographicErrors' AS dysorthographic_errors,
                   fd ->> 'totalErrors'          AS total_errors,
                   fd -> 'analysisErrors'        AS analysis_errors,
                   fd -> 'acousticErrors'        AS acoustic_errors,
                   fd -> 'motorErrors'           AS motor_errors,
                   fd -> 'visualMotorErrors'     AS visual_motor_errors,
                   fd -> 'visualSpatialErrors'   AS visual_spatial_errors,
                   fd -> 'regulationViolations'  AS regulation_violations,
                   fd -> 'orthographicErrorTypes' AS orthographic_error_types,
                   fd ->> 'orthographicErrorsOther' AS orthographic_errors_other,
                   fd -> 'readingSkill'           AS reading_skill
            FROM latest
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
                    'dictationWords': r.get('dictation_words') or '',
                    'dictationWords': r.get('dictation_words') or '',
                'dysgraphicErrors': r.get('dysgraphic_errors') or '',
                    'dysorthographicErrors': r.get('dysorthographic_errors') or '',
                    'totalErrors': r.get('total_errors') or '',
                    'analysisErrors': as_list(r.get('analysis_errors')),
                    'acousticErrors': as_list(r.get('acoustic_errors')),
                    'motorErrors': as_list(r.get('motor_errors')),
                    'visualMotorErrors': as_list(r.get('visual_motor_errors')),
                    'visualSpatialErrors': as_list(r.get('visual_spatial_errors')),
                    'regulationViolations': as_list(r.get('regulation_violations')),
                    'orthographicErrorTypes': as_list(r.get('orthographic_error_types')),
                    'orthographicErrorsOther': r.get('orthographic_errors_other') or '',
                    'readingSkill': as_list(r.get('reading_skill')),
                },
            })

        # История промежуточных диагностик (для цепочки динамики), связка по ФИО
        cursor.execute("""
            SELECT student_name,
                   date_of_examination,
                   form_data::jsonb ->> 'childName' AS child_name,
                   form_data::jsonb -> 'interimLevels'         AS interim_levels,
                   form_data::jsonb ->> 'readingSpeed'         AS reading_speed,
                   form_data::jsonb ->> 'readingComprehension' AS reading_comprehension,
                   form_data::jsonb ->> 'dictationWords'       AS dictation_words,
                   form_data::jsonb ->> 'dysgraphicErrors'     AS dysgraphic_errors,
                   form_data::jsonb ->> 'dysorthographicErrors' AS dysorthographic_errors,
                   form_data::jsonb ->> 'totalErrors'          AS total_errors,
                   form_data::jsonb ->> 'interimReadingChar'   AS interim_reading_char
            FROM t_p93118852_lineaschool_initiati.speech_therapy_reports
            WHERE diag_type = 'interim' AND archived_at IS NULL
              AND COALESCE(form_data::jsonb ->> 'excludedFromDynamics', 'false') <> 'true'
            ORDER BY date_of_examination ASC, id ASC
        """)

        interim_rows = cursor.fetchall()
        history_by_name = {}
        for r in interim_rows:
            nm = (r.get('child_name') or r.get('student_name') or '').strip()
            if not nm:
                continue
            key = nm.lower()
            levels = r.get('interim_levels')
            if not isinstance(levels, dict):
                levels = {}
            history_by_name.setdefault(key, []).append({
                'date': r['date_of_examination'].isoformat() if r['date_of_examination'] else None,
                'levels': levels,
                'readingSpeed': r.get('reading_speed') or '',
                'readingComprehension': r.get('reading_comprehension') or '',
                'dysgraphicErrors': r.get('dysgraphic_errors') or '',
                'dysorthographicErrors': r.get('dysorthographic_errors') or '',
                'totalErrors': r.get('total_errors') or '',
                'readingChar': r.get('interim_reading_char') or '',
            })

        for s in students:
            s['history'] = history_by_name.get(s['name'].lower(), [])

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