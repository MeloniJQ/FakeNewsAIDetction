import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

/**
 * Check news credibility using Gemini API
 * @param {string} text - News headline or article to check
 * @returns {Promise<Object>} Gemini response with analysis
 */
export async function checkNewsWithGemini(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `You are a fact-checking AI. Analyze the following news statement and determine if it's TRUE, FAKE, or UNCERTAIN.

News: "${text}"

Provide your response in this exact JSON format (no markdown, just JSON):
{
  "classification": "True" | "Fake" | "Uncertain",
  "confidence": <number 0-100>,
  "explanation": "<brief explanation of your assessment>",
  "keyFactors": ["<factor1>", "<factor2>", "<factor3>"]
}

Focus on:
- Sensationalist language (breaking, shocking, exclusive)
- Credible indicators (peer-reviewed, study, evidence)
- Logical fallacies and bias
- Extraordinary claims without evidence`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    // Parse JSON response
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      console.error("[Gemini] JSON parse error:", parseError)
    }

    return {
      classification: "Uncertain",
      confidence: 50,
      explanation: "Could not parse Gemini response",
      keyFactors: [],
    }
  } catch (error) {
    console.error("[Gemini] API error:", error)
    throw error
  }
}

/**
 * Generate detailed fact-check report using Gemini
 * @param {string} text - News text to analyze
 * @returns {Promise<Object>} Detailed report
 */
export async function generateFactCheckReport(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `Generate a detailed fact-check report for this news statement:

"${text}"

Provide a JSON response with this structure:
{
  "claim": "<the main claim>",
  "verdict": "True" | "False" | "Partially True" | "Unverifiable",
  "reasoning": "<detailed reasoning>",
  "sources": ["<source1>", "<source2>"],
  "relatedArticles": ["<article1>", "<article2>"],
  "confidence": <0-100>
}`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      console.error("[Gemini] Report parse error:", parseError)
    }

    return {
      claim: text,
      verdict: "Unverifiable",
      reasoning: "Unable to generate report",
      sources: [],
      relatedArticles: [],
      confidence: 0,
    }
  } catch (error) {
    console.error("[Gemini] Report generation error:", error)
    throw error
  }
}
