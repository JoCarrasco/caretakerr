import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

interface User {
    id: number;
    organization_id: number;
    email: string;
    password_hash: string;
    role: 'admin' | 'caretaker';
    name: string;
    phone: string | null;
    created_at: Date;
    updated_at: Date;
}

// Helper function to generate JWT
const generateToken = (user: User): string => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            organizationId: user.organization_id
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

// Register new user
router.post('/register',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 6 }),
        body('name').trim().notEmpty(),
        body('role').isIn(['admin', 'caretaker'])
    ],
    async (req: Request, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { email, password, name, role, phone } = req.body;

            // Check if user already exists
            const existingUser = await pool.query(
                'SELECT id FROM users WHERE email = $1',
                [email]
            );

            if (existingUser.rows.length > 0) {
                res.status(400).json({ error: 'User already exists' });
                return;
            }

            // Get or create organization (for self-hosted, there's only one)
            const isSelfHosted = process.env.SELF_HOSTED === 'true';
            let organizationId: number;

            if (isSelfHosted) {
                const orgResult = await pool.query(
                    `INSERT INTO organizations (name, plan_type) 
           VALUES ($1, 'self_hosted') 
           ON CONFLICT DO NOTHING 
           RETURNING id`,
                    [process.env.ORGANIZATION_NAME || 'Default Organization']
                );

                if (orgResult.rows.length > 0) {
                    organizationId = orgResult.rows[0].id;
                } else {
                    const existingOrg = await pool.query('SELECT id FROM organizations LIMIT 1');
                    organizationId = existingOrg.rows[0].id;
                }
            } else {
                // For multi-tenant, organization should be provided
                organizationId = req.body.organizationId;
                if (!organizationId) {
                    res.status(400).json({ error: 'Organization ID required' });
                    return;
                }
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Insert user
            const result = await pool.query<User>(
                `INSERT INTO users (organization_id, email, password_hash, role, name, phone)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, email, role, name, phone, organization_id, created_at`,
                [organizationId, email, passwordHash, role, name, phone || null]
            );

            const user = result.rows[0];
            const token = generateToken(user);

            res.status(201).json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    name: user.name,
                    phone: user.phone,
                    organizationId: user.organization_id
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Server error during registration' });
        }
    }
);

// Login
router.post('/login',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty()
    ],
    async (req: Request, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { email, password } = req.body;

            // Find user
            const result = await pool.query<User>(
                'SELECT * FROM users WHERE email = $1',
                [email]
            );

            if (result.rows.length === 0) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }

            const user = result.rows[0];

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }

            // Update last sync time
            await pool.query(
                'UPDATE users SET last_sync_at = CURRENT_TIMESTAMP WHERE id = $1',
                [user.id]
            );

            const token = generateToken(user);

            res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    name: user.name,
                    phone: user.phone,
                    organizationId: user.organization_id
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Server error during login' });
        }
    }
);

// Get current user (requires authentication)
router.get('/me', async (req: Request, res: Response): Promise<void> => {
    try {
        // This would typically use the auth middleware
        // For now, just a placeholder
        res.json({ message: 'Auth middleware required' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
