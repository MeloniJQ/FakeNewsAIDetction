// Feedback system for dynamic credibility score updates

// In-memory storage for feedback (can be replaced with SQLite/database)
const feedbackStore = new Map() // Map of news_id -> [feedback items]
const newsStore = new Map() // Map of news_id -> news item with updated scores

/**
 * Store feedback and update credibility score
 * @param {string} news_id - Unique news identifier
 * @param {string} feedback - "real" or "fake"
 * @param {Object} newsItem - Original news item (optional, for first-time storage)
 * @returns {Object} Updated news item with new credibility score
 */
export function storeFeedback(news_id, feedback, newsItem = null) {
  // Validate feedback value
  if (!["real", "fake"].includes(feedback)) {
    throw new Error("Feedback must be 'real' or 'fake'")
  }

  // Initialize feedback array if not exists
  if (!feedbackStore.has(news_id)) {
    feedbackStore.set(news_id, [])
  }

  // Store the feedback
  const feedbackList = feedbackStore.get(news_id)
  feedbackList.push({
    feedback,
    timestamp: new Date().toISOString(),
    value: feedback === "real" ? 1 : 0,
  })

  // Store or update news item
  if (newsItem && !newsStore.has(news_id)) {
    newsStore.set(news_id, { ...newsItem })
  }

  // Calculate updated credibility score
  const updatedItem = updateCredibilityScore(news_id)

  return updatedItem
}

/**
 * Calculate updated credibility score using weighted formula
 * new_score = 0.7 * ml_score + 0.3 * avg_feedback
 */
function updateCredibilityScore(news_id) {
  const feedbackList = feedbackStore.get(news_id) || []
  const newsItem = newsStore.get(news_id)

  if (!newsItem) {
    throw new Error(`News item ${news_id} not found`)
  }

  // Calculate average user feedback (0-1 scale)
  const feedbackAvg =
    feedbackList.length > 0 ? feedbackList.reduce((sum, f) => sum + f.value, 0) / feedbackList.length : 0.5

  // Get original ML score
  const mlScore = newsItem.credibility_score || 0.5

  // Apply weighted formula: 0.7 * ML + 0.3 * User Feedback
  const newScore = 0.7 * mlScore + 0.3 * feedbackAvg
  const normalizedScore = Math.round(newScore * 100) / 100

  // Update news item
  const updatedItem = {
    ...newsItem,
    credibility_score: normalizedScore,
    feedback_count: feedbackList.length,
    feedback_avg: Math.round(feedbackAvg * 100) / 100,
    feedback_history: feedbackList,
  }

  newsStore.set(news_id, updatedItem)

  return updatedItem
}

/**
 * Retrieve feedback for a specific news item
 */
export function getFeedback(news_id) {
  return feedbackStore.get(news_id) || []
}

/**
 * Retrieve stored news item with updated scores
 */
export function getNewsItem(news_id) {
  return newsStore.get(news_id) || null
}

/**
 * Store news batch (called when fetching latest news)
 */
export function storeNewsBatch(newsItems) {
  newsItems.forEach((item) => {
    if (!newsStore.has(item.news_id)) {
      newsStore.set(item.news_id, item)
    }
  })
}

/**
 * Clear old feedback (optional maintenance function)
 */
export function clearOldFeedback(hoursOld = 24) {
  const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000)

  for (const [newsId, feedbackList] of feedbackStore.entries()) {
    const recentFeedback = feedbackList.filter((f) => new Date(f.timestamp) > cutoffTime)

    if (recentFeedback.length === 0) {
      feedbackStore.delete(newsId)
    } else {
      feedbackStore.set(newsId, recentFeedback)
    }
  }
}
