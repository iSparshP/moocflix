const express = require('express');
const {
    signup,
    login,
    logout,
    refreshToken,
} = require('../controllers/authController.js');
const { validateRequest } = require('../middlewares/validateRequest');
const { rateLimit } = require('express-rate-limit');
const logger = require('../utils/logger');
const Joi = require('joi');

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip + req.headers['x-forwarded-for'],
    handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            requestId: req.id,
        });
        res.status(429).json({
            status: 'error',
            message: 'Too many attempts, please try again later',
        });
    },
});

const signupSchema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    role: Joi.string()
        .valid('student', 'instructor', 'admin')
        .default('student'),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 */
router.post('/signup', validateRequest(signupSchema), signup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 */
router.post('/login', authLimiter, validateRequest(loginSchema), login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     summary: Logout user
 */
router.post('/logout', logout);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     summary: Refresh token
 */
router.post('/refresh-token', refreshToken);

// Error logging middleware
router.use((err, req, res, next) => {
    logger.error('Auth route error:', {
        path: req.path,
        error: err.message,
    });
    next(err);
});

module.exports = router;
