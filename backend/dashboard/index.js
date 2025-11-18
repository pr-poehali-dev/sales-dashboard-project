const jwt = require('jsonwebtoken');
const { Client } = require('pg');

const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch {
        return null;
    }
};

exports.handler = async (event, context) => {
    const { httpMethod, queryStringParameters } = event;
    
    // Production routes - без авторизации (определяем по query параметру action)
    const action = queryStringParameters?.action;
    if (action === 'settings' || action === 'tasks') {
        return await handleProduction(event);
    }
    
    if (httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            body: ''
        };
    }
    
    const token = event.headers['x-auth-token'] || event.headers['X-Auth-Token'];
    
    if (!token) {
        return {
            statusCode: 401,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Требуется авторизация' })
        };
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
        return {
            statusCode: 401,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Неверный токен' })
        };
    }
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });
    
    try {
        await client.connect();
        
        if (httpMethod === 'GET') {
            const totalOrdersResult = await client.query('SELECT COUNT(*) as count FROM orders');
            const totalOrders = parseInt(totalOrdersResult.rows[0].count);
            
            const activeOrdersResult = await client.query(
                "SELECT COUNT(*) as count FROM orders WHERE status IN ('ACCEPTED', 'IN_PROGRESS', 'QUALITY_CHECK')"
            );
            const activeOrders = parseInt(activeOrdersResult.rows[0].count);
            
            const completedOrdersResult = await client.query(
                "SELECT COUNT(*) as count FROM orders WHERE status IN ('COMPLETED', 'SHIPPED')"
            );
            const completedOrders = parseInt(completedOrdersResult.rows[0].count);
            
            const overdueOrdersResult = await client.query(
                "SELECT COUNT(*) as count FROM orders WHERE deadline < CURRENT_TIMESTAMP AND status NOT IN ('COMPLETED', 'SHIPPED')"
            );
            const overdueOrders = parseInt(overdueOrdersResult.rows[0].count);
            
            const ordersByStatusResult = await client.query(
                'SELECT status, COUNT(*) as count FROM orders GROUP BY status'
            );
            const ordersByStatus = {};
            ordersByStatusResult.rows.forEach(row => {
                ordersByStatus[row.status] = parseInt(row.count);
            });
            
            const ordersByPriorityResult = await client.query(
                'SELECT priority, COUNT(*) as count FROM orders GROUP BY priority'
            );
            const ordersByPriority = {};
            ordersByPriorityResult.rows.forEach(row => {
                ordersByPriority[row.priority] = parseInt(row.count);
            });
            
            const recentOrdersResult = await client.query(
                `SELECT o.*, u.name as user_name 
                 FROM orders o 
                 LEFT JOIN users u ON o.user_id = u.id 
                 ORDER BY o.created_at DESC 
                 LIMIT 10`
            );
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    totalOrders,
                    activeOrders,
                    completedOrders,
                    overdueOrders,
                    ordersByStatus,
                    ordersByPriority,
                    recentOrders: recentOrdersResult.rows
                })
            };
        }
        
        return {
            statusCode: 405,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Метод не поддерживается' })
        };
        
    } catch (error) {
        console.error('Dashboard error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Внутренняя ошибка сервера', details: error.message })
        };
    } finally {
        await client.end();
    }
};

// Production API - без авторизации
async function handleProduction(event) {
    const { httpMethod, queryStringParameters } = event;
    const action = queryStringParameters?.action;
    const taskId = queryStringParameters?.id;
    
    if (httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            body: '',
            isBase64Encoded: false
        };
    }
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });
    
    try {
        await client.connect();
        
        // GET ?action=settings
        if (httpMethod === 'GET' && action === 'settings') {
            const result = await client.query(
                'SELECT machines, operators FROM production_settings ORDER BY id DESC LIMIT 1'
            );
            const settings = result.rows[0] || { machines: [], operators: [] };
            
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({
                    machines: settings.machines,
                    operators: settings.operators
                }),
                isBase64Encoded: false
            };
        }
        
        // PUT ?action=settings
        if (httpMethod === 'PUT' && action === 'settings') {
            const body = JSON.parse(event.body || '{}');
            await client.query(
                'UPDATE production_settings SET machines = $1, operators = $2, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
                [body.machines, body.operators]
            );
            
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ success: true }),
                isBase64Encoded: false
            };
        }
        
        // GET ?action=tasks
        if (httpMethod === 'GET' && action === 'tasks') {
            const archived = queryStringParameters?.archived === 'true';
            
            const result = await client.query(
                `SELECT id, day_of_week, scheduled_date, part_name, planned_quantity, time_per_part,
                        machine, operator, actual_quantity, archived, archived_at, completed_at
                 FROM production_tasks 
                 WHERE archived = $1 
                 ORDER BY id`,
                [archived]
            );
            
            const tasks = [];
            for (const task of result.rows) {
                const blueprintsResult = await client.query(
                    'SELECT file_name, file_url, file_type FROM production_blueprints WHERE task_id = $1',
                    [task.id]
                );
                
                const taskObj = {
                    id: String(task.id),
                    dayOfWeek: task.day_of_week,
                    scheduledDate: task.scheduled_date ? task.scheduled_date.toISOString() : null,
                    partName: task.part_name,
                    plannedQuantity: task.planned_quantity,
                    timePerPart: task.time_per_part,
                    machine: task.machine,
                    operator: task.operator,
                    actualQuantity: task.actual_quantity,
                    archived: task.archived,
                    archivedAt: task.archived_at ? task.archived_at.toISOString() : null,
                    completedAt: task.completed_at ? task.completed_at.toISOString() : null
                };
                
                if (blueprintsResult.rows.length > 0) {
                    taskObj.blueprints = blueprintsResult.rows.map(b => ({
                        name: b.file_name,
                        url: b.file_url,
                        type: b.file_type
                    }));
                }
                
                tasks.push(taskObj);
            }
            
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify(tasks),
                isBase64Encoded: false
            };
        }
        
        // POST ?action=tasks
        if (httpMethod === 'POST' && action === 'tasks') {
            const body = JSON.parse(event.body || '{}');
            
            const result = await client.query(
                `INSERT INTO production_tasks 
                 (day_of_week, scheduled_date, part_name, planned_quantity, time_per_part, 
                  machine, operator, actual_quantity)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
                 RETURNING id`,
                [
                    body.dayOfWeek,
                    body.scheduledDate || null,
                    body.partName,
                    body.plannedQuantity,
                    body.timePerPart,
                    body.machine,
                    body.operator,
                    body.actualQuantity || 0
                ]
            );
            
            const taskId = result.rows[0].id;
            
            if (body.blueprints && body.blueprints.length > 0) {
                for (const blueprint of body.blueprints) {
                    await client.query(
                        'INSERT INTO production_blueprints (task_id, file_name, file_url, file_type) VALUES ($1, $2, $3, $4)',
                        [taskId, blueprint.name, blueprint.url, blueprint.type]
                    );
                }
            }
            
            return {
                statusCode: 201,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ id: String(taskId) }),
                isBase64Encoded: false
            };
        }
        
        // PUT ?action=tasks&id=123
        if (httpMethod === 'PUT' && action === 'tasks' && taskId) {
            const body = JSON.parse(event.body || '{}');
            
            await client.query(
                `UPDATE production_tasks 
                 SET day_of_week = $1, scheduled_date = $2, part_name = $3, 
                     planned_quantity = $4, time_per_part = $5, machine = $6, operator = $7,
                     actual_quantity = $8, archived = $9, archived_at = $10, completed_at = $11,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $12`,
                [
                    body.dayOfWeek,
                    body.scheduledDate || null,
                    body.partName,
                    body.plannedQuantity,
                    body.timePerPart,
                    body.machine,
                    body.operator,
                    body.actualQuantity || 0,
                    body.archived || false,
                    body.archivedAt || null,
                    body.completedAt || null,
                    taskId
                ]
            );
            
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ success: true }),
                isBase64Encoded: false
            };
        }
        
        return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Not found' }),
            isBase64Encoded: false
        };
        
    } catch (error) {
        console.error('Production API error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error', details: error.message }),
            isBase64Encoded: false
        };
    } finally {
        await client.end();
    }
}