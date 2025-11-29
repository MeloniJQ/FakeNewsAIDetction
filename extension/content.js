// =======================================================
// FakeCheck AI — FINAL HOVER-FIX VERSION
// (Check only shows on hover, never inverted, never always-visible)
// =======================================================

console.log("🔥 FakeCheck FINAL HOVER FIX loaded");
// alert("FakeCheck Extension Loaded! If you see this, the update worked."); // Uncomment for debugging

// =======================================================
// 1. ANALYZE SELECTED TEXT
// =======================================================

let analyzeBubble = null;
let suppressMouseUp = false;

document.addEventListener("mousedown", () => {
  suppressMouseUp = true;
  setTimeout(() => (suppressMouseUp = false), 120);
});

document.addEventListener("mouseup", (e) => {
  if (suppressMouseUp) return;

  const text = window.getSelection().toString().trim();
  if (text.length < 25) return;

  if (analyzeBubble) analyzeBubble.remove();

  analyzeBubble = document.createElement("div");
  analyzeBubble.textContent = "Analyze";

  analyzeBubble.style.cssText = `
    position:absolute;
    top:${e.pageY + 10}px;
    left:${e.pageX + 10}px;
    background:#0d6efd;
    color:white;
    padding:6px 14px;
    border-radius:20px;
    border:none;
    box-shadow:0 6px 18px rgba(0,0,0,.15);
    cursor:pointer;
    font-size:13px;
    font-family:system-ui;
    z-index:999999999;
    white-space:nowrap;
  `;

  analyzeBubble.onclick = () => {
    chrome.runtime.sendMessage({ action: "analyze-text", text });
    analyzeBubble.remove();
    showLoadingToast();
  };

  document.body.appendChild(analyzeBubble);
});

// =======================================================
// 2. UNIVERSAL HEADLINE DETECTION
// =======================================================

const processed = new WeakSet();

function isClickableHeadline(el) {
  if (!el) return false;

  const text = el.innerText?.trim();
  if (!text || text.length < 30) return false;

  if (/^\d+(m|h|d|w)/i.test(text)) return false;
  if (/^By\s/i.test(text)) return false;

  if (el.tagName === "A" && el.href) return true;
  if (el.getAttribute("role") === "link") return true;
  if (el.onclick) return true;

  if (window.getComputedStyle(el).cursor === "pointer") return true;

  return false;
}

function isArticleTitle(el) {
  return (
    el.tagName === "H1" &&
    el.innerText.trim().length > 20 &&
    !el.closest("header, nav")
  );
}

function findContainer(el) {
  return (
    el.closest(
      "article, [role='article'], [jsname], [jslog], [data-n-id], [data-testid], [data-item-id], .card, .Card, .post, .Post, .story"
    ) || el.parentElement
  );
}

function attachButtons() {
  const elements = document.querySelectorAll("a, h1, h2, div, span, p");

  elements.forEach((el) => {
    const feedHeadline = isClickableHeadline(el);
    const articleHeadline = isArticleTitle(el);

    if (!feedHeadline && !articleHeadline) return;

    const container = findContainer(el);
    if (!container) return;

    if (processed.has(container)) return;
    processed.add(container);

    const headlineText = el.innerText.trim();

    // Create Check button (DEFAULT: HIDDEN)
    const btn = document.createElement("button");
    btn.textContent = "Check";

    btn.style.cssText = `
      display:none !important;            /* <<< FIX: hidden by default */
      padding:6px 14px;
      background:#0d6efd;
      color:white;
      border:none;
      border-radius:20px;
      cursor:pointer;
      font-size:13px;
      font-family:system-ui;
      white-space:nowrap;
      width:auto !important;
      max-width:max-content;
      box-shadow:0 4px 10px rgba(0,0,0,.25);
      margin-top:6px;
      z-index:999999999 !important;
      transition:opacity .15s ease-out;
      opacity:0;                          /* <<< FIX: fully invisible initially */
    `;

    el.insertAdjacentElement("afterend", btn);

    let hideTimeout;

    // Hover (SHOW)
    const showBtn = () => {
      clearTimeout(hideTimeout);
      btn.style.display = "inline-block";
      requestAnimationFrame(() => {
        btn.style.opacity = "1";
      });
    };

    container.addEventListener("mouseenter", showBtn);
    btn.addEventListener("mouseenter", showBtn); // Keep open when hovering button

    // Unhover (HIDE)
    const hideBtn = () => {
      hideTimeout = setTimeout(() => {
        btn.style.opacity = "0";
        setTimeout(() => {
          if (btn.style.opacity === "0") btn.style.display = "none";
        }, 150);
      }, 300); // Increased delay to 300ms for better UX
    };

    container.addEventListener("mouseleave", hideBtn);
    btn.addEventListener("mouseleave", hideBtn);

    btn.addEventListener("mousedown", (e) => e.stopPropagation());
    btn.addEventListener("mouseup", (e) => e.stopPropagation());

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Visual feedback
      const originalText = btn.textContent;
      btn.textContent = "Checking...";
      btn.style.background = "#6c757d";
      btn.style.cursor = "wait";

      chrome.runtime.sendMessage({
        action: "analyze-text",
        text: headlineText,
      });

      showLoadingToast();

      // Reset button after 5 seconds (timeout fallback)
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = "#0d6efd";
        btn.style.cursor = "pointer";
      }, 5000);
    });
  });
}

setInterval(attachButtons, 700);

// =======================================================
// 3. RESULT TOAST & LOADING STATE
// =======================================================

let loadingToast = null;

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "analysis-result") {
    removeLoadingToast();
    showToast(msg.data);
  }
});

function showLoadingToast() {
  console.log("Showing loading toast..."); // Debug log
  removeLoadingToast(); // Clear existing

  loadingToast = document.createElement("div");
  loadingToast.style.cssText = `
    position:fixed !important;
    bottom:20px !important;
    right:20px !important;
    background:white !important;
    padding:18px !important;
    border-radius:12px !important;
    width:330px !important;
    box-shadow:0 12px 30px rgba(0,0,0,.3) !important;
    font-family:system-ui !important;
    z-index:2147483647 !important; /* Max z-index */
    display:flex !important;
    align-items:center !important;
    gap:15px !important;
    opacity: 1 !important;
    visibility: visible !important;
  `;

  // Simple CSS spinner
  const spinner = document.createElement("div");
  spinner.style.cssText = `
    border: 3px solid #f3f3f3;
    border-top: 3px solid #0d6efd;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    animation: spin 1s linear infinite;
  `;

  // Add keyframes for spinner if not present
  if (!document.getElementById("fakecheck-keyframes")) {
    const style = document.createElement("style");
    style.id = "fakecheck-keyframes";
    style.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  }

  const text = document.createElement("div");
  text.innerHTML = `
    <div style="font-weight:600;font-size:16px;color:#111;">Analyzing...</div>
    <div style="font-size:13px;color:#666;">AI is verifying this content</div>
  `;

  loadingToast.appendChild(spinner);
  loadingToast.appendChild(text);

  try {
    (document.body || document.documentElement).appendChild(loadingToast);
    console.log("FakeCheck: Loading toast appended successfully");
  } catch (e) {
    console.error("FakeCheck: Failed to append toast", e);
  }
}

function removeLoadingToast() {
  if (loadingToast) {
    loadingToast.remove();
    loadingToast = null;
  }
}

function showToast(data) {
  const box = document.createElement("div");

  box.style.cssText = `
    position:fixed;
    bottom:20px;
    right:20px;
    background:white;
    padding:18px;
    border-radius:12px;
    width:330px;
    max-height:400px;
    overflow-y:auto;
    box-shadow:0 12px 30px rgba(0,0,0,.3);
    font-family:system-ui;
    z-index:999999999;
    animation: slideIn 0.3s ease-out;
  `;

  // Add slideIn keyframes
  if (!document.getElementById("fakecheck-slidein")) {
    const style = document.createElement("style");
    style.id = "fakecheck-slidein";
    style.innerHTML = `@keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`;
    document.head.appendChild(style);
  }

  box.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
      <div style="font-weight:600;font-size:17px;color:#111;">AI Analysis</div>
      <button id="fc-close-btn" style="background:none;border:none;font-size:20px;cursor:pointer;color:#999;">&times;</button>
    </div>
    <div style="font-size:15px;font-weight:700;color:${data.classification === 'Real' ? '#198754' : '#dc3545'};margin-bottom:10px;">
      ${data.classification} (${data.confidence}%)
    </div>
    <div style="font-size:14px;line-height:1.55;color:#222;white-space:pre-wrap;">
      ${data.explanation || "No explanation available."}
    </div>
  `;

  document.body.appendChild(box);

  // Close button functionality
  const closeBtn = box.querySelector("#fc-close-btn");
  closeBtn.onclick = () => box.remove();

  // Auto-remove after 15 seconds (increased from 9s)
  setTimeout(() => {
    if (document.body.contains(box)) {
      box.style.transition = "opacity .4s";
      box.style.opacity = "0";
      setTimeout(() => box.remove(), 400);
    }
  }, 15000)
}
