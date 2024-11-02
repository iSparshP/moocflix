module.exports = (duration) => async (req, res, next) => {
    if (req.method !== 'GET') {
        return next();
    }

    const key = `__express__${req.originalUrl}`;
    const cachedResponse = await cache.get(key);

    if (cachedResponse) {
        return res.json(JSON.parse(cachedResponse));
    }

    res.originalJson = res.json;
    res.json = (body) => {
        cache.set(key, JSON.stringify(body), duration);
        res.originalJson(body);
    };
    next();
};
