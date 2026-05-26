import os
import json
import requests
from datetime import datetime, timedelta

S20_HOST = "https://11086.s20.online"
S20_EMAIL = "abram.viktoriya.00@mail.ru"


def get_headers(token: str = None) -> dict:
    h = {
        "X-APP-KEY": os.environ["S20_X_APP_KEY"],
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if token:
        h["X-ALFACRM-TOKEN"] = token
    return h


def get_token() -> str:
    """Получить токен авторизации S20 API"""
    url = f"{S20_HOST}/v2api/auth/login"
    resp = requests.post(url, json={
        "email": S20_EMAIL,
        "api_key": os.environ["S20_API_KEY"],
    }, headers=get_headers())
    resp.raise_for_status()
    data = resp.json()
    return data["token"]


def get_lessons(token: str, date_from: str, date_to: str) -> list:
    """Получить список занятий за период"""
    url = f"{S20_HOST}/v2api/1/lesson/index"
    resp = requests.post(url, json={
        "date_from": date_from,
        "date_to": date_to,
        "page": 0,
        "pageSize": 200,
    }, headers=get_headers(token))
    resp.raise_for_status()
    data = resp.json()
    return data.get("items", [])


def get_groups(token: str) -> list:
    """Получить список активных групп"""
    url = f"{S20_HOST}/v2api/1/group/index"
    resp = requests.post(url, json={
        "page": 0,
        "pageSize": 200,
        "is_active": 1,
    }, headers=get_headers(token))
    resp.raise_for_status()
    data = resp.json()
    return data.get("items", [])


def handler(event: dict, context) -> dict:
    """Получить расписание занятий из S20 CRM — группы и индивидуальные"""
    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    params = event.get("queryStringParameters") or {}
    mode = params.get("mode", "lessons")

    today = datetime.today()
    date_from = params.get("date_from", today.strftime("%Y-%m-%d"))
    date_to = params.get("date_to", (today + timedelta(days=13)).strftime("%Y-%m-%d"))

    try:
        token = get_token()
    except Exception as e:
        return {
            "statusCode": 502,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps({"error": f"S20 auth failed: {str(e)}"}, ensure_ascii=False),
        }

    if mode == "groups":
        groups = get_groups(token)
        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps({"groups": groups}, ensure_ascii=False),
        }

    lessons = get_lessons(token, date_from, date_to)
    return {
        "statusCode": 200,
        "headers": {**cors_headers, "Content-Type": "application/json"},
        "body": json.dumps({
            "lessons": lessons,
            "date_from": date_from,
            "date_to": date_to,
        }, ensure_ascii=False),
    }