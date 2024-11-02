const getCourseModulesService = require('../services/getCourseModulesService');
const handleError = require('../utils/errorHandler');
const logger = require('../utils/logger');

exports.getCourseModules = async (req, res) => {
    try {
        const modules = await getCourseModulesService(req.params.courseId);

        logger.info('Course modules retrieved successfully', {
            courseId: req.params.courseId,
            timestamp: new Date(),
        });

        res.status(200).json(modules);
    } catch (error) {
        const { status, body } = handleError(error, req);
        res.status(status).json(body);
    }
};
