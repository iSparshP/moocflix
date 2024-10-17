const listCoursesService = require('../services/listCoursesService');

exports.listCourses = async (req, res) => {
    try {
        const courses = await listCoursesService();
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
