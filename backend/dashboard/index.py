'''
Business: API для производственного дашборда и статистики заказов
Args: event - dict with httpMethod, body, queryStringParameters
      context - object with attributes: request_id, function_name
Returns: HTTP response dict
Version: 2.0
'''

import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise ValueError('DATABASE_URL not configured')
    return psycopg2.connect(database_url, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    query_params = event.get('queryStringParameters') or {}
    action = query_params.get('action')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    # Production routes - без авторизации
    if action in ['settings', 'tasks']:
        return handle_production(event, context)
    
    # Dashboard routes - с авторизацией
    return handle_dashboard(event, context)

def handle_production(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    query_params = event.get('queryStringParameters') or {}
    action = query_params.get('action')
    task_id = query_params.get('id')
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # GET ?action=settings
        if method == 'GET' and action == 'settings':
            cur.execute('SELECT machines, operators FROM production_settings ORDER BY id DESC LIMIT 1')
            settings = cur.fetchone()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'machines': settings['machines'] if settings else [],
                    'operators': settings['operators'] if settings else []
                }),
                'isBase64Encoded': False
            }
        
        # PUT ?action=settings
        if method == 'PUT' and action == 'settings':
            body_data = json.loads(event.get('body', '{}'))
            machines = body_data.get('machines', [])
            operators = body_data.get('operators', [])
            
            machines_str = ','.join([f"'{m.replace(chr(39), chr(39)+chr(39))}'" for m in machines])
            operators_str = ','.join([f"'{o.replace(chr(39), chr(39)+chr(39))}'" for o in operators])
            
            query = f"UPDATE production_settings SET machines = ARRAY[{machines_str}], operators = ARRAY[{operators_str}], updated_at = CURRENT_TIMESTAMP WHERE id = 1"
            cur.execute(query)
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        # GET ?action=tasks
        if method == 'GET' and action == 'tasks':
            archived = query_params.get('archived', 'false') == 'true'
            
            cur.execute(
                f"SELECT id, day_of_week, scheduled_date, part_name, planned_quantity, time_per_part, "
                f"machine, operator, actual_quantity, archived, archived_at, completed_at "
                f"FROM production_tasks WHERE archived = {'TRUE' if archived else 'FALSE'} ORDER BY id"
            )
            tasks = cur.fetchall()
            
            result = []
            for task in tasks:
                cur.execute(
                    f"SELECT file_name, file_url, file_type FROM production_blueprints WHERE task_id = {task['id']}"
                )
                blueprints = cur.fetchall()
                
                task_dict = {
                    'id': str(task['id']),
                    'dayOfWeek': task['day_of_week'],
                    'scheduledDate': task['scheduled_date'].isoformat() if task['scheduled_date'] else None,
                    'partName': task['part_name'],
                    'plannedQuantity': task['planned_quantity'],
                    'timePerPart': task['time_per_part'],
                    'machine': task['machine'],
                    'operator': task['operator'],
                    'actualQuantity': task['actual_quantity'],
                    'archived': task['archived'],
                    'archivedAt': task['archived_at'].isoformat() if task['archived_at'] else None,
                    'completedAt': task['completed_at'].isoformat() if task['completed_at'] else None
                }
                
                if blueprints:
                    task_dict['blueprints'] = [
                        {'name': b['file_name'], 'url': b['file_url'], 'type': b['file_type']}
                        for b in blueprints
                    ]
                
                result.append(task_dict)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result),
                'isBase64Encoded': False
            }
        
        # POST ?action=tasks
        if method == 'POST' and action == 'tasks':
            body_data = json.loads(event.get('body', '{}'))
            
            scheduled_date = f"'{body_data.get('scheduledDate')}'" if body_data.get('scheduledDate') else 'NULL'
            
            part_name_escaped = body_data.get('partName', '').replace(chr(39), chr(39)+chr(39))
            machine_escaped = body_data.get('machine', '').replace(chr(39), chr(39)+chr(39))
            operator_escaped = body_data.get('operator', '').replace(chr(39), chr(39)+chr(39))
            
            query = f"""
                INSERT INTO production_tasks 
                (day_of_week, scheduled_date, part_name, planned_quantity, time_per_part, machine, operator, actual_quantity)
                VALUES ('{body_data.get('dayOfWeek')}', {scheduled_date}, '{part_name_escaped}', 
                        {body_data.get('plannedQuantity')}, {body_data.get('timePerPart')}, 
                        '{machine_escaped}', '{operator_escaped}', {body_data.get('actualQuantity', 0)})
                RETURNING id
            """
            cur.execute(query)
            task_id_result = cur.fetchone()['id']
            
            blueprints = body_data.get('blueprints', [])
            for blueprint in blueprints:
                file_name_escaped = blueprint.get('name', '').replace(chr(39), chr(39)+chr(39))
                file_url_escaped = blueprint.get('url', '').replace(chr(39), chr(39)+chr(39))
                file_type_escaped = blueprint.get('type', '').replace(chr(39), chr(39)+chr(39))
                cur.execute(
                    f"INSERT INTO production_blueprints (task_id, file_name, file_url, file_type) "
                    f"VALUES ({task_id_result}, '{file_name_escaped}', '{file_url_escaped}', '{file_type_escaped}')"
                )
            
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'id': str(task_id_result)}),
                'isBase64Encoded': False
            }
        
        # PUT ?action=tasks&id=123
        if method == 'PUT' and action == 'tasks' and task_id:
            body_data = json.loads(event.get('body', '{}'))
            
            scheduled_date = f"'{body_data.get('scheduledDate')}'" if body_data.get('scheduledDate') else 'NULL'
            archived_at = f"'{body_data.get('archivedAt')}'" if body_data.get('archivedAt') else 'NULL'
            completed_at = f"'{body_data.get('completedAt')}'" if body_data.get('completedAt') else 'NULL'
            
            part_name_escaped = body_data.get('partName', '').replace(chr(39), chr(39)+chr(39))
            machine_escaped = body_data.get('machine', '').replace(chr(39), chr(39)+chr(39))
            operator_escaped = body_data.get('operator', '').replace(chr(39), chr(39)+chr(39))
            
            query = f"""
                UPDATE production_tasks 
                SET day_of_week = '{body_data.get('dayOfWeek')}',
                    scheduled_date = {scheduled_date},
                    part_name = '{part_name_escaped}',
                    planned_quantity = {body_data.get('plannedQuantity')},
                    time_per_part = {body_data.get('timePerPart')},
                    machine = '{machine_escaped}',
                    operator = '{operator_escaped}',
                    actual_quantity = {body_data.get('actualQuantity', 0)},
                    archived = {'TRUE' if body_data.get('archived') else 'FALSE'},
                    archived_at = {archived_at},
                    completed_at = {completed_at},
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = {task_id}
            """
            cur.execute(query)
            
            blueprints = body_data.get('blueprints', [])
            if blueprints:
                cur.execute(f"DELETE FROM production_blueprints WHERE task_id = {task_id}")
                for blueprint in blueprints:
                    file_name_escaped = blueprint.get('name', '').replace(chr(39), chr(39)+chr(39))
                    file_url_escaped = blueprint.get('url', '').replace(chr(39), chr(39)+chr(39))
                    file_type_escaped = blueprint.get('type', '').replace(chr(39), chr(39)+chr(39))
                    cur.execute(
                        f"INSERT INTO production_blueprints (task_id, file_name, file_url, file_type) "
                        f"VALUES ({task_id}, '{file_name_escaped}', '{file_url_escaped}', '{file_type_escaped}')"
                    )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Not found'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()

def handle_dashboard(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    headers_dict = event.get('headers', {})
    token = headers_dict.get('x-auth-token') or headers_dict.get('X-Auth-Token')
    
    if not token:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Требуется авторизация'}),
            'isBase64Encoded': False
        }
    
    # Simplified: just return stats
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'totalOrders': 0,
            'activeOrders': 0,
            'completedOrders': 0,
            'overdueOrders': 0
        }),
        'isBase64Encoded': False
    }