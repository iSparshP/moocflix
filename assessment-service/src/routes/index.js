const express = require('express');
const quizRoutes = require('./quizRoutes');
const assignmentRoutes = require('./assignmentRoutes');
const healthRoutes = require('./healthRoutes');
const { authenticate } = require('../middlewares/authenticate');
const { correlationId } = require('../middlewares/correlationId');
const { requestLogger } = require('../middlewares/requestLogger');
const { cacheControl } = require('../middlewares/cacheControl');

const router = express.Router();

// Apply common middleware
router.use(correlationId);
router.use(requestLogger);

// Cache control for static responses
router.use(cacheControl(300)); // 5 minutes default cache

// Health routes (no auth required)
router.use('/', healthRoutes);

// Protected routes
router.use(authenticate);
router.use('/', quizRoutes);
router.use('/', assignmentRoutes);

// 404 handler
router.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found',
        path: req.originalUrl,
    });
});

module.exports = router;
