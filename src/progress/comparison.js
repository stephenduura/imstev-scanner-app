import { state } from '../shared/state.js';
import { elements } from '../shared/ui.js';

export function updateCompareImages() {
  if (!elements.compareBeforeSelect || !elements.compareAfterSelect) return;
  const beforeId = elements.compareBeforeSelect.value;
  const afterId = elements.compareAfterSelect.value;

  const beforeScan = state.history.find(s => s.timestamp === beforeId);
  const afterScan = state.history.find(s => s.timestamp === afterId);

  if (beforeScan && afterScan) {
    const fallback = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500";
    elements.compareBeforeImg.src = beforeScan.photo || fallback;
    elements.compareAfterImg.src = afterScan.photo || fallback;
    
    setTimeout(() => {
      if (elements.compareSliderViewport && elements.compareAfterImg) {
        const rect = elements.compareSliderViewport.getBoundingClientRect();
        elements.compareAfterImg.style.width = rect.width + 'px';
      }
    }, 50);
  }
}

export function initSliderComparer() {
  const viewport = elements.compareSliderViewport;
  const container = elements.compareAfterContainer;
  const handle = elements.compareSliderHandle;
  const afterImg = elements.compareAfterImg;

  if (!viewport || !container || !handle || !afterImg) return;

  function updateSlider(clientX) {
    const rect = viewport.getBoundingClientRect();
    const offset = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (offset / rect.width) * 100));
    
    container.style.width = percentage + '%';
    handle.style.left = percentage + '%';
    afterImg.style.width = rect.width + 'px';
  }

  let isDragging = false;

  viewport.addEventListener('mousedown', (e) => {
    isDragging = true;
    updateSlider(e.clientX);
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    updateSlider(e.clientX);
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  viewport.addEventListener('touchstart', (e) => {
    isDragging = true;
    if (e.touches.length > 0) {
      updateSlider(e.touches[0].clientX);
    }
  });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    if (e.touches.length > 0) {
      updateSlider(e.touches[0].clientX);
    }
  });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });

  window.addEventListener('resize', () => {
    const rect = viewport.getBoundingClientRect();
    afterImg.style.width = rect.width + 'px';
  });
}
