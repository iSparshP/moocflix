#!/bin/sh

# Wait for the Kafka broker to be ready
while ! nc -z kafka 9092; do
  echo "Waiting for Kafka..."
  sleep 1
done

echo "Kafka is up and running"
exec "$@"