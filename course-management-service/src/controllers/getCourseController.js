const getCourseService = require('../services/getCourseService');

exports.getCourse = async (req, res) => {
    try {
        const course = await getCourseService(req.params.courseId);
        res.status(200).json(course);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
