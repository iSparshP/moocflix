// tests/helpers.js
const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');
const Course = require('../src/models/course');

const generateCourse = (instructorId = new mongoose.Types.ObjectId()) => ({
    title: faker.word.words(3),
    description: faker.lorem.paragraph(),
    instructor: instructorId,
    modules: [
        {
            title: faker.word.words(2),
            content: faker.lorem.paragraph(),
        },
    ],
});

const createTestCourse = async (overrides = {}) => {
    const course = new Course({
        ...generateCourse(),
        ...overrides,
    });
    await course.save();
    return course;
};

module.exports = {
    generateCourse,
    createTestCourse,
};
