// tests/mocks/authMiddleware.js
const mockAuthMiddleware = (req, res, next) => {
    req.user = {
        id: '507f1f77bcf86cd799439011', // Mock user ID
        role: 'instructor',
    };
    next();
};

module.exports = mockAuthMiddleware;
