const Course = require('../models/course');

module.exports = async (courseId) => {
    const course = await Course.findById(courseId).select('modules');
    if (!course) {
        throw new Error('Course not found');
    }
    return course.modules;
};
