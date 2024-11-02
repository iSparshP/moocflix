// course-management-service/src/controllers/createCourseController.js
const createCourseService = require('../services/createCourseService');
const handleError = require('../utils/errorHandler');
const logger = require('../utils/logger');

exports.createCourse = async (req, res) => {
    try {
        const course = await createCourseService(req.body, req.user.id);

        logger.info('Course created successfully', {
            courseId: course._id,
            instructorId: req.user.id,
            title: course.title,
        });

        res.status(201).json(course);
    } catch (error) {
        const { status, body } = handleError(error, req);
        res.status(status).json(body);
    }
};
