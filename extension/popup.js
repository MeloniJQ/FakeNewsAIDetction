const API_URL_KEY = "fakeCheckApiUrl"
const DEFAULT_API_URL = "http://127.0.0.1:5000"

const newsTextEl = document.getElementById("newsText")
const checkBtnEl = document.getElementById("checkBtn")
const resultContainerEl = document.getElementById("resultContainer")
const loadingContainerEl = document.getElementById("loadingContainer")
const errorContainerEl = document.getElementById("errorContainer")
const settingsBtnEl = document.getElementById("settingsBtn")
const settingsModalEl = document.getElementById("settingsModal")
const apiUrlInputEl = document.getElementById("apiUrl")
const saveSettingsBtnEl = document.getElementById("saveSettingsBtn")
const closeModalEl = document.querySelector(".close")
const analyticsBtnEl = document.getElementById("analyticsBtn")

// Declare chrome variable
// const chrome = window.chrome

document.addEventListener("DOMContentLoaded", () => {
  // Use callback for compatibility
  chrome.storage.local.get([API_URL_KEY], (result) => {
    apiUrlInputEl.value = result[API_URL_KEY] || DEFAULT_API_URL
  })

  // Load and display analytics
  loadAnalytics()
})

checkBtnEl.addEventListener("click", checkNews)
settingsBtnEl.addEventListener("click", () => {
  settingsModalEl.style.display = "flex"
})
closeModalEl.addEventListener("click", () => {
  settingsModalEl.style.display = "none"
})
saveSettingsBtnEl.addEventListener("click", saveSettings)
analyticsBtnEl?.addEventListener("click", showAnalyticsDashboard)

document.getElementById("correctBtn").addEventListener("click", () => submitFeedback(true))
document.getElementById("incorrectBtn").addEventListener("click", () => submitFeedback(false))

async function checkNews() {
  const text = newsTextEl.value.trim()

  if (!text) {
    showError("Please enter some news text to check")
    return
  }

  showLoading()

  try {
    const response = await chrome.runtime.sendMessage({ action: "analyze-from-popup", text })

    if (response.success) {
      displayResult(response.data)
    } else {
      showError(response.error)
    }
  } catch (error) {
    showError(`Error: ${error.message}. Make sure the backend is running.`)
  }
}

async function submitFeedback(isCorrect) {
  const resultId = document.getElementById("resultContainer").dataset.resultId

  if (!resultId) return

  try {
    const apiUrl = await getApiUrl()
    const response = await fetch(`${apiUrl}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newsId: resultId, isCorrect }),
    })

    if (response.ok) {
      const data = await response.json()
      document.getElementById("communityScore").textContent = data.communityScore
    }

    document.querySelectorAll(".btn-feedback").forEach((btn) => btn.classList.remove("active"))
    event.target.closest(".btn-feedback").classList.add("active")
  } catch (error) {
    console.error("Feedback error:", error)
  }
}

function displayResult(result) {
  const classification = result.classification.toLowerCase()
  const container = document.getElementById("resultContainer")

  document.getElementById("classificationLabel").textContent = result.classification
  document.getElementById("classificationLabel").className = `label ${classification}`
  document.getElementById("confidenceScore").textContent = `${result.confidence}%`
  document.getElementById("confidenceBar").style.width = `${result.confidence}%`
  document.getElementById("explanation").textContent = result.explanation
  document.getElementById("communityScore").textContent = result.communityScore || 0

  container.dataset.resultId = result.id
  resultContainerEl.style.display = "block"
  loadingContainerEl.style.display = "none"
  errorContainerEl.style.display = "none"

  document.querySelectorAll(".btn-feedback").forEach((btn) => btn.classList.remove("active"))
}

function showLoading() {
  resultContainerEl.style.display = "none"
  errorContainerEl.style.display = "none"
  loadingContainerEl.style.display = "block"
}

function showError(message) {
  document.getElementById("errorMessage").textContent = message
  resultContainerEl.style.display = "none"
  loadingContainerEl.style.display = "none"
  errorContainerEl.style.display = "block"
}

async function saveSettings() {
  const apiUrl = apiUrlInputEl.value.trim()

  if (!apiUrl) {
    alert("Please enter an API URL")
    return
  }

  await chrome.storage.local.set({ [API_URL_KEY]: apiUrl })
  alert("Settings saved!")
  settingsModalEl.style.display = "none"
}

async function getApiUrl() {
  return new Promise((resolve) => {
    chrome.storage.local.get([API_URL_KEY], (result) => {
      resolve(result[API_URL_KEY] || DEFAULT_API_URL)
    })
  })
}

async function loadAnalytics() {
  chrome.runtime.sendMessage({ action: "getAnalytics" }, (response) => {
    if (response.success) {
      const analytics = response.data
      const analyticsEl = document.getElementById("analyticsPanel")
      if (analyticsEl) {
        analyticsEl.innerHTML = `
          <div style="font-size: 12px; color: #6b7280;">
            <p>Session checks: ${analytics.checksThisSession}</p>
            <p>Total checks: ${analytics.totalChecks}</p>
            <p>Avg confidence: ${analytics.averageConfidence}%</p>
          </div>
        `
      }
    }
  })
}

function showAnalyticsDashboard() {
  chrome.runtime.sendMessage({ action: "getAnalytics" }, (response) => {
    if (response.success) {
      const analytics = response.data
      alert(
        `Analytics Dashboard\n\nTotal Checks: ${analytics.totalChecks}\nSession Checks: ${analytics.checksThisSession}\nAvg Confidence: ${analytics.averageConfidence}%\n\nTrue: ${analytics.classificationCounts.True}\nFake: ${analytics.classificationCounts.Fake}\nUncertain: ${analytics.classificationCounts.Uncertain}`,
      )
    }
  })
}
