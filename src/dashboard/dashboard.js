import { state } from '../shared/state.js';
import { elements, showView } from '../shared/ui.js';
import { renderRoutineSteps } from '../routines/routines.js';
import { renderProductsCarousel } from '../products/products.js';

export function updateWelcomeStats() {
  // Update Health scores from history
  const skinScans = state.history.filter(s => s.type === 'skin');
  const hairScans = state.history.filter(s => s.type === 'hair');

  const scoreSkinEl = document.getElementById('dash-score-skin');
  const scoreHairEl = document.getElementById('dash-score-hair');
  const scoreScalpEl = document.getElementById('dash-score-scalp');

  if (scoreSkinEl) {
    if (skinScans.length > 0) {
      scoreSkinEl.innerText = `${skinScans[0].metrics.scores.hydration}%`;
    } else {
      scoreSkinEl.innerText = "--";
    }
  }

  if (scoreHairEl) {
    if (hairScans.length > 0) {
      const h = hairScans[0].metrics.scores;
      const avgHealth = 100 - Math.round((h.frizziness + h.damage) / 2);
      scoreHairEl.innerText = `${avgHealth}%`;
    } else {
      scoreHairEl.innerText = "--";
    }
  }

  if (scoreScalpEl) {
    if (hairScans.length > 0) {
      scoreScalpEl.innerText = `${hairScans[0].metrics.scores.density}%`;
    } else {
      scoreScalpEl.innerText = "--";
    }
  }

  // Populate Today's Routine List
  populateDashboardRoutine(skinScans[0] || hairScans[0]);

  // Populate Active Goals
  populateDashboardGoals();

  // Populate Achievements
  populateAchievements(skinScans.length + hairScans.length);

  // Populate Recent Timeline
  populateRecentTimeline();

  // Next recommended check-in calculation
  const nextScanTextEl = document.getElementById('dash-next-scan-text');
  if (nextScanTextEl) {
    if (state.history.length > 0) {
      const lastScanDate = new Date(state.history[0].timestamp);
      const diffDays = Math.round((Date.now() - lastScanDate.getTime()) / (1000 * 60 * 60 * 24));
      const remaining = Math.max(0, 7 - diffDays);
      if (remaining === 0) {
        nextScanTextEl.innerText = "Suggested Scan: Check-in recommended today!";
        nextScanTextEl.style.color = "var(--primary-brown)";
      } else {
        nextScanTextEl.innerText = `Suggested Scan: In ${remaining} day${remaining > 1 ? 's' : ''} (Weekly Check-in)`;
        nextScanTextEl.style.color = "var(--text-secondary)";
      }
    } else {
      nextScanTextEl.innerText = "Suggested Scan: Complete your first scan today.";
    }
  }

  // Update personalized title name
  const titleEl = document.querySelector('.welcome-hero h1');
  if (titleEl) {
    if (state.profile && state.profile.name) {
      titleEl.innerHTML = `Welcome, ${state.profile.name}!<br><span>Hair & Skin Scan</span>`;
    } else {
      titleEl.innerHTML = `Personalized AI<br><span>Hair & Skin Scan</span>`;
    }
  }
}

function populateDashboardRoutine(latestScan) {
  const stepsListEl = document.getElementById('dash-routine-steps-list');
  const progressTextEl = document.getElementById('dash-routine-progress');
  const progressFillEl = document.getElementById('dash-routine-progress-fill');

  if (!stepsListEl) return;
  stepsListEl.innerHTML = "";

  let steps = [];
  if (latestScan && latestScan.routine && latestScan.routine.steps) {
    steps = latestScan.routine.steps;
  } else {
    // Default fallback welcome steps
    steps = [
      { name: "Cleanse", desc: "Wash face or hair with lukewarm water." },
      { name: "Soothe & Tone", desc: "Balance dermal layers using botanical waters." },
      { name: "Lock Moisture", desc: "Seal with a organic light barrier cream or oil." }
    ];
  }

  // Load checked state from local storage to keep state persistent
  const storageKey = 'imstev_dash_routine_checks';
  const checkedIndices = JSON.parse(localStorage.getItem(storageKey) || "[]");

  steps.forEach((step, idx) => {
    const isChecked = checkedIndices.includes(idx);
    const div = document.createElement('div');
    div.style.display = "flex";
    div.style.alignItems = "flex-start";
    div.style.gap = "10px";
    div.style.padding = "6px 0";
    div.innerHTML = `
      <input type="checkbox" id="dash-step-${idx}" ${isChecked ? 'checked' : ''} style="accent-color: var(--primary-emerald); cursor: pointer; margin-top: 3px;">
      <div style="display: flex; flex-direction: column; gap: 2px;">
        <label for="dash-step-${idx}" style="font-size: 13px; font-weight: 600; color: var(--text-primary); cursor: pointer; ${isChecked ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${step.name}</label>
        <span style="font-size: 11px; color: var(--text-secondary); line-height: 1.4;">${step.desc}</span>
      </div>
    `;

    // Listen to changes
    const input = div.querySelector('input');
    input.addEventListener('change', (e) => {
      const activeChecks = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (e.target.checked) {
        if (!activeChecks.includes(idx)) activeChecks.push(idx);
        div.querySelector('label').style.textDecoration = 'line-through';
        div.querySelector('label').style.opacity = '0.6';
      } else {
        const index = activeChecks.indexOf(idx);
        if (index > -1) activeChecks.splice(index, 1);
        div.querySelector('label').style.textDecoration = 'none';
        div.querySelector('label').style.opacity = '1';
      }
      localStorage.setItem(storageKey, JSON.stringify(activeChecks));
      updateRoutineProgressBar(steps.length);
    });

    stepsListEl.appendChild(div);
  });

  updateRoutineProgressBar(steps.length);
}

function updateRoutineProgressBar(totalSteps) {
  const storageKey = 'imstev_dash_routine_checks';
  const checkedIndices = JSON.parse(localStorage.getItem(storageKey) || "[]");
  const completed = checkedIndices.filter(i => i < totalSteps).length;
  
  const progressTextEl = document.getElementById('dash-routine-progress');
  const progressFillEl = document.getElementById('dash-routine-progress-fill');

  if (progressTextEl) {
    progressTextEl.innerText = `${completed} of ${totalSteps} Completed`;
  }
  if (progressFillEl) {
    const pct = totalSteps > 0 ? (completed / totalSteps) * 100 : 0;
    progressFillEl.style.width = `${pct}%`;
  }
}

function populateDashboardGoals() {
  const goalsListEl = document.getElementById('dash-goals-list');
  if (!goalsListEl) return;
  goalsListEl.innerHTML = "";

  const defaultGoals = [
    "Retain natural 4C/4B curl moisture",
    "Strengthen skin protective barrier",
    "Maintain balanced sebum sebum index"
  ];

  const storageKey = 'imstev_dash_goals_checks';
  const checkedGoals = JSON.parse(localStorage.getItem(storageKey) || "[]");

  defaultGoals.forEach((goal, idx) => {
    const isChecked = checkedGoals.includes(idx);
    const div = document.createElement('div');
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.gap = "10px";
    div.innerHTML = `
      <input type="checkbox" id="dash-goal-${idx}" ${isChecked ? 'checked' : ''} style="accent-color: var(--primary-brown); cursor: pointer;">
      <label for="dash-goal-${idx}" style="font-size: 13px; color: var(--text-primary); cursor: pointer; ${isChecked ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${goal}</label>
    `;

    const input = div.querySelector('input');
    input.addEventListener('change', (e) => {
      const activeChecks = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (e.target.checked) {
        if (!activeChecks.includes(idx)) activeChecks.push(idx);
        div.querySelector('label').style.textDecoration = 'line-through';
        div.querySelector('label').style.opacity = '0.6';
      } else {
        const index = activeChecks.indexOf(idx);
        if (index > -1) activeChecks.splice(index, 1);
        div.querySelector('label').style.textDecoration = 'none';
        div.querySelector('label').style.opacity = '1';
      }
      localStorage.setItem(storageKey, JSON.stringify(activeChecks));
    });

    goalsListEl.appendChild(div);
  });
}

function populateAchievements(totalScans) {
  const shelfEl = document.getElementById('dash-achievements-shelf');
  if (!shelfEl) return;
  shelfEl.innerHTML = "";

  const achievements = [];
  if (totalScans >= 1) {
    achievements.push({ icon: "rocket_launch", name: "Dermal Pioneer", desc: "First scan done" });
  }
  if (totalScans >= 3) {
    achievements.push({ icon: "workspace_premium", name: "Scan Expert", desc: "Consistency unlocked" });
  }
  if (state.profile && state.profile.specialistNotes) {
    achievements.push({ icon: "clinical_notes", name: "Salon Client", desc: "Has Specialist advice" });
  }

  // Ensure there is always a default/encouraging achievements state
  if (achievements.length === 0) {
    shelfEl.innerHTML = "<span style='font-size: 12px; color: var(--text-muted); padding: 4px 0;'>Scan your hair or skin to unlock achievements.</span>";
    return;
  }

  achievements.forEach(ach => {
    const badge = document.createElement('div');
    badge.style.display = "flex";
    badge.style.alignItems = "center";
    badge.style.gap = "6px";
    badge.style.padding = "6px 12px";
    badge.style.borderRadius = "20px";
    badge.style.background = "rgba(92, 77, 74, 0.05)";
    badge.style.border = "1px solid rgba(92, 77, 74, 0.12)";
    badge.style.flexShrink = "0";
    badge.innerHTML = `
      <i class="material-symbols-outlined" style="font-size: 16px; color: var(--primary-brown);">${ach.icon}</i>
      <div style="display: flex; flex-direction: column;">
        <span style="font-size: 11px; font-weight: bold; color: var(--text-primary);">${ach.name}</span>
      </div>
    `;
    shelfEl.appendChild(badge);
  });
}

function populateRecentTimeline() {
  const timelineEl = document.getElementById('dash-recent-scans-timeline');
  if (!timelineEl) return;
  timelineEl.innerHTML = "";

  const recents = state.history.slice(0, 3);
  if (recents.length === 0) {
    timelineEl.innerHTML = "<span style='font-size: 12px; color: var(--text-muted); text-align: center; padding: 12px 0;'>No scans recorded yet.</span>";
    return;
  }

  recents.forEach(report => {
    const date = new Date(report.timestamp);
    const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const isHair = report.type === 'hair';

    const card = document.createElement('div');
    card.style.display = "flex";
    card.style.alignItems = "center";
    card.style.justifyContent = "space-between";
    card.style.padding = "10px 14px";
    card.style.borderRadius = "16px";
    card.style.background = "rgba(92, 77, 74, 0.03)";
    card.style.border = "1px solid rgba(92, 77, 74, 0.08)";
    card.style.cursor = "pointer";

    let scoreVal = "";
    if (isHair) {
      const h = report.metrics.scores;
      scoreVal = `${100 - Math.round((h.frizziness + h.damage) / 2)}% Health`;
    } else {
      scoreVal = `${report.metrics.scores.hydration}% Hydration`;
    }

    card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: ${isHair ? 'rgba(92,77,74,0.08)' : 'rgba(64,95,78,0.08)'}; color: ${isHair ? 'var(--primary-brown)' : 'var(--primary-emerald)'};">
          <i class="material-symbols-outlined" style="font-size: 18px;">${isHair ? 'spa' : 'face'}</i>
        </div>
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <span style="font-size: 12px; font-weight: 600; color: var(--text-primary);">${report.metrics.type} Scan</span>
          <span style="font-size: 10px; color: var(--text-muted);">${dateStr}</span>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="font-size: 11px; font-weight: bold; color: ${isHair ? 'var(--primary-brown)' : 'var(--primary-emerald)'};">${scoreVal}</span>
        <i class="material-symbols-outlined" style="font-size: 16px; color: var(--text-secondary);">chevron_right</i>
      </div>
    `;

    card.addEventListener('click', () => {
      renderResultsDashboard(report);
      showView('viewResults');
    });

    timelineEl.appendChild(card);
  });
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
