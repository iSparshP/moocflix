// tests/authController.test.js
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const userRoutes = require('../src/routes/userRoutes');
const User = require('../src/models/User');

dotenv.config();

const app = express();
app.use(express.json());
app.use('/api/v1/users', userRoutes);

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Auth Controller', () => {
    let token;

    it('should sign up a new user', async () => {
        const res = await request(app).post('/api/v1/users/signup').send({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'password123',
        });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('user');
    });

    it('should log in an existing user', async () => {
        const res = await request(app).post('/api/v1/users/login').send({
            email: 'john@example.com',
            password: 'password123',
        });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        token = res.body.token;
    });

    it('should log out a user', async () => {
        const res = await request(app)
            .post('/api/v1/users/logout')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toBe('Logged out');
    });
});
