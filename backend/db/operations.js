import { Detection, Feedback, Author, User } from "./models.js"
import { isMongoConnected } from "./connection.js"

// In-memory fallback for when MongoDB is not connected
const inMemoryDetections = []
const inMemoryFeedback = new Map()
const inMemoryAuthors = new Map()
const inMemoryUsers = []

/**
 * Save a detection result to MongoDB or in-memory
 */
export async function saveDetection(data) {
  try {
    if (isMongoConnected()) {
      const detection = new Detection(data)
      await detection.save()
      return detection
    } else {
      // Fallback to in-memory storage
      const detection = {
        _id: `mem_${Date.now()}_${Math.random()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      inMemoryDetections.push(detection)
      return detection
    }
  } catch (error) {
    console.error("[DB] Save detection error:", error)
    throw error
  }
}

/**
 * Get all detections with optional filtering
 */
export async function getDetections(limit = 50, skip = 0, userId = null, userIp = null) {
  try {
    let detections = []
    if (isMongoConnected()) {
      detections = await Detection.find().sort({ createdAt: -1 }).limit(limit).skip(skip).lean()
    } else {
      // Return from in-memory storage
      detections = inMemoryDetections.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(skip, skip + limit)
    }

    // Populate userVote if user info is provided
    if (userId || userIp) {
      const detectionIds = detections.map(d => d._id)
      let feedbacks = []

      if (isMongoConnected()) {
        const query = { detectionId: { $in: detectionIds } }
        if (userId) {
          // Find feedback by this user OR by this IP (if no userId on feedback)
          // Actually, simpler: find all feedback for these detections where userId matches OR (userId is null AND userIp matches)
          // But standard logic:
          feedbacks = await Feedback.find({
            detectionId: { $in: detectionIds },
            $or: [
              { userId: userId },
              { userId: null, userIp: userIp }
            ]
          }).lean()
        } else {
          feedbacks = await Feedback.find({
            detectionId: { $in: detectionIds },
            userIp: userIp,
            userId: null // Only match anonymous feedback if we are anonymous
          }).lean()
        }
      } else {
        // In-memory feedback lookup
        // inMemoryFeedback is a Map<detectionId, Array<Feedback>>
        for (const [dId, fList] of inMemoryFeedback.entries()) {
          if (detectionIds.includes(dId)) {
            const match = fList.find(f => (userId && f.userId === userId) || (!f.userId && f.userIp === userIp))
            if (match) feedbacks.push(match)
          }
        }
      }

      // Map votes to detections
      detections = detections.map(d => {
        const feedback = feedbacks.find(f => f.detectionId.toString() === d._id.toString())
        return {
          ...d,
          userVote: feedback ? (feedback.isCorrect ? 'up' : 'down') : null
        }
      })
    }

    return detections
  } catch (error) {
    console.error("[DB] Get detections error:", error)
    throw error
  }
}

/**
 * Get a specific detection by ID
 */
export async function getDetectionById(id) {
  try {
    if (isMongoConnected()) {
      return await Detection.findById(id).lean()
    } else {
      return inMemoryDetections.find((d) => d._id === id)
    }
  } catch (error) {
    console.error("[DB] Get detection error:", error)
    throw error
  }
}

/**
 * Save user feedback
 */
export async function saveFeedback(detectionId, isCorrect, userId = null, userIp = null) {
  try {
    if (isMongoConnected()) {
      let existingFeedback = null

      // Check by userId first if logged in
      if (userId) {
        existingFeedback = await Feedback.findOne({ detectionId, userId })
      }

      // If not found by userId (or not logged in), check by IP
      if (!existingFeedback && userIp) {
        existingFeedback = await Feedback.findOne({ detectionId, userIp })
      }

      if (existingFeedback) {
        // Update existing feedback
        existingFeedback.isCorrect = isCorrect
        if (userId && !existingFeedback.userId) {
          existingFeedback.userId = userId // Associate with user if previously anonymous
        }
        existingFeedback.userIp = userIp // Update IP
        await existingFeedback.save()

        await updateCommunityScore(detectionId)
        return existingFeedback
      }

      // Create new feedback
      const feedback = new Feedback({
        detectionId,
        userId,
        isCorrect,
        userIp,
      })
      await feedback.save()

      // Update detection community score
      await updateCommunityScore(detectionId)

      return feedback
    } else {
      // Fallback to in-memory storage
      if (!inMemoryFeedback.has(detectionId)) {
        inMemoryFeedback.set(detectionId, [])
      }

      const feedbackList = inMemoryFeedback.get(detectionId)
      let existingIndex = -1

      if (userId) {
        existingIndex = feedbackList.findIndex((f) => f.userId === userId)
      }

      if (existingIndex === -1 && userIp) {
        existingIndex = feedbackList.findIndex((f) => f.userIp === userIp)
      }

      if (existingIndex !== -1) {
        feedbackList[existingIndex].isCorrect = isCorrect
        if (userId) feedbackList[existingIndex].userId = userId
        feedbackList[existingIndex].userIp = userIp
        updateCommunityScoreInMemory(detectionId)
        return feedbackList[existingIndex]
      }

      const feedback = {
        _id: `mem_${Date.now()}`,
        detectionId,
        userId,
        isCorrect,
        userIp,
        createdAt: new Date(),
      }

      feedbackList.push(feedback)
      updateCommunityScoreInMemory(detectionId)

      return feedback
    }
  } catch (error) {
    console.error("[DB] Save feedback error:", error)
    throw error
  }
}

/**
 * Get feedback for a detection
 */
export async function getFeedback(detectionId) {
  try {
    if (isMongoConnected()) {
      return await Feedback.find({ detectionId }).lean()
    } else {
      return inMemoryFeedback.get(detectionId) || []
    }
  } catch (error) {
    console.error("[DB] Get feedback error:", error)
  }
}

/**
 * Update community score based on feedback
 */
export async function updateCommunityScore(detectionId) {
  try {
    if (isMongoConnected()) {
      const feedbackList = await Feedback.find({ detectionId }).lean()

      if (feedbackList.length === 0) return

      const correctCount = feedbackList.filter((f) => f.isCorrect).length
      const communityScore = Math.round((correctCount / feedbackList.length) * 100)

      await Detection.findByIdAndUpdate(
        detectionId,
        {
          communityScore,
          feedbackCount: feedbackList.length,
        },
        { new: true },
      )
    }
  } catch (error) {
    console.error("[DB] Update community score error:", error)
  }
}

/**
 * In-memory community score update
 */
function updateCommunityScoreInMemory(detectionId) {
  const detection = inMemoryDetections.find((d) => d._id === detectionId)
  const feedbackList = inMemoryFeedback.get(detectionId) || []

  if (detection && feedbackList.length > 0) {
    const correctCount = feedbackList.filter((f) => f.isCorrect).length
    detection.communityScore = Math.round((correctCount / feedbackList.length) * 100)
    detection.feedbackCount = feedbackList.length
  }
}

export async function getOrCreateAuthor(authorName, source = null) {
  try {
    if (isMongoConnected()) {
      let author = await Author.findOne({ name: authorName })
      if (!author) {
        author = new Author({
          name: authorName,
          website: source,
          credibilityScore: 50,
        })
        await author.save()
      }
      return author
    } else {
      if (!inMemoryAuthors.has(authorName)) {
        inMemoryAuthors.set(authorName, {
          _id: `mem_${Date.now()}`,
          name: authorName,
          credibilityScore: 50,
          articleCount: 0,
          accurateArticles: 0,
          userFeedbackAccurate: 0,
          userFeedbackInaccurate: 0,
          website: source,
        })
      }
      return inMemoryAuthors.get(authorName)
    }
  } catch (error) {
    console.error("[DB] Get or create author error:", error)
    throw error
  }
}

export async function updateAuthorCredibility(authorId, isAccurate) {
  try {
    if (isMongoConnected()) {
      const author = await Author.findByIdAndUpdate(
        authorId,
        {
          $inc: {
            articleCount: 1,
            ...(isAccurate ? { accurateArticles: 1, userFeedbackAccurate: 1 } : { userFeedbackInaccurate: 1 }),
          },
        },
        { new: true },
      )

      // Recalculate credibility score
      if (author) {
        const score = Math.round((author.accurateArticles / author.articleCount) * 100)
        author.credibilityScore = Math.max(20, Math.min(100, score))
        author.lastUpdated = new Date()
        await author.save()
      }

      return author
    }
  } catch (error) {
    console.error("[DB] Update author credibility error:", error)
  }
}

export async function getAuthorStats(authorId) {
  try {
    if (isMongoConnected()) {
      return await Author.findById(authorId).lean()
    } else {
      // Find author in memory
      for (const author of inMemoryAuthors.values()) {
        if (author._id === authorId) {
          return author
        }
      }
      return null
    }
  } catch (error) {
    console.error("[DB] Get author stats error:", error)
  }
}

export async function createUser(email, hashedPassword, username = null) {
  try {
    if (isMongoConnected()) {
      const user = new User({
        email,
        password: hashedPassword,
        username: username || email.split("@")[0],
      })
      await user.save()
      return user
    } else {
      // In-memory fallback
      const user = {
        _id: `mem_user_${Date.now()}`,
        email: email.toLowerCase(),
        password: hashedPassword,
        username: username || email.split("@")[0],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      inMemoryUsers.push(user)
      return user
    }
  } catch (error) {
    console.error("[DB] Create user error:", error)
    throw error
  }
}

export async function findUserByEmail(email) {
  try {
    if (isMongoConnected()) {
      return await User.findOne({ email: email.toLowerCase() }).lean()
    } else {
      // In-memory fallback
      return inMemoryUsers.find(u => u.email === email.toLowerCase())
    }
  } catch (error) {
    console.error("[DB] Find user error:", error)
  }
}

export async function findOrCreateGoogleUser(email, name, googleId, picture) {
  try {
    if (isMongoConnected()) {
      let user = await User.findOne({ email: email.toLowerCase() })

      if (!user) {
        user = new User({
          email,
          username: name,
          googleId,
          picture,
          authProvider: "google",
        })
        await user.save()
      } else {
        let updated = false
        if (!user.googleId) {
          user.googleId = googleId
          user.authProvider = "google"
          updated = true
        }
        if (picture && user.picture !== picture) {
          user.picture = picture
          updated = true
        }
        if (updated) await user.save()
      }
      return user
    } else {
      // In-memory fallback
      let user = inMemoryUsers.find(u => u.email === email.toLowerCase())

      if (!user) {
        user = {
          _id: `mem_user_${Date.now()}`,
          email: email.toLowerCase(),
          username: name,
          googleId,
          picture,
          authProvider: "google",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        inMemoryUsers.push(user)
      } else {
        if (!user.googleId) {
          user.googleId = googleId
          user.authProvider = "google"
          user.updatedAt = new Date()
        }
        if (picture) {
          user.picture = picture
        }
      }
      return user
    }
  } catch (error) {
    console.error("[DB] Find or create google user error:", error)
    throw error
  }
}

export async function updateUserCredibility(userId, newScore) {
  try {
    if (isMongoConnected()) {
      return await User.findByIdAndUpdate(
        userId,
        {
          credibilityScore: Math.max(0, Math.min(100, newScore)),
          $inc: { feedbackGiven: 1 },
        },
        { new: true },
      )
    }
  } catch (error) {
    console.error("[DB] Update user credibility error:", error)
  }
}

export async function getDetectionsWithAuthorInfo(limit = 50, skip = 0, userId = null, userIp = null) {
  try {
    let detections = []
    if (isMongoConnected()) {
      detections = await Detection.find()
        .populate("authorId", "name credibilityScore")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean()
    } else {
      // Return from in-memory storage with simulated author info
      detections = inMemoryDetections
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(skip, skip + limit)
        .map((d) => ({
          ...d,
          author: d.author || "Unknown",
          authorId: d.authorId || null,
        }))
    }

    // Populate userVote if user info is provided
    if (userId || userIp) {
      const detectionIds = detections.map(d => d._id)
      let feedbacks = []

      if (isMongoConnected()) {
        feedbacks = await Feedback.find({
          detectionId: { $in: detectionIds },
          $or: [
            { userId: userId },
            { userId: null, userIp: userIp }
          ]
        }).lean()
      } else {
        // In-memory feedback lookup
        for (const [dId, fList] of inMemoryFeedback.entries()) {
          if (detectionIds.includes(dId)) {
            const match = fList.find(f => (userId && f.userId === userId) || (!f.userId && f.userIp === userIp))
            if (match) feedbacks.push(match)
          }
        }
      }

      // Map votes to detections
      detections = detections.map(d => {
        const feedback = feedbacks.find(f => f.detectionId.toString() === d._id.toString())
        return {
          ...d,
          userVote: feedback ? (feedback.isCorrect ? 'up' : 'down') : null
        }
      })
    }

    return detections
  } catch (error) {
    console.error("[DB] Get detections with author info error:", error)
    return []
  }
}

export async function getDetectionsByAuthor(authorId, limit = 50) {
  try {
    if (isMongoConnected()) {
      return await Detection.find({ authorId }).sort({ createdAt: -1 }).limit(limit).lean()
    }
  } catch (error) {
    console.error("[DB] Get detections by author error:", error)
    return []
  }
}

export async function getTopAuthors(limit = 10) {
  try {
    if (isMongoConnected()) {
      return await Author.find().sort({ credibilityScore: -1, articleCount: -1 }).limit(limit).lean()
    } else {
      // Return from in-memory storage
      return Array.from(inMemoryAuthors.values())
        .sort((a, b) => b.credibilityScore - a.credibilityScore)
        .slice(0, limit)
    }
  } catch (error) {
    console.error("[DB] Get top authors error:", error)
    return []
  }
}
