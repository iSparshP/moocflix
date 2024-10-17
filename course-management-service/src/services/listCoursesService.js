const Course = require('../models/course');

module.exports = async () => {
    const courses = await Course.find();
    return courses;
};
