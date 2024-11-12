const errorHandler = require('./errorHandler');
const validateRequest = require('./validateRequest');
const videoUpload = require('./videoUpload');
const cache = require('./cache');
const metrics = require('./metrics');
const { authenticate, authorize } = require('./auth');

module.exports = {
    errorHandler,
    validateRequest,
    videoUpload,
    cache,
    metrics,
    authenticate,
    authorize,
};
