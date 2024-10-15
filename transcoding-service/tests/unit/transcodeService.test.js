const path = require("path");
const { transcodeVideo } = require("../../src/services/transcodeService");
const ffmpeg = require("fluent-ffmpeg");

jest.mock("fluent-ffmpeg");

describe("transcodeService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.INPUT_VIDEO_PATH = "/input";
    process.env.OUTPUT_VIDEO_PATH = "/output";
  });

  it("should transcode video with default profile", async () => {
    const mockFfmpeg = {
      output: jest.fn().mockReturnThis(),
      videoBitrate: jest.fn().mockReturnThis(),
      audioBitrate: jest.fn().mockReturnThis(),
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === "end") {
          callback();
        }
        return mockFfmpeg;
      }),
      run: jest.fn(),
    };

    ffmpeg.mockReturnValue(mockFfmpeg);

    await transcodeVideo("test-video-id");

    expect(ffmpeg).toHaveBeenCalledWith(
      path.join("/input", "test-video-id.mp4")
    );
    expect(mockFfmpeg.output).toHaveBeenCalledWith(
      path.join("/output", "test-video-id-transcoded.mp4")
    );
    expect(mockFfmpeg.videoBitrate).toHaveBeenCalledWith("1000k");
    expect(mockFfmpeg.audioBitrate).toHaveBeenCalledWith("128k");
    expect(mockFfmpeg.run).toHaveBeenCalled();
  });

  it("should use high profile when specified", async () => {
    const mockFfmpeg = {
      output: jest.fn().mockReturnThis(),
      videoBitrate: jest.fn().mockReturnThis(),
      audioBitrate: jest.fn().mockReturnThis(),
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === "end") {
          callback();
        }
        return mockFfmpeg;
      }),
      run: jest.fn(),
    };

    ffmpeg.mockReturnValue(mockFfmpeg);

    await transcodeVideo("test-video-id", "high");

    expect(mockFfmpeg.videoBitrate).toHaveBeenCalledWith("2000k");
    expect(mockFfmpeg.audioBitrate).toHaveBeenCalledWith("192k");
  });
});
