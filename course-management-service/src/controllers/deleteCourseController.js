const deleteCourseService = require('../services/deleteCourseService');
const handleError = require('../utils/errorHandler');
const logger = require('../utils/logger');

exports.deleteCourse = async (req, res) => {
    try {
        await deleteCourseService(req.params.courseId, req.user.id);

        logger.info('Course deleted successfully', {
            courseId: req.params.courseId,
            deletedBy: req.user.id,
        });

        res.status(204).send();
    } catch (error) {
        const { status, body } = handleError(error, req);
        res.status(status).json(body);
    }
};
