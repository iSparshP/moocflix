const Course = require('../models/course');

module.exports = {
    async handleSubmissionCompleted(message) {
        try {
            const course = await Course.findById(message.courseId);
            if (!course) throw new Error('Course not found');

            // Record submission in course module
            const module = course.modules.id(message.moduleId);
            if (!module) throw new Error('Module not found');

            const assessment = module.assessments?.find(
                (a) => a.assessmentId === message.assessmentId
            );
            if (assessment) {
                assessment.submissions = assessment.submissions || [];
                assessment.submissions.push({
                    studentId: message.studentId,
                    submittedAt: new Date(),
                    status: 'submitted',
                });
            }

            await course.save();
            console.log(
                `Submission recorded for assessment ${message.assessmentId}`
            );
        } catch (error) {
            console.error('Error handling submission:', error);
        }
    },
};
