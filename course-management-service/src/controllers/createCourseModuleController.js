const createCourseModuleService = require('../services/createCourseModuleService');
const handleError = require('../utils/errorHandler');
const logger = require('../utils/logger');

exports.createCourseModule = async (req, res) => {
    try {
        const module = await createCourseModuleService(
            req.params.courseId,
            req.body,
            req.user.id
        );

        logger.info('Course module created successfully', {
            courseId: req.params.courseId,
            createdBy: req.user.id,
        });

        res.status(201).json(module);
    } catch (error) {
        const { status, body } = handleError(error, req);
        res.status(status).json(body);
    }
};
