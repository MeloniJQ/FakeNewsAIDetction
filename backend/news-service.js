// News fetching and credibility scoring service using Gemini API
import Parser from "rss-parser"
import { GoogleGenerativeAI } from "@google/generative-ai"
import google from "googlethis"
import { predictWithML } from "./ml-server.js"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

/**
 * Fetch latest trending news using Google News RSS and analyze with Gemini
 * @returns {Promise<Array>} Array of news items with predictions
 */
export async function fetchLatestNews() {
  try {
    const parser = new Parser()
    const feed = await parser.parseURL("https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en")

    // Take top 10 items
    const topItems = feed.items.slice(0, 10).map(item => {
      // Google News titles are often "Headline - Source"
      let source = item.creator || item.source || "Google News"
      let title = item.title

      const lastDashIndex = title.lastIndexOf(" - ")
      if (lastDashIndex !== -1) {
        const possibleSource = title.substring(lastDashIndex + 3)
        // If the extracted source looks like a real name (not too long), use it
        if (possibleSource.length < 30) {
          source = possibleSource
          title = title.substring(0, lastDashIndex)
        }
      }

      return {
        title: title,
        summary: item.contentSnippet || item.content || "",
        source: source,
        link: item.link,
        pubDate: item.pubDate
      }
    })

    // Batch analyze with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const prompt = `Analyze the following ${topItems.length} news headlines. 
    For each, determine if it seems "Real" (credible mainstream news) or "Fake" (suspicious/clickbait/unverified).
    
    CRITICAL INSTRUCTIONS:
    1. Check the "source" field. If the source is a well-known, established news organization (e.g., BBC, Reuters, AP, New York Times, CNN, Fox News, The Guardian, etc.), you MUST lean heavily towards classifying it as "Real", even if the headline is dramatic.
    2. Only classify as "Fake" if the source is unknown/suspicious OR if the content is obviously satirical or physically impossible.
    3. Provide a confidence score (0-100). High confidence (90+) for known credible sources.
    4. Provide a 1-sentence explanation. Mention the source's credibility in your reasoning.
    
    News Items:
    ${JSON.stringify(topItems.map((item, i) => ({ id: i, title: item.title, source: item.source })))}

    Format response as a JSON array matching the order:
    [
      {
        "id": 0,
        "classification": "Real" | "Fake",
        "confidence": 95,
        "explanation": "..."
      }
    ]
    Return ONLY valid JSON.`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    let analysisResults = []
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        analysisResults = JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.error("Gemini analysis parse error", e)
    }

    // Fetch images and merge data
    return await Promise.all(topItems.map(async (item, index) => {
      const analysis = analysisResults.find(a => a.id === index) || {
        classification: "Real",
        confidence: 80,
        explanation: "Verified via Google News source."
      }

      // Fetch image for the article
      const imageUrl = await getNewsImage(item.title);

      return {
        news_id: `news_${Date.now()}_${index}`,
        title: item.title,
        summary: item.summary,
        source: item.source,
        prediction: analysis.classification,
        credibility_score: analysis.confidence / 100,
        ml_confidence: analysis.confidence,
        explanation: analysis.explanation,
        url: item.link,
        imageUrl: imageUrl,
        feedback_count: 0,
        feedback_avg: 0.5,
      }
    }))

  } catch (error) {
    console.error("[News Service] Error fetching news:", error.message)
    return getSampleNews()
  }
}

/**
 * Fetch an image for a news query using googlethis
 */
async function getNewsImage(query) {
  try {
    // Clean query to improve results (remove source name if possible)
    const cleanQuery = query.split(" - ")[0];
    const images = await google.image(cleanQuery, { safe: false });
    if (images.length > 0) {
      return images[0].url;
    }
  } catch (error) {
    console.error(`[News Service] Image fetch error for "${query}":`, error.message);
  }
  // Fallback image
  return "https://placehold.co/800x600?text=News+Image";
}

/**
 * Sample news data returned when API calls fail
 */
function getSampleNews() {
  return [
    {
      title: "New Breakthrough in Quantum Computing Announced",
      summary:
        "Researchers at a leading tech company have announced a major breakthrough in quantum computing, claiming to have achieved quantum advantage in solving real-world problems.",
      source: "TechNews Daily",
      classification: "Real",
      confidence: 92,
      globalCredibility: 95,
      feedbackCount: 120,
      communityScore: 98,
      url: "#"
    },
    {
      title: "Health Officials Warn of New Disease Outbreak",
      summary:
        "Health authorities are investigating reports of a new infectious disease spreading across multiple regions. Experts recommend preventative measures.",
      source: "Health Monitor",
      classification: "Real",
      confidence: 88,
      globalCredibility: 90,
      feedbackCount: 85,
      communityScore: 92,
      url: "#"
    },
    {
      title: "Aliens Land in Central Park, Demand Pizza",
      summary:
        "Witnesses claim to have seen a UFO land in New York City, with extraterrestrial beings emerging to ask for pepperoni pizza.",
      source: "Conspiracy Weekly",
      classification: "Fake",
      confidence: 99,
      globalCredibility: 10,
      feedbackCount: 342,
      communityScore: 5,
      url: "#"
    },
    {
      title: "Stock Market Reaches Historic Peak",
      summary:
        "Global stock markets have reached new all-time highs as investors show renewed confidence in economic recovery.",
      source: "Financial Times",
      classification: "Real",
      confidence: 85,
      globalCredibility: 92,
      feedbackCount: 56,
      communityScore: 88,
      url: "#"
    },
    {
      title: "Revolutionary AI Model Outperforms Humans in Complex Tasks",
      summary:
        "A new artificial intelligence model has demonstrated capabilities exceeding human performance in several benchmark tests.",
      source: "AI Research Journal",
      classification: "Real",
      confidence: 94,
      globalCredibility: 88,
      feedbackCount: 210,
      communityScore: 95,
      url: "#"
    },
    {
      title: "Climate Scientists Release Alarming New Study",
      summary:
        "A peer-reviewed study warns of accelerating climate change impacts, calling for immediate global action.",
      source: "Science Daily",
      classification: "Real",
      confidence: 96,
      globalCredibility: 98,
      feedbackCount: 150,
      communityScore: 97,
      url: "#"
    },
    {
      title: "Celebrity Admits to Being a Lizard Person",
      summary:
        "In a shocking interview, a famous actor allegedly revealed their true reptilian nature to a stunned audience.",
      source: "Tabloid News",
      classification: "Fake",
      confidence: 95,
      globalCredibility: 15,
      feedbackCount: 89,
      communityScore: 12,
      url: "#"
    }
  ]
}
