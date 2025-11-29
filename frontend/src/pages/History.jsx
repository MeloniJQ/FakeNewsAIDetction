"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Calendar, TrendingUp, ThumbsUp, ThumbsDown } from "lucide-react"

import { API_URL } from "../config"

export default function History() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token")
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const response = await axios.get(`${API_URL}/api/news-history`, { headers })
      setItems(response.data.data || [])
    } catch (err) {
      setError("Failed to load history")
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
      const response = await axios.post(
        `${API_URL}/api/feedback`,
        { newsId: id, isCorrect },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        // Update local state with new score and user vote
        setItems(prev => prev.map(item =>
          item._id === id
            ? {
              ...item,
              communityScore: response.data.communityScore,
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

  const getResultColor = (classification) => {
    if (classification === "True") return "text-green-600"
    if (classification === "Fake") return "text-red-600"
    return "text-yellow-600"
  }

  if (loading) {
    return <div className="text-center py-12">Loading history...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Detection History</h1>

      {error && <div className="p-4 bg-red-50 text-red-800 rounded-lg mb-6">{error}</div>}

      {items.length === 0 ? (
        <div className="card p-12 text-center text-muted-foreground">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No detection history yet. Start checking news!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item._id} className="card p-6 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <p className="font-medium line-clamp-2">{item.text}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${getResultColor(item.classification)}`}>{item.classification}</p>
                  <p className="text-sm text-muted-foreground">{item.confidence}%</p>
                </div>
              </div>

              {item.communityScore !== undefined && (
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Community Score: </span>
                    <span className="font-semibold">{item.communityScore}%</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVote(item._id, true)}
                      className={`p-1 rounded-full transition ${item.userVote === 'up' ? 'bg-green-100 text-green-700' : 'hover:bg-green-50 text-green-600'}`}
                      title="Vote Real"
                    >
                      <ThumbsUp className={`w-4 h-4 ${item.userVote === 'up' ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleVote(item._id, false)}
                      className={`p-1 rounded-full transition ${item.userVote === 'down' ? 'bg-red-100 text-red-700' : 'hover:bg-red-50 text-red-600'}`}
                      title="Vote Fake"
                    >
                      <ThumbsDown className={`w-4 h-4 ${item.userVote === 'down' ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
