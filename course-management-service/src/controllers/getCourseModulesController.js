const getCourseModulesService = require('../services/getCourseModulesService');

exports.getCourseModules = async (req, res) => {
    try {
        const modules = await getCourseModulesService(req.params.courseId);
        res.status(200).json(modules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
