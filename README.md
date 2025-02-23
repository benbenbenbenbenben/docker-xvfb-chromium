# docker-xvfb-chromium

This project provides a Docker container that runs Chromium in a virtual X server (Xvfb) and streams the windows/tabs using WebRTC.

## Building the Docker image

To build the Docker image, run the following command in the project directory:

```bash
docker build -t docker-xvfb-chromium .
```

## Running the container

To run the container, you can use the following command:

```bash
docker run -p 3333:3333 docker-xvfb-chromium
```

This command maps port 3333 in the container to port 3333 on the host machine. You may need to adjust the port mapping based on your specific needs. You may also need to set environment variables.

## Usage
Once the container is running, open the following URL in your browser:

```
http://localhost:3333
```
Send the URL you want to display via a websocket message.
