import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database.js';
import { authMiddleware, AuthRequest, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all inventory routes
router.use(authMiddleware);

/**
 * GET /api/inventory
 * List all inventory items for the organization
 */
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const orgId = req.user?.organizationId;

        const result = await pool.query(
            'SELECT * FROM inventory_items WHERE organization_id = $1 ORDER BY name ASC',
            [orgId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Server error fetching inventory' });
    }
});

/**
 * GET /api/inventory/low-stock
 * List items that are below their minimum stock level
 */
router.get('/low-stock', async (req: AuthRequest, res: Response) => {
    try {
        const orgId = req.user?.organizationId;

        const result = await pool.query(
            'SELECT * FROM inventory_items WHERE organization_id = $1 AND quantity <= min_stock_level ORDER BY name ASC',
            [orgId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching low stock:', error);
        res.status(500).json({ error: 'Server error fetching low stock' });
    }
});

/**
 * GET /api/inventory/:id
 * Get details of a single inventory item
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const orgId = req.user?.organizationId;

        const result = await pool.query(
            'SELECT * FROM inventory_items WHERE id = $1 AND organization_id = $2',
            [id, orgId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        return res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching inventory item:', error);
        return res.status(500).json({ error: 'Server error fetching inventory item' });
    }
});

/**
 * POST /api/inventory
 * Create a new inventory item (Admin only)
 */
router.post('/',
    requireAdmin,
    [
        body('name').trim().notEmpty(),
        body('category').isIn(['medicine', 'supply']),
        body('quantity').isNumeric().toFloat(),
        body('unit').trim().notEmpty(),
        body('min_stock_level').isNumeric().toFloat().optional(),
        body('expiry_date').isISO8601().optional({ nullable: true }),
        body('location').trim().optional(),
        body('notes').trim().optional()
    ],
    async (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const orgId = req.user?.organizationId;
            const { name, category, quantity, unit, min_stock_level, expiry_date, location, notes } = req.body;

            const result = await pool.query(
                `INSERT INTO inventory_items 
         (organization_id, name, category, quantity, unit, min_stock_level, expiry_date, location, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
                [orgId, name, category, quantity, unit, min_stock_level || 0, expiry_date, location, notes]
            );

            return res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Error creating inventory item:', error);
            return res.status(500).json({ error: 'Server error creating inventory item' });
        }
    }
);

/**
 * PATCH /api/inventory/:id
 * Update an inventory item
 */
router.patch('/:id',
    requireAdmin,
    [
        body('name').trim().optional(),
        body('category').isIn(['medicine', 'supply']).optional(),
        body('quantity').isNumeric().toFloat().optional(),
        body('unit').trim().optional(),
        body('min_stock_level').isNumeric().toFloat().optional(),
        body('expiry_date').isISO8601().optional({ nullable: true }),
        body('location').trim().optional(),
        body('notes').trim().optional()
    ],
    async (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { id } = req.params;
            const orgId = req.user?.organizationId;
            const updates = req.body;

            // Filter out only allowed fields and build dynamic query
            const allowedFields = ['name', 'category', 'quantity', 'unit', 'min_stock_level', 'expiry_date', 'location', 'notes'];
            const fieldNames = Object.keys(updates).filter(f => allowedFields.includes(f));

            if (fieldNames.length === 0) {
                return res.status(400).json({ error: 'No valid update fields provided' });
            }

            const setClause = fieldNames.map((name, index) => `${name} = $${index + 1}`).join(', ');
            const values = fieldNames.map(name => updates[name]);

            const query = `
        UPDATE inventory_items 
        SET ${setClause}, version = version + 1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $${fieldNames.length + 1} AND organization_id = $${fieldNames.length + 2}
        RETURNING *
      `;

            const result = await pool.query(query, [...values, id, orgId]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Item not found' });
            }

            return res.json(result.rows[0]);
        } catch (error) {
            console.error('Error updating inventory item:', error);
            return res.status(500).json({ error: 'Server error updating inventory item' });
        }
    }
);

/**
 * POST /api/inventory/:id/transaction
 * Record a stock in/out transaction
 */
router.post('/:id/transaction',
    [
        body('type').isIn(['in', 'out']),
        body('quantity').isNumeric().toFloat(),
        body('notes').trim().optional()
    ],
    async (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const orgId = req.user?.organizationId;
        const userId = req.user?.id;
        const { type, quantity, notes } = req.body;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const itemResult = await client.query(
                'SELECT quantity FROM inventory_items WHERE id = $1 AND organization_id = $2 FOR UPDATE',
                [id, orgId]
            );

            if (itemResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Item not found' });
            }

            const currentQty = parseFloat(itemResult.rows[0].quantity);
            let newQty = type === 'in' ? currentQty + quantity : currentQty - quantity;

            if (newQty < 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Insufficient stock' });
            }

            const updateResult = await client.query(
                'UPDATE inventory_items SET quantity = $1, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
                [newQty, id]
            );

            await client.query(
                `INSERT INTO inventory_transactions (item_id, type, quantity, performed_by, notes)
         VALUES ($1, $2, $3, $4, $5)`,
                [id, type, quantity, userId, notes]
            );

            await client.query('COMMIT');
            return res.json(updateResult.rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Transaction error:', error);
            return res.status(500).json({ error: 'Server error recording transaction' });
        } finally {
            client.release();
        }
    }
);

/**
 * DELETE /api/inventory/:id
 * Remove an inventory item (Admin only)
 */
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const orgId = req.user?.organizationId;

        const result = await pool.query(
            'DELETE FROM inventory_items WHERE id = $1 AND organization_id = $2 RETURNING id',
            [id, orgId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        return res.json({ message: 'Item deleted successfully', id });
    } catch (error) {
        console.error('Error deleting inventory item:', error);
        return res.status(500).json({ error: 'Server error deleting inventory item' });
    }
});

export default router;
