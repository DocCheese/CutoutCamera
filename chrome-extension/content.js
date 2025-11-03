// Content script injected into pages to manage the webcam overlay.

// We hold a reference to the video element and its media stream. These
// variables live in the page context so they persist as long as the page
// remains loaded. When the extension instructs us to show or hide the overlay
// we either start or stop the webcam and modify the video element's display.
let webcamVideo = null;
let webcamStream = null;

/**
 * Create the overlay element if it does not already exist. The overlay is a
 * <video> element styled to appear as a circular picture-in-picture in the
 * bottom‑right corner of the page. When called repeatedly it simply returns
 * the existing element.
 *
 * @returns {HTMLVideoElement} The overlay video element.
 */
function getOrCreateOverlay() {
  if (webcamVideo) {
    return webcamVideo;
  }
  // Create the video element and assign an id so we can find it later.
  const video = document.createElement('video');
  video.id = 'webcam-overlay';
  video.autoplay = true;
  video.muted = true; // Mute audio to prevent feedback.
  video.style.position = 'fixed';
  video.style.bottom = '10px';
  video.style.right = '10px';
  video.style.width = '150px';
  video.style.height = '150px';
  video.style.borderRadius = '50%';
  video.style.objectFit = 'cover';
  video.style.zIndex = 2147483647; // Large z-index to appear above other content.
  video.style.boxShadow = '0 0 8px rgba(0, 0, 0, 0.3)';
  video.style.backgroundColor = '#000';
  document.body.appendChild(video);
  webcamVideo = video;
  return video;
}

/**
 * Show the webcam overlay. If it's already visible nothing happens. This
 * function requests access to the user's webcam via getUserMedia. On success
 * the stream is attached to the video element. On failure an error is logged
 * and the overlay is hidden.
 */
async function showOverlay() {
  const video = getOrCreateOverlay();
  if (webcamStream) {
    // If we already have a stream simply show the element.
    video.style.display = 'block';
    return;
  }
  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    video.srcObject = webcamStream;
    video.play();
  } catch (err) {
    console.error('Failed to access webcam:', err);
    // Hide overlay on error.
    hideOverlay();
  }
}

/**
 * Hide the webcam overlay. This stops the media stream and hides the video
 * element. If there is no overlay or stream then nothing happens.
 */
function hideOverlay() {
  if (webcamVideo) {
    webcamVideo.style.display = 'none';
  }
  if (webcamStream) {
    // Stop each track to release the camera.
    webcamStream.getTracks().forEach((track) => track.stop());
    webcamStream = null;
  }
}

// Listen for messages from the background script. The message includes an
// `action` property of either 'show' or 'hide' which triggers the
// corresponding behaviour.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.action === 'show') {
    showOverlay();
  } else if (message && message.action === 'hide') {
    hideOverlay();
  }
});