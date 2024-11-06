const { AppError } = require('../utils/errorUtils');

const timeout = (seconds = 30) => {
    return (req, res, next) => {
        const timeoutId = setTimeout(() => {
            next(new AppError('Request timeout', 408));
        }, seconds * 1000);

        res.on('finish', () => {
            clearTimeout(timeoutId);
        });

        next();
    };
};

module.exports = timeout;
