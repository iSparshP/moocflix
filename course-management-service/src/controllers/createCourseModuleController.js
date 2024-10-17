const createCourseModuleService = require('../services/createCourseModuleService');

exports.createCourseModule = async (req, res) => {
    try {
        const module = await createCourseModuleService(
            req.params.courseId,
            req.body,
            req.user.id
        );
        res.status(201).json(module);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
