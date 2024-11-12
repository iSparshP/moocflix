# Content Delivery Service API Documentation

## Base URL 
http://your-domain/api/v1

## Health Check Endpoints

### Liveness Check

GET /health/liveness

Checks if the service is alive and running.

**Response:** `200 OK`

### Readiness Check

GET /health/readiness

Checks if the service is ready to accept requests.

**Response:** `200 OK`

## Service Information

- **Port:** 3006
- **Default Replicas:** 3

## Resource Specifications
The service is configured with the following resource limits:
- CPU: 1 core
- Memory: 1GB
- Minimum CPU Request: 500m
- Minimum Memory Request: 512MB

## Environment Variables

| Variable | Description | Default Value |
|----------|-------------|---------------|
| PORT     | Service port | 3006         |

## Notes for Frontend Developers

1. **Base URL Configuration**
   - Always use the base URL prefix `/api/v1` for all API calls
   - For local development, the full URL would be: `http://localhost:3006/api/v1`

2. **Health Checks**
   - The health check endpoints can be used to verify service availability
   - Frontend monitoring tools can utilize these endpoints for service status

3. **Error Handling**
   - Implement proper error handling for cases when the service is not available
   - Use the readiness endpoint to check service availability before making API calls

4. **Best Practices**
   - Implement retry mechanisms for failed requests
   - Add proper timeout handling
   - Consider implementing circuit breakers for production environments

## Service Architecture

The Content Delivery Service is deployed as a Kubernetes service with:
- High availability (3 replicas)
- Resource limits to ensure stable performance
- Health checks for reliability
- Container port exposure on 3006

## Need Help?

For additional support or to report issues:
1. Check the service health endpoints
2. Verify your API endpoint URLs include the correct base path
3. Ensure you're not exceeding any rate limits
4. Contact the backend team with specific error responses

---

**Note:** This documentation is based on the deployment configuration. For specific API endpoints and their specifications, please contact the backend team to provide additional details about available routes, request/response formats, and authentication requirements.