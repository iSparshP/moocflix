const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const validateNotification = require('../middlewares/validateNotification');

router.post(
    '/sendPush',
    validateNotification,
    notificationController.sendPushNotification
);
router.post(
    '/preferences',
    validateNotification,
    notificationController.updatePreferences
);
router.post(
    '/sendEmail',
    validateNotification,
    notificationController.sendEmailNotification
);
router.get('/history', notificationController.getNotificationHistory);

module.exports = router;
