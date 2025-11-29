import mongoose from "mongoose"

const detectionSchema = new mongoose.Schema(
  {
    title: String,
    url: String,
    content: String,
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    author: String,
    source: String,
    imageUrl: String,
    classification: {
      type: String,
      enum: ["True", "Fake", "Uncertain"],
      required: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    explanation: {
      type: String,
      required: true,
    },
    globalCredibility: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    userCredibility: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    communityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    feedbackCount: {
      type: Number,
      default: 0,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Author",
    },
    fetchedFrom: {
      type: String,
      enum: ["user", "newsapi", "manual"],
      default: "user",
    },
  },
  { timestamps: true },
)

const authorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    credibilityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    articleCount: {
      type: Number,
      default: 0,
    },
    accurateArticles: {
      type: Number,
      default: 0,
    },
    userFeedbackAccurate: {
      type: Number,
      default: 0,
    },
    userFeedbackInaccurate: {
      type: Number,
      default: 0,
    },
    website: String,
    lastUpdated: Date,
  },
  { timestamps: true },
)

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    username: String,
    picture: String,
    feedbackGiven: {
      type: Number,
      default: 0,
    },
    credibilityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
)

const feedbackSchema = new mongoose.Schema(
  {
    detectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Detection",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    userIp: String,
    helpful: Boolean,
  },
  { timestamps: true },
)

// Create indexes
detectionSchema.index({ createdAt: -1 })
detectionSchema.index({ author: 1 })
detectionSchema.index({ source: 1 })
detectionSchema.index({ url: 1 })
authorSchema.index({ credibilityScore: -1 })
feedbackSchema.index({ detectionId: 1 })
feedbackSchema.index({ userId: 1 })

export const Detection = mongoose.model("Detection", detectionSchema)
export const Author = mongoose.model("Author", authorSchema)
export const User = mongoose.model("User", userSchema)
export const Feedback = mongoose.model("Feedback", feedbackSchema)
