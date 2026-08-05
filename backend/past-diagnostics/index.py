import json
import os
import secrets
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = 't_p93118852_lineaschool_initiati'

CORS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

METRICS = [
    'readingSpeed',
    'readingComprehension',
    'dysgraphicErrors',
    'dysorthographicErrors',
    'totalErrors',
]


def _levels_to_primary_fields(levels: Dict[str, str]) -> Dict[str, Any]:
    """Раскладывает уровни процессов по полям первичной диагностики,
    чтобы форма подтянула их как значения «было»."""
    out: Dict[str, Any] = {}

    for key, field in (
        ('wordUnderstanding', 'wordUnderstanding'),
        ('complexConstructions', 'complexConstructions'),
        ('phonematicPerception', 'phonematicPerception'),
        ('grammaticalStructure', 'grammaticalStructure'),
    ):
        if levels.get(key):
            out[field] = levels[key]

    motor = []
    if levels.get('soundProduction'):
        motor.append(f"звукопроизношение нарушено: {levels['soundProduction']}")
    if levels.get('syllableStructure'):
        motor.append(f"слоговая структура слова нарушена: {levels['syllableStructure']}")
    if levels.get('kineticPraxis'):
        motor.append(f"кинетический артикуляционный праксис нарушен: {levels['kineticPraxis']}")
    if motor:
        out['motorRealization'] = motor

    if levels.get('connectedSpeech'):
        out['connectedSpeech'] = [f"связная речь нарушена: {levels['connectedSpeech']}"]

    analysis = []
    if levels.get('phonematicAnalysis'):
        analysis.append(f"фонематический анализ и синтез: {levels['phonematicAnalysis']}")
    if levels.get('syllableAnalysis'):
        analysis.append(f"слоговой анализ: {levels['syllableAnalysis']}")
    if levels.get('sentenceAnalysis'):
        analysis.append(f"анализ на уровне предложения: {levels['sentenceAnalysis']}")
    if analysis:
        out['languageAnalysis'] = analysis

    return out


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: Результаты прошлых промежуточных диагностик ученика — список, добавление,
    изменение и удаление. Нужны для построения цепочки динамики показателей.
    Args: event - dict с httpMethod, queryStringParameters (name), body (action, id, ...)
          context - объект с request_id
    Returns: HTTP response dict со списком записей или результатом операции
    """
    method: str = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': '', 'isBase64Encoded': False}

    conn = psycopg2.connect(os.environ['DATABASE_URL'], connect_timeout=5)
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            name = (params.get('name') or '').strip()
            if not name:
                return _bad('Не указано имя ученика')

            cursor.execute(
                f"""
                SELECT id,
                       diag_type,
                       date_of_examination,
                       COALESCE(form_data::jsonb ->> 'childName', student_name) AS child_name,
                       form_data::jsonb ->> 'readingSpeed'          AS reading_speed,
                       form_data::jsonb ->> 'readingComprehension'  AS reading_comprehension,
                       form_data::jsonb ->> 'dysgraphicErrors'      AS dysgraphic_errors,
                       form_data::jsonb ->> 'dysorthographicErrors' AS dysorthographic_errors,
                       form_data::jsonb ->> 'totalErrors'           AS total_errors,
                       COALESCE(
                           form_data::jsonb ->> 'interimReadingChar',
                           form_data::jsonb ->> 'manualReadingChar'
                       ) AS reading_char,
                       form_data::jsonb -> 'interimLevels' AS levels
                FROM {SCHEMA}.speech_therapy_reports
                WHERE lower(COALESCE(form_data::jsonb ->> 'childName', student_name)) = lower(%s)
                ORDER BY date_of_examination ASC, id ASC
                """,
                (name,),
            )
            items = [
                {
                    'id': r['id'],
                    'diagType': r['diag_type'] or 'interim',
                    'date': r['date_of_examination'].isoformat() if r['date_of_examination'] else None,
                    'readingSpeed': r['reading_speed'] or '',
                    'readingComprehension': r['reading_comprehension'] or '',
                    'dysgraphicErrors': r['dysgraphic_errors'] or '',
                    'dysorthographicErrors': r['dysorthographic_errors'] or '',
                    'totalErrors': r['total_errors'] or '',
                    'readingChar': r['reading_char'] or '',
                    'levels': r['levels'] if isinstance(r['levels'], dict) else {},
                }
                for r in cursor.fetchall()
            ]
            return _ok({'items': items})

        body = json.loads(event.get('body') or '{}')
        action = body.get('action')

        if action == 'create':
            name = (body.get('name') or '').strip()
            date = (body.get('date') or '').strip()
            if not name or not date:
                return _bad('Нужны имя ученика и дата диагностики')

            diag_type = 'primary' if body.get('diagType') == 'primary' else 'interim'
            reading_char = body.get('readingChar') or ''

            levels = body.get('levels') or {}
            if not isinstance(levels, dict):
                levels = {}

            form_data = {
                'childName': name,
                'birthDate': body.get('birthDate') or '',
                'grade': body.get('grade') or '',
                'manualEntry': True,
                'interimReadingChar': reading_char,
                'interimLevels': levels,
            }
            if diag_type == 'primary':
                # Для первичной характер чтения читается из readingSkill
                form_data['readingSkill'] = [reading_char] if reading_char else []
                form_data['manualReadingChar'] = reading_char
                form_data.update(_levels_to_primary_fields(levels))
            for m in METRICS:
                form_data[m] = str(body.get(m) or '')

            label = 'Первичная диагностика' if diag_type == 'primary' else 'Промежуточная диагностика'

            cursor.execute(
                f"""
                INSERT INTO {SCHEMA}.speech_therapy_reports
                    (student_name, date_of_examination, therapist_name, diagnosis,
                     recommendations, report_content, form_data, access_token, diag_type, created_at)
                VALUES (%s, %s, %s, '', '', %s, %s, %s, %s, NOW())
                RETURNING id
                """,
                (
                    name,
                    date,
                    body.get('logopedist') or 'Логопед',
                    f'{label} (внесена вручную)',
                    json.dumps(form_data),
                    secrets.token_urlsafe(32),
                    diag_type,
                ),
            )
            new_id = cursor.fetchone()['id']
            conn.commit()
            return _ok({'id': new_id})

        if action == 'update':
            rid = body.get('id')
            date = (body.get('date') or '').strip()
            if not rid or not date:
                return _bad('Нужны идентификатор записи и дата')

            reading_char = body.get('readingChar') or ''
            levels = body.get('levels') or {}
            if not isinstance(levels, dict):
                levels = {}

            patch = {'interimReadingChar': reading_char, 'interimLevels': levels}
            if body.get('diagType') == 'primary':
                patch['readingSkill'] = [reading_char] if reading_char else []
                patch['manualReadingChar'] = reading_char
                patch.update(_levels_to_primary_fields(levels))
            for m in METRICS:
                patch[m] = str(body.get(m) or '')

            cursor.execute(
                f"""
                UPDATE {SCHEMA}.speech_therapy_reports
                SET date_of_examination = %s,
                    form_data = (COALESCE(form_data::jsonb, '{{}}'::jsonb) || %s::jsonb)::text
                WHERE id = %s
                """,
                (date, json.dumps(patch), int(rid)),
            )
            conn.commit()
            return _ok({'updated': cursor.rowcount})

        if action == 'delete':
            rid = body.get('id')
            if not rid:
                return _bad('Нужен идентификатор записи')
            cursor.execute(
                f"DELETE FROM {SCHEMA}.speech_therapy_reports WHERE id = %s",
                (int(rid),),
            )
            conn.commit()
            return _ok({'deleted': cursor.rowcount})

        return _bad('Неизвестное действие')

    finally:
        cursor.close()
        conn.close()


def _ok(payload: Dict[str, Any]) -> Dict[str, Any]:
    data = {'success': True}
    data.update(payload)
    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(data), 'isBase64Encoded': False}


def _bad(message: str) -> Dict[str, Any]:
    return {
        'statusCode': 400,
        'headers': CORS,
        'body': json.dumps({'success': False, 'error': message}),
        'isBase64Encoded': False,
    }