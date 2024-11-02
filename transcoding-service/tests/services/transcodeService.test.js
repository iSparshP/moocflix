const { transcodeVideo } = require('../../src/services/transcodeService');
const { TranscodingError } = require('../../src/middleware/errorHandler');

jest.mock('fluent-ffmpeg');

describe('Transcoding Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should transcode video successfully', async () => {
        const mockFFmpeg = require('fluent-ffmpeg');
        mockFFmpeg.mockImplementation(() => ({
            output: jest.fn().mockReturnThis(),
            videoCodec: jest.fn().mockReturnThis(),
            size: jest.fn().mockReturnThis(),
            videoBitrate: jest.fn().mockReturnThis(),
            audioBitrate: jest.fn().mockReturnThis(),
            on: jest.fn().mockImplementation(function (event, callback) {
                if (event === 'end') setTimeout(callback, 100);
                return this;
            }),
            run: jest.fn(),
        }));

        const result = await transcodeVideo('test-video', 'default');
        expect(result).toMatch(/test-video-default\.mp4$/);
    });

    it('should handle transcoding errors', async () => {
        const mockFFmpeg = require('fluent-ffmpeg');
        mockFFmpeg.mockImplementation(() => ({
            output: jest.fn().mockReturnThis(),
            videoCodec: jest.fn().mockReturnThis(),
            size: jest.fn().mockReturnThis(),
            videoBitrate: jest.fn().mockReturnThis(),
            audioBitrate: jest.fn().mockReturnThis(),
            on: jest.fn().mockImplementation(function (event, callback) {
                if (event === 'error')
                    setTimeout(
                        () => callback(new Error('Transcoding failed')),
                        100
                    );
                return this;
            }),
            run: jest.fn(),
        }));

        await expect(transcodeVideo('test-video', 'default')).rejects.toThrow(
            TranscodingError
        );
    });
});
