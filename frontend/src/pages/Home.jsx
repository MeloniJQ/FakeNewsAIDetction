"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { CheckCircle, TrendingUp, AlertCircle, Loader, ThumbsUp, ThumbsDown } from "lucide-react"
import "../styles/news-animations.css"
import { API_URL } from "../config"

export default function Home() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchLatestNews()
  }, [])

  const fetchLatestNews = async (forceRefresh = false) => {
    try {
      setLoading(true)

      const token = localStorage.getItem("token")
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      if (forceRefresh) {
        await fetch(`${API_URL}/api/news/refresh`, { method: "POST" })
      }

      const response = await fetch(`${API_URL}/api/news?limit=20`, { headers })
      const data = await response.json()

      if (data.success) {
        setNews(data.data)
      }
    } catch (err) {
      setError("Failed to fetch news")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (id, isCorrect) => {
    const token = localStorage.getItem("token")
    if (!token) {
      alert("Please login to vote")
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newsId: id, isCorrect }),
      })

      const data = await response.json()

      if (data.success) {
        // Update local state with new score and user vote
        setNews(prev => prev.map(item =>
          item._id === id
            ? {
              ...item,
              communityScore: data.communityScore,
              feedbackCount: data.feedbackCount,
              userVote: isCorrect ? 'up' : 'down'
            }
            : item
        ))
      }
    } catch (err) {
      console.error("Vote failed", err)
      alert("Failed to submit vote")
    }
  }

  const getCredibilityColor = (score) => {
    if (score >= 70) return "text-green-600"
    if (score >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  const getClassificationColor = (classification) => {
    switch (classification?.toLowerCase()) {
      case "true":
      case "real":
        return "bg-green-100 text-green-800"
      case "fake":
        return "bg-red-100 text-red-800"
      case "uncertain":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-12">
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">AI Fake News Detector</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Verify the truth behind every headline with AI-powered credibility detection
        </p>
        <Link to="/detect" className="btn-primary inline-block">
          Start Detecting Now
        </Link>
      </section>

      <section className="grid md:grid-cols-3 gap-8">
        <div className="card p-6">
          <CheckCircle className="w-12 h-12 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">AI Verification</h3>
          <p className="text-muted-foreground">Real-time fact checking powered by Google Gemini API</p>
        </div>

        <div className="card p-6">
          <TrendingUp className="w-12 h-12 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Community Scores</h3>
          <p className="text-muted-foreground">See how the community rates news credibility</p>
        </div>

        <div className="card p-6">
          <AlertCircle className="w-12 h-12 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Browser Extension</h3>
          <p className="text-muted-foreground">Check headlines while browsing the web</p>
        </div>
      </section>

      <section className="card p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Trending News Analysis</h2>
          <button
            onClick={() => fetchLatestNews(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin w-8 h-8" />
          </div>
        ) : news.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No articles available</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {news.map((article) => (
              <div
                key={article._id}
                className="news-card group relative overflow-hidden rounded-lg border border-border hover-enlarge transition-all duration-300"
              >
                {article.imageUrl && (
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={article.imageUrl || "/placeholder.svg"}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                )}

                <div className="p-4 space-y-3">
                  <div
                    className={`inline-block px-2 py-1 rounded text-sm font-semibold ${getClassificationColor(article.classification)}`}
                  >
                    {article.classification}
                  </div>

                  <h3 className="font-bold text-sm line-clamp-2">{article.title}</h3>

                  {/* Added Summary/Explanation */}
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {article.explanation || article.content}
                  </p>

                  <div className="space-y-2 text-xs text-muted-foreground">
                    {article.source && <p>Source: {article.source}</p>}
                    {article.author && <p>Author: {article.author}</p>}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div>
                      <p className={`font-bold text-sm ${getCredibilityColor(article.confidence)}`}>
                        {article.confidence}% Confidence
                      </p>
                      {article.globalCredibility && (
                        <p className="text-xs text-muted-foreground">Global: {article.globalCredibility}%</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleVote(article._id, true)}
                          className={`p-1 rounded-full transition ${article.userVote === 'up' ? 'bg-green-100 text-green-700' : 'hover:bg-green-50 text-green-600'}`}
                          title="Vote Real"
                        >
                          <ThumbsUp className={`w-4 h-4 ${article.userVote === 'up' ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleVote(article._id, false)}
                          className={`p-1 rounded-full transition ${article.userVote === 'down' ? 'bg-red-100 text-red-700' : 'hover:bg-red-50 text-red-600'}`}
                          title="Vote Fake"
                        >
                          <ThumbsDown className={`w-4 h-4 ${article.userVote === 'down' ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-blue-600">{article.feedbackCount} votes</p>
                        <p className="text-xs text-muted-foreground">Community: {article.communityScore}%</p>
                      </div>
                    </div>
                  </div>

                  {article.url && article.url !== "#" && (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline block mt-2"
                    >
                      Read Original
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
