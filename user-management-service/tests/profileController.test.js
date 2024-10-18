// tests/profileController.test.js
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const profileRoutes = require('../src/routes/profileRoutes');
const User = require('../src/models/User');

dotenv.config();

const app = express();
app.use(express.json());
app.use('/api/v1/profile', profileRoutes);

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    // Create a test user and get a token
    const res = await request(app).post('/api/v1/users/signup').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
    });
    token = res.body.token;
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Profile Controller', () => {
    let token;

    it('should get the user profile', async () => {
        const res = await request(app)
            .get('/api/v1/profile/profile')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('user');
    });

    it('should update the user profile', async () => {
        const res = await request(app)
            .put('/api/v1/profile/update')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'John Updated',
                email: 'john.updated@example.com',
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('user');
    });

    it('should deactivate the user account', async () => {
        const res = await request(app)
            .delete('/api/v1/profile/deactivate')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toBe('Account deactivated');
    });
});
