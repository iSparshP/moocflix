# Enhanced droplet-user-data.sh
#!/bin/bash

# System updates and requirements
sudo apt-get update
sudo apt-get install -y curl lsb-release

# Install Kong with proper error handling
if ! curl -Lo kong.deb "https://download.konghq.com/gateway-3.x-ubuntu-$(lsb_release -sc)/pool/all/k/kong/kong_3.5.0_amd64.deb"; then
    echo "Failed to download Kong package"
    exit 1
fi

# Create video directories with proper permissions
sudo mkdir -p /var/videos/input
sudo mkdir -p /var/videos/output
sudo chown -R kong:kong /var/videos
sudo chmod 755 /var/videos

# Enhanced Kong configuration
cat > /etc/kong/kong.conf <<EOF
database = off
declarative_config = /etc/kong/kong.yml
proxy_listen = 0.0.0.0:80, 0.0.0.0:443 ssl
admin_listen = 127.0.0.1:8001
log_level = warn
lua_ssl_verify_depth = 1
lua_ssl_trusted_certificate = system

# Performance tuning
nginx_worker_processes = auto
nginx_worker_connections = 2048
EOF

# Enhanced Kong declarative configuration
cat > /etc/kong/kong.yml <<EOF
_format_version: "3.0"
_transform: true

services:
  - name: transcoding-service
    url: http://localhost:3006
    protocol: http
    connect_timeout: 60000
    write_timeout: 60000
    read_timeout: 60000
    retries: 3
    
    routes:
      - name: transcoding-route
        paths:
          - /api/v1/transcode
        strip_path: false
        preserve_host: true
        protocols: 
          - http
          - https
    
    plugins:
      - name: rate-limiting
        config:
          minute: 60
          hour: 1000
          policy: local
          hide_client_headers: false
          
      - name: cors
        config:
          origins: ["*"]
          methods: ["GET", "POST"]
          headers: ["Content-Type", "Authorization"]
          exposed_headers: ["X-Request-ID"]
          
      - name: prometheus
      
      - name: ip-restriction
        config:
          allow: ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
          
    healthchecks:
      active:
        healthy:
          interval: 5
          successes: 1
        unhealthy:
          interval: 5
          failures: 2
          http_failures: 2
          timeout: 1
        http_path: /health/live
        type: http
EOF

# Security headers
cat > /etc/kong/custom-headers.conf <<EOF
header_filter_by_lua_block {
    kong.response.set_header("X-Frame-Options", "DENY")
    kong.response.set_header("X-Content-Type-Options", "nosniff")
    kong.response.set_header("X-XSS-Protection", "1; mode=block")
    kong.response.set_header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    kong.response.clear_header("Server")
}
EOF

# Start and enable Kong
sudo systemctl enable kong
sudo systemctl start kong