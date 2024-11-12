const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');

module.exports = (duration) => async (req, res, next) => {
    if (req.method !== 'GET') {
        return next();
    }

    const key = `__express__${req.originalUrl}`;

    try {
        const cachedResponse = await cacheService.get(key);
        if (cachedResponse) {
            logger.debug(`Cache hit for ${req.originalUrl}`);
            return res.json(cachedResponse);
        }

        res.originalJson = res.json;
        res.json = (body) => {
            cacheService.set(key, body, duration);
            res.originalJson(body);
        };
        next();
    } catch (error) {
        logger.error('Cache middleware error:', error);
        next();
    }
};
