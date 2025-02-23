#!/bin/bash

# Image name
IMAGE_NAME="docker-xvfb-chromium"

# Check if the image exists
if ! docker images | grep -q "$IMAGE_NAME"; then
  echo "Building Docker image..."
  docker build -t "$IMAGE_NAME" .
fi

# Remove existing container if any
# Kill any process listening on port 3333
PID=$(lsof -t -i:3333)
if [ -n "$PID" ]; then
  echo "Killing process $PID listening on port 3333"
  kill -9 "$PID" 2>/dev/null || true
fi

# Remove existing container if any
docker rm -f "$IMAGE_NAME" 2>/dev/null || true

sleep 1  # Wait for port to be released

echo "Starting Docker container..."
docker run -d -p 3333:3333 --name "$IMAGE_NAME" "$IMAGE_NAME"

# Check if the container started successfully
start_time=$(date +%s)
while [[ $(docker inspect -f '{{.State.Running}}' "$IMAGE_NAME" 2>/dev/null) != "true" ]]; do
  sleep 0.1
  current_time=$(date +%s)
  elapsed_time=$((current_time - start_time))
  if [[ "$elapsed_time" -ge 5 ]]; then
    echo "Error: Container failed to start within 5 seconds."
    exit 1
  fi
done

echo "Waiting for server to start..."
sleep 5  # Wait for the server to start

# Open the browser
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open http://localhost:3333
elif [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:3333
elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]]; then
    start http://localhost:3333
else
    echo "Unknown OS. Please open http://localhost:3333 manually."
fi
