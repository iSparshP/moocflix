// tests/mocks/axios.js
const mockAxiosResponse = {
    data: {
        valid: true,
        role: 'instructor',
        id: '507f1f77bcf86cd799439011',
    },
};

jest.mock('axios', () => ({
    get: jest.fn().mockResolvedValue(mockAxiosResponse),
}));
