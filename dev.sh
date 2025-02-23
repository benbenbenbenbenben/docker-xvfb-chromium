#!/bin/bash

# Image name
IMAGE_NAME="docker-xvfb-chromium"

# Check if a container with the same name exists
if docker ps -aq --filter "name=$IMAGE_NAME" | grep -q .; then
  read -r -p "Container '$IMAGE_NAME' already exists. Remove it and start a new one? [y/N]: " response
  if [[ "$response" =~ ^([yY][eE][sS]|[yY]) ]]; then
    docker rm -f "$IMAGE_NAME" 2>/dev/null
    # Rebuild
    docker build -t docker-xvfb-chromium .
    # Start
    echo "Starting container '$IMAGE_NAME' in interactive mode..."
    docker run -it -p 3333:3333 --name "$IMAGE_NAME" "$IMAGE_NAME" /bin/bash
  else
    echo "Exiting."
    exit 0
  fi
else
  # If the container doesn't exist, start it in interactive mode
  echo "Container '$IMAGE_NAME' is not running. Starting it in interactive mode..."
  docker run -it -p 3333:3333 --name "$IMAGE_NAME" --entry-point /bin/bash "$IMAGE_NAME" "https://example.com"
fi
