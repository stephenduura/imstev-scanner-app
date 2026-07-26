import { state, surveys, clearUserSessionData } from './shared/state.js';
import { elements, initElements, showView } from './shared/ui.js';
import { initSupabase, supabase } from './services/supabase.js';
import { requestSkinAnalysis, requestHairAnalysis } from './services/api.js';
import { performAnalysis } from './scanner/analysis.js';
import { startCamera, stopCamera, captureFromVideo, loadUploadedFile, inspectImageQuality } from './scanner/camera.js';
import { renderHistoryList, downloadCalendarReminder } from './progress/history.js';
import { initSliderComparer, updateCompareImages } from './progress/comparison.js';
import { loadProfileFromStorage, saveProfileToStorage, handleSignOut } from './profile/profile.js';
import { updateWelcomeStats, renderClientSpecialistView, renderResultsDashboard } from './dashboard/dashboard.js';
import { loadClientsList, renderClientsDirectory, openClientDetailDrawer, saveSpecialistPrescription } from './consultation/specialist.js';
import { products } from '../data.js';

// Boot strap
document.addEventListener('DOMContentLoaded', () => {
  initElements();
  loadHistoryFromStorage();
  loadProfileFromStorage();
  checkConsentInit();
  updateWelcomeStats();
  setupEventListeners();
  fetchEnvKeys().finally(() => {
    initializeAuth();
  });
});

async function fetchEnvKeys() {
  try {
    const response = await fetch('.env');
    if (response.ok) {
      const text = await response.text();
      const lines = text.split('\n');
      let supabaseUrl = "";
      let supabaseAnonKey = "";
      
      lines.forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
          if (key === 'OPENAI_API_KEY' && value && !value.includes('YOUR_OPENAI_API_KEY')) {
            localStorage.setItem('imstev_openai_key', value);
            if (elements.profileOpenAIKey) elements.profileOpenAIKey.value = value;
          } else if (key === 'SUPABASE_URL') {
            supabaseUrl = value;
          } else if (key === 'SUPABASE_ANON_KEY') {
            supabaseAnonKey = value;
          }
        }
      });
      
      if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('YOUR_SUPABASE_URL')) {
        initSupabase(supabaseUrl, supabaseAnonKey);
      }
    }
  } catch (e) {
    console.warn("Could not load local .env file. Relying on UI settings.", e);
  }
}

function loadHistoryFromStorage() {
  try {
    const raw = localStorage.getItem('imstev_scan_history');
    state.history = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load history:", e);
    state.history = [];
  }
}

function saveHistoryToStorage() {
  try {
    localStorage.setItem('imstev_scan_history', JSON.stringify(state.history));
  } catch (e) {
    console.error("Failed to save history:", e);
  }
}

// Supabase Auth Observers
function initializeAuth() {
  if (!supabase) {
    console.warn("Supabase is not configured. Running in offline/local-only mode.");
    handleSessionTransition(null);
    return;
  }

  supabase.auth.getSession().then(({ data: { session } }) => {
    handleSessionTransition(session);
  });

  supabase.auth.onAuthStateChange((event, session) => {
    handleSessionTransition(session);
  });
}

function handleSessionTransition(session) {
  if (session) {
    state.hasSession = true;
    const navBar = document.querySelector('.nav-bar');
    if (navBar) navBar.style.display = 'flex';
    
    syncUserData().then(() => {
      if (state.currentView === 'viewAuth' || !state.currentView) {
        showView('viewWelcome');
      }
      renderClientSpecialistView();
    });
  } else {
    clearUserSessionData();
    showView('viewAuth');
    // Set to login view by default
    import('./authentication/auth.js').then(m => m.showAuthViewForm('login'));
  }
}

async function syncUserData() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;

    if (user && user.user_metadata) {
      state.profile = user.user_metadata.profile || {
        name: user.user_metadata.name || "",
        age: "25-34",
        gender: "",
        baselineHair: "none",
        baselineSkin: "none"
      };
      
      if (elements.profileName) elements.profileName.value = state.profile.name || "";
      if (elements.profileAge) elements.profileAge.value = state.profile.age || "25-34";
      if (elements.profileGender) elements.profileGender.value = state.profile.gender || "";
      if (elements.profileBaselineHair) elements.profileBaselineHair.value = state.profile.baselineHair || "none";
      if (elements.profileBaselineSkin) elements.profileBaselineSkin.value = state.profile.baselineSkin || "none";

      const remoteScans = user.user_metadata.scans || [];
      if (remoteScans.length > 0) {
        state.history = remoteScans;
        saveHistoryToStorage();
      }
      updateWelcomeStats();
    }
  } catch (e) {
    console.warn("Failed to sync user metadata from Supabase:", e);
  }
}

// Setup elements events
function setupEventListeners() {
  // Navigation Tabs
  elements.navHome.addEventListener('click', () => {
    stopScannerStream();
    showView('viewWelcome');
  });
  
  elements.navScan.addEventListener('click', () => {
    stopScannerStream();
    startScanningFlow(state.activeScanType || 'skin');
  });
  
  elements.navHistory.addEventListener('click', () => {
    stopScannerStream();
    renderHistoryList();
    showView('viewHistory');
  });
  
  elements.navProfile.addEventListener('click', () => {
    stopScannerStream();
    showView('viewProfile');
  });

  // Welcome triggers
  elements.startHairScanBtn.addEventListener('click', () => startScanningFlow('hair'));
  elements.startSkinScanBtn.addEventListener('click', () => startScanningFlow('skin'));

  // Camera views triggers
  elements.closeScannerBtn.addEventListener('click', () => {
    stopScannerStream();
    showView('viewWelcome');
  });
  
  elements.captureBtn.addEventListener('click', captureSnapshot);
  elements.uploadBtn.addEventListener('click', () => elements.fileInput.click());
  elements.fileInput.addEventListener('change', handleImageUpload);

  elements.macroToggleBtn.addEventListener('click', () => {
    state.isMacroMode = !state.isMacroMode;
    const guide = document.getElementById('scanner-guide');
    if (state.isMacroMode) {
      guide.classList.add('macro-mode');
      elements.macroToggleText.innerText = "Macro Lens On";
      elements.macroToggleBtn.style.background = "rgba(64, 95, 78, 0.15)";
      elements.macroToggleBtn.style.borderColor = "var(--primary-emerald)";
    } else {
      guide.classList.remove('macro-mode');
      elements.macroToggleText.innerText = "Macro Lens Off";
      elements.macroToggleBtn.style.background = "rgba(250, 248, 245, 0.85)";
      elements.macroToggleBtn.style.borderColor = "rgba(74, 62, 61, 0.15)";
    }
  });

  const retryBtn = document.getElementById('rejection-retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      const modal = document.getElementById('quality-rejection-modal');
      if (modal) modal.style.display = 'none';
    });
  }

  // Comparison select listeners
  elements.compareBeforeSelect.addEventListener('change', updateCompareImages);
  elements.compareAfterSelect.addEventListener('change', updateCompareImages);
  initSliderComparer();

  // Survey close trigger
  elements.closeSurveyBtn.addEventListener('click', () => showView('viewWelcome'));

  // Results screen triggers
  elements.shareReportBtn.addEventListener('click', shareReport);
  elements.saveReportBtn.addEventListener('click', () => {
    alert("Report PDF generation initiated! Your download will begin shortly.");
  });

  // Settings screen profile triggers
  elements.saveProfileBtn.addEventListener('click', () => saveProfileToStorage(updateWelcomeStats));
  elements.signoutBtn.addEventListener('click', () => handleSignOut(clearUserSessionData));

  // Specialist panel toggles
  elements.toggleSpecialistBtn.addEventListener('click', () => {
    state.isSpecialistMode = true;
    loadClientsList();
    renderClientsDirectory();
    showView('viewSpecialist');
  });

  elements.specialistBackBtn.addEventListener('click', () => {
    state.isSpecialistMode = false;
    showView('viewProfile');
  });

  elements.specialistSearch.addEventListener('input', (e) => {
    renderClientsDirectory(e.target.value.trim());
  });

  elements.drawerCloseBtn.addEventListener('click', () => {
    elements.specialistDetailDrawer.style.display = 'none';
  });

  elements.drawerSaveBtn.addEventListener('click', saveSpecialistPrescription);

  // Auth Card listeners
  elements.linkGoRegister.addEventListener('click', (e) => {
    e.preventDefault();
    import('./authentication/auth.js').then(m => m.showAuthViewForm('register'));
  });
  
  elements.linkGoForgot.addEventListener('click', (e) => {
    e.preventDefault();
    import('./authentication/auth.js').then(m => m.showAuthViewForm('forgot'));
  });
  
  elements.linkGoLogin.addEventListener('click', (e) => {
    e.preventDefault();
    import('./authentication/auth.js').then(m => m.showAuthViewForm('login'));
  });
  
  elements.linkForgotBackLogin.addEventListener('click', (e) => {
    e.preventDefault();
    import('./authentication/auth.js').then(m => m.showAuthViewForm('login'));
  });

  elements.btnLogin.addEventListener('click', () => {
    import('./authentication/auth.js').then(m => m.handleLogin());
  });

  const demoBtn = document.getElementById('btn-demo-login');
  if (demoBtn) {
    demoBtn.addEventListener('click', () => {
      state.hasSession = true;
      state.profile = {
        name: "Amara Okafor (Abuja, NG)",
        age: "25-34",
        gender: "She/Her",
        baselineHair: "frizziness",
        baselineSkin: "acne"
      };
      state.history = [];
      const navBar = document.querySelector('.nav-bar');
      if (navBar) navBar.style.display = 'flex';
      showView('viewWelcome');
      renderClientSpecialistView();
    });
  }

  elements.btnRegister.addEventListener('click', () => {
    import('./authentication/auth.js').then(m => m.handleRegister());
  });

  elements.btnForgot.addEventListener('click', () => {
    import('./authentication/auth.js').then(m => m.handleForgot());
  });

  // Consent Screen Modals
  elements.consentCheckbox.addEventListener('change', (e) => {
    elements.agreeConsentBtn.disabled = !e.target.checked;
  });
  
  elements.declineConsentBtn.addEventListener('click', () => {
    toggleConsentModal(false);
    showView('viewWelcome');
  });
  
  elements.agreeConsentBtn.addEventListener('click', () => {
    state.hasConsented = true;
    localStorage.setItem('imstev_biometric_consent', 'true');
    toggleConsentModal(false);
    executeScanningFlow();
  });

  elements.setReminderBtn.addEventListener('click', downloadCalendarReminder);
}

// Consent Modal Controllers
function checkConsentInit() {
  const consent = localStorage.getItem('imstev_biometric_consent');
  state.hasConsented = (consent === 'true');
  if (elements.consentCheckbox) {
    elements.consentCheckbox.checked = state.hasConsented;
    elements.agreeConsentBtn.disabled = !state.hasConsented;
  }
}

function toggleConsentModal(isOpen) {
  if (elements.consentModal) {
    elements.consentModal.style.display = isOpen ? 'flex' : 'none';
  }
}

// Scanning Orchestrations
async function startScanningFlow(type) {
  state.activeScanType = type;
  state.capturedCanvas = document.createElement('canvas');
  state.surveyStep = 0;
  state.surveyAnswers = {};
  state.capturedZones = [];
  state.scannerZoneIndex = 0;
  
  if (!state.hasConsented) {
    toggleConsentModal(true);
  } else {
    executeScanningFlow();
  }
}

let liveQualityInterval = null;

function startLiveQualityMonitoring() {
  if (liveQualityInterval) clearInterval(liveQualityInterval);
  
  const monitorCanvas = document.createElement('canvas');
  monitorCanvas.width = 160;
  monitorCanvas.height = 200;

  liveQualityInterval = setInterval(() => {
    if (!elements.scannerVideo || elements.scannerVideo.paused || elements.scannerVideo.ended) return;
    
    const ctx = monitorCanvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(elements.scannerVideo, 0, 0, 160, 200);

    const check = inspectImageQuality(monitorCanvas);

    const lightingText = document.getElementById('live-lighting-text');
    const focusText = document.getElementById('live-focus-text');
    const scoreText = document.getElementById('live-score-text');

    if (lightingText) {
      if (check.avgLuminance < 45) {
        lightingText.innerText = "Too Dark";
        lightingText.style.color = "#ec7063";
      } else if (check.avgLuminance > 230) {
        lightingText.innerText = "Too Bright";
        lightingText.style.color = "#ec7063";
      } else {
        lightingText.innerText = "Good";
        lightingText.style.color = "#58d68d";
      }
    }

    if (focusText) {
      const sharpnessNormalized = Math.min(100, Math.round((check.sharpness / 12) * 100));
      if (sharpnessNormalized < 40) {
        focusText.innerText = "Blurry";
        focusText.style.color = "#ec7063";
      } else {
        focusText.innerText = "Sharp";
        focusText.style.color = "#58d68d";
      }
    }

    if (scoreText) {
      scoreText.innerText = `${check.score}%`;
      if (check.score < 50) {
        scoreText.style.color = "#ec7063";
      } else {
        scoreText.style.color = "var(--primary-emerald)";
      }
    }
  }, 500);
}

function stopLiveQualityMonitoring() {
  if (liveQualityInterval) {
    clearInterval(liveQualityInterval);
    liveQualityInterval = null;
  }
}

async function executeScanningFlow() {
  const type = state.activeScanType;
  const guide = document.getElementById('scanner-guide');
  
  state.isMacroMode = false;
  if (guide) {
    guide.classList.remove('macro-mode');
    if (type === 'hair') {
      guide.className = "face-mask-guide hair-mode";
      elements.captureBtn.className = "btn btn-primary gold";
    } else {
      guide.className = "face-mask-guide";
      elements.captureBtn.className = "btn btn-primary";
    }
  }
  
  elements.macroToggleText.innerText = "Macro Lens Off";
  elements.macroToggleBtn.style.background = "rgba(250, 248, 245, 0.85)";
  elements.macroToggleBtn.style.borderColor = "rgba(74, 62, 61, 0.15)";
  
  updateZoneTracker();
  showView('viewScanner');
  
  const ok = await startCamera(elements.scannerVideo);
  if (ok) {
    startLiveQualityMonitoring();
  } else {
    alert("Camera unavailable or permission denied. Please upload a clear photo instead.");
    elements.fileInput.click();
  }
}

function updateZoneTracker() {
  const isHair = state.activeScanType === 'hair';
  const zones = isHair 
    ? ["Scalp & Roots (Follicle Health)", "Hair Mid-Shaft (Curls & Porosity)", "Hair Ends (Split Ends & Damage)"]
    : ["T-Zone (Forehead & Nose Sebum)", "U-Zone (Cheeks & Chin Redness)", "Side Profile (Cheek & Tone)"];
    
  const currentZoneName = zones[state.scannerZoneIndex];
  elements.scannerZoneTitle.innerText = `Zone ${state.scannerZoneIndex + 1} of 3: ${currentZoneName}`;
  
  let dots = "";
  for (let i = 0; i < 3; i++) {
    if (i === state.scannerZoneIndex) dots += "● ";
    else if (i < state.scannerZoneIndex) dots += "✔ ";
    else dots += "○ ";
  }
  elements.scannerZoneSteps.innerText = `[ ${dots.trim()} ]`;

  const topLabel = document.getElementById('guide-label-top');
  const bottomLabel = document.getElementById('guide-label-bottom');
  if (topLabel && bottomLabel) {
    if (isHair) {
      if (state.scannerZoneIndex === 0) {
        topLabel.textContent = "ALIGN SCALP & ROOTS";
        bottomLabel.textContent = "USE BIOTECH MACRO LENS";
      } else if (state.scannerZoneIndex === 1) {
        topLabel.textContent = "ALIGN HAIR MID-SHAFT";
        bottomLabel.textContent = "FOCUS ON HAIR STRANDS";
      } else {
        topLabel.textContent = "ALIGN HAIR ENDS & TIPS";
        bottomLabel.textContent = "CHECK FOR DAMAGE & SPLITS";
      }
    } else {
      if (state.scannerZoneIndex === 0) {
        topLabel.textContent = "ALIGN FOREHEAD & NOSE";
        bottomLabel.textContent = "T-ZONE OVAL ALIGNMENT";
      } else if (state.scannerZoneIndex === 1) {
        topLabel.textContent = "ALIGN CHEEKS & CHIN";
        bottomLabel.textContent = "U-ZONE REDNESS CHECK";
      } else {
        topLabel.textContent = "ALIGN SIDE PROFILE CHEEK";
        bottomLabel.textContent = "TURN HEAD 45° TO SIDE";
      }
    }
  }
}

function triggerScanningVisuals() {
  const guide = document.querySelector('.scan-overlay-guide');
  if (guide) {
    guide.classList.add('active-scanning');
    const container = document.querySelector('.scanner-view-container');
    const dots = [];
    const coordinates = [
      { top: '30%', left: '35%' },
      { top: '30%', left: '65%' },
      { top: '50%', left: '50%' },
      { top: '65%', left: '35%' },
      { top: '65%', left: '65%' }
    ];
    
    coordinates.forEach(coords => {
      const dot = document.createElement('div');
      dot.className = 'tracking-dot';
      dot.style.top = coords.top;
      dot.style.left = coords.left;
      container.appendChild(dot);
      dots.push(dot);
    });
    
    setTimeout(() => {
      guide.classList.remove('active-scanning');
      dots.forEach(d => d.remove());
    }, 1200);
  }
}

function stopScannerStream() {
  stopLiveQualityMonitoring();
  stopCamera();
}

function captureSnapshot() {
  const tempCanvas = document.createElement('canvas');
  const success = captureFromVideo(elements.scannerVideo, tempCanvas);
  
  if (success) {
    const check = inspectImageQuality(tempCanvas);
    if (!check.ok) {
      const modal = document.getElementById('quality-rejection-modal');
      const text = document.getElementById('rejection-reason-text');
      if (modal && text) {
        text.innerText = `${check.reason}\n\nQuality Confidence Score: ${check.score}% (Requires 50%+)`;
        modal.style.display = 'flex';
      } else {
        alert("Capture Rejected: " + check.reason);
      }
      return;
    }

    triggerScanningVisuals();
    
    const compressedCanvas = document.createElement('canvas');
    compressedCanvas.width = 320;
    compressedCanvas.height = 400;
    const cctx = compressedCanvas.getContext('2d');
    cctx.drawImage(tempCanvas, 0, 0, 320, 400);
    
    const base64Img = compressedCanvas.toDataURL("image/jpeg", 0.5);
    state.capturedZones.push(base64Img);
    state.scannerZoneIndex++;
    
    if (state.scannerZoneIndex < 3) {
      elements.captureBtn.disabled = true;
      setTimeout(() => {
        updateZoneTracker();
        elements.captureBtn.disabled = false;
      }, 1200);
    } else {
      elements.captureBtn.disabled = true;
      setTimeout(() => {
        const ctx = state.capturedCanvas.getContext('2d');
        state.capturedCanvas.width = 320;
        state.capturedCanvas.height = 400;
        ctx.drawImage(compressedCanvas, 0, 0);
        
        elements.captureBtn.disabled = false;
        stopScannerStream();
        startSurveyFlow();
      }, 1200);
    }
  } else {
    alert("Failed to capture image. Please try again or upload a photo.");
  }
}

async function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  stopScannerStream();
  const ok = await loadUploadedFile(file, state.capturedCanvas);
  if (ok) {
    const compressedCanvas = document.createElement('canvas');
    compressedCanvas.width = 320;
    compressedCanvas.height = 400;
    const cctx = compressedCanvas.getContext('2d');
    cctx.drawImage(state.capturedCanvas, 0, 0, 320, 400);
    const base64Img = compressedCanvas.toDataURL("image/jpeg", 0.5);
    
    state.capturedZones = [base64Img, base64Img, base64Img];
    state.scannerZoneIndex = 3;
    
    startSurveyFlow();
  } else {
    alert("Invalid image file. Please upload a clear JPG or PNG.");
  }
  elements.fileInput.value = "";
}

function startSurveyFlow() {
  state.surveyStep = 0;
  state.surveyAnswers = {};
  showView('viewSurvey');
  renderSurveyQuestion();
}

function renderSurveyQuestion() {
  const list = surveys[state.activeScanType];
  const stepData = list[state.surveyStep];
  
  const percent = ((state.surveyStep + 1) / list.length) * 100;
  elements.surveyProgressFill.style.width = `${percent}%`;
  
  elements.surveyQuestionTitle.innerText = stepData.question;
  elements.surveyQuestionDesc.innerText = stepData.desc;
  elements.surveyOptionsList.innerHTML = "";
  
  stepData.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = "option-btn";
    btn.innerHTML = `<span>${opt.label}</span>`;
    btn.addEventListener('click', () => handleSurveyAnswer(stepData.key, opt.value));
    elements.surveyOptionsList.appendChild(btn);
  });
}

function handleSurveyAnswer(key, value) {
  state.surveyAnswers[key] = value;
  const list = surveys[state.activeScanType];
  
  if (state.surveyStep < list.length - 1) {
    state.surveyStep++;
    renderSurveyQuestion();
  } else {
    startProcessingFlow();
  }
}

function startProcessingFlow() {
  showView('viewProcessing');
  elements.processingRadarIcon.innerText = state.activeScanType === 'hair' ? 'spa' : 'face';
  
  const steps = state.activeScanType === 'hair' 
    ? ["Initializing hair scan engine...", "Checking curl pattern structure...", "Measuring moisture porosity index...", "Compiling hair routines & oils..."]
    : ["Activating skin layer mapping...", "Assessing hydration & sebum balances...", "Scoring pigmentation & pores...", "Generating skincare recommendations..."];
  
  elements.processingStatusSteps.innerHTML = "";
  steps.forEach((text, i) => {
    const div = document.createElement('div');
    div.className = `status-step ${i === 0 ? 'active' : ''}`;
    div.innerHTML = `<span class="status-dot"></span><span>${text}</span>`;
    elements.processingStatusSteps.appendChild(div);
  });
  
  let currentStep = 0;
  const interval = setInterval(() => {
    const stepEl = elements.processingStatusSteps.children[currentStep];
    if (stepEl) {
      stepEl.className = "status-step completed";
      stepEl.innerHTML = `<i class="material-symbols-outlined">check_circle</i><span>${steps[currentStep]}</span>`;
    }
    
    currentStep++;
    if (currentStep < steps.length) {
      const nextEl = elements.processingStatusSteps.children[currentStep];
      if (nextEl) nextEl.className = "status-step active";
    } else {
      clearInterval(interval);
      finishAnalysis();
    }
  }, 1000);
}

async function finishAnalysis() {
  let report = null;

  try {
    const statusStep = document.createElement('div');
    statusStep.className = "status-step active";
    statusStep.innerHTML = `<span class="status-dot"></span><span>Connecting to Server AI Services...</span>`;
    elements.processingStatusSteps.appendChild(statusStep);

    if (state.activeScanType === 'skin') {
      report = await requestSkinAnalysis(state.capturedZones, state.surveyAnswers);
    } else {
      report = await requestHairAnalysis(state.capturedZones, state.surveyAnswers);
    }

    const allProds = [...products.hair, ...products.skin];
    // Map products
    if (report && report.productIds) {
      report.products = allProds.filter(p => report.productIds && report.productIds.includes(p.id));
      delete report.productIds;
    }
  } catch (err) {
    console.error("Server AI Analysis failed, falling back to local simulation:", err);
    report = performAnalysis(state.activeScanType, state.capturedCanvas, state.surveyAnswers);
  }

  report.photo = state.capturedZones[0] || (state.capturedCanvas ? state.capturedCanvas.toDataURL("image/jpeg", 0.5) : null);
  report.photos = state.capturedZones;

  state.currentReport = report;
  state.history.unshift(report);
  saveHistoryToStorage();
  updateWelcomeStats();

  if (state.hasSession && supabase) {
    try {
      await supabase.auth.updateUser({
        data: {
          scans: state.history
        }
      });
    } catch (e) {
      console.warn("Failed to sync new scan to Supabase auth metadata:", e);
    }
  }
  
  renderResultsDashboard(report);
  showView('viewResults');
}

function shareReport() {
  if (!state.currentReport) return;
  const metrics = state.currentReport.metrics;
  const text = `Check out my Imstev Hair & Skin Diagnostic! Type: ${metrics.type}, Concern: ${state.currentReport.primaryConcern.name}.`;
  
  if (navigator.share) {
    navigator.share({
      title: 'Imstev Hair & Skin Report',
      text: text,
      url: window.location.href
    }).catch(console.error);
  } else {
    navigator.clipboard.writeText(text).then(() => {
      alert("Report details copied to clipboard!");
    }).catch(console.error);
  }
}
