# MOOCflix API Gateway

The API Gateway service for MOOCflix platform, built using Kong.

## Services and Ports

- User Management: 3007
- Course Management: 3002
- Content Delivery: 3006
- Notification: 3003
- Assessment: 3001
- Transcoding: 3004

## Configuration

The gateway is configured to route traffic to the following services:

- `/api/v1/users/*` → User Management Service
- `/api/v1/courses/*` → Course Management Service
- `/api/v1/content/*` → Content Delivery Service
- `/api/v1/notifications/*` → Notification Service
- `/api/v1/assessments/*` → Assessment Service
- `/api/v1/transcoding/*` → Transcoding Service

## Setup

1. Install dependencies:
```bash
./scripts/setup.sh
```

2. Start the gateway:
```bash
docker-compose up -d
