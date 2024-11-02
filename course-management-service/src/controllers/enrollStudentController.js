const enrollStudentService = require('../services/enrollStudentService');
const handleError = require('../utils/errorHandler');
const logger = require('../utils/logger');

exports.enrollStudent = async (req, res) => {
    try {
        const course = await enrollStudentService(
            req.params.courseId,
            req.user.id
        );

        logger.info('Student enrolled successfully', {
            courseId: req.params.courseId,
            studentId: req.user.id,
            timestamp: new Date(),
            action: 'enroll_student',
        });

        res.status(200).json(course);
    } catch (error) {
        const { status, body } = handleError(error, req);
        res.status(status).json(body);
    }
};
