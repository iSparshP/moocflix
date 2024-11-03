const request = require('supertest');
const app = require('../src/index');
const { sequelize } = require('../src/models/Notification');

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

afterAll(async () => {
    await sequelize.close();
});

describe('Notification API', () => {
    it('should send a push notification', async () => {
        const response = await request(app)
            .post('/api/v1/notifications/sendPush')
            .send({
                userId: '123',
                title: 'Test',
                body: 'This is a test',
                token: 'testToken',
            });
        expect(response.status).toBe(200);
    });

    it('should update notification preferences', async () => {
        const response = await request(app)
            .post('/api/v1/notifications/preferences')
            .send({ userId: '123', preferences: { email: true, push: false } });
        expect(response.status).toBe(200);
    });

    it('should send an email notification', async () => {
        const response = await request(app)
            .post('/api/v1/notifications/sendEmail')
            .send({
                userId: '123',
                email: 'test@example.com',
                subject: 'Test',
                body: 'This is a test',
            });
        expect(response.status).toBe(200);
    });

    it('should get notification history', async () => {
        const response = await request(app)
            .get('/api/v1/notifications/history')
            .query({ userId: '123' });
        expect(response.status).toBe(200);
    });
});
