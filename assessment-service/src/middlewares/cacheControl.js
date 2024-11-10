const cacheControl = (duration) => {
    return (req, res, next) => {
        if (req.method === 'GET') {
            res.set('Cache-Control', `public, max-age=${duration}`);
        } else {
            res.set('Cache-Control', 'no-store');
        }
        next();
    };
};

module.exports = { cacheControl };
