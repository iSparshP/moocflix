const deleteCourseModuleService = require('../services/deleteCourseModuleService');

exports.deleteCourseModule = async (req, res) => {
    try {
        await deleteCourseModuleService(
            req.params.courseId,
            req.params.moduleId,
            req.user.id
        );
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
