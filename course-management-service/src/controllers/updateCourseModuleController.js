const updateCourseModuleService = require('../services/updateCourseModuleService');
const handleError = require('../utils/errorHandler');
const logger = require('../utils/logger');

exports.updateCourseModule = async (req, res) => {
    try {
        const module = await updateCourseModuleService(
            req.params.courseId,
            req.params.moduleId,
            req.body,
            req.user.id
        );

        logger.info('Course module updated successfully', {
            courseId: req.params.courseId,
            moduleId: req.params.moduleId,
            updatedBy: req.user.id,
            timestamp: new Date(),
        });

        res.status(200).json(module);
    } catch (error) {
        const { status, body } = handleError(error, req);
        res.status(status).json(body);
    }
};
