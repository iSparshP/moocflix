const updateCourseService = require('../services/updateCourseService');
const handleError = require('../utils/errorHandler');
const logger = require('../utils/logger');

exports.updateCourse = async (req, res) => {
    try {
        const course = await updateCourseService(
            req.params.courseId,
            req.body,
            req.user.id
        );

        logger.info('Course updated successfully', {
            courseId: req.params.courseId,
            updatedBy: req.user.id,
            timestamp: new Date(),
        });

        res.status(200).json(course);
    } catch (error) {
        const { status, body } = handleError(error, req);
        res.status(status).json(body);
    }
};
