const express = require('express');
const WebSocket = require('ws');
const puppeteer = require('puppeteer-core');

const app = express();
const port = process.env.PORT || 3333; // Use port 3333

console.log("starting")

// Serve the viewer page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Chromium Stream</title>
        <style>
          body { margin: 0; }
          img { width: 100vw; height: 100vh; object-fit: cover; }
        </style>
      </head>
      <body>
        <img id="stream" />
        <script>
          const ws = new WebSocket('ws://' + window.location.host);
          const streamImage = document.getElementById('stream');

          ws.onmessage = (event) => {
            streamImage.src = URL.createObjectURL(event.data);
          };
        </script>
      </body>
    </html>
  `);
});

// Start WebSocket server
const wss = new WebSocket.Server({ server: app.listen(port) });

// Handle WebSocket connections and streaming
wss.on('connection', (ws) => {
  console.log('Client connected');

  let page; // Keep track of the page for this connection

  const startStreaming = async (url) => {
    try {
      const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium-browser',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--start-maximized'
        ],
      });

      page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle0' });

      // Send screenshots periodically
      setInterval(async () => {
        try {
          const screenshot = await page.screenshot({ type: 'jpeg', quality: 80 });
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(screenshot);
          }
        } catch (screenshotError) {
          console.error('Error taking screenshot:', screenshotError);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('Error taking screenshot');
          }
        }
      }, 100); // Adjust interval as needed

    } catch (error) {
      console.error('Error launching browser or navigating:', error);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('Error launching browser or navigating');
      }
    }
  };

  ws.on('message', (message) => {
    // Expect a message to contain the URL to navigate
    console.log("Received URL:", message)
    startStreaming(message.toString());
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    if (page) {
      page.close().catch(error => console.error("Error closing page:", error));
    }
  });

  startStreaming("https://example.com")
});
