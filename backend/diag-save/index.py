import json
import os
import secrets
from datetime import datetime
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: Сохранение заключений из диагностической формы в базу данных
    Args: event - dict с httpMethod, body; context - объект с request_id
    Returns: HTTP response dict с токеном доступа
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
            'isBase64Encoded': False,
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Разрешен только POST метод'})
        }
    
    try:
        # Парсим данные из диагностической формы
        body_data = json.loads(event.get('body', '{}'))
        
        # Подключение к базе данных
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Формируем данные для сохранения
        student_name = body_data.get('childName', 'Не указано')
        student_age = calculate_age(body_data.get('birthDate'))
        examination_date = body_data.get('diagnosisDate') or datetime.now().strftime('%Y-%m-%d')
        therapist_name = body_data.get('logopedist', 'Логопед LineaSchool')
        
        # Формируем диагноз из данных формы
        diagnosis = format_diagnosis(body_data)
        
        # Формируем рекомендации
        recommendations = format_recommendations(body_data)
        
        # Формируем полный текст заключения
        report_content = generate_full_report(body_data)
        
        # Генерация уникального токена для доступа
        access_token = secrets.token_urlsafe(32)
        
        # Сохраняем в базу данных
        cursor.execute("""
            INSERT INTO speech_therapy_reports 
            (student_name, student_age, date_of_examination, therapist_name, 
             diagnosis, recommendations, report_content, access_token)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, access_token
        """, (
            student_name,
            student_age,
            examination_date,
            therapist_name,
            diagnosis,
            recommendations,
            report_content,
            access_token
        ))
        
        result = cursor.fetchone()
        conn.commit()
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'success': True,
                'id': result['id'],
                'access_token': result['access_token'],
                'public_url': f"https://functions.poehali.dev/90c2b81a-149c-41ae-aaa0-2693751f9619?token={result['access_token']}",
                'message': 'Заключение успешно сохранено'
            })
        }
        
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Неверный формат JSON'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'})
        }
        
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

def calculate_age(birth_date_str: str) -> int:
    """Вычисляет возраст по дате рождения"""
    if not birth_date_str:
        return 0
    
    try:
        birth_date = datetime.strptime(birth_date_str, '%Y-%m-%d')
        today = datetime.now()
        age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
        return max(0, age)
    except:
        return 0

def format_diagnosis(data: Dict[str, Any]) -> str:
    """Формирует диагноз из данных формы"""
    diagnosis_parts = []
    
    # Речевые нарушения
    speech_disorders = data.get('speechDisorders', [])
    if speech_disorders:
        diagnosis_parts.extend(speech_disorders)
    
    # Типы дислексии
    dyslexia_types = data.get('dyslexiaTypes', [])
    if dyslexia_types:
        diagnosis_parts.append(f"Дислексия: {', '.join(dyslexia_types)}")
    
    # Типы дисграфии
    dysgraphia_types = data.get('dysgraphiaTypes', [])
    if dysgraphia_types:
        diagnosis_parts.append(f"Дисграфия: {', '.join(dysgraphia_types)}")
    
    # Синдромы
    brain_syndromes = data.get('brainSyndromes', [])
    if brain_syndromes:
        diagnosis_parts.extend(brain_syndromes)
    
    return '; '.join(diagnosis_parts) if diagnosis_parts else 'Требует дополнительного обследования'

def format_recommendations(data: Dict[str, Any]) -> str:
    """Формирует рекомендации из данных формы"""
    recommendations = data.get('recommendations', [])
    work_directions = data.get('workDirections', [])
    
    all_recommendations = recommendations + work_directions
    return '; '.join(all_recommendations) if all_recommendations else 'Индивидуальные рекомендации будут даны после консультации'

def generate_full_report(data: Dict[str, Any]) -> str:
    """Генерирует полный текст заключения"""
    report_sections = []
    
    # Персональные данные
    child_name = data.get('childName', 'Не указано')
    age = data.get('age', '')
    grade = data.get('grade', '')
    parent_name = data.get('parentName', '')
    
    report_sections.append(f"""ЛОГОПЕДИЧЕСКОЕ ЗАКЛЮЧЕНИЕ

Ребенок: {child_name}
Возраст: {age}
Класс: {grade}
Родитель/опекун: {parent_name}""")
    
    # Жалобы
    complaints = data.get('complaints', '')
    if complaints:
        report_sections.append(f"Жалобы: {complaints}")
    
    # Анамнестические данные
    if data.get('prenatalDevelopment') != 'Без особенностей':
        report_sections.append(f"Пренатальное развитие: {data.get('prenatalDevelopment')}")
    
    if data.get('neurologicalDisorders') != 'Нет / не диагностировано':
        report_sections.append(f"Неврологические нарушения: {data.get('neurologicalDisorders')}")
    
    # Результаты обследования речи
    motor_realization = data.get('motorRealization', [])
    if motor_realization:
        report_sections.append(f"Моторная реализация речи: {', '.join(motor_realization)}")
    
    grammatical_structure = data.get('grammaticalStructure', '')
    if grammatical_structure:
        report_sections.append(f"Грамматический строй: {grammatical_structure}")
    
    # Письменная речь
    reading_skill = data.get('readingSkill', [])
    if reading_skill:
        report_sections.append(f"Навык чтения: {', '.join(reading_skill)}")
    
    dysgraphic_errors = data.get('dysgraphicErrors', '')
    if dysgraphic_errors:
        report_sections.append(f"Дисграфические ошибки: {dysgraphic_errors}")
    
    # Заключение
    diagnosis = format_diagnosis(data)
    report_sections.append(f"ЗАКЛЮЧЕНИЕ: {diagnosis}")
    
    # Рекомендации
    recommendations = format_recommendations(data)
    report_sections.append(f"РЕКОМЕНДАЦИИ: {recommendations}")
    
    return '\n\n'.join(report_sections)