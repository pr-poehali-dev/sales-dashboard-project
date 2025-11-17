const jwt = require('jsonwebtoken');
const { Client } = require('pg');

const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch {
        return null;
    }
};

const generateOrderNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `MFG-${year}-${random}`;
};

exports.handler = async (event, context) => {
    const { httpMethod, body, queryStringParameters } = event;
    
    if (httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
            const orderId = queryStringParameters?.id;
            
            if (orderId) {
                const result = await client.query(
                    `SELECT o.*, u.name as user_name, u.email as user_email, u.role as user_role
                     FROM orders o
                     LEFT JOIN users u ON o.user_id = u.id
                     WHERE o.id = $1`,
                    [orderId]
                );
                
                if (result.rows.length === 0) {
                    return {
                        statusCode: 404,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        body: JSON.stringify({ error: 'Заказ не найден' })
                    };
                }
                
                const order = result.rows[0];
                
                const filesResult = await client.query(
                    'SELECT * FROM files WHERE order_id = $1',
                    [orderId]
                );
                
                const stagesResult = await client.query(
                    `SELECT ps.*, u.name as assigned_user_name, u.email as assigned_user_email
                     FROM production_stages ps
                     LEFT JOIN users u ON ps.assigned_to = u.id
                     WHERE ps.order_id = $1`,
                    [orderId]
                );
                
                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        ...order,
                        files: filesResult.rows,
                        stages: stagesResult.rows
                    })
                };
            }
            
            const status = queryStringParameters?.status;
            const priority = queryStringParameters?.priority;
            const search = queryStringParameters?.search;
            const page = parseInt(queryStringParameters?.page || '1');
            const limit = parseInt(queryStringParameters?.limit || '20');
            const offset = (page - 1) * limit;
            
            let query = `
                SELECT o.*, u.name as user_name, u.email as user_email
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                WHERE 1=1
            `;
            const params = [];
            let paramIndex = 1;
            
            if (status) {
                query += ` AND o.status = $${paramIndex}`;
                params.push(status);
                paramIndex++;
            }
            
            if (priority) {
                query += ` AND o.priority = $${paramIndex}`;
                params.push(priority);
                paramIndex++;
            }
            
            if (search) {
                query += ` AND (o.order_number ILIKE $${paramIndex} OR o.client_name ILIKE $${paramIndex})`;
                params.push(`%${search}%`);
                paramIndex++;
            }
            
            query += ` ORDER BY o.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(limit, offset);
            
            const result = await client.query(query, params);
            
            const countQuery = `SELECT COUNT(*) FROM orders WHERE 1=1` + 
                (status ? ` AND status = '${status}'` : '') +
                (priority ? ` AND priority = '${priority}'` : '') +
                (search ? ` AND (order_number ILIKE '%${search}%' OR client_name ILIKE '%${search}%')` : '');
            
            const countResult = await client.query(countQuery);
            const total = parseInt(countResult.rows[0].count);
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    orders: result.rows,
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit)
                    }
                })
            };
        }
        
        if (httpMethod === 'POST') {
            const data = JSON.parse(body || '{}');
            const { clientName, description, priority, deadline } = data;
            
            const orderNumber = generateOrderNumber();
            
            const result = await client.query(
                `INSERT INTO orders (order_number, client_name, description, priority, deadline, user_id)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [orderNumber, clientName, description || null, priority, deadline, decoded.userId]
            );
            
            await client.query(
                `INSERT INTO order_history (order_id, user_id, action, new_value)
                 VALUES ($1, $2, $3, $4)`,
                [result.rows[0].id, decoded.userId, 'Создан заказ', orderNumber]
            );
            
            return {
                statusCode: 201,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(result.rows[0])
            };
        }
        
        if (httpMethod === 'PUT') {
            const orderId = queryStringParameters?.id;
            
            if (!orderId) {
                return {
                    statusCode: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'ID заказа обязателен' })
                };
            }
            
            const data = JSON.parse(body || '{}');
            const updates = [];
            const params = [];
            let paramIndex = 1;
            
            if (data.clientName !== undefined) {
                updates.push(`client_name = $${paramIndex}`);
                params.push(data.clientName);
                paramIndex++;
            }
            
            if (data.description !== undefined) {
                updates.push(`description = $${paramIndex}`);
                params.push(data.description);
                paramIndex++;
            }
            
            if (data.status !== undefined) {
                updates.push(`status = $${paramIndex}`);
                params.push(data.status);
                paramIndex++;
            }
            
            if (data.priority !== undefined) {
                updates.push(`priority = $${paramIndex}`);
                params.push(data.priority);
                paramIndex++;
            }
            
            if (data.deadline !== undefined) {
                updates.push(`deadline = $${paramIndex}`);
                params.push(data.deadline);
                paramIndex++;
            }
            
            if (updates.length === 0) {
                return {
                    statusCode: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'Нет данных для обновления' })
                };
            }
            
            params.push(orderId);
            const query = `UPDATE orders SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
            
            const result = await client.query(query, params);
            
            if (result.rows.length === 0) {
                return {
                    statusCode: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'Заказ не найден' })
                };
            }
            
            await client.query(
                `INSERT INTO order_history (order_id, user_id, action, new_value)
                 VALUES ($1, $2, $3, $4)`,
                [orderId, decoded.userId, 'Обновлён заказ', JSON.stringify(data)]
            );
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(result.rows[0])
            };
        }
        
        if (httpMethod === 'DELETE') {
            const orderId = queryStringParameters?.id;
            
            if (!orderId) {
                return {
                    statusCode: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'ID заказа обязателен' })
                };
            }
            
            const result = await client.query(
                'SELECT id FROM orders WHERE id = $1',
                [orderId]
            );
            
            if (result.rows.length === 0) {
                return {
                    statusCode: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'Заказ не найден' })
                };
            }
            
            await client.query('DELETE FROM order_history WHERE order_id = $1', [orderId]);
            await client.query('DELETE FROM production_stages WHERE order_id = $1', [orderId]);
            await client.query('DELETE FROM files WHERE order_id = $1', [orderId]);
            await client.query('DELETE FROM orders WHERE id = $1', [orderId]);
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ message: 'Заказ удалён' })
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
        console.error('Orders error:', error);
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
