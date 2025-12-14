import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, MessageCircle, Palette, Shield, ArrowRight, Loader2 } from 'lucide-react'
import { getProjectByToken } from '../lib/supabase'
import './HomePage.css'

export default function HomePage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!code.trim()) return

    setLoading(true)
    setError('')

    try {
      // Try to find project with this token/code (convert to lowercase for lookup)
      const tokenLower = code.trim().toLowerCase()
      const project = await getProjectByToken(tokenLower)
      if (project) {
        navigate(`/p/${tokenLower}`)
      } else {
        setError('Invalid code. Please check and try again.')
      }
    } catch (err) {
      setError('Invalid code. Please check and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="container">
          <h1 className="logo">Preview Portal</h1>
          <Link to="/admin" className="btn btn-secondary">
            Admin
          </Link>
        </div>
      </header>

      <main className="home-main">
        <div className="container">
          <div className="hero-section">
            <h1>Client Preview Portal</h1>
            <p className="hero-subtitle">
              Share website previews with clients, gather feedback with inline comments,
              and deliver brand assets — all in one place.
            </p>
          </div>

          {/* Code Input Section */}
          <div className="code-input-section">
            <h2>Enter Your Preview Code</h2>
            <p>Enter the code provided by your designer to view your project</p>
            <form onSubmit={handleSubmit} className="code-input-form">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter code..."
                className="input"
                maxLength={20}
                disabled={loading}
              />
              <button type="submit" className="btn btn-primary" disabled={loading || !code.trim()}>
                {loading ? (
                  <Loader2 size={18} className="spinner" />
                ) : (
                  <>
                    View <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
            {error && <div className="code-error">{error}</div>}
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Eye size={24} />
              </div>
              <h3>Live Previews</h3>
              <p>Share responsive website previews with desktop, tablet, and mobile views.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <MessageCircle size={24} />
              </div>
              <h3>Inline Comments</h3>
              <p>Click anywhere to leave pinned feedback directly on the design.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Palette size={24} />
              </div>
              <h3>Brand Assets</h3>
              <p>Deliver logo files, color palettes, and fonts in a downloadable package.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Shield size={24} />
              </div>
              <h3>Unique Links</h3>
              <p>Each project gets a private, shareable link — no passwords needed.</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="home-footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} <a href="https://thedevside.com" target="_blank" rel="noopener noreferrer">The Dev Side</a>. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
