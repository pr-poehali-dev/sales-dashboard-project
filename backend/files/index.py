import json
import os
import base64
import mimetypes
from typing import Dict, Any, Optional
import requests
import jwt
from datetime import datetime

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        decoded = jwt.decode(token, os.environ.get('JWT_SECRET', 'fallback-secret'), algorithms=['HS256'])
        return decoded
    except:
        return None

def upload_to_yandex_disk(file_content: bytes, filename: str, folder: str = '/metalworking-orders') -> str:
    token = os.environ.get('YANDEX_DISK_TOKEN')
    
    if not token:
        raise Exception('YANDEX_DISK_TOKEN not configured')
    
    headers = {
        'Authorization': f'OAuth {token}'
    }
    
    try:
        mkdir_response = requests.put(
            'https://cloud-api.yandex.net/v1/disk/resources',
            headers=headers,
            params={'path': folder}
        )
    except:
        pass
    
    file_path = f'{folder}/{filename}'
    
    upload_url_response = requests.get(
        'https://cloud-api.yandex.net/v1/disk/resources/upload',
        headers=headers,
        params={'path': file_path, 'overwrite': 'true'}
    )
    
    if upload_url_response.status_code != 200:
        raise Exception(f'Failed to get upload URL: {upload_url_response.text}')
    
    upload_url = upload_url_response.json()['href']
    
    upload_response = requests.put(upload_url, data=file_content)
    
    if upload_response.status_code not in [201, 202]:
        raise Exception(f'Failed to upload file: {upload_response.text}')
    
    publish_response = requests.put(
        'https://cloud-api.yandex.net/v1/disk/resources/publish',
        headers=headers,
        params={'path': file_path}
    )
    
    if publish_response.status_code != 200:
        raise Exception(f'Failed to publish file: {publish_response.text}')
    
    meta_response = requests.get(
        'https://cloud-api.yandex.net/v1/disk/resources',
        headers=headers,
        params={'path': file_path}
    )
    
    if meta_response.status_code != 200:
        raise Exception(f'Failed to get file metadata: {meta_response.text}')
    
    public_url = meta_response.json().get('public_url', '')
    
    return public_url

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = event.get('headers', {})
    token = headers.get('x-auth-token') or headers.get('X-Auth-Token')
    
    if not token:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Требуется авторизация'})
        }
    
    decoded = verify_token(token)
    
    if not decoded:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Неверный токен'})
        }
    
    import psycopg2
    
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cursor = conn.cursor()
    
    try:
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            order_id = body_data.get('orderId')
            filename = body_data.get('filename')
            file_type = body_data.get('fileType', 'DOCUMENT')
            file_content_base64 = body_data.get('fileContent')
            
            if not all([order_id, filename, file_content_base64]):
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'orderId, filename и fileContent обязательны'})
                }
            
            cursor.execute('SELECT id FROM orders WHERE id = %s', (order_id,))
            if not cursor.fetchone():
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Заказ не найден'})
                }
            
            try:
                file_content = base64.b64decode(file_content_base64)
            except:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Неверный формат fileContent (требуется base64)'})
                }
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            unique_filename = f'{order_id}_{timestamp}_{filename}'
            
            file_url = upload_to_yandex_disk(file_content, unique_filename)
            
            cursor.execute(
                'INSERT INTO files (filename, file_url, file_type, order_id) VALUES (%s, %s, %s, %s) RETURNING id, filename, file_url, file_type, order_id, created_at',
                (filename, file_url, file_type, order_id)
            )
            
            file_record = cursor.fetchone()
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'id': file_record[0],
                    'filename': file_record[1],
                    'fileUrl': file_record[2],
                    'fileType': file_record[3],
                    'orderId': file_record[4],
                    'createdAt': file_record[5].isoformat()
                })
            }
        
        if method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            order_id = params.get('orderId')
            
            if order_id:
                cursor.execute('SELECT * FROM files WHERE order_id = %s ORDER BY created_at DESC', (order_id,))
            else:
                cursor.execute('SELECT * FROM files ORDER BY created_at DESC LIMIT 100')
            
            files = []
            for row in cursor.fetchall():
                files.append({
                    'id': row[0],
                    'filename': row[1],
                    'fileUrl': row[2],
                    'fileType': row[3],
                    'orderId': row[4],
                    'createdAt': row[5].isoformat()
                })
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'files': files})
            }
        
        if method == 'DELETE':
            params = event.get('queryStringParameters', {}) or {}
            file_id = params.get('id')
            
            if not file_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'ID файла обязателен'})
                }
            
            cursor.execute('SELECT id FROM files WHERE id = %s', (file_id,))
            if not cursor.fetchone():
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Файл не найден'})
                }
            
            cursor.execute('DELETE FROM files WHERE id = %s', (file_id,))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'message': 'Файл удалён'})
            }
        
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Метод не поддерживается'})
        }
        
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Внутренняя ошибка сервера', 'details': str(e)})
        }
    finally:
        cursor.close()
        conn.close()
