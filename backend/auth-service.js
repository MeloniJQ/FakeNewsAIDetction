import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { OAuth2Client } from "google-auth-library"
import { createUser, findUserByEmail, findOrCreateGoogleUser } from "./db/operations.js"
import { User } from "./db/models.js"

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"
const JWT_EXPIRE = "7d"

/**
 * Hash password
 */
export async function hashPassword(password) {
  return await bcrypt.hash(password, 10)
}

/**
 * Verify password
 */
export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash)
}

/**
 * Generate JWT token
 */
export function generateToken(userId, email) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRE })
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

/**
 * Register new user
 */
export async function registerUser(email, password, username) {
  try {
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      throw new Error("Email already registered")
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters")
    }

    const hashedPassword = await hashPassword(password)
    const user = await createUser(email, hashedPassword, username)

    const token = generateToken(user._id, user.email)
    return { user, token }
  } catch (error) {
    throw error
  }
}

/**
 * Login user
 */
export async function loginUser(email, password) {
  try {
    const user = await findUserByEmail(email)
    if (!user) {
      throw new Error("Invalid email or password")
    }

    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      throw new Error("Invalid email or password")
    }

    const token = generateToken(user._id, user.email)
    return { user, token }
  } catch (error) {
    throw error
  }
}

/**
 * Middleware to verify JWT
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "No token provided" })
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return res.status(403).json({ error: "Invalid or expired token" })
  }

  req.userId = decoded.userId
  req.userEmail = decoded.email
  next()
}

/**
 * Middleware to optionally verify JWT
 * Does not fail if no token is provided
 */
export function optionalAuthenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return next()
  }

  const decoded = verifyToken(token)
  if (decoded) {
    req.userId = decoded.userId
    req.userEmail = decoded.email
  }
  next()
}

/**
 * Verify Google Token
 */
export async function verifyGoogleToken(token) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    return ticket.getPayload()
  } catch (error) {
    throw new Error("Invalid Google Token")
  }
}

/**
 * Login or Register with Google
 */
export async function loginWithGoogle(token) {
  try {
    const payload = await verifyGoogleToken(token)
    console.log("[AUTH] Google Payload:", JSON.stringify(payload, null, 2))
    const { email, name, sub: googleId, picture } = payload

    const user = await findOrCreateGoogleUser(email, name, googleId, picture)
    console.log("[AUTH] User after findOrCreate:", JSON.stringify(user, null, 2))

    const jwtToken = generateToken(user._id, user.email)
    return { user, token: jwtToken }
  } catch (error) {
    throw error
  }
}
