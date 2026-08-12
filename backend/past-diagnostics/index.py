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
    'dictationWords',
    'dysgraphicErrors',
    'dysorthographicErrors',
    'totalErrors',
]


READING_ERROR_CATALOG = [
    'пропуск, перестановка, замены букв/слогов/слов при чтении',
    'аграмматизмы при чтении',
    'ошибки угадывающего чтения',
    'затруднения в припоминании букв',
    'зеркальность чтения букв и/или слов',
]

DYSGRAPHIC_GROUP_FIELDS = [
    'analysisErrors',
    'acousticErrors',
    'motorErrors',
    'visualMotorErrors',
    'visualSpatialErrors',
    'regulationViolations',
]


def _clean_list(raw: Any) -> list:
    """Убирает пустые значения, «нет» и дубли, сохраняя порядок."""
    seen = set()
    out = []
    for x in raw or []:
        label = str(x or '').strip()
        low = label.lower()
        if not label or low == 'нет' or low in seen:
            continue
        seen.add(low)
        out.append(label)
    return out


def _reading_errors_from_primary(fd: Dict[str, Any]) -> list:
    catalog = {x.lower() for x in READING_ERROR_CATALOG}
    return _clean_list(
        [x for x in (fd.get('readingSkill') or []) if str(x or '').strip().lower() in catalog]
    )


def _dysgraphic_from_primary(fd: Dict[str, Any]) -> list:
    items = []
    for field in DYSGRAPHIC_GROUP_FIELDS:
        items.extend(fd.get(field) or [])
    return _clean_list(items)


def _ortho_from_primary(fd: Dict[str, Any]) -> list:
    items = list(fd.get('orthographicErrorTypes') or [])
    other = str(fd.get('orthographicErrorsOther') or '')
    items.extend([s for s in other.split(',')])
    return _clean_list(items)


def _error_lists_patch(body: Dict[str, Any], diag_type: str) -> Dict[str, Any]:
    """Готовит поля со списками типов ошибок для сохранения."""
    reading = _clean_list(body.get('readingErrorTypes'))
    dysgraphic = _clean_list(body.get('errorTypes'))
    ortho = _clean_list(body.get('orthoErrorTypes'))

    out: Dict[str, Any] = {
        'interimReadingErrorTypes': reading,
        'interimErrorTypes': dysgraphic,
        'interimOrthoErrorTypes': ortho,
    }

    if diag_type == 'primary':
        # У первичной ошибки чтения лежат вместе с характером чтения
        char = str(body.get('readingChar') or '').strip()
        out['readingSkill'] = ([char] if char else []) + reading
        # Все дисграфические кладём в одну группу, остальные очищаем,
        # чтобы не задваивать при обратном разборе
        out['analysisErrors'] = dysgraphic
        for field in DYSGRAPHIC_GROUP_FIELDS[1:]:
            out[field] = []
        out['orthographicErrorTypes'] = ortho
        out['orthographicErrorsOther'] = ''

    return out


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


LEVEL_WORDS = (
    ('грубо', 'грубо нарушено'),
    ('приближ', 'приближено к возрастной норме'),
    ('не соответствует', 'не соответствует возрастной норме'),
    ('не сформиров', 'не соответствует возрастной норме'),
    ('нарушен', 'не соответствует возрастной норме'),
)


def _match_level(text: str) -> str:
    """Приводит произвольную формулировку первичной к одному из 4 уровней."""
    s = (text or '').strip().lower()
    if not s:
        return ''
    for word, level in LEVEL_WORDS:
        if word in s:
            return level
    if 'норма' in s:
        return 'норма'
    return 'не соответствует возрастной норме'


def _level_from_list(items: Any, keyword: str) -> str:
    if not isinstance(items, list):
        return ''
    for x in items:
        if keyword in str(x).lower():
            return _match_level(str(x))
    return ''


def _levels_from_primary(fd: Dict[str, Any]) -> Dict[str, str]:
    """Собирает уровни процессов из полей настоящей первичной диагностики."""
    out: Dict[str, str] = {}

    for key in ('wordUnderstanding', 'complexConstructions', 'phonematicPerception',
                'grammaticalStructure'):
        lvl = _match_level(str(fd.get(key) or ''))
        if lvl:
            out[key] = lvl

    motor = fd.get('motorRealization')
    for key, kw in (
        ('soundProduction', 'звукопроизношение'),
        ('syllableStructure', 'слоговая структура'),
        ('kineticPraxis', 'кинетическ'),
    ):
        lvl = _level_from_list(motor, kw)
        if lvl:
            out[key] = lvl

    lvl = _level_from_list(fd.get('connectedSpeech'), 'связн')
    if not lvl:
        lvl = _level_from_list(fd.get('connectedSpeech'), 'нарушен')
    if lvl:
        out['connectedSpeech'] = lvl

    la = fd.get('languageAnalysis')
    for key, kw in (
        ('phonematicAnalysis', 'фонематическ'),
        ('syllableAnalysis', 'слогов'),
        ('sentenceAnalysis', 'предложен'),
    ):
        lvl = _level_from_list(la, kw)
        if lvl:
            out[key] = lvl

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
                       public_code,
                       diag_type,
                       date_of_examination,
                       COALESCE(form_data::jsonb ->> 'childName', student_name) AS child_name,
                       form_data::jsonb ->> 'readingSpeed'          AS reading_speed,
                       form_data::jsonb ->> 'readingComprehension'  AS reading_comprehension,
                       form_data::jsonb ->> 'dictationWords'        AS dictation_words,
                       form_data::jsonb ->> 'dysgraphicErrors'      AS dysgraphic_errors,
                       form_data::jsonb ->> 'dysorthographicErrors' AS dysorthographic_errors,
                       form_data::jsonb ->> 'totalErrors'           AS total_errors,
                       COALESCE(
                           form_data::jsonb ->> 'interimReadingChar',
                           form_data::jsonb ->> 'manualReadingChar'
                       ) AS reading_char,
                       form_data::jsonb -> 'interimLevels' AS levels,
                       COALESCE(form_data::jsonb ->> 'excludedFromDynamics', 'false') AS excluded,
                       form_data::jsonb AS fd
                FROM {SCHEMA}.speech_therapy_reports
                WHERE lower(COALESCE(form_data::jsonb ->> 'childName', student_name)) = lower(%s)
                  AND archived_at IS NULL
                ORDER BY date_of_examination ASC, id ASC
                """,
                (name,),
            )
            items = []
            for r in cursor.fetchall():
                fd = r['fd'] if isinstance(r['fd'], dict) else {}
                levels = r['levels'] if isinstance(r['levels'], dict) else {}
                # У настоящей первичной уровни лежат в её собственных полях —
                # разбираем их, чтобы логопед мог отредактировать
                if not levels:
                    levels = _levels_from_primary(fd)

                reading_char = r['reading_char'] or ''
                if not reading_char and isinstance(fd.get('readingSkill'), list):
                    reading_char = next(
                        (str(x) for x in fd['readingSkill'] if str(x).strip()), ''
                    )

                # Списки типов ошибок: свои поля вручную внесённых записей,
                # иначе разбираем поля настоящей первичной
                reading_errs = fd.get('interimReadingErrorTypes')
                if not isinstance(reading_errs, list):
                    reading_errs = _reading_errors_from_primary(fd)

                dysgraphic_types = fd.get('interimErrorTypes')
                if not isinstance(dysgraphic_types, list):
                    dysgraphic_types = _dysgraphic_from_primary(fd)

                ortho_types = fd.get('interimOrthoErrorTypes')
                if not isinstance(ortho_types, list):
                    ortho_types = _ortho_from_primary(fd)

                items.append({
                    'readingErrorTypes': _clean_list(reading_errs),
                    'errorTypes': _clean_list(dysgraphic_types),
                    'orthoErrorTypes': _clean_list(ortho_types),
                    'id': r['id'],
                    # Код для публичной ссылки; у старых заключений его нет
                    'publicCode': r['public_code'],
                    'diagType': r['diag_type'] or 'interim',
                    'date': r['date_of_examination'].isoformat() if r['date_of_examination'] else None,
                    'readingSpeed': r['reading_speed'] or '',
                    'readingComprehension': r['reading_comprehension'] or '',
                    'dictationWords': r['dictation_words'] or '',
                    'dysgraphicErrors': r['dysgraphic_errors'] or '',
                    'dysorthographicErrors': r['dysorthographic_errors'] or '',
                    'totalErrors': r['total_errors'] or '',
                    'readingChar': reading_char,
                    'levels': levels,
                    'excluded': str(r['excluded']).lower() == 'true',
                })
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
            form_data.update(_error_lists_patch(body, diag_type))
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
            patch.update(_error_lists_patch(body, body.get('diagType') or 'interim'))
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
            # ВАЖНО: это НЕ удаление заключения из базы.
            # Логопед лишь исключает диагностику из цепочки динамики этого ребёнка.
            # Само заключение остаётся в кабинете и открывается по своей ссылке.
            rid = body.get('id')
            if not rid:
                return _bad('Нужен идентификатор записи')
            cursor.execute(
                f"""
                UPDATE {SCHEMA}.speech_therapy_reports
                SET form_data = (
                        COALESCE(form_data::jsonb, '{{}}'::jsonb)
                        || '{{"excludedFromDynamics": true}}'::jsonb
                    )::text
                WHERE id = %s
                """,
                (int(rid),),
            )
            conn.commit()
            return _ok({'excluded': max(cursor.rowcount, 0)})

        if action == 'include':
            # Вернуть диагностику в цепочку динамики
            rid = body.get('id')
            if not rid:
                return _bad('Нужен идентификатор записи')
            cursor.execute(
                f"""
                UPDATE {SCHEMA}.speech_therapy_reports
                SET form_data = (
                        COALESCE(form_data::jsonb, '{{}}'::jsonb) - 'excludedFromDynamics'
                    )::text
                WHERE id = %s
                """,
                (int(rid),),
            )
            conn.commit()
            return _ok({'included': max(cursor.rowcount, 0)})

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