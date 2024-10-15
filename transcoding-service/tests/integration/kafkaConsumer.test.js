const kafka = require("kafka-node");
const { transcodeVideo } = require("../../src/services/transcodeService");

jest.mock("../../src/services/transcodeService");

describe("Kafka Consumer Integration", () => {
  let producer;
  let consumer;

  beforeAll(async () => {
    const client = new kafka.KafkaClient({ kafkaHost: process.env.KAFKA_HOST });
    producer = new kafka.Producer(client);
    await new Promise((resolve) => producer.on("ready", resolve));
    consumer = require("../../src/config/kafka");
  });

  afterAll(() => {
    producer.close();
    consumer.close();
  });

  it("should process incoming messages and call transcodeVideo", (done) => {
    const message = {
      videoId: "test-video-123",
      profile: "high",
    };

    transcodeVideo.mockResolvedValue();

    producer.send(
      [
        {
          topic: process.env.KAFKA_TRANSCODE_TOPIC,
          messages: JSON.stringify(message),
        },
      ],
      async (err) => {
        if (err) {
          done(err);
          return;
        }

        // Wait for the message to be processed
        await new Promise((resolve) => setTimeout(resolve, 1000));

        expect(transcodeVideo).toHaveBeenCalledWith("test-video-123", "high");
        done();
      }
    );
  });
});
