import json
import os
import urllib.parse
import urllib.request

import boto3


def handler(event: dict, context) -> dict:
    '''Скачивает PDF лицензии с Яндекс.Диска и загружает его в хранилище сайта (S3), возвращает CDN-ссылку.'''
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    public_key = 'https://disk.yandex.ru/i/1LHfAvTPYTqQ6Q'
    api_url = (
        'https://cloud-api.yandex.net/v1/disk/public/resources/download'
        '?public_key=' + urllib.parse.quote(public_key, safe='')
    )
    api_req = urllib.request.Request(api_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(api_req) as api_resp:
        href = json.loads(api_resp.read())['href']

    req = urllib.request.Request(href, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        data = resp.read()

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    key = 'documents/educational-license.pdf'
    s3.put_object(Bucket='files', Key=key, Body=data, ContentType='application/pdf')

    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
        },
        'body': json.dumps({'url': cdn_url, 'size': len(data)}),
    }