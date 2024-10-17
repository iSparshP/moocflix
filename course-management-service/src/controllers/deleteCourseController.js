const deleteCourseService = require('../services/deleteCourseService');

exports.deleteCourse = async (req, res) => {
    try {
        await deleteCourseService(req.params.courseId, req.user.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
