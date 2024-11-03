const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const validateNotification = require('../middlewares/validateNotification');
const { requestCounter } = require('../middlewares/metrics');
const { sequelize } = require('../models/Notification');
const kafkaConsumer = require('../subscribers/kafkaConsumer');

// Apply validation middleware to all routes
router.use(validateNotification);

router.post('/sendPush', notificationController.sendPushNotification);
router.post('/sendEmail', notificationController.sendEmailNotification);
router.post('/preferences', notificationController.updatePreferences);
router.get('/history', notificationController.getNotificationHistory);

// Health check endpoint
router.get('/health', async (req, res) => {
    try {
        // Check database connection
        await sequelize.authenticate();

        // Check Kafka connection
        const kafkaStatus = await kafkaConsumer.isConnected();

        // Get service metrics
        const metrics = {
            uptime: process.uptime(),
            responseTime: process.hrtime(),
            timestamp: Date.now(),
        };

        res.status(200).json({
            status: 'healthy',
            checks: {
                database: 'connected',
                kafka: kafkaStatus ? 'connected' : 'disconnected',
            },
            metrics,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});

module.exports = router;
