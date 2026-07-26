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

export function inspectImageQuality(canvasEl) {
  const ctx = canvasEl.getContext('2d');
  if (!ctx) return { ok: false, score: 0, reason: "No drawing context" };

  const w = canvasEl.width;
  const h = canvasEl.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  let totalLuminance = 0;
  let pixelCount = 0;
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i+1];
    const b = data[i+2];
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    totalLuminance += y;
    pixelCount++;
  }
  const avgLuminance = totalLuminance / pixelCount;

  let gradientSum = 0;
  let gradientSamples = 0;
  const rowBytes = w * 4;

  const numSamples = 300;
  const sampleValues = [];
  for (let s = 0; s < numSamples; s++) {
    const x = Math.floor(w * 0.2 + Math.random() * w * 0.6);
    const y = Math.floor(h * 0.2 + Math.random() * h * 0.6);
    const idx = (y * w + x) * 4;

    const val = 0.299 * data[idx] + 0.587 * data[idx+1] + 0.114 * data[idx+2];
    const rightIdx = idx + 4;
    const downIdx = idx + rowBytes;

    if (rightIdx < data.length && downIdx < data.length) {
      const valRight = 0.299 * data[rightIdx] + 0.587 * data[rightIdx+1] + 0.114 * data[rightIdx+2];
      const valDown = 0.299 * data[downIdx] + 0.587 * data[downIdx+1] + 0.114 * data[downIdx+2];
      const grad = Math.abs(val - valRight) + Math.abs(val - valDown);
      sampleValues.push(grad);
      gradientSum += grad;
      gradientSamples++;
    }
  }

  const avgGradient = gradientSum / gradientSamples;
  let varianceSum = 0;
  sampleValues.forEach(g => {
    varianceSum += Math.pow(g - avgGradient, 2);
  });
  const sharpness = Math.sqrt(varianceSum / gradientSamples);

  let ok = true;
  let reason = "Optimal Quality";
  let score = 100;

  if (avgLuminance < 45) {
    ok = false;
    reason = "Poor Lighting: Environment is too dark. Please use a light source or move to a brighter room.";
    score = Math.max(10, Math.round((avgLuminance / 45) * 45));
  } else if (avgLuminance > 230) {
    ok = false;
    reason = "Poor Lighting: Bright glare or overexposure detected. Please scan away from direct harsh light.";
    score = Math.max(10, Math.round(((255 - avgLuminance) / 25) * 45));
  } else {
    const sharpnessNormalized = Math.min(100, Math.round((sharpness / 12) * 100));
    if (sharpnessNormalized < 40) {
      ok = false;
      reason = "Blurry Capture: The image is too blurry. Please hold your camera steady and retake.";
      score = sharpnessNormalized;
    } else {
      score = Math.round(50 + (avgLuminance/255)*25 + (sharpnessNormalized/100)*25);
    }
  }

  return { ok, score, reason, avgLuminance, sharpness };
}
