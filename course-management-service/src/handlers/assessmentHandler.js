const Course = require('../models/course');

module.exports = {
    async handleAssessmentCreation(message) {
        try {
            const { courseId, moduleId, assessmentData } = message;
            const course = await Course.findById(courseId);
            if (!course) throw new Error('Course not found');

            const module = course.modules.id(moduleId);
            if (!module) throw new Error('Module not found');

            module.assessments = module.assessments || [];
            module.assessments.push(assessmentData);
            await course.save();

            console.log(
                `Assessment created for module ${moduleId} in course ${courseId}`
            );
        } catch (error) {
            console.error('Error handling assessment creation:', error);
        }
    },
};
