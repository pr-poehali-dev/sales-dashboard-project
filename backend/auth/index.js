const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

exports.handler = async (event, context) => {
    const { httpMethod, body } = event;
    
    if (httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            body: ''
        };
    }
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });
    
    try {
        await client.connect();
        
        if (httpMethod === 'POST') {
            const data = JSON.parse(body || '{}');
            const { action, email, password, name, role } = data;
            
            if (action === 'register') {
                const existingUser = await client.query(
                    'SELECT id FROM users WHERE email = $1',
                    [email]
                );
                
                if (existingUser.rows.length > 0) {
                    return {
                        statusCode: 400,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        body: JSON.stringify({ error: 'Пользователь с таким email уже существует' })
                    };
                }
                
                const hashedPassword = await bcrypt.hash(password, 10);
                const userRole = role || 'USER';
                
                const result = await client.query(
                    'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at',
                    [email, hashedPassword, name, userRole]
                );
                
                const user = result.rows[0];
                const token = jwt.sign(
                    { userId: user.id, email: user.email, role: user.role },
                    process.env.JWT_SECRET || 'fallback-secret',
                    { expiresIn: '7d' }
                );
                
                return {
                    statusCode: 201,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        token,
                        user: {
                            id: user.id,
                            email: user.email,
                            name: user.name,
                            role: user.role,
                            createdAt: user.created_at
                        }
                    })
                };
            }
            
            if (action === 'login') {
                const result = await client.query(
                    'SELECT * FROM users WHERE email = $1',
                    [email]
                );
                
                if (result.rows.length === 0) {
                    return {
                        statusCode: 401,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        body: JSON.stringify({ error: 'Неверный email или пароль' })
                    };
                }
                
                const user = result.rows[0];
                const isPasswordValid = await bcrypt.compare(password, user.password);
                
                if (!isPasswordValid) {
                    return {
                        statusCode: 401,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        body: JSON.stringify({ error: 'Неверный email или пароль' })
                    };
                }
                
                const token = jwt.sign(
                    { userId: user.id, email: user.email, role: user.role },
                    process.env.JWT_SECRET || 'fallback-secret',
                    { expiresIn: '7d' }
                );
                
                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        token,
                        user: {
                            id: user.id,
                            email: user.email,
                            name: user.name,
                            role: user.role,
                            createdAt: user.created_at
                        }
                    })
                };
            }
        }
        
        if (httpMethod === 'GET') {
            const token = event.headers['x-auth-token'] || event.headers['X-Auth-Token'];
            
            if (!token) {
                return {
                    statusCode: 401,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'Токен не предоставлен' })
                };
            }
            
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
                
                const result = await client.query(
                    'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
                    [decoded.userId]
                );
                
                if (result.rows.length === 0) {
                    return {
                        statusCode: 404,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        body: JSON.stringify({ error: 'Пользователь не найден' })
                    };
                }
                
                const user = result.rows[0];
                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        createdAt: user.created_at
                    })
                };
            } catch (err) {
                return {
                    statusCode: 401,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'Неверный или истёкший токен' })
                };
            }
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
        console.error('Auth error:', error);
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
