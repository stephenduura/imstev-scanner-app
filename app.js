import { startCamera, stopCamera, captureFromVideo, loadUploadedFile } from './scanner.js';
import { performAnalysis, performOpenAIAnalysis } from './analysis.js';
import { initSupabase } from './supabase.js';
import { products } from './data.js';

let supabase = null;

// Application State
const state = {
  activeScanType: null, // 'skin' | 'hair'
  capturedCanvas: null,
  surveyStep: 0,
  surveyAnswers: {},
  history: [],
  currentReport: null,
  hasConsented: false,
  profile: {
    name: "",
    age: "25-34",
    gender: "",
    baselineHair: "none",
    baselineSkin: "none"
  },
  hasSession: false,
  currentView: 'viewAuth',
  isSpecialistMode: false,
  selectedClient: null,
  clients: []
};

// Survey Configuration
const surveys = {
  hair: [
    {
      question: "How does your hair behave after washing?",
      desc: "This helps estimate your hair porosity (moisture absorption).",
      key: "hairWashing",
      options: [
        { label: "Dries slowly, products sit on top", value: "low" },
        { label: "Dries in average time, absorbs product easily", value: "medium" },
        { label: "Dries very fast, feels dry/thirsty quickly", value: "high" }
      ]
    },
    {
      question: "What shape do your strands form?",
      desc: "Select your primary curl pattern.",
      key: "hairStrands",
      options: [
        { label: "Straight, completely flat", value: "type1" },
        { label: "Wavy, loose S-shape", value: "type2" },
        { label: "Curly, springy ringlets/spirals", value: "type3" },
        { label: "Coily, tight zig-zag or kinks", value: "type4" }
      ]
    },
    {
      question: "How thick is a single strand of your hair?",
      desc: "This determines your hair texture.",
      key: "hairThickness",
      options: [
        { label: "Fine (hardly felt, transparent in light)", value: "fine" },
        { label: "Medium (standard thread feel)", value: "medium" },
        { label: "Coarse (thick, wiry, strong)", value: "coarse" }
      ]
    },
    {
      question: "What is your main hair concern?",
      desc: "We will tailor product recommendations to this.",
      key: "hairConcern",
      options: [
        { label: "Frizziness & lack of definition", value: "frizziness" },
        { label: "Dryness, damage & split ends", value: "damage" },
        { label: "Thinning, hair loss & low density", value: "density" }
      ]
    }
  ],
  skin: [
    {
      question: "How does your skin feel in the afternoon?",
      desc: "This helps identify your base skin type.",
      key: "skinFeeling",
      options: [
        { label: "Tight, dry, or flaky", value: "dry" },
        { label: "Oily or shiny all over", value: "oily" },
        { label: "Oily in T-zone, dry on cheeks", value: "combination" },
        { label: "Red, irritated, or burning", value: "sensitive" }
      ]
    },
    {
      question: "How easily does your skin burn in the sun?",
      desc: "Helps classify your Fitzpatrick sun sensitivity level.",
      key: "skinSun",
      options: [
        { label: "Always burns easily, rarely/never tans", value: "type1_2" },
        { label: "Burns moderately, tans gradually", value: "type3_4" },
        { label: "Rarely burns, tans deeply and easily", value: "type5_6" }
      ]
    },
    {
      question: "What is your primary skin concern?",
      desc: "We will tailor ingredients and treatments to this.",
      key: "skinConcern",
      options: [
        { label: "Acne, blackheads, or breakouts", value: "acne" },
        { label: "Dark spots, pigmentation, or uneven tone", value: "pigmentation" },
        { label: "Fine lines, wrinkles, or sagging", value: "wrinkles" },
        { label: "Redness, irritation, or broken capillaries", value: "redness" }
      ]
    }
  ]
};

// UI Elements Cache
let elements = {};

function initElements() {
  elements = {
    // Navigation
    navHome: document.getElementById('nav-home'),
    navScan: document.getElementById('nav-scan'),
    navHistory: document.getElementById('nav-history'),
    navProfile: document.getElementById('nav-profile'),
    
    // Views
    viewWelcome: document.getElementById('view-welcome'),
    viewScanner: document.getElementById('view-scanner'),
    viewSurvey: document.getElementById('view-survey'),
    viewProcessing: document.getElementById('view-processing'),
    viewResults: document.getElementById('view-results'),
    viewHistory: document.getElementById('view-history'),
    viewProfile: document.getElementById('view-profile'),
    viewAuth: document.getElementById('view-auth'),
    
    // Welcome View Buttons
    startHairScanBtn: document.getElementById('start-hair-scan'),
    startSkinScanBtn: document.getElementById('start-skin-scan'),
    welcomeStats: document.getElementById('welcome-stats'),
    
    // Scanner Elements
    scannerVideo: document.getElementById('scanner-video'),
    scannerGuide: document.getElementById('scanner-guide'),
    captureBtn: document.getElementById('capture-btn'),
    uploadBtn: document.getElementById('upload-btn'),
    fileInput: document.getElementById('file-input'),
    closeScannerBtn: document.getElementById('close-scanner-btn'),
    
    // Survey Elements
    surveyProgressFill: document.getElementById('survey-progress-fill'),
    surveyQuestionTitle: document.getElementById('survey-question-title'),
    surveyQuestionDesc: document.getElementById('survey-question-desc'),
    surveyOptionsList: document.getElementById('survey-options-list'),
    closeSurveyBtn: document.getElementById('close-survey-btn'),
    
    // Processing Elements
    processingStatusSteps: document.getElementById('processing-status-steps'),
    processingRadarIcon: document.getElementById('processing-radar-icon'),
    
    // Results Elements
    resultsHeaderTitle: document.getElementById('results-header-title'),
    resultsHeaderSubtitle: document.getElementById('results-header-subtitle'),
    resultsMetricGrid: document.getElementById('results-metric-grid'),
    resultsRoutineSteps: document.getElementById('results-routine-steps'),
    resultsProductsCarousel: document.getElementById('results-products-carousel'),
    shareReportBtn: document.getElementById('share-report-btn'),
    saveReportBtn: document.getElementById('save-report-btn'),
    
    // History Elements
    historyList: document.getElementById('history-list'),
    historyEmpty: document.getElementById('history-empty'),
    historyTrendsCard: document.getElementById('history-trends-card'),
    trendSvgWrapper: document.getElementById('trend-svg-wrapper'),
    trendAnalysisSummary: document.getElementById('trend-analysis-summary'),
    setReminderBtn: document.getElementById('set-reminder-btn'),
    
    // Consent Modal
    consentModal: document.getElementById('consent-modal'),
    consentCheckbox: document.getElementById('consent-checkbox'),
    declineConsentBtn: document.getElementById('decline-consent-btn'),
    agreeConsentBtn: document.getElementById('agree-consent-btn'),
    
    // Profile Fields
    profileName: document.getElementById('profile-name'),
    profileAge: document.getElementById('profile-age'),
    profileGender: document.getElementById('profile-gender'),
    profileBaselineHair: document.getElementById('profile-baseline-hair'),
    profileBaselineSkin: document.getElementById('profile-baseline-skin'),
    profileOpenAIKey: document.getElementById('profile-openai-key'),
    saveProfileBtn: document.getElementById('save-profile-btn'),
    signoutBtn: document.getElementById('signout-btn'),
    
    // Auth Elements
    authErrorMsg: document.getElementById('auth-error-msg'),
    formLogin: document.getElementById('form-login'),
    formRegister: document.getElementById('form-register'),
    formForgot: document.getElementById('form-forgot'),
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    btnLogin: document.getElementById('btn-login'),
    linkGoRegister: document.getElementById('link-go-register'),
    linkGoForgot: document.getElementById('link-go-forgot'),
    registerName: document.getElementById('register-name'),
    registerEmail: document.getElementById('register-email'),
    registerPassword: document.getElementById('register-password'),
    registerConfirmPassword: document.getElementById('register-confirm-password'),
    btnRegister: document.getElementById('btn-register'),
    linkGoLogin: document.getElementById('link-go-login'),
    forgotEmail: document.getElementById('forgot-email'),
    btnForgot: document.getElementById('btn-forgot'),
    linkForgotBackLogin: document.getElementById('link-forgot-back-login'),

    // Specialist View DOM Cache
    toggleSpecialistBtn: document.getElementById('toggle-specialist-btn'),
    viewSpecialist: document.getElementById('view-specialist'),
    specialistBackBtn: document.getElementById('specialist-back-btn'),
    specialistSearch: document.getElementById('specialist-search'),
    specialistClientList: document.getElementById('specialist-client-list'),
    specialistDetailDrawer: document.getElementById('specialist-detail-drawer'),
    drawerClientName: document.getElementById('drawer-client-name'),
    drawerClientEmail: document.getElementById('drawer-client-email'),
    drawerCloseBtn: document.getElementById('drawer-close-btn'),
    drawerTrendsContainer: document.getElementById('drawer-trends-container'),
    drawerNotesInput: document.getElementById('drawer-notes-input'),
    drawerProductsList: document.getElementById('drawer-products-list'),
    drawerSaveBtn: document.getElementById('drawer-save-btn'),
    welcomeSpecialistNotes: document.getElementById('welcome-specialist-notes'),
    welcomeSpecialistText: document.getElementById('welcome-specialist-text')
  };
}

// Initialize Application
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

// Fetch local .env configuration if served on local server
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
        supabase = initSupabase(supabaseUrl, supabaseAnonKey);
      }
    }
  } catch (e) {
    console.warn("Could not load local .env file. Relying on UI settings.", e);
  }
}

// Load history from localStorage
function loadHistoryFromStorage() {
  try {
    const raw = localStorage.getItem('imstev_scan_history');
    state.history = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load history:", e);
    state.history = [];
  }
}

// Save history to localStorage
function saveHistoryToStorage() {
  try {
    localStorage.setItem('imstev_scan_history', JSON.stringify(state.history));
  } catch (e) {
    console.error("Failed to save history:", e);
  }
}

// Update Welcome Screen counters
function updateWelcomeStats() {
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

  // Personalize title if name is set
  const titleEl = document.querySelector('.welcome-hero h1');
  if (titleEl) {
    if (state.profile && state.profile.name) {
      titleEl.innerHTML = `Welcome, ${state.profile.name}!<br><span>Hair & Skin Scan</span>`;
    } else {
      titleEl.innerHTML = `Personalized AI<br><span>Hair & Skin Scan</span>`;
    }
  }
}

// Event Listeners Setup
function setupEventListeners() {
  // Bottom Tab Nav Bar
  elements.navHome.addEventListener('click', () => {
    stopScannerStream();
    showView('viewWelcome');
  });
  
  elements.navScan.addEventListener('click', () => {
    stopScannerStream();
    showView('viewWelcome');
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
  
  // Welcome Cards
  elements.startHairScanBtn.addEventListener('click', () => startScanningFlow('hair'));
  elements.startSkinScanBtn.addEventListener('click', () => startScanningFlow('skin'));
  
  // Scanner Buttons
  elements.captureBtn.addEventListener('click', captureSnapshot);
  elements.uploadBtn.addEventListener('click', () => elements.fileInput.click());
  elements.fileInput.addEventListener('change', handleImageUpload);
  elements.closeScannerBtn.addEventListener('click', () => {
    stopScannerStream();
    showView('viewWelcome');
  });
  
  // Survey Close
  elements.closeSurveyBtn.addEventListener('click', () => {
    showView('viewWelcome');
  });

  // Share & Save Report Buttons
  if (elements.shareReportBtn) {
    elements.shareReportBtn.addEventListener('click', shareReport);
  }
  if (elements.saveReportBtn) {
    elements.saveReportBtn.addEventListener('click', () => {
      alert("Report saved to your scan history!");
      elements.navHistory.click();
    });
  }

  // Profile Save & Sign Out
  elements.saveProfileBtn.addEventListener('click', saveProfileToStorage);
  elements.signoutBtn.addEventListener('click', handleSignOut);

  // Consent Actions
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

  // Set Reminder Actions
  elements.setReminderBtn.addEventListener('click', generateICSReminder);

  // Authentication Switch Links
  elements.linkGoRegister.addEventListener('click', (e) => { e.preventDefault(); showAuthViewForm('register'); });
  elements.linkGoLogin.addEventListener('click', (e) => { e.preventDefault(); showAuthViewForm('login'); });
  elements.linkGoForgot.addEventListener('click', (e) => { e.preventDefault(); showAuthViewForm('forgot'); });
  elements.linkForgotBackLogin.addEventListener('click', (e) => { e.preventDefault(); showAuthViewForm('login'); });

  // Authentication Buttons Submission
  elements.btnLogin.addEventListener('click', handleLogin);
  elements.btnRegister.addEventListener('click', handleRegister);
  elements.btnForgot.addEventListener('click', handleForgot);

  // Specialist View Toggles
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

  // Specialist Search Input Filter
  elements.specialistSearch.addEventListener('input', (e) => {
    renderClientsDirectory(e.target.value.trim());
  });

  // Specialist Detail Modal Actions
  elements.drawerCloseBtn.addEventListener('click', () => {
    elements.specialistDetailDrawer.style.display = 'none';
  });

  elements.drawerSaveBtn.addEventListener('click', saveSpecialistPrescription);
}

// Router/View Manager
function showView(viewId) {
  // If no Supabase session is active, lock navigation and show auth screen
  if (!state.hasSession && viewId !== 'viewAuth') {
    viewId = 'viewAuth';
  }
  state.currentView = viewId;

  // Deactivate all views
  Object.keys(elements).forEach(key => {
    if (key.startsWith('view') && elements[key]) {
      elements[key].classList.remove('active');
    }
  });
  
  // Activate selected view
  if (elements[viewId]) {
    elements[viewId].classList.add('active');
  }
  
  // Hide or show bottom navigation bar based on view and mode
  const navBar = document.querySelector('.nav-bar');
  if (navBar) {
    if (viewId === 'viewAuth' || viewId === 'viewSpecialist') {
      navBar.style.display = 'none';
    } else if (state.hasSession) {
      navBar.style.display = 'flex';
    }
  }

  // Update Tab active states
  elements.navHome.classList.remove('active');
  elements.navScan.classList.remove('active');
  elements.navHistory.classList.remove('active');
  elements.navProfile.classList.remove('active');
  
  if (viewId === 'viewWelcome') {
    elements.navHome.classList.add('active');
  } else if (viewId === 'viewScanner' || viewId === 'viewSurvey' || viewId === 'viewProcessing') {
    elements.navScan.classList.add('active');
  } else if (viewId === 'viewHistory' || viewId === 'viewResults') {
    elements.navHistory.classList.add('active');
  } else if (viewId === 'viewProfile') {
    elements.navProfile.classList.add('active');
  }
}

// Flow: Start Scanning
async function startScanningFlow(type) {
  state.activeScanType = type;
  state.capturedCanvas = document.createElement('canvas');
  state.surveyStep = 0;
  state.surveyAnswers = {};
  
  if (!state.hasConsented) {
    toggleConsentModal(true);
  } else {
    executeScanningFlow();
  }
}

async function executeScanningFlow() {
  const type = state.activeScanType;
  // Set guides
  if (type === 'hair') {
    elements.scannerGuide.className = "face-mask-guide hair-mode";
    elements.captureBtn.className = "btn btn-primary gold";
  } else {
    elements.scannerGuide.className = "face-mask-guide";
    elements.captureBtn.className = "btn btn-primary";
  }
  
  showView('viewScanner');
  
  const ok = await startCamera(elements.scannerVideo);
  if (!ok) {
    alert("Camera unavailable or permission denied. Please upload a clear photo instead.");
    elements.fileInput.click();
  }
}

// Stop Video Stream
function stopScannerStream() {
  stopCamera();
}

// Capture Video Snapshot
function captureSnapshot() {
  const success = captureFromVideo(elements.scannerVideo, state.capturedCanvas);
  if (success) {
    stopScannerStream();
    startSurveyFlow();
  } else {
    alert("Failed to capture image. Please try again or upload a photo.");
  }
}

// Handle File Input Upload
async function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  stopScannerStream();
  const ok = await loadUploadedFile(file, state.capturedCanvas);
  if (ok) {
    startSurveyFlow();
  } else {
    alert("Invalid image file. Please upload a clear JPG or PNG.");
  }
  // Reset file input
  elements.fileInput.value = "";
}

// Flow: Survey Quiz
function startSurveyFlow() {
  state.surveyStep = 0;
  state.surveyAnswers = {};
  showView('viewSurvey');
  renderSurveyQuestion();
}

function renderSurveyQuestion() {
  const list = surveys[state.activeScanType];
  const stepData = list[state.surveyStep];
  
  // Update Progress
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
    // End of survey -> analyze
    startProcessingFlow();
  }
}

// Flow: AI Mock Processing
function startProcessingFlow() {
  showView('viewProcessing');
  
  // Set radar icon
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
  
  // Cycle through processing steps
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
      // Processing complete -> generate & show results
      finishAnalysis();
    }
  }, 1000);
}

async function finishAnalysis() {
  let report = null;
  const apiKey = localStorage.getItem('imstev_openai_key');

  if (apiKey && apiKey.startsWith("sk-")) {
    try {
      // Add visual state feedback
      const statusStep = document.createElement('div');
      statusStep.className = "status-step active";
      statusStep.innerHTML = `<span class="status-dot"></span><span>Connecting to OpenAI Vision AI...</span>`;
      elements.processingStatusSteps.appendChild(statusStep);

      const openAIReport = await performOpenAIAnalysis(
        state.activeScanType, 
        state.capturedCanvas, 
        state.surveyAnswers, 
        apiKey
      );

      // Map product IDs returned by OpenAI to our product objects catalog
      const allProds = [...products.hair, ...products.skin];
      openAIReport.products = allProds.filter(p => openAIReport.productIds && openAIReport.productIds.includes(p.id));
      delete openAIReport.productIds;
      
      report = openAIReport;
    } catch (err) {
      console.error("OpenAI Analysis failed, falling back to local simulation:", err);
      alert("OpenAI Scan failed: " + err.message + "\n\nFalling back to local simulation analysis.");
      report = performAnalysis(state.activeScanType, state.capturedCanvas, state.surveyAnswers);
    }
  } else {
    report = performAnalysis(state.activeScanType, state.capturedCanvas, state.surveyAnswers);
  }

  state.currentReport = report;
  
  // Save to history list
  state.history.unshift(report);
  saveHistoryToStorage();
  updateWelcomeStats();

  // Sync scan history to Supabase cloud metadata
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

// Renders the Results Dashboard
function renderResultsDashboard(report) {
  const isHair = report.type === 'hair';
  
  // Set title headers
  elements.resultsHeaderTitle.innerText = report.metrics.type;
  elements.resultsHeaderSubtitle.innerText = isHair 
    ? `${report.metrics.porosity} | ${report.metrics.texture} Texture`
    : `Fitzpatrick ${report.metrics.fitzpatrick} | Undertone: ${report.metrics.undertone}`;
  
  // Color theme adjustments
  const headerCard = elements.resultsHeaderTitle.closest('.results-hero-metric');
  if (isHair) {
    elements.resultsHeaderTitle.style.color = "var(--primary-gold)";
  } else {
    elements.resultsHeaderTitle.style.color = "var(--light-emerald)";
  }

  // Render metrics
  elements.resultsMetricGrid.innerHTML = "";
  
  Object.keys(report.metrics.scores).forEach(key => {
    const score = report.metrics.scores[key];
    const card = document.createElement('div');
    
    // Label display format
    let label = key.charAt(0).toUpperCase() + key.slice(1);
    if (key === 'darkCircles') label = 'Dark Circles';
    
    // Style issues differently if high (worse) or low (good/bad depending on metric)
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
  
  // Render Routine Steps
  elements.resultsRoutineSteps.innerHTML = `
    <h4 style="font-family: var(--font-display); font-size: 16px; margin-bottom: 12px; color: var(--primary-gold)">
      ${report.routine.title}
    </h4>
  `;
  report.routine.steps.forEach((step, idx) => {
    const div = document.createElement('div');
    div.className = "step-item";
    div.innerHTML = `
      <div class="step-num">${idx + 1}</div>
      <div class="step-info">
        <h5>${step.name}</h5>
        <p>${step.desc}</p>
      </div>
    `;
    elements.resultsRoutineSteps.appendChild(div);
  });
  
  // Render Products Carousel
  elements.resultsProductsCarousel.innerHTML = "";
  
  let productsToRender = report.products;
  let isPrescribed = false;
  
  if (state.profile && state.profile.productOverrides && state.profile.productOverrides.length > 0) {
    const allProds = [...products.hair, ...products.skin];
    const overrides = allProds.filter(p => state.profile.productOverrides.includes(p.id));
    if (overrides.length > 0) {
      productsToRender = overrides;
      isPrescribed = true;
    }
  }
  
  if (productsToRender.length === 0) {
    elements.resultsProductsCarousel.innerHTML = "<p style='color: var(--text-muted); font-size: 13px;'>No matching products in database.</p>";
  } else {
    productsToRender.forEach(prod => {
      const card = document.createElement('div');
      card.className = "product-card";
      card.innerHTML = `
        <img class="product-image" src="${prod.image}" alt="${prod.name}">
        ${isPrescribed ? `<span class="product-category" style="background: rgba(212, 175, 55, 0.15); color: var(--primary-gold); font-weight: bold; border: 1px solid rgba(212, 175, 55, 0.3);">Specialist Prescribed</span>` : `<span class="product-category">${prod.category}</span>`}
        <h5 class="product-name">${prod.name}</h5>
        <div class="product-price-row">
          <span class="product-price">${prod.price}</span>
          <button class="product-buy-btn" onclick="alert('Proceeding to checkout for ${prod.name}...')">
            <i class="material-symbols-outlined" style="font-size: 16px;">shopping_bag</i>
          </button>
        </div>
      `;
      elements.resultsProductsCarousel.appendChild(card);
    });
  }
}

// Renders Scan History List
function renderHistoryList() {
  elements.historyList.innerHTML = "";
  
  if (state.history.length === 0) {
    elements.historyEmpty.style.display = "flex";
    elements.historyTrendsCard.style.display = "none";
    return;
  }
  
  elements.historyEmpty.style.display = "none";
  
  // Draw SVGs and Progress charts
  renderProgressTrends();

  state.history.forEach((report, index) => {
    const card = document.createElement('div');
    const isHair = report.type === 'hair';
    card.className = `history-card ${isHair ? 'hair' : 'skin'}`;
    
    const date = new Date(report.timestamp);
    const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    // Hero score displays
    let scoreDisplay = "";
    if (isHair) {
      const health = 100 - Math.round((report.metrics.scores.frizziness + report.metrics.scores.damage) / 2);
      scoreDisplay = `<div class="history-score-val">${health}%</div><div class="history-score-label">Hair Health</div>`;
    } else {
      const score = report.metrics.scores.hydration;
      scoreDisplay = `<div class="history-score-val">${score}%</div><div class="history-score-label">Hydration</div>`;
    }
    
    card.innerHTML = `
      <div class="history-info">
        <div class="history-type-badge">
          <i class="material-symbols-outlined">${isHair ? 'spa' : 'face'}</i>
        </div>
        <div class="history-meta">
          <h4>${report.metrics.type} Scan</h4>
          <span>${dateStr}</span>
        </div>
      </div>
      <div class="history-score">
        ${scoreDisplay}
      </div>
    `;
    
    card.addEventListener('click', () => {
      renderResultsDashboard(report);
      showView('viewResults');
    });
    
    elements.historyList.appendChild(card);
  });
}

// Share Report Simulation
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
    // Clipboard copy fallback
    navigator.clipboard.writeText(text).then(() => {
      alert("Report details copied to clipboard!");
    }).catch(console.error);
  }
}

// Load user profile from storage
function loadProfileFromStorage() {
  try {
    const raw = localStorage.getItem('imstev_user_profile');
    if (raw) {
      state.profile = JSON.parse(raw);
      
      // Populate fields
      if (elements.profileName) elements.profileName.value = state.profile.name || "";
      if (elements.profileAge) elements.profileAge.value = state.profile.age || "25-34";
      if (elements.profileGender) elements.profileGender.value = state.profile.gender || "";
      if (elements.profileBaselineHair) elements.profileBaselineHair.value = state.profile.baselineHair || "none";
      if (elements.profileBaselineSkin) elements.profileBaselineSkin.value = state.profile.baselineSkin || "none";
    }
    
    // Load OpenAI API Key
    const apiKey = localStorage.getItem('imstev_openai_key') || "";
    if (elements.profileOpenAIKey) elements.profileOpenAIKey.value = apiKey;
  } catch (e) {
    console.error("Failed to load profile:", e);
  }
}

// Save user profile to storage
async function saveProfileToStorage() {
  try {
    state.profile = {
      name: elements.profileName.value.trim(),
      age: elements.profileAge.value,
      gender: elements.profileGender.value.trim(),
      baselineHair: elements.profileBaselineHair.value,
      baselineSkin: elements.profileBaselineSkin.value
    };
    
    localStorage.setItem('imstev_user_profile', JSON.stringify(state.profile));
    
    // Save OpenAI Key
    if (elements.profileOpenAIKey) {
      const apiKey = elements.profileOpenAIKey.value.trim();
      localStorage.setItem('imstev_openai_key', apiKey);
    }
    
    updateWelcomeStats();

    // Sync profile to Supabase user metadata
    if (state.hasSession && supabase) {
      elements.saveProfileBtn.disabled = true;
      elements.saveProfileBtn.innerText = "Saving & Syncing...";
      await supabase.auth.updateUser({
        data: {
          name: state.profile.name,
          profile: state.profile
        }
      });
      elements.saveProfileBtn.disabled = false;
      elements.saveProfileBtn.innerText = "Save Profile";
    }

    alert("Profile saved successfully!");
    showView('viewWelcome');
  } catch (e) {
    console.error("Failed to save profile:", e);
    alert("Failed to save profile. Please try again.");
    if (elements.saveProfileBtn) {
      elements.saveProfileBtn.disabled = false;
      elements.saveProfileBtn.innerText = "Save Profile";
    }
  }
}


// Consent Initializer
function checkConsentInit() {
  const consent = localStorage.getItem('imstev_biometric_consent');
  state.hasConsented = (consent === 'true');
  if (elements.consentCheckbox) {
    elements.consentCheckbox.checked = state.hasConsented;
    elements.agreeConsentBtn.disabled = !state.hasConsented;
  }
}

// Toggle Consent Modal Overlay
function toggleConsentModal(show) {
  if (show) {
    elements.consentModal.classList.add('active');
  } else {
    elements.consentModal.classList.remove('active');
  }
}

// Generate ICS Calendar File for weekly checkin reminders
function generateICSReminder() {
  const timestamp = getICSTimestamp(new Date());
  
  // Set event start time: tomorrow at 09:00 AM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  const startStr = getICSTimestamp(tomorrow);
  
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Imstev Hair & Skin Lab//NONSGML Weekly Checkin//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:imstev_reminder_${Date.now()}@imstev.com`,
    `DTSTAMP:${timestamp}`,
    `DTSTART:${startStr}`,
    "DURATION:PT15M",
    "SUMMARY:Imstev Hair & Skin Scan Check-in",
    "DESCRIPTION:Time to do your weekly scalp check-in and skin hydration analysis on Imstev Hair & Skin Lab app!",
    "RRULE:FREQ=WEEKLY;INTERVAL=1",
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder: Weekly Skin/Hair Scan",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  try {
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "imstev_weekly_checkin.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert("Calendar reminder downloaded! Open this file to import it into your Apple, Google, or Outlook Calendar.");
  } catch (e) {
    console.error("Failed to generate ICS file:", e);
    alert("Unable to generate calendar reminder file.");
  }
}

// Helper to format Date for iCalendar standard (YYYYMMDDTHHMMSSZ)
function getICSTimestamp(date) {
  const pad = (num) => String(num).padStart(2, '0');
  const yyyy = date.getUTCFullYear();
  const mm = pad(date.getUTCMonth() + 1);
  const dd = pad(date.getUTCDate());
  const hh = pad(date.getUTCHours());
  const min = pad(date.getUTCMinutes());
  const ss = pad(date.getUTCSeconds());
  return `${yyyy}${mm}${dd}T${hh}${min}${ss}Z`;
}

// Render dynamic progress SVG sparklines in the History tab
function renderProgressTrends() {
  if (state.history.length < 2) {
    elements.historyTrendsCard.style.display = "none";
    return;
  }
  
  elements.historyTrendsCard.style.display = "block";
  
  // Grab the last 5 scans and reverse to arrange chronologically (oldest to newest)
  const scans = state.history.slice(0, 5).reverse();
  const count = scans.length;
  
  const width = 300;
  const height = 90;
  const paddingX = 25;
  const paddingY = 15;
  
  let hairPoints = [];
  let skinPoints = [];
  
  for (let i = 0; i < count; i++) {
    const scan = scans[i];
    const x = paddingX + (i * (width - 2 * paddingX)) / (count - 1);
    
    if (scan.type === 'hair') {
      const health = 100 - Math.round((scan.metrics.scores.frizziness + scan.metrics.scores.damage) / 2);
      const y = height - paddingY - (health / 100) * (height - 2 * paddingY);
      hairPoints.push({ x, y, val: health, idx: i + 1 });
    } else {
      const hyd = scan.metrics.scores.hydration;
      const y = height - paddingY - (hyd / 100) * (height - 2 * paddingY);
      skinPoints.push({ x, y, val: hyd, idx: i + 1 });
    }
  }

  const getPathD = (points) => {
    if (points.length < 2) return "";
    return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
  };

  const hairPath = getPathD(hairPoints);
  const skinPath = getPathD(skinPoints);
  
  let svgContent = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  
  // Draw helper gridlines (25%, 50%, 75%)
  [0.25, 0.5, 0.75].forEach(ratio => {
    const yLine = height - paddingY - ratio * (height - 2 * paddingY);
    svgContent += `<line x1="${paddingX}" y1="${yLine}" x2="${width - paddingX}" y2="${yLine}" stroke="rgba(255,255,255,0.04)" stroke-dasharray="3,3" />`;
  });
  
  // Draw Hair line
  if (hairPath) {
    svgContent += `<path class="trend-line-hair" d="${hairPath}" />`;
    hairPoints.forEach(p => {
      svgContent += `
        <circle class="trend-point-hair" cx="${p.x}" cy="${p.y}" r="4">
          <title>Hair Health ${p.val}%</title>
        </circle>
        <text x="${p.x}" y="${p.y - 8}" fill="var(--primary-gold)" font-size="8" font-family="var(--font-numeric)" text-anchor="middle" font-weight="bold">${p.val}%</text>
      `;
    });
  }
  
  // Draw Skin line
  if (skinPath) {
    svgContent += `<path class="trend-line-skin" d="${skinPath}" />`;
    skinPoints.forEach(p => {
      svgContent += `
        <circle class="trend-point-skin" cx="${p.x}" cy="${p.y}" r="4">
          <title>Skin Hydration ${p.val}%</title>
        </circle>
        <text x="${p.x}" y="${p.y + 12}" fill="var(--light-emerald)" font-size="8" font-family="var(--font-numeric)" text-anchor="middle" font-weight="bold">${p.val}%</text>
      `;
    });
  }
  
  svgContent += "</svg>";
  elements.trendSvgWrapper.innerHTML = svgContent;
  
  // Generate brief text summary
  let summary = "Track your scores. Keep consistent with your routines!";
  const skinScans = scans.filter(s => s.type === 'skin');
  const hairScans = scans.filter(s => s.type === 'hair');
  
  if (skinScans.length >= 2) {
    const diff = skinScans[skinScans.length - 1].metrics.scores.hydration - skinScans[0].metrics.scores.hydration;
    if (diff > 0) {
      summary = `Your Skin Hydration improved by +${diff}% since your first scan! Keep up your routines.`;
    } else if (diff < 0) {
      summary = `Your Skin Hydration has declined by ${Math.abs(diff)}%. Hydrate more and review your skin barrier cream.`;
    } else {
      summary = "Your Skin Hydration levels are steady. Focus on daily protection.";
    }
  } else if (hairScans.length >= 2) {
    const getH = (s) => 100 - Math.round((s.metrics.scores.frizziness + s.metrics.scores.damage) / 2);
    const diff = getH(hairScans[hairScans.length - 1]) - getH(hairScans[0]);
    if (diff > 0) {
      summary = `Your Hair Health score increased by +${diff}%! Your curls are retaining moisture.`;
    } else if (diff < 0) {
      summary = `Your Hair Health has declined by ${Math.abs(diff)}%. Try using a steam cap or deep treatment mask.`;
    } else {
      summary = "Your Hair Health is holding steady. Keep moisturizing.";
    }
  }
  elements.trendAnalysisSummary.innerText = summary;
}

// ----------------------------------------------------
// SUPABASE AUTHENTICATION CONTROLLER FLOWS
// ----------------------------------------------------

// Initialize Session listener
function initializeAuth() {
  if (!supabase) {
    console.warn("Supabase is not configured. Running in offline/local-only mode.");
    handleSessionTransition(null);
    return;
  }

  // Check active session on load
  supabase.auth.getSession().then(({ data: { session } }) => {
    handleSessionTransition(session);
  });

  // Listen to Auth State changes (Login, Logout, Token Refreshes)
  supabase.auth.onAuthStateChange((event, session) => {
    handleSessionTransition(session);
  });
}

// Handle Session Changes
function handleSessionTransition(session) {
  if (session) {
    state.hasSession = true;
    const navBar = document.querySelector('.nav-bar');
    if (navBar) navBar.style.display = 'flex';
    
    syncUserData().then(() => {
      // If currently on Auth view or no view set, go to Welcome
      if (state.currentView === 'viewAuth' || !state.currentView) {
        showView('viewWelcome');
      }
      renderClientSpecialistView();
    });
  } else {
    clearUserSessionData();
    showView('viewAuth');
    showAuthViewForm('login');
  }
}

// Sync user profile data and scan history from Supabase user_metadata
async function syncUserData() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;

    if (user && user.user_metadata) {
      // Sync Profile
      state.profile = user.user_metadata.profile || {
        name: user.user_metadata.name || "",
        age: "25-34",
        gender: "",
        baselineHair: "none",
        baselineSkin: "none"
      };
      
      // Populate fields in UI
      if (elements.profileName) elements.profileName.value = state.profile.name || "";
      if (elements.profileAge) elements.profileAge.value = state.profile.age || "25-34";
      if (elements.profileGender) elements.profileGender.value = state.profile.gender || "";
      if (elements.profileBaselineHair) elements.profileBaselineHair.value = state.profile.baselineHair || "none";
      if (elements.profileBaselineSkin) elements.profileBaselineSkin.value = state.profile.baselineSkin || "none";

      localStorage.setItem('imstev_user_profile', JSON.stringify(state.profile));

      // Sync Scan History: Merge local storage and remote
      const localHist = JSON.parse(localStorage.getItem('imstev_scan_history') || '[]');
      const remoteHist = user.user_metadata.scans || [];
      
      const mergedMap = new Map();
      [...remoteHist, ...localHist].forEach(item => {
        mergedMap.set(item.timestamp, item);
      });
      
      state.history = Array.from(mergedMap.values()).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      localStorage.setItem('imstev_scan_history', JSON.stringify(state.history));
      updateWelcomeStats();
      renderClientSpecialistView();
    }
  } catch (e) {
    console.error("Failed to sync user data from Supabase:", e);
  }
}

// Clear state and local cache on signout
function clearUserSessionData() {
  state.hasSession = false;
  state.profile = { name: "", age: "25-34", gender: "", baselineHair: "none", baselineSkin: "none" };
  state.history = [];
  localStorage.removeItem('imstev_scan_history');
  localStorage.removeItem('imstev_user_profile');
  
  if (elements.profileName) elements.profileName.value = "";
  if (elements.profileAge) elements.profileAge.value = "25-34";
  if (elements.profileGender) elements.profileGender.value = "";
  if (elements.profileBaselineHair) elements.profileBaselineHair.value = "none";
  if (elements.profileBaselineSkin) elements.profileBaselineSkin.value = "none";

  const navBar = document.querySelector('.nav-bar');
  if (navBar) navBar.style.display = 'none';
  if (elements.welcomeSpecialistNotes) elements.welcomeSpecialistNotes.style.display = 'none';

  updateWelcomeStats();
}

// Switch between Auth Forms
function showAuthViewForm(formName) {
  hideAuthError();
  if (formName === 'login') {
    elements.formLogin.style.display = 'flex';
    elements.formRegister.style.display = 'none';
    elements.formForgot.style.display = 'none';
  } else if (formName === 'register') {
    elements.formLogin.style.display = 'none';
    elements.formRegister.style.display = 'flex';
    elements.formForgot.style.display = 'none';
  } else if (formName === 'forgot') {
    elements.formLogin.style.display = 'none';
    elements.formRegister.style.display = 'none';
    elements.formForgot.style.display = 'flex';
  }
}

// Set button state during async queries
function setButtonLoading(btn, isLoading, text) {
  if (btn) {
    btn.disabled = isLoading;
    btn.innerText = text;
  }
}

// Render auth errors
function showAuthError(msg) {
  if (elements.authErrorMsg) {
    elements.authErrorMsg.innerText = msg;
    elements.authErrorMsg.style.display = 'block';
  }
}
function hideAuthError() {
  if (elements.authErrorMsg) {
    elements.authErrorMsg.style.display = 'none';
  }
}

// Login trigger
async function handleLogin() {
  if (!supabase) {
    showAuthError("Authentication is currently offline (Supabase is not configured).");
    return;
  }

  const email = elements.loginEmail.value.trim();
  const password = elements.loginPassword.value;
  if (!email || !password) {
    showAuthError("Please enter both email and password.");
    return;
  }

  setButtonLoading(elements.btnLogin, true, "Signing In...");
  hideAuthError();

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  } catch (e) {
    showAuthError(e.message);
    setButtonLoading(elements.btnLogin, false, "Sign In");
  }
}

// Register trigger
async function handleRegister() {
  if (!supabase) {
    showAuthError("Registration is currently offline (Supabase is not configured).");
    return;
  }

  const name = elements.registerName.value.trim();
  const email = elements.registerEmail.value.trim();
  const password = elements.registerPassword.value;
  const confirm = elements.registerConfirmPassword.value;

  if (!name || !email || !password || !confirm) {
    showAuthError("Please fill in all registration fields.");
    return;
  }

  if (password.length < 6) {
    showAuthError("Password must be at least 6 characters.");
    return;
  }

  if (password !== confirm) {
    showAuthError("Passwords do not match.");
    return;
  }

  setButtonLoading(elements.btnRegister, true, "Creating Account...");
  hideAuthError();

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          profile: {
            name: name,
            age: "25-34",
            gender: "",
            baselineHair: "none",
            baselineSkin: "none"
          },
          scans: []
        }
      }
    });

    if (error) throw error;

    if (data.session) {
      alert("Registration successful! Welcome to Imstev.");
    } else {
      alert("Account registration initiated! Check your email inbox to confirm.");
      showAuthViewForm('login');
    }
  } catch (e) {
    showAuthError(e.message);
  } finally {
    setButtonLoading(elements.btnRegister, false, "Create Account");
  }
}

// Forgot Password trigger
async function handleForgot() {
  if (!supabase) {
    showAuthError("Password reset is currently offline (Supabase is not configured).");
    return;
  }

  const email = elements.forgotEmail.value.trim();
  if (!email) {
    showAuthError("Please specify your email address.");
    return;
  }

  setButtonLoading(elements.btnForgot, true, "Sending Reset Link...");
  hideAuthError();

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname
    });
    
    if (error) throw error;
    
    alert("Password reset instructions sent to your email!");
    showAuthViewForm('login');
  } catch (e) {
    showAuthError(e.message);
  } finally {
    setButtonLoading(elements.btnForgot, false, "Send Reset Link");
  }
}
// Logout trigger
async function handleSignOut() {
  if (!supabase) {
    clearUserSessionData();
    showView('viewAuth');
    return;
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (e) {
    alert("Sign out failed: " + e.message);
  }
}

// ----------------------------------------------------
// SALON SPECIALIST CONTROLLER & MOCK DATA
// ----------------------------------------------------

const mockClients = [
  {
    id: "mock-client-1",
    email: "sarah.jones@example.com",
    profile: {
      name: "Sarah Jones",
      age: "18-24",
      gender: "She/Her",
      baselineHair: "damage",
      baselineSkin: "acne",
      specialistNotes: "Focus on weekly deep hydration treatments. Avoid sulfate-based shampoos.",
      productOverrides: ["h1", "s2"]
    },
    scans: [
      {
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        type: "hair",
        metrics: {
          type: "3B Curl Pattern",
          texture: "Medium",
          porosity: "High Porosity",
          scores: { frizziness: 75, damage: 60 }
        },
        primaryConcern: { name: "Dryness / Damage", desc: "Your hair shows elevated split ends." }
      },
      {
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        type: "skin",
        metrics: {
          type: "Oily / Acne-Prone",
          scores: { hydration: 42, sebum: 80, pores: 70, redness: 50, pigmentation: 30, wrinkles: 10, eyebags: 15, darkCircles: 20 }
        },
        primaryConcern: { name: "Active Breakouts", desc: "Sebum production is highly active." }
      }
    ]
  },
  {
    id: "mock-client-2",
    email: "david.kim@example.com",
    profile: {
      name: "David Kim",
      age: "25-34",
      gender: "He/Him",
      baselineHair: "density",
      baselineSkin: "pigmentation",
      specialistNotes: "Recommend using caffeine scalp tonic twice daily. Wear sunscreen SPF 50 daily.",
      productOverrides: ["s4"]
    },
    scans: [
      {
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        type: "skin",
        metrics: {
          type: "Dry / Sensitive",
          scores: { hydration: 35, sebum: 20, pores: 30, redness: 65, pigmentation: 50, wrinkles: 25, eyebags: 30, darkCircles: 35 }
        },
        primaryConcern: { name: "Pigmentation & Sun Spots", desc: "Mild UV damage detected." }
      }
    ]
  },
  {
    id: "mock-client-3",
    email: "amara.okafor@example.com",
    profile: {
      name: "Amara Okafor",
      age: "35-44",
      gender: "They/Them",
      baselineHair: "frizziness",
      baselineSkin: "wrinkles",
      specialistNotes: "",
      productOverrides: []
    },
    scans: []
  }
];

// Load and merge specialist clients directory
function loadClientsList() {
  let clients = [];
  const stored = localStorage.getItem('imstev_mock_clients');
  if (stored) {
    try {
      clients = JSON.parse(stored);
    } catch (e) {
      clients = [...mockClients];
    }
  } else {
    clients = [...mockClients];
  }
  
  // Add current active client to the specialist directory so they can prescribe notes to themselves
  const currentUserEmail = state.hasSession && supabase && supabase.auth.user ? supabase.auth.user()?.email : "you@local.client";
  const currentUserName = state.profile.name || "You (Local Profile)";
  
  const exists = clients.find(c => c.email === currentUserEmail);
  if (!exists) {
    clients.unshift({
      id: "current-user-client",
      email: currentUserEmail,
      profile: state.profile,
      scans: state.history
    });
  } else {
    exists.profile = state.profile;
    exists.scans = state.history;
  }
  
  state.clients = clients;
}

// Render client cards list
function renderClientsDirectory(filterText = "") {
  elements.specialistClientList.innerHTML = "";
  
  const query = filterText.toLowerCase();
  const filtered = state.clients.filter(c => 
    (c.profile.name && c.profile.name.toLowerCase().includes(query)) ||
    (c.email && c.email.toLowerCase().includes(query))
  );

  if (filtered.length === 0) {
    elements.specialistClientList.innerHTML = "<p style='color: var(--text-muted); text-align: center; font-size: 13px; margin-top: 24px;'>No clients found matching search query.</p>";
    return;
  }

  filtered.forEach(client => {
    const card = document.createElement('div');
    card.className = "client-card";
    
    const lastScan = client.scans && client.scans.length > 0 ? client.scans[0] : null;
    const lastScanDate = lastScan ? new Date(lastScan.timestamp).toLocaleDateString() : "Never";
    
    let badgeHtml = "";
    if (lastScan) {
      badgeHtml = `<span class="client-badge ${lastScan.type}">${lastScan.type} scan</span>`;
    } else {
      badgeHtml = `<span class="client-badge no-scans">No scans</span>`;
    }
    
    card.innerHTML = `
      <div class="client-info-main">
        <h4>${client.profile.name || "Unnamed Client"}</h4>
        <span>${client.email}</span>
        <div class="client-meta-badges">
          ${badgeHtml}
          <span style="font-size: 11px; color: var(--text-secondary);">Last active: ${lastScanDate}</span>
        </div>
      </div>
      <i class="material-symbols-outlined" style="color: var(--text-secondary); font-size: 20px;">chevron_right</i>
    `;
    card.addEventListener('click', () => openClientDetailDrawer(client.id));
    elements.specialistClientList.appendChild(card);
  });
}

// Open expanding client details drawer modal
function openClientDetailDrawer(clientId) {
  const client = state.clients.find(c => c.id === clientId);
  if (!client) return;

  state.selectedClient = client;

  elements.drawerClientName.innerText = client.profile.name || "Unnamed Client";
  elements.drawerClientEmail.innerText = client.email;
  elements.drawerNotesInput.value = client.profile.specialistNotes || "";

  // Render client scan history summary inside drawer
  elements.drawerTrendsContainer.innerHTML = "";
  if (!client.scans || client.scans.length === 0) {
    elements.drawerTrendsContainer.innerHTML = `<span style="font-size: 13px; color: var(--text-muted);">No scan history captured yet.</span>`;
  } else {
    const last = client.scans[0];
    const isHair = last.type === 'hair';
    let scoreText = "";
    if (isHair) {
      const health = 100 - Math.round((last.metrics.scores.frizziness + last.metrics.scores.damage) / 2);
      scoreText = `Last Scan: ${last.metrics.type} (Health: ${health}%)`;
    } else {
      scoreText = `Last Scan: ${last.metrics.type} (Hydration: ${last.metrics.scores.hydration}%)`;
    }
    
    elements.drawerTrendsContainer.innerHTML = `
      <div style="width: 100%; display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
        <span style="font-weight: 600; color: ${isHair ? 'var(--primary-gold)' : 'var(--light-emerald)'};">${scoreText}</span>
        <span style="color: var(--text-secondary);">${new Date(last.timestamp).toLocaleDateString()}</span>
      </div>
      <div style="font-size: 11px; color: var(--text-secondary); width: 100%; text-align: left; line-height: 1.4;">
        Primary Concern: <strong>${last.primaryConcern.name}</strong> - ${last.primaryConcern.desc}
      </div>
    `;
  }

  // Render checkbox override list
  elements.drawerProductsList.innerHTML = "";
  const allProds = [...products.hair, ...products.skin];
  allProds.forEach(prod => {
    const isChecked = client.profile.productOverrides && client.profile.productOverrides.includes(prod.id);
    const div = document.createElement('div');
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.gap = "8px";
    div.style.padding = "4px 0";
    div.innerHTML = `
      <input type="checkbox" id="prescribe-${prod.id}" value="${prod.id}" ${isChecked ? 'checked' : ''} style="accent-color: var(--primary-brown); cursor: pointer;">
      <label for="prescribe-${prod.id}" style="font-size: 13px; color: var(--text-primary); cursor: pointer;">${prod.name} (${prod.category})</label>
    `;
    elements.drawerProductsList.appendChild(div);
  });

  elements.specialistDetailDrawer.style.display = 'flex';
}

// Save specialist prescription details
async function saveSpecialistPrescription() {
  if (!state.selectedClient) return;

  const notes = elements.drawerNotesInput.value.trim();
  
  // Grab checked product checkboxes
  const productIds = [];
  const checkboxes = elements.drawerProductsList.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => {
    if (cb.checked) productIds.push(cb.value);
  });

  state.selectedClient.profile.specialistNotes = notes;
  state.selectedClient.profile.productOverrides = productIds;

  // Save clients list to localStorage (excluding the dynamic current user wrapper)
  const clientsToStore = state.clients.filter(c => c.id !== "current-user-client");
  localStorage.setItem('imstev_mock_clients', JSON.stringify(clientsToStore));

  // If we just updated ourselves, update state profile and sync to Supabase
  if (state.selectedClient.id === "current-user-client") {
    state.profile.specialistNotes = notes;
    state.profile.productOverrides = productIds;
    localStorage.setItem('imstev_user_profile', JSON.stringify(state.profile));

    if (state.hasSession && supabase) {
      try {
        elements.drawerSaveBtn.disabled = true;
        elements.drawerSaveBtn.innerText = "Syncing with Cloud...";
        await supabase.auth.updateUser({
          data: {
            profile: state.profile
          }
        });
      } catch (e) {
        console.warn("Failed to sync prescription notes to Supabase metadata:", e);
      } finally {
        elements.drawerSaveBtn.disabled = false;
        elements.drawerSaveBtn.innerText = "Save Prescription";
      }
    }
  }

  elements.specialistDetailDrawer.style.display = 'none';
  alert(`Prescription for ${state.selectedClient.profile.name || 'Client'} saved successfully!`);
  renderClientsDirectory();
  renderClientSpecialistView();
}

// Display Specialist advice on Client Home Screen
function renderClientSpecialistView() {
  if (state.profile && state.profile.specialistNotes) {
    elements.welcomeSpecialistText.innerText = state.profile.specialistNotes;
    elements.welcomeSpecialistNotes.style.display = 'flex';
  } else {
    elements.welcomeSpecialistNotes.style.display = 'none';
  }
}
