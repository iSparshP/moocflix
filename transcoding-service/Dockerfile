# Use Node.js base image with FFmpeg
FROM node:22-alpine

# Install FFmpeg and essential dependencies
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++ \
    wget

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Bundle app source
COPY . .

# Create directories for video processing and logs
RUN mkdir -p /app/temp/videos /app/temp/processed /app/logs /app/data && \
    chmod -R 777 /app/temp /app/logs /app/data

# Set environment variables
ENV NODE_ENV=production

# Expose service ports
EXPOSE 3004 3005

# Start the service
CMD ["node", "src/index.js"]