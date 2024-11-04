const helmet = require('helmet');
const config = require('../config/appConfig');

const securityHeaders = [
    helmet(config.security.helmet),
    (req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        next();
    },
];

module.exports = securityHeaders;
