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
    const { httpMethod, body, queryStringParameters } = event;
    
    if (httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Allow-Max': '86400'
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
            const orderId = queryStringParameters?.orderId;
            const stageId = queryStringParameters?.id;
            
            if (stageId) {
                const result = await client.query(
                    `SELECT ps.*, u.name as assigned_user_name, u.email as assigned_user_email, u.role as assigned_user_role
                     FROM production_stages ps
                     LEFT JOIN users u ON ps.assigned_to = u.id
                     WHERE ps.id = $1`,
                    [stageId]
                );
                
                if (result.rows.length === 0) {
                    return {
                        statusCode: 404,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        body: JSON.stringify({ error: 'Этап не найден' })
                    };
                }
                
                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify(result.rows[0])
                };
            }
            
            if (orderId) {
                const result = await client.query(
                    `SELECT ps.*, u.name as assigned_user_name, u.email as assigned_user_email, u.role as assigned_user_role
                     FROM production_stages ps
                     LEFT JOIN users u ON ps.assigned_to = u.id
                     WHERE ps.order_id = $1
                     ORDER BY ps.created_at ASC`,
                    [orderId]
                );
                
                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ stages: result.rows })
                };
            }
            
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'orderId или id обязательны' })
            };
        }
        
        if (httpMethod === 'POST') {
            const data = JSON.parse(body || '{}');
            const { orderId, name, assignedTo } = data;
            
            if (!orderId || !name) {
                return {
                    statusCode: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'orderId и name обязательны' })
                };
            }
            
            const orderCheck = await client.query(
                'SELECT id FROM orders WHERE id = $1',
                [orderId]
            );
            
            if (orderCheck.rows.length === 0) {
                return {
                    statusCode: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'Заказ не найден' })
                };
            }
            
            const result = await client.query(
                `INSERT INTO production_stages (name, order_id, assigned_to)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [name, orderId, assignedTo || null]
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
            const stageId = queryStringParameters?.id;
            
            if (!stageId) {
                return {
                    statusCode: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'ID этапа обязателен' })
                };
            }
            
            const data = JSON.parse(body || '{}');
            const updates = [];
            const params = [];
            let paramIndex = 1;
            
            if (data.name !== undefined) {
                updates.push(`name = $${paramIndex}`);
                params.push(data.name);
                paramIndex++;
            }
            
            if (data.status !== undefined) {
                updates.push(`status = $${paramIndex}`);
                params.push(data.status);
                paramIndex++;
                
                if (data.status === 'IN_PROGRESS' && !data.startDate) {
                    updates.push(`start_date = CURRENT_TIMESTAMP`);
                }
                
                if (data.status === 'COMPLETED' && !data.endDate) {
                    updates.push(`end_date = CURRENT_TIMESTAMP`);
                }
            }
            
            if (data.assignedTo !== undefined) {
                updates.push(`assigned_to = $${paramIndex}`);
                params.push(data.assignedTo || null);
                paramIndex++;
            }
            
            if (data.startDate !== undefined) {
                updates.push(`start_date = $${paramIndex}`);
                params.push(data.startDate);
                paramIndex++;
            }
            
            if (data.endDate !== undefined) {
                updates.push(`end_date = $${paramIndex}`);
                params.push(data.endDate);
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
            
            params.push(stageId);
            const query = `UPDATE production_stages SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
            
            const result = await client.query(query, params);
            
            if (result.rows.length === 0) {
                return {
                    statusCode: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'Этап не найден' })
                };
            }
            
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
            const stageId = queryStringParameters?.id;
            
            if (!stageId) {
                return {
                    statusCode: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'ID этапа обязателен' })
                };
            }
            
            const result = await client.query(
                'SELECT id FROM production_stages WHERE id = $1',
                [stageId]
            );
            
            if (result.rows.length === 0) {
                return {
                    statusCode: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'Этап не найден' })
                };
            }
            
            await client.query('DELETE FROM production_stages WHERE id = $1', [stageId]);
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ message: 'Этап удалён' })
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
        console.error('Stages error:', error);
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
