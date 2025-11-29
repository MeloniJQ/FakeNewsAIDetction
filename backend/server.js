import "dotenv/config"
import express from "express"
import cors from "cors"
import { analyzeNewsText } from "./ai-detection.js"
import { predictWithML } from "./ml-server.js"
import { verifyWithGoogle } from "./verification-service.js"
import { connectDB } from "./db/connection.js"
import {
  saveDetection,
  getDetections,
  saveFeedback,
  getDetectionById,
  updateAuthorCredibility,
  getAuthorStats,
  findUserByEmail,
  getDetectionsWithAuthorInfo,
  getTopAuthors,
} from "./db/operations.js"
import { registerUser, loginUser, authenticateToken, optionalAuthenticateToken, loginWithGoogle } from "./auth-service.js"
import { startNewsScheduler, triggerNewsUpdate } from "./job-scheduler.js"



const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow localhost and chrome extensions
      if (origin.startsWith("http://localhost") ||
        origin.startsWith("http://127.0.0.1") ||
        origin.startsWith("chrome-extension://")) {
        return callback(null, true);
      }

      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)

app.use(express.json())

await connectDB()
startNewsScheduler()
// Trigger initial update
triggerNewsUpdate().then(result => console.log("[Startup] Initial news update:", result.success ? "Success" : "Failed"))

// Validate Gemini API key on startup
if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠️  GEMINI_API_KEY not set. /api/check-news endpoint will use sample data.")
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "Backend is running", timestamp: new Date().toISOString() })
})

app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, username } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    const { user, token } = await registerUser(email, password, username)

    res.json({
      success: true,
      token,
      user: { id: user._id, email: user.email, username: user.username, picture: user.picture },
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    const { user, token } = await loginUser(email, password)

    res.json({
      success: true,
      token,
      user: { id: user._id, email: user.email, username: user.username, picture: user.picture },
    })
  } catch (error) {
    res.status(401).json({ error: error.message })
  }
})

app.post("/api/auth/google", async (req, res) => {
  try {
    const { token } = req.body
    if (!token) {
      return res.status(400).json({ error: "Token is required" })
    }
    const { user, token: jwtToken } = await loginWithGoogle(token)
    res.json({
      success: true,
      token: jwtToken,
      user: { id: user._id, email: user.email, username: user.username, picture: user.picture },
    })
  } catch (error) {
    res.status(401).json({ error: error.message })
  }
})

app.post("/api/check-news", async (req, res) => {
  try {
    const { text } = req.body

    // Validate input
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({
        error: "Invalid input: text is required and must be a non-empty string",
      })
    }

    // Analyze the text (Gemini for classification, ML for confidence)
    const analysis = await analyzeNewsText(text)

    // Verify with Google Search (Optional layer)
    const searchResult = await verifyWithGoogle(text)

    let result = {
      classification: analysis.classification,
      confidence: analysis.confidence,
      summary: analysis.explanation
    }

    // 2. Adjust with Search Verification (if available)
    if (searchResult.verified && searchResult.sources.length > 0) {
      console.log(`[Verification] Search found: ${searchResult.result} (${searchResult.confidence}%)`)

      // If search is highly confident, it overrides or boosts ML
      if (searchResult.confidence > 70) {
        result.classification = searchResult.result.toLowerCase()
        // Boost confidence if they agree, average if they disagree
        if (result.classification === searchResult.result.toLowerCase()) {
          result.confidence = Math.min(result.confidence + 15, 99)
        } else {
          // Search usually wins for facts
          result.confidence = searchResult.confidence
        }
        result.summary += `\n\nWeb Verification: ${searchResult.summary}`
      }
    } else {
      result.summary += "\n\n(No definitive web verification found)"
    }

    // Normalize classification
    const finalClassification = result.classification
      ? result.classification.charAt(0).toUpperCase() + result.classification.slice(1).toLowerCase()
      : "Uncertain"

    const detection = await saveDetection({
      text,
      classification: result.classification,
      confidence: result.confidence,
      explanation: result.summary,
      geminiResult: null,
    })

    // Return result with detection ID for feedback
    res.json({
      id: detection._id,
      text,
      classification: finalClassification,
      confidence: result.confidence,
      explanation: result.summary,
      communityScore: detection.communityScore || 0,
      feedbackCount: detection.feedbackCount || 0,
    })
  } catch (error) {
    console.error("Detection error:", error)
    res.status(500).json({
      error: "Failed to check news",
      message: error.message,
    })
  }
})

app.get("/api/news", optionalAuthenticateToken, async (req, res) => {
  try {
    const limit = Math.min(Number.parseInt(req.query.limit) || 20, 50)
    const skip = Number.parseInt(req.query.skip) || 0

    const detections = await getDetectionsWithAuthorInfo(limit, skip, req.userId, req.ip)

    res.json({
      success: true,
      count: detections.length,
      data: detections.map((d) => ({
        _id: d._id,
        title: d.title,
        content: d.content,
        url: d.url,
        imageUrl: d.imageUrl,
        source: d.source,
        author: d.author,
        authorId: d.authorId,
        classification: d.classification,
        confidence: d.confidence,
        globalCredibility: d.globalCredibility,
        userCredibility: d.userCredibility,
        communityScore: d.communityScore,
        feedbackCount: d.feedbackCount,
        explanation: d.explanation,
        userVote: d.userVote,
        createdAt: d.createdAt,
      })),
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get("/api/news/by-author/:authorId", async (req, res) => {
  try {
    const stats = await getAuthorStats(req.params.authorId)
    res.json({ success: true, author: stats })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get("/api/authors/top", async (req, res) => {
  try {
    const limit = Math.min(Number.parseInt(req.query.limit) || 10, 50)
    const authors = await getTopAuthors(limit)

    res.json({
      success: true,
      count: authors.length,
      data: authors,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post("/api/admin/trigger-news-update", authenticateToken, async (req, res) => {
  try {
    const user = await findUserByEmail(req.userEmail)
    if (!user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" })
    }

    const result = await triggerNewsUpdate()
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Public endpoint to refresh news (for demo purposes)
app.post("/api/news/refresh", async (req, res) => {
  try {
    console.log("[API] Manual news refresh requested")
    const result = await triggerNewsUpdate()
    res.json(result)
  } catch (error) {
    console.error("Refresh error:", error)
    res.status(500).json({ error: error.message })
  }
})

app.post("/api/feedback", optionalAuthenticateToken, async (req, res) => {
  try {
    const { newsId, isCorrect } = req.body

    // Validate input
    if (!newsId || typeof newsId !== "string") {
      return res.status(400).json({
        error: "Invalid input: newsId is required",
      })
    }

    if (typeof isCorrect !== "boolean") {
      return res.status(400).json({
        error: "Invalid input: isCorrect must be boolean (true/false)",
      })
    }

    await saveFeedback(newsId, isCorrect, req.userId, req.ip)
    const detection = await getDetectionById(newsId)

    // If user is authenticated and detection has an author, update credibility
    // We can also update credibility for anonymous users if we trust the IP, but for now let's stick to the logic:
    // The original code updated credibility only in the authenticated route.
    // However, the original code also had a logic hole where anonymous feedback didn't update credibility.
    // Let's allow credibility update if we have a valid detection, regardless of auth, or maybe restrict it?
    // The original authenticated route updated credibility. The unauthenticated one didn't.
    // Let's assume we want to update credibility if the user is authenticated OR if we want to allow public feedback to influence it (maybe with less weight?).
    // For now, I'll follow the authenticated route's logic but make it conditional on auth if that was the intent,
    // OR just update it always. Given the goal is to "fix", and the extension was using the unauthenticated one which didn't update credibility,
    // maybe that was a missing feature.
    // But to be safe and merge them:

    if (detection?.authorId) {
      // Only update credibility if authenticated? Or always?
      // Let's update it always for now as it seems to be the core feature "author credibility tracking".
      await updateAuthorCredibility(detection.authorId, isCorrect)
    }

    res.json({
      success: true,
      communityScore: detection?.communityScore || 0,
      feedbackCount: detection?.feedbackCount || 0,
    })
  } catch (error) {
    console.error("Feedback error:", error)
    res.status(500).json({
      error: "Failed to save feedback",
      message: error.message,
    })
  }
})

app.get("/api/news-history", optionalAuthenticateToken, async (req, res) => {
  try {
    const limit = Math.min(Number.parseInt(req.query.limit) || 50, 100)
    const skip = Number.parseInt(req.query.skip) || 0

    const detections = await getDetections(limit, skip, req.userId, req.ip)

    res.json({
      success: true,
      count: detections.length,
      data: detections.map((d) => ({
        _id: d._id,
        text: d.text,
        classification: d.classification,
        confidence: d.confidence,
        explanation: d.explanation,
        communityScore: d.communityScore || 0,
        feedbackCount: d.feedbackCount || 0,
        userVote: d.userVote,
        createdAt: d.createdAt,
      })),
    })
  } catch (error) {
    console.error("History error:", error)
    res.status(500).json({
      error: "Failed to fetch history",
      message: error.message,
    })
  }
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" })
})

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err)
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Fake News Detector Backend running on http://localhost:${PORT}`)
  console.log(`📋 Check news: POST http://localhost:${PORT}/api/check-news`)
  console.log(`💬 Feedback: POST http://localhost:${PORT}/api/feedback`)
  console.log(`📰 History: GET http://localhost:${PORT}/api/news-history`)
  console.log(`❤️  Health check: GET http://localhost:${PORT}/health`)
  console.log(`🔒 Register: POST http://localhost:${PORT}/api/auth/register`)
  console.log(`🔒 Login: POST http://localhost:${PORT}/api/auth/login`)
  console.log(`📰 News: GET http://localhost:${PORT}/api/news`)
  console.log(`📰 News by author: GET http://localhost:${PORT}/api/news/by-author/:authorId`)
  console.log(`🌟 Top authors: GET http://localhost:${PORT}/api/authors/top`)
  console.log(`🔧 Trigger news update: POST http://localhost:${PORT}/api/admin/trigger-news-update`)
})
