import { Link } from 'react-router-dom'
import { Eye, MessageCircle, Palette, Shield } from 'lucide-react'
import './HomePage.css'

export default function HomePage() {
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

          <div className="cta-section">
            <p className="text-gray-500">Have a preview link?</p>
            <p className="text-sm text-gray-400">
              Enter the link your designer sent you to view your project.
            </p>
          </div>
        </div>
      </main>

      <footer className="home-footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} The Dev Side. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
