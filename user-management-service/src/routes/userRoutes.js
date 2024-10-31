const express = require('express');
const { signup, login, logout } = require('../controllers/authController.js');
const { validateRequest } = require('../middlewares/validateRequest');
const { rateLimit } = require('express-rate-limit');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many attempts, please try again later',
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

// Error logging middleware
router.use((err, req, res, next) => {
    logger.error('Auth route error:', {
        path: req.path,
        error: err.message,
    });
    next(err);
});

module.exports = router;
