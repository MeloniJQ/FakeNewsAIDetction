import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Shield, User, LogOut } from "lucide-react"
import AuthModal from "./AuthModal"

export default function Header() {
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      console.log("[HEADER] User from localStorage:", parsedUser)
      setUser(parsedUser)
    }
  }, [])

  useEffect(() => {
    if (user) {
      console.log("[HEADER] Current user state:", user)
    }
  }, [user])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold">FakeCheck AI</span>
        </Link>
        <nav className="flex gap-6 items-center">
          <Link to="/detect" className="hover:text-primary transition">
            Detect
          </Link>
          <Link to="/history" className="hover:text-primary transition">
            History
          </Link>
          <Link to="/about" className="hover:text-primary transition">
            About
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.username}
                  className="w-8 h-8 rounded-full border border-border"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {user.username?.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium hidden sm:block">{user.username}</span>
              <button
                onClick={handleLogout}
                className="text-muted-foreground hover:text-primary transition ml-2"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition"
            >
              <User className="w-4 h-4" />
              Login
            </button>
          )}
        </nav>
      </div>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(userData) => setUser(userData)}
      />
    </header>
  )
}
