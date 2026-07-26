import { elements } from '../shared/ui.js';

export function renderRoutineSteps(report) {
  if (!elements.resultsRoutineSteps) return;
  
  elements.resultsRoutineSteps.innerHTML = `
    <h4 style="font-family: var(--font-display); font-size: 16px; margin-bottom: 12px; color: var(--primary-brown)">
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
}
