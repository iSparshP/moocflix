MoocFlix: A mooc streaming platform
content-delivery-service is going to be a microservice which is going to carry out these tasks:

Video Streaming: Use streaming protocols (HLS/WebRTC) for real-time video lectures, and manage video uploads and transcoding.
Content Distribution: Store and serve course materials such as PDFs, quizzes, and other multimedia.
Caching Layer: Implement caching for quick access to frequently used content​.


the structure is going to look like this:
/content-delivery-service
│
├── /src
│   ├── /controllers         # HTTP requests (upload video, fetch video)
│   ├── /services
│   │   ├── /uploadService   # Manages video uploads to cloud storage
│   │   └── /transcodeService # Handles video transcoding (via external API)
│   ├── /routes              # Routes (e.g., /upload, /stream)
│   └── /middlewares         # Validation for uploads and streaming
│
├── /config                  # Cloud storage and CDN config
├── /transcoding-jobs        # Jobs for handling transcoding tasks
├── /tests                   # Unit and integration tests
├── package.json             # Dependencies
└── Dockerfile               # Docker setup

these are going to be the routes:
POST   /api/v1/content/upload                     // Upload a video
GET    /api/v1/content/:videoId                   // Fetch video details (like status or metadata)
GET    /api/v1/content/:videoId/stream            // Stream video content
POST   /api/v1/content/:videoId/transcode         // Request transcoding of uploaded video
DELETE /api/v1/content/:videoId/delete            // Delete a video


Technology Stack:
Backend: Node.js (Express)
Database: PostgreSQL, Redis (for caching)
Messaging: Kafka
Storage: Amazon S3
Authentication: OAuth 2.0/JWT (Auth0, Firebase Auth)
Search: Elasticsearch
API Gateway: Kong / AWS API Gateway
Deployment: Docker, Kubernetes
Monitoring: Prometheus, ELK Stack


Content Delivery Service:
Used by:
Course Management Service: To link course material (videos) to specific courses.
User Management Service: To confirm if a user has access to stream specific videos.
API Used:
/api/v1/content/:videoId/stream
/api/v1/content/:videoId
Format:
Course Management uses the Content Delivery API to fetch or stream course materials.

the user user related api will be managed by user-management-service microservice
which will constist of these apis:
POST   /api/v1/users/signup          // Register a new user
POST   /api/v1/users/login           // Authenticate and log in a user
POST   /api/v1/users/logout          // Log out a user
GET    /api/v1/users/profile         // Get current user's profile
PUT    /api/v1/users/profile/update  // Update user profile (name, email, etc.)
DELETE /api/v1/users/deactivate      // Deactivate user account


