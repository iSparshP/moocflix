const Course = require('../models/course');

module.exports = {
    async handleGradingCompleted(message) {
        try {
            const course = await Course.findById(message.courseId);
            if (!course) throw new Error('Course not found');

            // Update module assessment grades
            const module = course.modules.id(message.moduleId);
            if (!module) throw new Error('Module not found');

            const assessment = module.assessments?.find(
                (a) => a.assessmentId === message.assessmentId
            );
            if (assessment) {
                assessment.grades = assessment.grades || [];
                assessment.grades.push({
                    studentId: message.studentId,
                    score: message.score,
                    feedback: message.feedback,
                    gradedAt: new Date(),
                });
            }

            await course.save();
            console.log(
                `Grading completed for assessment ${message.assessmentId}`
            );
        } catch (error) {
            console.error('Error handling grading completion:', error);
        }
    },
};
