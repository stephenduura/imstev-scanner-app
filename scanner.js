/**
 * Camera and Image Processing utility module.
 */

let cameraStream = null;

/**
 * Initializes and starts the device camera stream onto the video element.
 * @param {HTMLVideoElement} videoEl
 * @returns {Promise<boolean>} True if successful, false if failed/denied
 */
export async function startCamera(videoEl) {
  if (cameraStream) {
    stopCamera();
  }

  const constraints = {
    video: {
      facingMode: "user", // front camera for self-scanning, fallback is fine
      width: { ideal: 1280 },
      height: { ideal: 720 }
    },
    audio: false
  };

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    videoEl.srcObject = cameraStream;
    // Wait for metadata to load so video can play
    await new Promise((resolve) => {
      videoEl.onloadedmetadata = () => {
        videoEl.play();
        resolve();
      };
    });
    return true;
  } catch (error) {
    console.error("Camera access error:", error);
    return false;
  }
}

/**
 * Stops the current camera stream if active.
 */
export function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
}

/**
 * Captures a snapshot frame from the video element and writes it to the canvas.
 * @param {HTMLVideoElement} videoEl
 * @param {HTMLCanvasElement} canvasEl
 * @returns {boolean} Success state
 */
export function captureFromVideo(videoEl, canvasEl) {
  if (!videoEl || videoEl.paused || videoEl.ended) return false;

  const ctx = canvasEl.getContext('2d');
  if (!ctx) return false;

  // Match canvas dimensions to the actual video resolution
  canvasEl.width = videoEl.videoWidth || 640;
  canvasEl.height = videoEl.videoHeight || 480;

  // Mirror horizontally for self-scan camera feel
  ctx.translate(canvasEl.width, 0);
  ctx.scale(-1, 1);

  ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
  
  // Reset translation
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return true;
}

/**
 * Loads an uploaded file (image) onto the canvas.
 * @param {File} file
 * @param {HTMLCanvasElement} canvasEl
 * @returns {Promise<boolean>}
 */
export function loadUploadedFile(file, canvasEl) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const ctx = canvasEl.getContext('2d');
        if (!ctx) {
          resolve(false);
          return;
        }

        // Limit size for analysis speed while preserving detail
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvasEl.width = w;
        canvasEl.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(true);
      };
      img.onerror = () => resolve(false);
      img.src = event.target.result;
    };
    reader.onerror = () => resolve(false);
    reader.readAsDataURL(file);
  });
}
