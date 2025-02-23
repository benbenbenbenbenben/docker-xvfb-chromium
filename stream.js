// This file handles the WebRTC streaming setup
const startStream = async (url) => {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { cursor: "always" }
  });
  return stream;
};

module.exports = { startStream };