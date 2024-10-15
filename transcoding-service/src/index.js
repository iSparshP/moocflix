const consumer = require("./config/kafka");
const { transcodeVideo } = require("./services/transcodeService");

consumer.on("message", async (message) => {
  try {
    const { videoId, profile = "default" } = JSON.parse(message.value);
    if (!videoId) {
      throw new Error("Invalid message: missing videoId");
    }
    console.log(`Received transcoding request for video ID: ${videoId}`);
    await transcodeVideo(videoId, profile);
  } catch (error) {
    console.error(`Error processing message:`, error);
  }
});

process.on("SIGINT", () => {
  console.log("Gracefully shutting down...");
  consumer.close(true, () => {
    console.log("Kafka consumer closed");
    process.exit(0);
  });
});

console.log("Transcoding service is running and listening for Kafka messages.");
