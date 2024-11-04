const User = require('../models/User.js');
const bcrypt = require('bcryptjs');
const { sendMessage } = require('../../config/kafka');
const { generateToken, generateRefreshToken } = require('../utils/tokenUtils');
const logger = require('../utils/logger');
const { createBreaker } = require('@honeycombio/opentelemetry-circuit-breaker');
const { AppError } = require('../utils/errorUtils');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new AppError('Email already registered', 400);
        }

        const newUser = await User.create({ name, email, password, role });

        // Send Kafka event with circuit breaker
        const breaker = createBreaker(async () => {
            await sendMessage('User-Creation', {
                userId: newUser._id,
                email: newUser.email,
                role: newUser.role,
                timestamp: new Date().toISOString(),
            });
        });
        await breaker.fire();

        logger.info('User created successfully', { userId: newUser._id });

        // Remove password from response
        newUser.password = undefined;

        res.status(201).json({
            status: 'success',
            user: newUser,
        });
    } catch (err) {
        next(new AppError(err.message, err.statusCode || 400));
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user and explicitly select password
        const user = await User.findOne({ email }).select('+password');

        // Validate password using bcrypt
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        // Generate both access and refresh tokens
        const accessToken = generateToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        // Remove password from response
        user.password = undefined;

        // Set refresh token as HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(200).json({
            status: 'success',
            token: accessToken,
            user,
        });
    } catch (error) {
        logger.error('Login failed', { error: error.message });
        res.status(500).json({
            status: 'error',
            message: 'Login failed',
        });
    }
};

exports.logout = async (req, res, next) => {
    try {
        // Clear refresh token cookie
        res.cookie('refreshToken', '', {
            httpOnly: true,
            expires: new Date(0),
        });

        logger.info('User logged out successfully', { userId: req.user?.id });

        res.status(200).json({
            status: 'success',
            message: 'Logged out successfully',
        });
    } catch (err) {
        next(new AppError('Logout failed', 500));
    }
};

exports.refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            throw new AppError('No refresh token provided', 401);
        }

        // Verify refresh token and get user
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
        );
        const user = await User.findById(decoded.id);

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Generate new tokens
        const newAccessToken = generateToken(user._id, user.role);
        const newRefreshToken = generateRefreshToken(user._id);

        // Set new refresh token cookie
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(200).json({
            status: 'success',
            token: newAccessToken,
        });
    } catch (error) {
        next(new AppError('Invalid refresh token', 401));
    }
};
