FROM kong:latest

# Copy configuration files
COPY ./config /usr/local/kong/config

# Set environment variables
ENV KONG_DATABASE=postgres
ENV KONG_PG_HOST=kong-database
ENV KONG_PG_USER=kong
ENV KONG_PG_PASSWORD=kong_pass
ENV KONG_PROXY_ACCESS_LOG=/dev/stdout
ENV KONG_ADMIN_ACCESS_LOG=/dev/stdout
ENV KONG_PROXY_ERROR_LOG=/dev/stderr
ENV KONG_ADMIN_ERROR_LOG=/dev/stderr
ENV KONG_ADMIN_LISTEN=0.0.0.0:8001
ENV KONG_DECLARATIVE_CONFIG=/usr/local/kong/config/kong.yml

# Expose ports
EXPOSE 8000 8001 8443 8444

# Use declarative configuration
ENV KONG_DATABASE=off
ENV KONG_DECLARATIVE_CONFIG=/usr/local/kong/config/kong.yml

# Start Kong
CMD ["kong", "docker-start"]
