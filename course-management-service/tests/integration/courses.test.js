// tests/integration/courses.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
require('../mocks/axios');

// Mock auth middleware
jest.mock('../../src/middlewares/authMiddleware', () =>
    require('../mocks/authMiddleware')
);

const app = require('../../src/app');
const { createTestCourse } = require('../helpers');

describe('Course Endpoints', () => {
    const mockInstructorId = '507f1f77bcf86cd799439011';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('GET /courses should return all courses', async () => {
        const course = await createTestCourse({ instructor: mockInstructorId });
        const res = await request(app)
            .get('/api/v1/courses')
            .set('Authorization', 'Bearer test-token');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        expect(res.body[0].title).toBe(course.title);
    });

    test('POST /courses/create should create a new course', async () => {
        const courseData = {
            title: faker.word.words(3),
            description: faker.lorem.paragraph(),
        };

        const res = await request(app)
            .post('/api/v1/courses/create')
            .set('Authorization', 'Bearer test-token')
            .send(courseData);

        expect(res.status).toBe(201);
        expect(res.body.title).toBe(courseData.title);
        expect(res.body.instructor.toString()).toBe(mockInstructorId);
    });

    test('POST /courses/create should fail with invalid data', async () => {
        const res = await request(app)
            .post('/api/v1/courses/create')
            .set('Authorization', 'Bearer test-token')
            .send({});

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });
});
