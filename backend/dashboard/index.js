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
    const { httpMethod } = event;
    
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
