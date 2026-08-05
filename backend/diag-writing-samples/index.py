'''
Business: Фото письменных работ (диктант) ученика — из первичной и последней
          промежуточной диагностики. Отдельный лёгкий эндпоинт: фото тяжёлые (base64),
          поэтому запрашиваются только для конкретного ученика, а не общим списком.
Args: event с queryStringParameters { name } — ФИО ученика
Returns: JSON { primary: [..base64..], interim: [..base64..], interimDate }
'''
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any, List


def _samples(fd: dict) -> List[str]:
    '''Достаёт writingSamples из form_data (для промежуточной — из вложенного снимка).'''
    if not isinstance(fd, dict):
        return []
    direct = fd.get('writingSamples')
    if isinstance(direct, list) and direct:
        return [str(x) for x in direct if x]
    rw = fd.get('interimReadingWriting')
    if isinstance(rw, dict):
        ws = rw.get('writingSamples')
        if isinstance(ws, list):
            return [str(x) for x in ws if x]
    return []


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    }
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': '', 'isBase64Encoded': False}

    params = event.get('queryStringParameters') or {}
    name = (params.get('name') or '').strip()
    if not name:
        return {'statusCode': 400, 'headers': cors,
                'body': json.dumps({'success': False, 'error': 'name required'})}

    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'], connect_timeout=3)
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Ищем по ФИО ученика (совпадение по childName в form_data или student_name)
        cur.execute("""
            SELECT diag_type, date_of_examination, form_data::jsonb AS fd
            FROM t_p93118852_lineaschool_initiati.speech_therapy_reports
            WHERE lower(trim(COALESCE(form_data::jsonb ->> 'childName', student_name))) = lower(trim(%s))
              AND archived_at IS NULL
            ORDER BY date_of_examination DESC, id DESC
        """, (name,))
        rows = cur.fetchall()

        primary_samples: List[str] = []
        interim_samples: List[str] = []
        interim_date = None

        for r in rows:
            dtype = r.get('diag_type') or 'primary'
            fd = r.get('fd') or {}
            if dtype == 'primary' and not primary_samples:
                primary_samples = _samples(fd)
            if dtype == 'interim' and not interim_samples:
                s = _samples(fd)
                if s:
                    interim_samples = s
                    interim_date = r['date_of_examination'].isoformat() if r['date_of_examination'] else None

        return {
            'statusCode': 200,
            'headers': cors,
            'body': json.dumps({
                'success': True,
                'primary': primary_samples,
                'interim': interim_samples,
                'interimDate': interim_date,
            }, ensure_ascii=False),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': cors,
            'body': json.dumps({'success': False, 'error': str(e)})
        }
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()