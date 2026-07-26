import { state } from '../shared/state.js';
import { elements, showView } from '../shared/ui.js';
import { supabase } from '../services/supabase.js';

export function loadProfileFromStorage() {
  try {
    const raw = localStorage.getItem('imstev_user_profile');
    if (raw) {
      state.profile = JSON.parse(raw);
      if (elements.profileName) elements.profileName.value = state.profile.name || "";
      if (elements.profileAge) elements.profileAge.value = state.profile.age || "25-34";
      if (elements.profileGender) elements.profileGender.value = state.profile.gender || "";
      if (elements.profileBaselineHair) elements.profileBaselineHair.value = state.profile.baselineHair || "none";
      if (elements.profileBaselineSkin) elements.profileBaselineSkin.value = state.profile.baselineSkin || "none";
    }
    
    const apiKey = localStorage.getItem('imstev_openai_key') || "";
    if (elements.profileOpenAIKey) elements.profileOpenAIKey.value = apiKey;
  } catch (e) {
    console.error("Failed to load profile:", e);
  }
}

export async function saveProfileToStorage(updateWelcomeStatsCb) {
  try {
    state.profile = {
      name: elements.profileName.value.trim(),
      age: elements.profileAge.value,
      gender: elements.profileGender.value.trim(),
      baselineHair: elements.profileBaselineHair.value,
      baselineSkin: elements.profileBaselineSkin.value
    };
    
    localStorage.setItem('imstev_user_profile', JSON.stringify(state.profile));
    
    if (elements.profileOpenAIKey) {
      const apiKey = elements.profileOpenAIKey.value.trim();
      localStorage.setItem('imstev_openai_key', apiKey);
    }
    
    if (updateWelcomeStatsCb) updateWelcomeStatsCb();

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

export async function handleSignOut(clearUserSessionDataCb) {
  if (!supabase) {
    if (clearUserSessionDataCb) clearUserSessionDataCb();
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
