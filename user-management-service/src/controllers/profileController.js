const Joi = require('joi');
const User = require('../models/User.js');
const { sendMessage } = require('../../config/kafka');
const { AppError } = require('../utils/errorUtils');
const logger = require('../utils/logger');
const { validateRequest } = require('../middlewares/validateRequest');
const { createBreaker } = require('../utils/circuitBreaker');

// Validation schemas
const updateProfileSchema = Joi.object({
    name: Joi.string().min(2).max(50),
    email: Joi.string().email(),
    notificationPreferences: Joi.object({
        email: Joi.boolean(),
        push: Joi.boolean(),
    }),
});

exports.getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        logger.info('Profile retrieved successfully', { userId: req.user.id });
        res.status(200).json({ user });
    } catch (err) {
        next(new AppError(err.message, 400));
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        // Validate request body
        await validateRequest(updateProfileSchema)(req, res, () => {});

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            throw new AppError('User not found', 404);
        }

        // Send Kafka event with circuit breaker
        const breaker = createBreaker(async () => {
            await sendMessage('User-Update', {
                userId: updatedUser._id,
                email: updatedUser.email,
                role: updatedUser.role,
                timestamp: new Date().toISOString(),
            });
        });
        await breaker.fire();

        logger.info('Profile updated successfully', {
            userId: req.user.id,
            updates: Object.keys(req.body),
        });

        res.status(200).json({ user: updatedUser });
    } catch (err) {
        next(new AppError(err.message, err.statusCode || 400));
    }
};

exports.deactivateAccount = async (req, res, next) => {
    try {
        const user = await User.findByIdAndDelete(req.user.id);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        logger.info('Account deactivated', { userId: req.user.id });
        res.status(200).json({ message: 'Account deactivated' });
    } catch (err) {
        next(new AppError(err.message, 400));
    }
};

exports.updateNotificationPreferences = async (req, res, next) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { notificationPreferences: req.body.notificationPreferences },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            throw new AppError('User not found', 404);
        }

        logger.info('Notification preferences updated', {
            userId: req.user.id,
            preferences: req.body.notificationPreferences,
        });

        res.status(200).json({ user: updatedUser });
    } catch (err) {
        next(new AppError(err.message, 400));
    }
};
