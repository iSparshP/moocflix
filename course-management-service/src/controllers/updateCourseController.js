const updateCourseService = require('../services/updateCourseService');

exports.updateCourse = async (req, res) => {
    try {
        const course = await updateCourseService(
            req.params.courseId,
            req.body,
            req.user.id
        );
        res.status(200).json(course);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
