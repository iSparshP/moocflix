# Use Node.js base image with FFmpeg
FROM node:16-alpine

# Install FFmpeg and essential dependencies
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Bundle app source
COPY . .

# Create directories for video processing
RUN mkdir -p /app/temp/videos /app/temp/processed

# Set environment variables
ENV NODE_ENV=production

# Expose service ports
EXPOSE 3006 3001

# Start the service
CMD ["node", "src/index.js"]