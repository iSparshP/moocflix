# API Gateway with Kong

This project sets up an API Gateway using Kong to manage requests, route them to the correct microservices, and secure access to endpoints.

## Microservices

- User Management
- Course Management
- Content Delivery
- Assessment
- Transcoding
- Notification

## Configuration

The configuration files for Kong are located in the `config` directory. Each microservice has its own configuration file in the `services` directory, and the routes are defined in the `routes` directory.

## Plugins

The following plugins are configured for the API Gateway:

- Rate Limiting
- JWT Authentication
- Logging
- Circuit Breaker

## Deployment

To deploy the Kong configuration, run the following script:

```sh
./scripts/deploy-kong-config.sh