const Course = require('../models/course');

module.exports = {
    async handleUserCreation(message) {
        // Handle new user recommendations
        try {
            const recommendedCourses = await Course.find()
                .limit(5)
                .select('title description');

            // Future implementation: Send recommendations to notification service
            console.log(`Recommendations ready for user ${message.userId}`);
            return recommendedCourses;
        } catch (error) {
            console.error('Error handling user creation:', error);
        }
    },

    async handleAssessmentCreation(message) {
        // Link assessment to course
        try {
            const course = await Course.findById(message.courseId);
            if (!course) {
                throw new Error('Course not found');
            }
            // Future implementation: Update course with assessment info
            console.log(
                `Assessment ${message.assessmentId} linked to course ${message.courseId}`
            );
        } catch (error) {
            console.error('Error handling assessment creation:', error);
        }
    },
};
