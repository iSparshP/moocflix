#!/bin/sh
# Deploy Kong configuration
curl -i -X POST http://localhost:8001/config \
  --data "config=@config/kong.yml"