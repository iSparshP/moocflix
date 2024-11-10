const express = require('express');
const { healthCheckLimiter } = require('../middlewares/rateLimiter');
const router = express.Router();
const {
    getBasicHealth,
    getDetailedHealth,
} = require('../controllers/healthController');

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 */
router.get('/health', healthCheckLimiter, getBasicHealth);

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Detailed health check
 *     tags: [Health]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Detailed health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                     kafka:
 *                       type: string
 */
router.get('/health/detailed', healthCheckLimiter, getDetailedHealth);

module.exports = router;
