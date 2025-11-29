import schedule from "node-schedule"
import { fetchLatestNews } from "./news-service.js"
import { saveDetection } from "./db/operations.js"

let scheduledJob = null

/**
 * Start scheduled news fetching and classification
 */
export function startNewsScheduler() {
  if (scheduledJob) {
    console.log("News scheduler already running")
    return
  }

  // Run every 6 hours
  scheduledJob = schedule.scheduleJob("0 */6 * * *", async () => {
    await updateNews()
  })

  console.log("News scheduler started - runs every 6 hours")
}

/**
 * Stop scheduler
 */
export function stopNewsScheduler() {
  if (scheduledJob) {
    scheduledJob.cancel()
    scheduledJob = null
    console.log("News scheduler stopped")
  }
}

/**
 * Manually trigger news fetch (for testing)
 */
export async function triggerNewsUpdate() {
  return await updateNews()
}

/**
 * Core logic to generate and store news
 */
async function updateNews() {
  console.log("[SCHEDULER] Generating news analysis...")
  try {
    const newsItems = await fetchLatestNews()
    const results = []

    for (const item of newsItems) {
      const detection = await saveDetection({
        title: item.title,
        content: item.summary,
        text: item.title + " " + item.summary,
        source: item.source,
        classification: item.prediction === "Real" ? "True" : item.prediction, // Map "Real" to "True" for schema
        confidence: item.ml_confidence,
        explanation: item.explanation || `AI Analysis: ${item.prediction} (${item.ml_confidence}% confidence).`,
        fetchedFrom: "newsapi",
        author: "AI Analyst",
        url: item.url || "#",
        imageUrl: item.imageUrl || "https://placehold.co/800x600?text=News", // Use fetched image or fallback
        globalCredibility: item.credibility_score * 100
      })
      results.push(detection)
    }

    console.log(`[SCHEDULER] Generated and stored ${results.length} articles`)
    return {
      success: true,
      articlesClassified: results.length,
      articles: results,
    }
  } catch (error) {
    console.error("[SCHEDULER] Error:", error.message)
    return {
      success: false,
      error: error.message,
    }
  }
}
