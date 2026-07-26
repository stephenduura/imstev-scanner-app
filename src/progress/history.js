import { state } from '../shared/state.js';
import { elements, showView } from '../shared/ui.js';
import { renderResultsDashboard } from '../dashboard/dashboard.js';
import { updateCompareImages } from './comparison.js';

export function renderHistoryList() {
  if (!elements.historyList) return;
  elements.historyList.innerHTML = "";
  
  if (state.history.length === 0) {
    elements.historyEmpty.style.display = "flex";
    elements.historyTrendsCard.style.display = "none";
    elements.historyCompareContainer.style.display = "none";
    return;
  }
  
  elements.historyEmpty.style.display = "none";
  
  if (state.history.length >= 2) {
    elements.historyCompareContainer.style.display = "block";
    elements.compareBeforeSelect.innerHTML = "";
    elements.compareAfterSelect.innerHTML = "";
    
    state.history.forEach((scan) => {
      const date = new Date(scan.timestamp);
      const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ` (${scan.type === 'hair' ? 'Hair' : 'Skin'})`;
      
      const optBefore = document.createElement('option');
      optBefore.value = scan.timestamp;
      optBefore.innerText = dateStr;
      elements.compareBeforeSelect.appendChild(optBefore);
      
      const optAfter = document.createElement('option');
      optAfter.value = scan.timestamp;
      optAfter.innerText = dateStr;
      elements.compareAfterSelect.appendChild(optAfter);
    });
    
    elements.compareBeforeSelect.selectedIndex = 1;
    elements.compareAfterSelect.selectedIndex = 0;
    
    updateCompareImages();
  } else {
    elements.historyCompareContainer.style.display = "none";
  }
  
  renderProgressTrends();

  state.history.forEach((report, index) => {
    const card = document.createElement('div');
    const isHair = report.type === 'hair';
    card.className = `history-card ${isHair ? 'hair' : 'skin'}`;
    
    const date = new Date(report.timestamp);
    const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    
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

export function renderProgressTrends() {
  if (state.history.length < 2) {
    elements.historyTrendsCard.style.display = "none";
    return;
  }
  
  elements.historyTrendsCard.style.display = "block";
  
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
  
  [0.25, 0.5, 0.75].forEach(ratio => {
    const yLine = height - paddingY - ratio * (height - 2 * paddingY);
    svgContent += `<line x1="${paddingX}" y1="${yLine}" x2="${width - paddingX}" y2="${yLine}" stroke="rgba(255,255,255,0.04)" stroke-dasharray="3,3" />`;
  });
  
  if (hairPath) {
    svgContent += `<path class="trend-line-hair" d="${hairPath}" />`;
    hairPoints.forEach(p => {
      svgContent += `
        <circle class="trend-point-hair" cx="${p.x}" cy="${p.y}" r="4">
          <title>Hair Health ${p.val}%</title>
        </circle>
        <text x="${p.x}" y="${p.y - 8}" fill="var(--primary-brown)" font-size="8" font-family="var(--font-numeric)" text-anchor="middle" font-weight="bold">${p.val}%</text>
      `;
    });
  }
  
  if (skinPath) {
    svgContent += `<path class="trend-line-skin" d="${skinPath}" />`;
    skinPoints.forEach(p => {
      svgContent += `
        <circle class="trend-point-skin" cx="${p.x}" cy="${p.y}" r="4">
          <title>Skin Hydration ${p.val}%</title>
        </circle>
        <text x="${p.x}" y="${p.y + 12}" fill="var(--primary-emerald)" font-size="8" font-family="var(--font-numeric)" text-anchor="middle" font-weight="bold">${p.val}%</text>
      `;
    });
  }
  
  svgContent += "</svg>";
  elements.trendSvgWrapper.innerHTML = svgContent;
  
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

export function downloadCalendarReminder() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 7);
  tomorrow.setHours(10, 0, 0, 0);
  
  const pad = (num) => String(num).padStart(2, '0');
  const timestamp = getICSTimestamp(new Date());
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
