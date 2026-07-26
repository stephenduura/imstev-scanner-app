import { state } from './state.js';

export let elements = {};

export function initElements() {
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
    welcomeSpecialistText: document.getElementById('welcome-specialist-text'),

    // Advanced Diagnostics Viewport Cache
    scannerZoneTracker: document.getElementById('scanner-zone-tracker'),
    scannerZoneTitle: document.getElementById('scanner-zone-title'),
    scannerZoneSteps: document.getElementById('scanner-zone-steps'),
    macroToggleBtn: document.getElementById('macro-toggle-btn'),
    macroToggleText: document.getElementById('macro-toggle-text'),
    historyCompareContainer: document.getElementById('history-compare-container'),
    compareBeforeSelect: document.getElementById('compare-before-select'),
    compareAfterSelect: document.getElementById('compare-after-select'),
    compareSliderViewport: document.getElementById('compare-slider-viewport'),
    compareBeforeImg: document.getElementById('compare-before-img'),
    compareAfterContainer: document.getElementById('compare-after-container'),
    compareAfterImg: document.getElementById('compare-after-img'),
    compareSliderHandle: document.getElementById('compare-slider-handle'),
    resultsHerbalList: document.getElementById('results-herbal-list'),
    resultsMedicalList: document.getElementById('results-medical-list')
  };
}

export function showView(viewId) {
  // If no session is active, lock navigation and show auth screen
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
  if (elements.navHome) {
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
}
