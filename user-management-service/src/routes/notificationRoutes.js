const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validateRequest');
const notificationService = require('../services/notificationService');
const { profileUpdateLimiter } = require('../middlewares/rateLimiter');
const logger = require('../utils/logger');
const Joi = require('joi');

const notificationPreferencesSchema = Joi.object({
    email: Joi.boolean().required(),
    push: Joi.boolean().required(),
});

router.put(
    '/preferences',
    protect,
    profileUpdateLimiter,
    validateRequest(notificationPreferencesSchema),
    async (req, res, next) => {
        try {
            const user = await User.findById(req.user.id);
            await user.updateNotificationPreferences(req.body);

            logger.info('Notification preferences updated', {
                userId: req.user.id,
                preferences: req.body,
            });

            res.status(200).json({
                status: 'success',
                message: 'Notification preferences updated',
                data: user.notificationPreferences,
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
