# Use Node.js base image with FFmpeg
FROM node:16-alpine

# Install FFmpeg and other required dependencies
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++ \
    jpeg-dev \
    cairo-dev \
    giflib-dev \
    pango-dev \
    libtool \
    autoconf \
    automake

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Create directories for temporary video processing
RUN mkdir -p /app/temp/videos
RUN mkdir -p /app/temp/processed

# Set environment variables
ENV NODE_ENV=production
ENV KAFKA_HOST=kafka:9092
ENV KAFKA_TRANSCODE_TOPIC=video-transcoding
ENV HEALTH_CHECK_PORT=3001

# Add wait-for-kafka script
COPY wait-for-kafka.sh /wait-for-kafka.sh
RUN chmod +x /wait-for-kafka.sh

# Expose ports for the service and health check
EXPOSE 3006 3001

# Wait for Kafka to be ready before starting the service
CMD ["/wait-for-kafka.sh", "node", "src/index.js"]