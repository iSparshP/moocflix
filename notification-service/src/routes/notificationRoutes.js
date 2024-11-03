const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const validateNotification = require('../middlewares/validateNotification');
const { requestCounter } = require('../middlewares/metrics');

// Apply validation middleware to all routes
router.use(validateNotification);

router.post('/sendPush', notificationController.sendPushNotification);
router.post('/sendEmail', notificationController.sendEmailNotification);
router.post('/preferences', notificationController.updatePreferences);
router.get('/history', notificationController.getNotificationHistory);
router.get('/health', (req, res) => {
    requestCounter.inc({ type: 'health_check', status: 200 });
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        metrics: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
        },
    });
});

module.exports = router;
