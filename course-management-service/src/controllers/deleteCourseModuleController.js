const deleteCourseModuleService = require('../services/deleteCourseModuleService');
const handleError = require('../utils/errorHandler');
const logger = require('../utils/logger');

exports.deleteCourseModule = async (req, res) => {
    try {
        await deleteCourseModuleService(
            req.params.courseId,
            req.params.moduleId,
            req.user.id
        );

        logger.info('Course module deleted successfully', {
            courseId: req.params.courseId,
            moduleId: req.params.moduleId,
            deletedBy: req.user.id,
        });

        res.status(204).send();
    } catch (error) {
        const { status, body } = handleError(error, req);
        res.status(status).json(body);
    }
};
