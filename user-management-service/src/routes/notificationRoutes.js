const express = require('express');
const {
    updateNotificationPreferences,
    getNotificationPreferences,
    testNotification,
} = require('../controllers/profileController');
const { protect } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validateRequest');
const { AppError } = require('../utils/errorUtils');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /notifications/preferences:
 *   get:
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     summary: Get user notification preferences
 *     responses:
 *       200:
 *         description: Current notification preferences
 */
router.get('/preferences', protect, getNotificationPreferences);

/**
 * @swagger
 * /notifications/preferences:
 *   put:
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     summary: Update notification preferences
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: boolean }
 *               push: { type: boolean }
 */
router.put(
    '/preferences',
    protect,
    validateRequest(notificationPreferencesSchema),
    updateNotificationPreferences
);

/**
 * @swagger
 * /notifications/test:
 *   post:
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     summary: Send test notification
 */
router.post('/test', protect, testNotification);

// Error handling middleware
router.use((err, req, res, next) => {
    logger.error('Notification route error:', {
        path: req.path,
        error: err.message,
    });
    next(err);
});

module.exports = router;
