# Dockerfile
FROM node:23-alpine3.21

# Install dependencies
RUN apk update && apk add \
    chromium \
    xvfb

# Set up the streaming server
WORKDIR /app
COPY package.json .
COPY server.js .
COPY start.sh .

RUN npm install

# Make the start script executable
RUN chmod +x /app/start.sh

# Default environment variables
ENV DISPLAY=:99
ENV PORT=3333

# Expose the streaming port
EXPOSE 3333

# Set the entrypoint
ENTRYPOINT ["sh", "/app/start.sh"]
