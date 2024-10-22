MoocFlix: A mooc streaming platform
notification-service is a microservice responsible for handling notifications across the platform.

Structure:
/notification-service
│
├── /src
│   ├── /controllers         
│   │   └── notificationController.js    # Handle requests for sending and managing notifications
│   ├── /models              
│   │   └── Notification.js              # Define schema for notification storage or tracking
│   ├── /services            
│   │   └── notificationService.js       # Core logic for handling notifications (SMTP using Mailgun)
│   ├── /routes              
│   │   └── notificationRoutes.js        # API routes for managing notifications
│   ├── /middlewares         
│   │   └── validateNotification.js      # Validate inputs and format notifications
│   └── /subscribers                     # Listen to Kafka events for sending notifications
│   │   └── kafkaConsumer.js             # Consume messages from other services
│   └── index.js                         # Index file
│
├── /config                  
│   ├── smtpConfig.js                    # SMTP server configuration
│   ├── pushNotificationConfig.js        # Push notification service config (Firebase)
│   └── kafkaConfig.js                   # Kafka configuration for event listening
├── .env                                 # Environment file to keep environment variables
├── /tests                   
│   └── notification.test.js             # Unit tests for sending notifications
├── package.json             
└── Dockerfile


API Routes:
POST   /api/v1/notifications/sendPush     // Send a push notification
POST   /api/v1/notifications/preferences  // Update user notification preferences
POST   /api/v1/notifications/sendEmail    // Send an email notification
GET    /api/v1/notifications/history      // Get a user's notification history

Kafka Integration:
The notification service will consume messages from the following Kafka topics:
- Assessment-Creation
- Submission-Completed
- Grading-Completed
- Course-Creation
- Course-Update
- Course-Deletion
- Module-Creation
- Module-Update
- Student-Enrolled
- Transcoding-Completed
- User-Creation
- User-Update

Event-Driven Notification Triggers:
The Notification Service will listen for these events and send corresponding notifications:
- New assessment created
- Student submitted an assessment
- Assessment graded
- New course created
- New user created
- User profile updated
- Course updated or deleted
- New module added to a course
- Student enrolled in a course
- Video transcoding completed

Push Notifications:
Implement push notifications using Firebase Cloud Messaging (FCM) for real-time notifications to mobile and web applications.

Notification History:
Store sent notifications in PostgreSQL using the Notification model. This allows tracking and retrieving notification history via GET /api/v1/notifications/history.

Notification Preferences:
Implement a system for users to set their notification preferences (email, push, or both) for different types of events through POST /api/v1/notifications/preferences.

Process Flow:
1. Kafka events are consumed by kafkaConsumer.js
2. Based on the event type, notificationService.js determines the type of notification to send
3. notificationController.js handles the actual sending of notifications
4. Sent notifications are stored in the database for history tracking
5. Other services (Assessment, Course Management, Content Delivery, and User Management) produce Kafka messages that trigger notifications
6. For each event type, specific logic is applied:
   - Assessment-Creation: Notify enrolled students about new assessments
   - Submission-Completed: Notify instructors about new submissions
   - Grading-Completed: Notify students about their grades
   - Course-Creation/Update/Deletion: Notify enrolled students about course changes
   - Module-Creation/Update: Notify enrolled students about new or updated course content
   - Student-Enrolled: Welcome notification to newly enrolled students
   - Transcoding-Completed: Notify course creators about video processing completion
   - User-Creation/Update: Notify users about account changes or welcome new users

Transcoding Service Integration:
The Notification Service listens for the 'Transcoding-Completed' Kafka topic produced by the Transcoding Service. When a video has been successfully transcoded, the Notification Service sends appropriate notifications to relevant users (e.g., course instructors or students).

Notification Delivery:
1. Based on user preferences, determine the delivery method (email, push, or both)
2. For email notifications:
   - Use SMTP configuration from smtpConfig.js
   - Apply email templates based on notification type
   - Send emails using a reliable email delivery service (e.g., Mailgun)
3. For push notifications:
   - Use Firebase Cloud Messaging (FCM) configuration from pushNotificationConfig.js
   - Format push notification payload based on notification type
   - Send push notifications to user devices
4. Implement retry logic for failed notifications with exponential backoff
5. Log all notification attempts, successes, and failures for monitoring and debugging

Additional Features:
- Implement notification templates for different event types
- Add rate limiting to prevent overwhelming users with notifications
- Implement batching for non-urgent notifications
- Add analytics tracking for notification delivery rates and user engagement