const listCourseStudentsService = require('../services/listCourseStudentsService');
const handleError = require('../utils/errorHandler');
const logger = require('../utils/logger');

exports.listCourseStudents = async (req, res) => {
    try {
        const students = await listCourseStudentsService(req.params.courseId);

        logger.info('Course students listed successfully', {
            courseId: req.params.courseId,
            timestamp: new Date(),
            count: students.length,
        });

        res.status(200).json(students);
    } catch (error) {
        const { status, body } = handleError(error, req);
        res.status(status).json(body);
    }
};
