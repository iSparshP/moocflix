
# Application Documentation

To understand how all the files in the `src` directory and the `transcoding-jobs` folder work together, let's break down the flow and interactions between different components of your application.

## Overview

Your application is a content delivery service that handles video uploads, streaming, transcoding, and deletion. The main components include:

- **Express Server**: Handles HTTP requests and routes.
- **Middlewares**: Validates uploads and streaming requests.
- **Controllers**: Implements the business logic for handling requests.
- **Services**: Provides utility functions for interacting with external services like AWS S3, Kafka, and PostgreSQL.
- **Transcoding Jobs**: Handles the actual transcoding process, typically running as a separate service.

## Directory Structure

```bash
src/
├── config/
│   └── db.js                  # Database and Redis configuration
├── controllers/
│   └── contentController.js   # Business logic for handling content-related requests
├── middlewares/
│   └── validateUpload.js      # Middleware for validating uploads
├── routes/
│   └── contentRoutes.js       # Defines the routes for content-related requests
├── services/
│   ├── uploadService.js       # Handles file uploads to S3
│   ├── transcodeService.js    # Sends transcoding requests to Kafka
├── index.js                   # Entry point for the Express server
transcoding-jobs/
├── transcodeJob.js            # Script to handle the transcoding process
├── transcodeConfig.js         # Configuration for the transcoding process
.env                           # Environment variables
README.md                      # Documentation
```

## How They Work Together

### 1. Express Server (`index.js`)
**Purpose**: Sets up the Express server, applies middleware, and defines routes.

**Flow**:
- Imports necessary modules and middleware.
- Sets up routes using `contentRoutes.js`.
- Starts the server and listens on a specified port.

### 2. Routes (`contentRoutes.js`)
**Purpose**: Defines the API endpoints for handling content-related requests.

**Flow**:
- Imports controllers and middleware.
- Defines routes for uploading, fetching, streaming, transcoding, and deleting videos.
- Uses `validateUpload.js` middleware for the upload route.

### 3. Middlewares (`validateUpload.js`)
**Purpose**: Validates the uploaded files to ensure they meet the required criteria.

**Flow**:
- Uses `multer` to handle file uploads.
- Validates file type and size.
- Passes control to the next middleware or controller if validation is successful.

### 4. Controllers (`contentController.js`)
**Purpose**: Implements the business logic for handling content-related requests.

**Flow**:

- **Upload Video**:
  - Uses `uploadService.js` to upload the video to S3.
  - Saves metadata to PostgreSQL.
  
- **Fetch Video**:
  - Checks Redis cache for video details.
  - Fetches from PostgreSQL if not in cache.
  
- **Stream Video**:
  - Streams video content from the local file system.
  
- **Request Transcoding**:
  - Uses `transcodeService.js` to send a transcoding request to Kafka.
  
- **Delete Video**:
  - Deletes video metadata from PostgreSQL.
  - Deletes the video file from S3.

### 5. Services (`uploadService.js`, `transcodeService.js`)
**Purpose**: Provides utility functions for interacting with external services.

**Flow**:

- **Upload Service (`uploadService.js`)**:
  - Uploads files to S3.
  - Deletes files from S3.
  
- **Transcode Service (`transcodeService.js`)**:
  - Sends transcoding requests to Kafka.

### 6. Transcoding Jobs (`transcoding-jobs/transcodeJob.js`)
**Purpose**: Handles the actual transcoding process, typically running as a separate service.

**Flow**:
- Listens to Kafka for new transcoding requests.
- Downloads the video from S3.
- Transcodes the video using FFmpeg.
- Uploads the transcoded video back to S3.

## Example Flow: Upload and Transcode a Video

### Upload Video:
1. **Client**: Sends a `POST /api/v1/content/upload` request with the video file.
2. **Server**: `index.js` routes the request to `contentRoutes.js`.
3. **Middleware**: `validateUpload.js` validates the upload.
4. **Controller**: `contentController.js` handles the upload logic:
   - Uses `uploadService.js` to upload the video to S3.
   - Saves metadata to PostgreSQL.
5. **Response**: Returns the video metadata to the client.

### Request Transcoding:
1. **Client**: Sends a `POST /api/v1/content/:videoId/transcode` request.
2. **Server**: `index.js` routes the request to `contentRoutes.js`.
3. **Controller**: `contentController.js` handles the transcoding request:
   - Uses `transcodeService.js` to send a transcoding request to Kafka.
4. **Response**: Returns a confirmation to the client.

### Transcoding Job:
1. **Transcoding Service**: `transcoding-jobs/transcodeJob.js` listens to Kafka for new requests.
2. **Process**:
   - Downloads the video from S3.
   - Transcodes the video using FFmpeg.
   - Uploads the transcoded video back to S3.
   - Logs the status of the transcoding process.

## Summary

- **Express Server**: Handles HTTP requests and routes.
- **Middlewares**: Validates uploads and streaming requests.
- **Controllers**: Implements the business logic for handling requests.
- **Services**: Provides utility functions for interacting with external services.
- **Transcoding Jobs**: Handles the actual transcoding process, typically running as a separate service.
