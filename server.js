const express = require('express');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const puppeteer = require('puppeteer-core');

const app = express();
const port = process.env.PORT || 8080;

// Serve the viewer page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Chromium Stream</title>
        <style>
          body { margin: 0; }
          video { width: 100vw; height: 100vh; }
        </style>
      </head>
      <body>
        <video id="video" autoplay playsinline></video>
        <script>
          const ws = new WebSocket('ws://' + window.location.host);
          const video = document.getElementById('video');
          
          ws.onmessage = async (event) => {
            const blob = new Blob([event.data], { type: 'video/webm' });
            try {
              video.srcObject = await blob.stream();
            } catch (e) {
              console.error('Error setting video source:', e);
            }
          };
        </script>
      </body>
    </html>
  `);
});

// Start WebSocket server
const wss = new WebSocket.Server({ server: app.listen(port) });

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));
});

// Start Chromium with Puppeteer
async function startChromium(url) {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--start-maximized'
    ]
  });

  const page = await browser.newPage();
  await page.goto(url);

  // Start streaming
  const stream = await page.evaluate(() => {
    return navigator.mediaDevices.getDisplayMedia({
      video: { cursor: "always" }
    });
  });

  // Handle the stream (implementation depends on your needs)
  // You might want to use WebRTC, or stream directly to clients
}

// Start Chromium with the provided URL
if (process.argv[2]) {
  startChromium(process.argv[2]);
}