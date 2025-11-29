import axios from "axios"
import { saveDetection } from "./db/operations.js"
import { analyzeNewsText } from "./ai-detection.js"
import { predictWithML } from "./ml-server.js"

const NEWS_API_KEY = process.env.NEWS_API_KEY
const NEWS_API_BASE = "https://newsapi.org/v2"

/**
 * Fetch articles from NewsAPI
 */
export async function fetchArticlesFromNewsAPI(options = {}) {
  try {
    if (!NEWS_API_KEY) {
      console.warn("NEWS_API_KEY not set. Returning sample data.")
      return getSampleArticles()
    }

    const { country = "us", category = "general", pageSize = 20 } = options

    const response = await axios.get(`${NEWS_API_BASE}/top-headlines`, {
      params: {
        country,
        category,
        pageSize,
        apiKey: NEWS_API_KEY,
      },
      timeout: 10000,
    })

    return response.data.articles || []
  } catch (error) {
    console.error("[NEWS_API] Fetch error:", error.message)
    return getSampleArticles()
  }
}

/**
 * Fetch articles by search query
 */
export async function searchArticles(query, options = {}) {
  try {
    if (!NEWS_API_KEY) {
      return getSampleArticles()
    }

    const { pageSize = 20, sortBy = "relevancy" } = options

    const response = await axios.get(`${NEWS_API_BASE}/everything`, {
      params: {
        q: query,
        pageSize,
        sortBy,
        apiKey: NEWS_API_KEY,
      },
      timeout: 10000,
    })

    return response.data.articles || []
  } catch (error) {
    console.error("[NEWS_API] Search error:", error.message)
    return []
  }
}

/**
 * Classify and store articles from NewsAPI
 */
export async function classifyAndStoreArticles(articles) {
  const results = []

  for (const article of articles) {
    try {
      const analysisText = `${article.title} ${article.description || ""}`

      // Use ML model for classification
      const mlResult = await predictWithML(analysisText)

      // Fallback to keyword analysis if ML fails
      let analysis
      if (mlResult.error) {
        analysis = analyzeNewsText(analysisText)
      } else {
        analysis = {
          classification: mlResult.prediction ? mlResult.prediction.toLowerCase() : "uncertain",
          confidence: mlResult.confidence_percent || 0,
          summary: `AI Model analysis indicates this content is likely ${mlResult.prediction} with ${mlResult.confidence_percent}% confidence.`,
          sourceCredibility: 80 // Default for ML path
        }
      }

      const detection = await saveDetection({
        title: article.title,
        url: article.url,
        content: article.content || article.description,
        text: analysisText,
        author: article.author,
        source: article.source?.name,
        imageUrl: article.urlToImage,
        classification:
          analysis.classification === "real" ? "Real" : analysis.classification === "fake" ? "Fake" : "Uncertain",
        confidence: analysis.confidence,
        explanation: analysis.summary,
        globalCredibility: analysis.sourceCredibility,
        fetchedFrom: "newsapi",
      })

      results.push(detection)
    } catch (error) {
      console.error("[NEWS_API] Error classifying article:", error.message)
    }
  }

  return results
}

/**
 * Sample articles for fallback
 */
function getSampleArticles() {
  return [
    {
      title: "New Breakthrough in Quantum Computing Announced",
      description: "Researchers at a leading tech company have announced a major breakthrough in quantum computing, claiming to have achieved quantum advantage in solving real-world problems.",
      url: "https://example.com/quantum",
      urlToImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=60",
      author: "Dr. Sarah Chen",
      source: { name: "Tech Science Daily" },
      content: "Full article content would go here...",
    },
    {
      title: "Global Climate Summit Reaches Historic Agreement",
      description: "World leaders have signed a new binding agreement to reduce carbon emissions by 50% within the next decade.",
      url: "https://example.com/climate",
      urlToImage: "https://images.unsplash.com/photo-1569163139599-0f4517e36b51?w=800&auto=format&fit=crop&q=60",
      author: "James Wilson",
      source: { name: "World News" },
      content: "Full article content would go here...",
    },
    {
      title: "Aliens Found Living in Underwater City",
      description: "Shocking new evidence suggests an advanced alien civilization has been hiding in the Pacific Ocean for centuries.",
      url: "https://example.com/aliens",
      urlToImage: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=60",
      author: "Truth Seeker",
      source: { name: "Conspiracy Watch" },
      content: "Full article content would go here...",
    },
    {
      title: "Stock Market Hits Record High Amid Tech Boom",
      description: "Major indices surged today led by gains in the technology sector, marking a new all-time high for the year.",
      url: "https://example.com/markets",
      urlToImage: "https://images.unsplash.com/photo-1611974765270-ca1258634369?w=800&auto=format&fit=crop&q=60",
      author: "Amanda Lee",
      source: { name: "Financial Times" },
      content: "Full article content would go here...",
    },
    {
      title: "Study Links Coffee Consumption to Longer Life",
      description: "A new extensive study following 100,000 participants suggests that drinking 3 cups of coffee daily may increase longevity.",
      url: "https://example.com/health",
      urlToImage: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=60",
      author: "Dr. Robert Brown",
      source: { name: "Health Monitor" },
      content: "Full article content would go here...",
    }
  ]
}
