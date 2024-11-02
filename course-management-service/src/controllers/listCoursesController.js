const listCoursesService = require('../services/listCoursesService');
const handleError = require('../utils/errorHandler');
const logger = require('../utils/logger');

exports.listCourses = async (req, res) => {
    try {
        const courses = await listCoursesService();

        logger.info('Courses listed successfully', {
            timestamp: new Date(),
            count: courses.length,
        });

        res.status(200).json(courses);
    } catch (error) {
        const { status, body } = handleError(error, req);
        res.status(status).json(body);
    }
};
