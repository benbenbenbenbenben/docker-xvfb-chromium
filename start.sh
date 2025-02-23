#!/bin/sh
# Start Xvfb
Xvfb :99 -screen 0 1920x1080x24 > /dev/null 2>&1 &

# Start the Node.js server
node server.js "$@"