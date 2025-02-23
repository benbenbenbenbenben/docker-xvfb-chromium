#!/bin/bash

# Image name
IMAGE_NAME="docker-xvfb-chromium"

# Check if a container with the same name exists
if docker ps -aq --filter "name=$IMAGE_NAME" | grep -q .; then
    docker rm -f "$IMAGE_NAME" 2>/dev/null
fi
# Rebuild
docker build -t docker-xvfb-chromium .

# If the container doesn't exist, start it in interactive mode
echo "Container '$IMAGE_NAME' is not running. Starting it in interactive mode..."
docker run -it -p 3333:3333 --name "$IMAGE_NAME" "$IMAGE_NAME" "https://example.com"

