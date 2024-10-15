const kafka = require("kafka-node");
const Consumer = kafka.Consumer;
const client = new kafka.KafkaClient({ kafkaHost: process.env.KAFKA_HOST });

const consumer = new Consumer(
  client,
  [{ topic: process.env.KAFKA_TRANSCODE_TOPIC, partition: 0 }],
  { autoCommit: true }
);

consumer.on("error", (err) => {
  console.error("Kafka Consumer error:", err);
});

module.exports = consumer;
