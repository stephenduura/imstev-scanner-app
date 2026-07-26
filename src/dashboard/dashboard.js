import { state } from '../shared/state.js';
import { elements } from '../shared/ui.js';
import { renderRoutineSteps } from '../routines/routines.js';
import { renderProductsCarousel } from '../products/products.js';

export function updateWelcomeStats() {
  if (!elements.welcomeStats) return;
  
  const total = state.history.length;
  const hairCount = state.history.filter(s => s.type === 'hair').length;
  const skinCount = state.history.filter(s => s.type === 'skin').length;
  
  elements.welcomeStats.innerHTML = `
    <div class="stat-item">
      <div class="stat-val">${total}</div>
      <div class="stat-label">Total Scans</div>
    </div>
    <div class="stat-item">
      <div class="stat-val">${hairCount}</div>
      <div class="stat-label">Hair Scans</div>
    </div>
    <div class="stat-item">
      <div class="stat-val">${skinCount}</div>
      <div class="stat-label">Skin Scans</div>
    </div>
  `;

  const titleEl = document.querySelector('.welcome-hero h1');
  if (titleEl) {
    if (state.profile && state.profile.name) {
      titleEl.innerHTML = `Welcome, ${state.profile.name}!<br><span>Hair & Skin Scan</span>`;
    } else {
      titleEl.innerHTML = `Personalized AI<br><span>Hair & Skin Scan</span>`;
    }
  }
}

export function renderClientSpecialistView() {
  if (state.profile && state.profile.specialistNotes) {
    elements.welcomeSpecialistText.innerText = state.profile.specialistNotes;
    elements.welcomeSpecialistNotes.style.display = 'flex';
  } else {
    elements.welcomeSpecialistNotes.style.display = 'none';
  }
}

export function renderResultsDashboard(report) {
  const isHair = report.type === 'hair';
  
  elements.resultsHeaderTitle.innerText = report.metrics.type;
  elements.resultsHeaderSubtitle.innerText = isHair 
    ? `${report.metrics.porosity} | ${report.metrics.texture} Texture`
    : `Fitzpatrick ${report.metrics.fitzpatrick} | Undertone: ${report.metrics.undertone}`;
  
  if (isHair) {
    elements.resultsHeaderTitle.style.color = "var(--primary-brown)";
  } else {
    elements.resultsHeaderTitle.style.color = "var(--primary-emerald)";
  }

  elements.resultsMetricGrid.innerHTML = "";
  
  Object.keys(report.metrics.scores).forEach(key => {
    const score = report.metrics.scores[key];
    const card = document.createElement('div');
    
    let label = key.charAt(0).toUpperCase() + key.slice(1);
    if (key === 'darkCircles') label = 'Dark Circles';
    
    let isAlert = false;
    if (isHair) {
      if ((key === 'damage' && score > 40) || (key === 'frizziness' && score > 50) || (key === 'density' && score < 40)) {
        isAlert = true;
      }
    } else {
      if ((key !== 'hydration' && key !== 'texture' && score > 40) || (key === 'hydration' && score < 40)) {
        isAlert = true;
      }
    }
    
    card.className = `metric-card ${isAlert ? 'alert' : ''}`;
    card.innerHTML = `
      <div class="metric-header">
        <span class="metric-title">${label}</span>
        <span class="metric-score-text">${score}%</span>
      </div>
      <div class="metric-bar-bg">
        <div class="metric-bar-fill" style="width: ${score}%"></div>
      </div>
    `;
    elements.resultsMetricGrid.appendChild(card);
  });
  
  renderRoutineSteps(report);
  renderProductsCarousel(report);
  
  elements.resultsHerbalList.innerHTML = "";
  elements.resultsMedicalList.innerHTML = "";
  
  const herbal = report.herbalRecommendations || [
    "Apply organic cold-pressed Tea Tree Oil or Aloe Vera.",
    "Rinse with lukewarm Green Tea infusion to balance sebum.",
    "Use a honey-based botanical mask for natural hydration."
  ];
  const medical = report.medicalRecommendations || [
    "Apply over-the-counter Benzoyl Peroxide (2.5%) spot treatment.",
    "Use a Salicylic Acid (2%) clinical exfoliating wash daily.",
    "Consult a board-certified dermatologist if inflammation worsens."
  ];
  
  herbal.forEach(rec => {
    const li = document.createElement('li');
    li.style.marginBottom = "6px";
    li.innerText = rec;
    elements.resultsHerbalList.appendChild(li);
  });
  
  medical.forEach(rec => {
    const li = document.createElement('li');
    li.style.marginBottom = "6px";
    li.innerText = rec;
    elements.resultsMedicalList.appendChild(li);
  });
}
