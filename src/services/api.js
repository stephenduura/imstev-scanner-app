/**
 * API Gateway Interface to communicate with backend AI Services.
 */

const API_BASE = window.location.origin + "/api";

async function postJSON(endpoint, data) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Backend request failed");
  }

  return response.json();
}

export async function requestSkinAnalysis(photos, answers) {
  return postJSON("/ai/skin", { photos, answers });
}

export async function requestHairAnalysis(photos, answers) {
  return postJSON("/ai/hair", { photos, answers });
}

export async function requestScalpAnalysis(photo, answers) {
  return postJSON("/ai/scalp", { photo, answers });
}

export async function requestIngredientLookup(ingredientsText, skinType) {
  return postJSON("/ingredients/lookup", { ingredientsText, skinType });
}

export async function requestProgressAnalysis(beforeScan, afterScan) {
  return postJSON("/progress/analyze", { beforeScan, afterScan });
}

export async function requestConsultantChat(chatHistory, latestMessage, scanContext) {
  return postJSON("/consultant/chat", { chatHistory, latestMessage, scanContext });
}
