// course-management-service/src/controllers/createCourseController.js
const createCourseService = require('../services/createCourseService');

exports.createCourse = async (req, res) => {
    try {
        const course = await createCourseService(req.body, req.user.id);
        res.status(201).json(course);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
