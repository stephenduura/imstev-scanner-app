let cameraStream = null;

export async function startCamera(videoEl) {
  if (cameraStream) {
    stopCamera();
  }

  const constraints = {
    video: {
      facingMode: "user",
      width: { ideal: 1280 },
      height: { ideal: 720 }
    },
    audio: false
  };

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    videoEl.srcObject = cameraStream;
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

export function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
}

export function captureFromVideo(videoEl, canvasEl) {
  if (!videoEl || videoEl.paused || videoEl.ended) return false;

  const ctx = canvasEl.getContext('2d');
  if (!ctx) return false;

  canvasEl.width = videoEl.videoWidth || 640;
  canvasEl.height = videoEl.videoHeight || 480;

  ctx.translate(canvasEl.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return true;
}

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
