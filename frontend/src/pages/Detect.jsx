"use client"

import { useState } from "react"
import axios from "axios"
import { Send, ThumbsUp, ThumbsDown, Loader } from "lucide-react"

import { API_URL } from "../config"

export default function Detect() {
  const [text, setText] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [userFeedback, setUserFeedback] = useState(null)

  const handleCheck = async () => {
    if (!text.trim()) {
      setError("Please enter some news text to check")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await axios.post(`${API_URL}/api/check-news`, { text })
      setResult(response.data)
    } catch (err) {
      setError(err.response?.data?.error || "Failed to check news. Please try again.")
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const handleFeedback = async (isCorrect) => {
    if (!result) return

    try {
      await axios.post(`${API_URL}/api/feedback`, {
        newsId: result.id,
        isCorrect,
      })
      setUserFeedback(isCorrect)
    } catch (err) {
      console.error("Feedback failed:", err)
    }
  }

  const getResultColor = (classification) => {
    if (!classification) return "text-yellow-600"
    const cls = classification.toLowerCase()
    if (cls === "true" || cls === "real") return "text-green-600"
    if (cls === "fake") return "text-red-600"
    return "text-yellow-600"
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-6">Check News</h1>

        <div className="card p-6 space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste a news headline or article here..."
            className="w-full p-4 bg-input border border-border rounded-lg resize-none h-40"
          />

          {error && <div className="p-4 bg-red-50 text-red-800 rounded-lg">{error}</div>}

          <button
            onClick={handleCheck}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Check News
              </>
            )}
          </button>
        </div>
      </section>

      {result && (
        <section className="card p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-4">Analysis Result</h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Classification:</span>
                <span className={`text-2xl font-bold ${getResultColor(result.classification)}`}>
                  {result.classification || "Uncertain"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Confidence:</span>
                <span className="text-xl font-semibold">{result.confidence}%</span>
              </div>

              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${result.confidence}%` }}
                />
              </div>

              {result.communityScore !== undefined && (
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <span className="text-muted-foreground">Community Accuracy:</span>
                  <span className="text-xl font-semibold">{result.communityScore}%</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Explanation</h3>
            <p className="text-muted-foreground leading-relaxed">{result.explanation}</p>
          </div>

          <div className="flex gap-4 pt-4 border-t border-border">
            <button
              onClick={() => handleFeedback(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${userFeedback === true
                ? "bg-green-100 text-green-700"
                : "bg-secondary text-secondary-foreground hover:opacity-80"
                }`}
            >
              <ThumbsUp className="w-4 h-4" />
              Correct
            </button>
            <button
              onClick={() => handleFeedback(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${userFeedback === false
                ? "bg-red-100 text-red-700"
                : "bg-secondary text-secondary-foreground hover:opacity-80"
                }`}
            >
              <ThumbsDown className="w-4 h-4" />
              Incorrect
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
