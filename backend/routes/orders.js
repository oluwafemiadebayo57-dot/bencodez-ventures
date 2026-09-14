const express = require('express');
const pool = require('../db');
const authenticateToken = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { createOrderSchema, validate } = require('../middleware/validation');

const router = express.Router();

// ============================================================
// USER ROUTES
// ============================================================

// POST /orders — place a new order
router.post('/', authenticateToken, validate(createOrderSchema), async (req, res) => {
    const client = await pool.connect();

    try {
        const { items, shippingAddress, phone, fullName } = req.body;
        const userId = req.user.userId;

        // Begin transaction — all queries must succeed, or none will
        await client.query('BEGIN');

        // 1. Validate products exist, fetch their current prices + stock
        const productIds = items.map(i => i.productId);
        const productsRes = await client.query(
            'SELECT id, name, price, stock, is_active FROM products WHERE id = ANY($1)',
            [productIds]
        );
        const products = productsRes.rows;

        // Check every item exists
        for (const item of items) {
            const product = products.find(p => p.id === item.productId);
            if (!product) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: `Product #${item.productId} not found` });
            }
            if (!product.is_active) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: `Product "${product.name}" is no longer available` });
            }
            if (product.stock < item.quantity) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: `Only ${product.stock} of "${product.name}" left in stock` });
            }
        }

        // 2. Compute total (server-side — never trust client totals)
        let total = 0;
        const itemsWithPrice = items.map(item => {
            const product = products.find(p => p.id === item.productId);
            const lineTotal = Number(product.price) * item.quantity;
            total += lineTotal;
            return {
                productId: item.productId,
                quantity: item.quantity,
                priceAtPurchase: product.price
            };
        });

        // 3. Insert the order
        const orderRes = await client.query(
            `INSERT INTO orders (user_id, total, status, shipping_address, phone)
             VALUES ($1, $2, 'pending', $3, $4)
             RETURNING *`,
            [userId, total, `${fullName}\n${shippingAddress}`, phone]
        );
        const order = orderRes.rows[0];

        // 4. Insert order items
        for (const item of itemsWithPrice) {
            await client.query(
                `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
                 VALUES ($1, $2, $3, $4)`,
                [order.id, item.productId, item.quantity, item.priceAtPurchase]
            );

            // 5. Decrement stock
            await client.query(
                'UPDATE products SET stock = stock - $1 WHERE id = $2',
                [item.quantity, item.productId]
            );
        }

        // Commit
        await client.query('COMMIT');

        res.status(201).json({
            message: 'Order placed successfully',
            order: {
                id: order.id,
                total: order.total,
                status: order.status,
                createdAt: order.created_at
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
});

// GET /orders/my-orders — get current user's orders
router.get('/my-orders', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const ordersRes = await pool.query(
            'SELECT * FROM orders WHERE user_id = $1 ORDER BY id DESC',
            [userId]
        );

        // For each order, fetch its items
        const orders = [];
        for (const order of ordersRes.rows) {
            const itemsRes = await pool.query(
                `SELECT oi.quantity, oi.price_at_purchase, p.name, p.category
                 FROM order_items oi
                 JOIN products p ON p.id = oi.product_id
                 WHERE oi.order_id = $1`,
                [order.id]
            );

            orders.push({
                id: order.id,
                total: order.total,
                status: order.status,
                shippingAddress: order.shipping_address,
                phone: order.phone,
                createdAt: order.created_at,
                items: itemsRes.rows.map(i => ({
                    name: i.name,
                    category: i.category,
                    quantity: i.quantity,
                    price: i.price_at_purchase
                }))
            });
        }

        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /orders/:id — get one order (only owner or admin)
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const userId = req.user.userId;
        const isAdminUser = req.user.isAdmin;

        let query = 'SELECT * FROM orders WHERE id = $1';
        let params = [orderId];

        if (!isAdminUser) {
            query += ' AND user_id = $2';
            params.push(userId);
        }

        const orderRes = await pool.query(query, params);
        if (orderRes.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orderRes.rows[0];
        const itemsRes = await pool.query(
            `SELECT oi.quantity, oi.price_at_purchase, p.name, p.category
             FROM order_items oi
             JOIN products p ON p.id = oi.product_id
             WHERE oi.order_id = $1`,
            [orderId]
        );

        res.json({
            id: order.id,
            total: order.total,
            status: order.status,
            shippingAddress: order.shipping_address,
            phone: order.phone,
            createdAt: order.created_at,
            items: itemsRes.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================================
// ADMIN ROUTES
// ============================================================

// GET /orders/admin/all — all orders (admin only)
router.get('/admin/all', authenticateToken, isAdmin, async (req, res) => {
    try {
        const ordersRes = await pool.query(
            `SELECT o.*, u.username, u.email
             FROM orders o
             JOIN users u ON u.id = o.user_id
             ORDER BY o.id DESC`
        );

        const orders = [];
        for (const order of ordersRes.rows) {
            const itemsRes = await pool.query(
                `SELECT oi.quantity, oi.price_at_purchase, p.name, p.category
                 FROM order_items oi
                 JOIN products p ON p.id = oi.product_id
                 WHERE oi.order_id = $1`,
                [order.id]
            );

            orders.push({
                id: order.id,
                userId: order.user_id,
                username: order.username,
                email: order.email,
                total: order.total,
                status: order.status,
                shippingAddress: order.shipping_address,
                phone: order.phone,
                createdAt: order.created_at,
                items: itemsRes.rows.map(i => ({
                    name: i.name,
                    category: i.category,
                    quantity: i.quantity,
                    price: i.price_at_purchase
                }))
            });
        }

        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /orders/admin/:id/status — update order status (admin only)
router.put('/admin/:id/status', authenticateToken, isAdmin, async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const { status } = req.body;

        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await pool.query(
            'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
            [status, orderId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;