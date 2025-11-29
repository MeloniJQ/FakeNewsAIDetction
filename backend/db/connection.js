import mongoose from "mongoose"

let isConnected = false

export async function connectDB() {
  if (isConnected) {
    console.log("[DB] Already connected to MongoDB")
    return
  }

  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/fake-news-detector"

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    })

    isConnected = true
    console.log("[DB] Connected to MongoDB successfully")
  } catch (error) {
    console.error("[DB] MongoDB connection error:", error.message)
    console.warn("[DB] Falling back to in-memory storage")
    isConnected = false
  }
}

export function isMongoConnected() {
  return isConnected
}

export async function disconnectDB() {
  if (!isConnected) return

  try {
    await mongoose.disconnect()
    isConnected = false
    console.log("[DB] Disconnected from MongoDB")
  } catch (error) {
    console.error("[DB] Disconnect error:", error.message)
  }
}
