const listCourseStudentsService = require('../services/listCourseStudentsService');

exports.listCourseStudents = async (req, res) => {
    try {
        const students = await listCourseStudentsService(req.params.courseId);
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
