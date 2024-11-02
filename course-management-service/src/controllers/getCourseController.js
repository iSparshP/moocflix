const getCourseService = require('../services/getCourseService');
const handleError = require('../utils/errorHandler');
const logger = require('../utils/logger');

exports.getCourse = async (req, res) => {
    try {
        const course = await getCourseService(req.params.courseId);

        logger.info('Course retrieved successfully', {
            courseId: req.params.courseId,
            timestamp: new Date(),
        });

        res.status(200).json(course);
    } catch (error) {
        const { status, body } = handleError(error, req);
        res.status(status).json(body);
    }
};
