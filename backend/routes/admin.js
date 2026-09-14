const express = require('express');
const pool = require('../db');
const authenticateToken = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();

// All routes here require admin
router.use(authenticateToken, isAdmin);

// GET /admin/users — all users with stats
router.get('/users', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                u.id,
                u.username,
                u.email,
                u.is_admin,
                u.created_at,
                COUNT(o.id) AS orders_count,
                COALESCE(SUM(o.total), 0) AS total_spent
             FROM users u
             LEFT JOIN orders o ON o.user_id = u.id
             GROUP BY u.id
             ORDER BY u.id ASC`
        );

        res.json(result.rows.map(u => ({
            id: u.id,
            username: u.username,
            email: u.email,
            isAdmin: u.is_admin,
            joinedAt: u.created_at,
            ordersCount: parseInt(u.orders_count),
            totalSpent: Number(u.total_spent)
        })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /admin/stats — dashboard stats
router.get('/stats', async (req, res) => {
    try {
        const ordersRes = await pool.query(
            `SELECT
                COUNT(*) AS total_orders,
                COALESCE(SUM(total), 0) AS total_revenue
             FROM orders`
        );

        const productsRes = await pool.query('SELECT COUNT(*) FROM products');
        const usersRes = await pool.query('SELECT COUNT(*) FROM users WHERE is_admin = false');

        res.json({
            totalOrders: parseInt(ordersRes.rows[0].total_orders),
            totalRevenue: Number(ordersRes.rows[0].total_revenue),
            totalProducts: parseInt(productsRes.rows[0].count),
            totalUsers: parseInt(usersRes.rows[0].count)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;