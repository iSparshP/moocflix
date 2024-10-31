// src/middleware/security.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});

module.exports = {
    securityMiddleware: [helmet(), limiter, cors()],
};
