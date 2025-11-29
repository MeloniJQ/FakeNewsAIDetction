// AI Detection Logic using Gemini and ML
import { GoogleGenerativeAI } from "@google/generative-ai"
import { predictWithML } from "./ml-server.js"

// Initialize Gemini lazily
let genAI = null;

/**
 * Analyzes news text using Gemini for classification and ML for confidence
 * @param {string} text - The news article or headline to analyze
 * @returns {Promise<Object>} Detection result
 */
export async function analyzeNewsText(text) {
  try {
    // Initialize Gemini if not already done
    if (!genAI && process.env.GEMINI_API_KEY) {
      genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    }

    // 1. Get Classification & Explanation from Gemini
    let geminiResult = { classification: "Uncertain", explanation: "Analysis failed.", confidence: 0 }

    if (genAI) {
      try {
        // Using gemini-2.0-flash as it is available for this key
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
        const prompt = `Act as an expert Fact Checker. Verify the credibility of the following news text.
        Determine if it is "Real" (accurate/trustworthy), "Fake" (false/misleading/satire), or "Uncertain".
        
        Text: "${text}"
        
        Provide:
        1. Classification (Real/Fake/Uncertain)
        2. A confidence score (0-100) based on your internal knowledge and analysis of the writing style/claims.
        3. A concise explanation (max 3 sentences).

        Format response as JSON: { "classification": "Real" | "Fake" | "Uncertain", "confidence": number, "explanation": "..." }`

        const result = await model.generateContent(prompt)
        const responseText = result.response.text()

        // Extract JSON
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          geminiResult = JSON.parse(jsonMatch[0])
        }
      } catch (geminiError) {
        console.error("[AI Detection] Gemini error:", geminiError.message)
        // Fallback if Gemini fails
        geminiResult = { classification: "Uncertain", explanation: "AI service unavailable.", confidence: 0 }
      }
    } else {
      console.warn("[AI Detection] GEMINI_API_KEY not set.")
    }

    // 2. Get Confidence Score from Local ML Model
    const mlResult = await predictWithML(text)
    const mlConfidence = mlResult.confidence_percent || 0

    // 3. Combine Results
    // Use Gemini's classification if available and not "Uncertain"
    let finalClassification = geminiResult.classification
    let finalExplanation = geminiResult.explanation
    let finalConfidence = geminiResult.confidence || mlConfidence

    // If Gemini is uncertain or failed, fallback to ML
    // BUT only if text is long enough for ML to be reliable (>50 chars)
    // Short queries like "Modi is PM" often trigger false positives in ML
    if ((!finalClassification || finalClassification === "Uncertain") && !mlResult.error) {
      if (text.length > 50) {
        console.log("[AI Detection] Gemini uncertain/failed, using ML classification")
        finalClassification = mlResult.prediction || "Uncertain"
        finalExplanation = `ML Model Analysis: Classified as ${finalClassification} based on writing style patterns.`
        finalConfidence = mlConfidence
      } else {
        console.log("[AI Detection] Gemini failed and text too short for reliable ML. Defaulting to Uncertain.")
        finalClassification = "Uncertain"
        finalExplanation = "Could not verify this claim. Please provide more context or a longer article."
        finalConfidence = 0
      }
    } else if (finalClassification !== "Uncertain") {
      // Blend confidence if both exist, or prioritize Gemini
      // If Gemini is very confident, use it. Otherwise average with ML?
      // Let's trust Gemini's self-reported confidence if it exists.
      finalConfidence = geminiResult.confidence || mlConfidence
    }

    return {
      classification: finalClassification,
      confidence: finalConfidence,
      explanation: finalExplanation,
      sourceCredibility: finalConfidence > 80 ? 90 : 60,
      authorCredibility: finalConfidence > 80 ? 90 : 60,
      factCheckLinks: getFactCheckLinks(finalClassification)
    }

  } catch (error) {
    console.error("[AI Detection] Error:", error)
    return {
      classification: "Uncertain",
      confidence: 0,
      explanation: "An error occurred during analysis.",
      sourceCredibility: 50,
      authorCredibility: 50,
      factCheckLinks: []
    }
  }
}

/**
 * Returns relevant fact-checking links based on classification
 */
function getFactCheckLinks(classification) {
  const baseLinks = [
    { title: "Snopes - Fact Check", url: "https://www.snopes.com" },
    { title: "FactCheck.org", url: "https://www.factcheck.org" },
    { title: "PolitiFact", url: "https://www.politifact.com" },
  ]

  if (classification?.toLowerCase() === "fake") {
    return [
      ...baseLinks,
      { title: "Full Fact", url: "https://fullfact.org" },
      { title: "Lead Stories", url: "https://leadstories.com" },
    ]
  }

  return baseLinks
}
