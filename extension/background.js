// ==============================
// AI Fake News Detector Extension
// BACKGROUND SERVICE WORKER
// ==============================

// 🔧 IMPORTANT — SET YOUR BACKEND URL HERE
const API_URL = "http://localhost:5000/api/check-news";

console.log("🚀 FakeCheck AI Extension v3.0 (CURRENT WORKSPACE) Loaded!");
console.log("📂 If you see this, you are running the correct code.");


// LISTEN FOR MESSAGES FROM content.js OR popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // ==========================
  // 1. HANDLE TEXT ANALYSIS
  // ==========================
  if (request.action === "analyze-text") {
    const inputText = request.text;

    // Safety: ensure the active tab is available
    if (!sender.tab || !sender.tab.id) {
      sendResponse({ error: "No active tab found." });
      return false;
    }

    const tabId = sender.tab.id;

    // ---- CALL BACKEND API ---
    fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: inputText })
    })
      .then(res => res.json())
      .then(data => {
        // SEND RESULT BACK TO content.js
        chrome.tabs.sendMessage(tabId, {
          action: "analysis-result",
          data
        });
      })
      .catch(err => {
        console.error("API ERROR:", err);

        chrome.tabs.sendMessage(tabId, {
          action: "analysis-result",
          data: {
            score: "N/A",
            explanation: "API request failed. Check backend console."
          }
        });
      });

    // Required to keep messaging channel open for async responses
    return true;
  }


  // ==========================
  // 2. OPTIONAL: POPUP ACTIONS
  // ==========================
  if (request.action === "analyze-from-popup") {
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: request.text })
    })
      .then(res => res.json())
      .then(data => {
        sendResponse({ success: true, data });
      })
      .catch(() => {
        sendResponse({ success: false });
      });

    return true;
  }
});
