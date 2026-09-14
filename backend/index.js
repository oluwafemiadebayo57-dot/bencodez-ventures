const express = require('express');
const pool = require('./db');
require('dotenv').config();
const orderRoutes = require('./routes/orders');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');                    // ← NEW
const authenticateToken = require('./middleware/auth');
const isAdmin = require('./middleware/isAdmin');                       // ← NEW

const helmet = require('helmet');
const cors = require('cors');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiters');
const { createTodoSchema, updateTodoSchema, validate } = require('./middleware/validation');
const { notFoundHandler, errorHandler } = require('./middleware/errors');
const path = require('path');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(generalLimiter);
const adminRoutes = require('./routes/admin');

// ---- ROUTERS ----
app.use('/auth', authLimiter, authRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);                                  // ← NEW
app.use('/admin', adminRoutes);                                    // ← NEW

// Test route (PUBLIC)
app.get('/', (req, res) => {
    res.send('🚀 Bencodez-Ventures API is running!');
});

// ============================================================
// TODO ROUTES (kept for backwards compatibility)
// You can safely remove these once you no longer need them.
// ============================================================

// CREATE - Add a new todo (PROTECTED + VALIDATED)
app.post('/todos', authenticateToken, validate(createTodoSchema), async (req, res) => {
    try {
        const { task } = req.body;
        const userId = req.user.userId;

        const result = await pool.query(
            'INSERT INTO todos (task, user_id) VALUES ($1, $2) RETURNING *',
            [task, userId]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// READ ALL
app.get('/todos', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await pool.query(
            'SELECT * FROM todos WHERE user_id = $1 ORDER BY id ASC',
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// READ ONE
app.get('/todos/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const userId = req.user.userId;

        const result = await pool.query(
            'SELECT * FROM todos WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// UPDATE
app.put('/todos/:id', authenticateToken, validate(updateTodoSchema), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const userId = req.user.userId;
        const { task, isComplete } = req.body;

        const existing = await pool.query(
            'SELECT * FROM todos WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        const current = existing.rows[0];
        const newTask = task !== undefined ? task : current.task;
        const newIsComplete = isComplete !== undefined ? isComplete : current.is_complete;

        const result = await pool.query(
            'UPDATE todos SET task = $1, is_complete = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
            [newTask, newIsComplete, id, userId]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE
app.delete('/todos/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const userId = req.user.userId;

        const result = await pool.query(
            'DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ---- 404 + ERROR HANDLERS (must be LAST) ----
app.use(notFoundHandler);
app.use(errorHandler);

// ---- START SERVER ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});