const jwt = require('jsonwebtoken');
const { AppError } = require('./errorUtils');
const logger = require('./logger');

/**
 * Generate JWT token for user
 * @param {string} userId - User's ID
 * @param {('student'|'instructor'|'admin')} role - User's role
 * @param {Object} [options] - Token options
 * @returns {string} JWT token
 * @throws {AppError} If token generation fails
 */
exports.generateToken = (userId, role, options = {}) => {
    try {
        const token = jwt.sign(
            {
                id: userId,
                role,
                timestamp: Date.now(),
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '24h',
                algorithm: 'HS256',
                ...options,
            }
        );

        logger.debug('JWT token generated', { userId, role });
        return token;
    } catch (error) {
        logger.error('Token generation failed', {
            userId,
            error: error.message,
        });
        throw new AppError('Failed to generate token', 500);
    }
};

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {AppError} If token is invalid or expired
 */
exports.verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        logger.debug('JWT token verified', { userId: decoded.id });
        return decoded;
    } catch (error) {
        logger.error('Token verification failed', { error: error.message });

        if (error.name === 'TokenExpiredError') {
            throw new AppError('Token has expired', 401);
        }
        if (error.name === 'JsonWebTokenError') {
            throw new AppError('Invalid token', 401);
        }
        throw new AppError('Token validation failed', 401);
    }
};

/**
 * Extract JWT token from authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Extracted token or null if invalid
 */
exports.extractTokenFromHeader = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.debug('No valid authorization header found');
        return null;
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        logger.debug('No token found in authorization header');
        return null;
    }
    return token;
};
