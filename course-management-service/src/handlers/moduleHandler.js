const Course = require('../models/course');

module.exports = {
    async handleTranscodingCompleted(message) {
        try {
            const course = await Course.findById(message.courseId);
            if (!course) {
                throw new Error('Course not found');
            }

            const module = course.modules.id(message.moduleId);
            if (!module) {
                throw new Error('Module not found');
            }

            // Update module with transcoded video URL
            module.videoUrl = message.transcodedUrl;
            await course.save();

            console.log(
                `Video transcoding completed for module ${message.moduleId}`
            );
        } catch (error) {
            console.error('Error handling transcoding completion:', error);
        }
    },
};
