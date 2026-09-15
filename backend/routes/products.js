const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const pool = require('../db');
const authenticateToken = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const {
    createProductSchema,
    updateProductSchema,
    validate
} = require('../middleware/validation');
const upload = require('../middleware/upload');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const router = express.Router();

// ============================================================
// PUBLIC ROUTES
// ============================================================

// GET /products — list all active products (optionally filtered by category)
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;

        let query = 'SELECT * FROM products WHERE is_active = true';
        const params = [];

        if (category) {
            query += ' AND category = $1';
            params.push(category);
        }

        query += ' ORDER BY id DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /products/:id — single product
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================================
// ADMIN ROUTES
// ============================================================

// GET /products/admin/all — all products including inactive
router.get('/admin/all', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /products/upload — upload image to Supabase Storage (admin only)
router.post('/upload', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Generate unique filename
        const ext = req.file.originalname.split('.').pop().toLowerCase();
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('product-images')
            .upload(filename, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (error) {
            console.error('Supabase upload error:', error);
            return res.status(500).json({ error: error.message });
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(filename);

        res.json({ url: urlData.publicUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// POST /products — create new product (admin only)
router.post('/', authenticateToken, isAdmin, validate(createProductSchema), async (req, res) => {
    try {
        const { name, description, price, imageUrl, category, stock } = req.body;

        const result = await pool.query(
            `INSERT INTO products (name, description, price, image_url, category, stock)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [name, description || null, price, imageUrl || null, category, stock]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /products/:id — update product (admin only)
router.put('/:id', authenticateToken, isAdmin, validate(updateProductSchema), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, description, price, imageUrl, category, stock, isActive } = req.body;

        const existing = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const current = existing.rows[0];

        const result = await pool.query(
            `UPDATE products
             SET name = $1, description = $2, price = $3, image_url = $4,
                 category = $5, stock = $6, is_active = $7
             WHERE id = $8
             RETURNING *`,
            [
                name !== undefined ? name : current.name,
                description !== undefined ? description : current.description,
                price !== undefined ? price : current.price,
                imageUrl !== undefined ? imageUrl : current.image_url,
                category !== undefined ? category : current.category,
                stock !== undefined ? stock : current.stock,
                isActive !== undefined ? isActive : current.is_active,
                id
            ]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /products/:id/toggle — toggle active status (admin only)
router.patch('/:id/toggle', authenticateToken, isAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const existing = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const result = await pool.query(
            'UPDATE products SET is_active = NOT is_active WHERE id = $1 RETURNING *',
            [id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /products/:id — delete product (admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const result = await pool.query(
            'DELETE FROM products WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;