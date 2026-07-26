import { state } from '../shared/state.js';
import { elements } from '../shared/ui.js';
import { supabase } from '../services/supabase.js';
import { renderClientSpecialistView } from '../dashboard/dashboard.js';
import { products } from '../../data.js';

export const mockClients = [
  {
    id: "mock-client-1",
    email: "chioma.nze@example.com",
    profile: {
      name: "Chioma Nze (Lagos, NG)",
      age: "18-24",
      gender: "She/Her",
      baselineHair: "damage",
      baselineSkin: "acne",
      specialistNotes: "Focus on weekly warm oil pre-wash treatments. Protect natural 4C ends.",
      productOverrides: ["h2", "s4"],
      avatar: "nigerian_lady_4c.png"
    },
    scans: [
      {
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        type: "hair",
        photo: "nigerian_lady_4c.png",
        metrics: {
          type: "4C Curl Pattern",
          texture: "Coarse",
          porosity: "High Porosity",
          scores: { frizziness: 65, damage: 70, density: 85 }
        },
        primaryConcern: { name: "Cuticle Damage", desc: "Ends show high cuticle lifting from heat styling." }
      },
      {
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        type: "skin",
        photo: "nigerian_lady_4c.png",
        metrics: {
          type: "Sensitive Skin",
          scores: { hydration: 40, sebum: 35, pores: 40, redness: 65, pigmentation: 45, wrinkles: 10, eyebags: 15, darkCircles: 25 }
        },
        primaryConcern: { name: "Barrier Irritation", desc: "Capillary sensitivity detected around cheeks." }
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
      productOverrides: ["s4"],
      avatar: ""
    },
    scans: [
      {
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        type: "skin",
        metrics: {
          type: "Dry / Sensitive",
          scores: { hydration: 35, sebum: 20, pores: 30, redness: 45, pigmentation: 50, wrinkles: 25, eyebags: 30, darkCircles: 35 }
        },
        primaryConcern: { name: "Pigmentation & Sun Spots", desc: "Mild UV damage detected." }
      }
    ]
  },
  {
    id: "mock-client-3",
    email: "amara.okafor@example.com",
    profile: {
      name: "Amara Okafor (Abuja, NG)",
      age: "35-44",
      gender: "She/Her",
      baselineHair: "frizziness",
      baselineSkin: "wrinkles",
      specialistNotes: "Use steam treatment cap for low porosity absorption.",
      productOverrides: ["h3"],
      avatar: "nigerian_lady_4b.png"
    },
    scans: [
      {
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        type: "hair",
        photo: "nigerian_lady_4b.png",
        metrics: {
          type: "4B Curl Pattern",
          texture: "Medium",
          porosity: "Low Porosity",
          scores: { frizziness: 50, damage: 30, density: 90 }
        },
        primaryConcern: { name: "Low Absorption", desc: "Hair cuticles are tightly sealed, resisting topical moisture." }
      }
    ]
  }
];

export function loadClientsList() {
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
  
  const currentUserEmail = state.hasSession && supabase && supabase.auth.user ? supabase.auth.user()?.email : "you@local.client";
  
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

export function renderClientsDirectory(filterText = "") {
  if (!elements.specialistClientList) return;
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
    
    const avatarUrl = client.profile.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60";
    
    card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
        <img src="${avatarUrl}" alt="${client.profile.name}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 1.5px solid rgba(74, 62, 61, 0.15); flex-shrink: 0;">
        <div class="client-info-main" style="flex: 1; display: flex; flex-direction: column; gap: 2px;">
          <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: var(--text-primary);">${client.profile.name || "Unnamed Client"}</h4>
          <span style="font-size: 11px; color: var(--text-secondary);">${client.email}</span>
          <div class="client-meta-badges" style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
            ${badgeHtml}
            <span style="font-size: 10px; color: var(--text-secondary);">Active: ${lastScanDate}</span>
          </div>
        </div>
      </div>
      <i class="material-symbols-outlined" style="color: var(--text-secondary); font-size: 20px;">chevron_right</i>
    `;
    card.addEventListener('click', () => openClientDetailDrawer(client.id));
    elements.specialistClientList.appendChild(card);
  });
}

export function openClientDetailDrawer(clientId) {
  const client = state.clients.find(c => c.id === clientId);
  if (!client) return;

  state.selectedClient = client;

  elements.drawerClientName.innerText = client.profile.name || "Unnamed Client";
  elements.drawerClientEmail.innerText = client.email;
  elements.drawerNotesInput.value = client.profile.specialistNotes || "";

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
        <span style="font-weight: 600; color: ${isHair ? 'var(--primary-brown)' : 'var(--primary-emerald)'};">${scoreText}</span>
        <span style="color: var(--text-secondary);">${new Date(last.timestamp).toLocaleDateString()}</span>
      </div>
      <div style="font-size: 11px; color: var(--text-secondary); width: 100%; text-align: left; line-height: 1.4;">
        Primary Concern: <strong>${last.primaryConcern.name}</strong> - ${last.primaryConcern.desc}
      </div>
    `;
  }

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

export async function saveSpecialistPrescription() {
  if (!state.selectedClient) return;

  const notes = elements.drawerNotesInput.value.trim();
  
  const productIds = [];
  const checkboxes = elements.drawerProductsList.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => {
    if (cb.checked) productIds.push(cb.value);
  });

  state.selectedClient.profile.specialistNotes = notes;
  state.selectedClient.profile.productOverrides = productIds;

  const clientsToStore = state.clients.filter(c => c.id !== "current-user-client");
  localStorage.setItem('imstev_mock_clients', JSON.stringify(clientsToStore));

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
