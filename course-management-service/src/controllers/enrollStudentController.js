const enrollStudentService = require('../services/enrollStudentService');

exports.enrollStudent = async (req, res) => {
    try {
        const course = await enrollStudentService(
            req.params.courseId,
            req.user.id
        );
        res.status(200).json(course);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
