const updateCourseModuleService = require('../services/updateCourseModuleService');

exports.updateCourseModule = async (req, res) => {
    try {
        const module = await updateCourseModuleService(
            req.params.courseId,
            req.params.moduleId,
            req.body,
            req.user.id
        );
        res.status(200).json(module);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
