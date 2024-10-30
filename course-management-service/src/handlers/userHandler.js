const Course = require('../models/course');

module.exports = {
    async handleUserCreation(message) {
        try {
            if (message.role === 'student') {
                // Generate course recommendations for new student
                const recommendedCourses = await Course.find()
                    .limit(5)
                    .select('title description instructor');

                console.log(
                    `Generated recommendations for new user ${message.userId}`
                );
                return recommendedCourses;
            }
        } catch (error) {
            console.error('Error handling user creation:', error);
        }
    },

    async handleUserUpdate(message) {
        try {
            if (message.role === 'instructor') {
                // Update instructor info in all their courses
                await Course.updateMany(
                    { instructor: message.userId },
                    {
                        $set: {
                            'instructor.name': message.name,
                            'instructor.email': message.email,
                        },
                    }
                );
                console.log(
                    `Updated instructor info for user ${message.userId}`
                );
            }
        } catch (error) {
            console.error('Error handling user update:', error);
        }
    },
};
