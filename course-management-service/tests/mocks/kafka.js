// tests/mocks/kafka.js
jest.mock('../../src/utils/kafka', () => ({
    sendMessage: jest.fn().mockResolvedValue(true),
}));
