const ffmpeg = require("fluent-ffmpeg");
const path = require("path");

const transcodingProfiles = {
  default: { videoBitrate: "1000k", audioBitrate: "128k" },
  high: { videoBitrate: "2000k", audioBitrate: "192k" },
  low: { videoBitrate: "500k", audioBitrate: "64k" },
};

exports.transcodeVideo = (videoId, profile = "default") => {
  console.log(
    `Transcoding video with ID: ${videoId} using profile: ${profile}`
  );

  const inputPath = path.join(process.env.INPUT_VIDEO_PATH, `${videoId}.mp4`);
  const outputPath = path.join(
    process.env.OUTPUT_VIDEO_PATH,
    `${videoId}-transcoded.mp4`
  );

  const { videoBitrate, audioBitrate } =
    transcodingProfiles[profile] || transcodingProfiles.default;

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .videoBitrate(videoBitrate)
      .audioBitrate(audioBitrate)
      .on("end", () => {
        console.log(`Transcoding completed for video ID: ${videoId}`);
        resolve();
      })
      .on("error", (err) => {
        console.error(`Error transcoding video ID: ${videoId}`, err);
        reject(err);
      })
      .run();
  });
};
