const express = require('express');
const router = express.Router();
const Joi = require('joi');
const {
    signup,
    login,
    logout,
    refreshToken,
    forgotPassword,
    resetPassword,
    sendVerificationEmail,
    verifyEmail,
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validateRequest');

// Validation Schemas
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

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
    password: Joi.string().min(8).required(),
    passwordConfirm: Joi.string()
        .valid(Joi.ref('password'))
        .required()
        .messages({
            'any.only': 'Passwords do not match',
        }),
});

// Auth Routes
router.post('/signup', validateRequest(signupSchema), signup);
router.post('/login', validateRequest(loginSchema), login);
router.post('/logout', protect, logout);
router.post('/refresh-token', refreshToken);

// Password Reset Routes
router.post(
    '/forgot-password',
    validateRequest(forgotPasswordSchema),
    forgotPassword
);
router.post(
    '/reset-password/:token',
    validateRequest(resetPasswordSchema),
    resetPassword
);

// Email Verification Routes
router.post('/verify-email', protect, sendVerificationEmail);
router.get('/verify-email/:token', verifyEmail);

module.exports = router;
