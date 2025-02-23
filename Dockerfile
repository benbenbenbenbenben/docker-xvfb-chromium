# Dockerfile
FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    chromium-browser \
    nodejs \
    npm \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Set up the streaming server
WORKDIR /app
COPY package.json .
COPY server.js .
COPY start.sh .
COPY stream.js .

RUN npm install

# Make the start script executable
RUN chmod +x /app/start.sh

# Default environment variables
ENV DISPLAY=:99
ENV PORT=8080

# Expose the streaming port
EXPOSE 8080

# Set the entrypoint
ENTRYPOINT ["/app/start.sh"]