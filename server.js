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
          body { margin: 0; position: relative; }
          #stream { 
            width: 100vw; 
            height: 100vh; 
            object-fit: cover;
            cursor: pointer;
          }
          .click-indicator {
            position: absolute;
            width: 10px;
            height: 10px;
            background: rgba(255, 0, 0, 0.5);
            border-radius: 50%;
            pointer-events: none;
            transform: translate(-50%, -50%);
            animation: click-animation 0.5s ease-out forwards;
          }
          @keyframes click-animation {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
            100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
          }
        </style>
      </head>
      <body>
        <img id="stream" />
        <script>
          const ws = new WebSocket('ws://' + window.location.host);
          const streamImage = document.getElementById('stream');
          let naturalWidth = 0;
          let naturalHeight = 0;

          // Handle incoming screenshots
          ws.onmessage = (event) => {
            if (event.data instanceof Blob) {
              const newUrl = URL.createObjectURL(event.data);
              // Load image in memory first to get dimensions
              const tempImage = new Image();
              tempImage.onload = () => {
                naturalWidth = tempImage.naturalWidth;
                naturalHeight = tempImage.naturalHeight;
                streamImage.src = newUrl;
              };
              tempImage.src = newUrl;
            }
          };

          // Transform coordinates from client to actual page dimensions
          function transformCoordinates(clientX, clientY) {
            const rect = streamImage.getBoundingClientRect();
            const scaleX = naturalWidth / rect.width;
            const scaleY = naturalHeight / rect.height;
            
            const x = Math.round((clientX - rect.left) * scaleX);
            const y = Math.round((clientY - rect.top) * scaleY);
            
            return { x, y };
          }

          // Show click animation
          function showClickIndicator(x, y) {
            const indicator = document.createElement('div');
            indicator.className = 'click-indicator';
            indicator.style.left = x + 'px';
            indicator.style.top = y + 'px';
            document.body.appendChild(indicator);
            setTimeout(() => indicator.remove(), 500);
          }

          // Event handlers
          streamImage.addEventListener('mousemove', (e) => {
            const coords = transformCoordinates(e.clientX, e.clientY);
            ws.send(JSON.stringify({
              type: 'event',
              event: 'mousemove',
              ...coords
            }));
          });

          streamImage.addEventListener('mousedown', (e) => {
            const coords = transformCoordinates(e.clientX, e.clientY);
            showClickIndicator(e.clientX, e.clientY);
            ws.send(JSON.stringify({
              type: 'event',
              event: 'mousedown',
              button: e.button,
              ...coords
            }));
          });

          streamImage.addEventListener('mouseup', (e) => {
            const coords = transformCoordinates(e.clientX, e.clientY);
            ws.send(JSON.stringify({
              type: 'event',
              event: 'mouseup',
              button: e.button,
              ...coords
            }));
          });

          // Touch events
          streamImage.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const coords = transformCoordinates(touch.clientX, touch.clientY);
            showClickIndicator(touch.clientX, touch.clientY);
            ws.send(JSON.stringify({
              type: 'event',
              event: 'mousedown',
              ...coords
            }));
          });

          streamImage.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            const coords = transformCoordinates(touch.clientX, touch.clientY);
            ws.send(JSON.stringify({
              type: 'event',
              event: 'mouseup',
              ...coords
            }));
          });

          streamImage.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const coords = transformCoordinates(touch.clientX, touch.clientY);
            ws.send(JSON.stringify({
              type: 'event',
              event: 'mousemove',
              ...coords
            }));
          });
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

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'event' && page) {
        // Handle mouse/touch events
        switch (data.event) {
          case 'mousemove':
            await page.mouse.move(data.x, data.y);
            break;
          case 'mousedown':
            await page.mouse.move(data.x, data.y);
            await page.mouse.down({ button: data.button || 'left' });
            break;
          case 'mouseup':
            await page.mouse.move(data.x, data.y);
            await page.mouse.up({ button: data.button || 'left' });
            break;
        }
      } else {
        // Handle URL navigation
        console.log("Received URL:", message);
        startStreaming(message.toString());
      }
    } catch (error) {
      if (message.type !== 'Buffer') {
        console.error('Error handling message:', error);
      }
      // If message is not JSON, treat it as URL (backward compatibility)
      startStreaming(message.toString());
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    if (page) {
      page.close().catch(error => console.error("Error closing page:", error));
    }
  });

  startStreaming("https://example.com")
});
