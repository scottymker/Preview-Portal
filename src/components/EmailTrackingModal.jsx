import { useState, useEffect } from 'react'
import { X, Mail, Eye, MousePointerClick, ExternalLink, Clock, User, ChevronDown, ChevronRight } from 'lucide-react'
import { getAllSentEmails, getEmailTrackingStats } from '../lib/supabase'
import { formatDistanceToNow, format } from 'date-fns'

export default function EmailTrackingModal({ isOpen, onClose }) {
  const [emails, setEmails] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedEmail, setExpandedEmail] = useState(null)
  const [filter, setFilter] = useState('all') // all, opened, unopened

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  async function loadData() {
    try {
      setLoading(true)
      const [emailsData, statsData] = await Promise.all([
        getAllSentEmails(),
        getEmailTrackingStats()
      ])
      setEmails(emailsData || [])
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load tracking data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEmails = emails.filter(email => {
    if (filter === 'opened') return email.opened_at
    if (filter === 'unopened') return !email.opened_at
    return true
  })

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal tracking-modal animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2><Mail size={20} /> Email Tracking</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Stats Summary */}
        {stats && (
          <div className="tracking-summary">
            <div className="tracking-summary-stat">
              <div className="tracking-summary-value">{stats.totalSent}</div>
              <div className="tracking-summary-label">Emails Sent</div>
            </div>
            <div className="tracking-summary-stat">
              <div className="tracking-summary-value">{stats.totalOpened}</div>
              <div className="tracking-summary-label">Opened</div>
            </div>
            <div className="tracking-summary-stat">
              <div className="tracking-summary-value">{stats.openRate}%</div>
              <div className="tracking-summary-label">Open Rate</div>
            </div>
            <div className="tracking-summary-stat">
              <div className="tracking-summary-value">{stats.totalClicks}</div>
              <div className="tracking-summary-label">Link Clicks</div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="tracking-filters">
          <button
            className={`tracking-filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({emails.length})
          </button>
          <button
            className={`tracking-filter-btn ${filter === 'opened' ? 'active' : ''}`}
            onClick={() => setFilter('opened')}
          >
            Opened ({emails.filter(e => e.opened_at).length})
          </button>
          <button
            className={`tracking-filter-btn ${filter === 'unopened' ? 'active' : ''}`}
            onClick={() => setFilter('unopened')}
          >
            Not Opened ({emails.filter(e => !e.opened_at).length})
          </button>
        </div>

        {/* Email List */}
        <div className="tracking-email-list">
          {loading ? (
            <p className="text-muted text-center py-4">Loading...</p>
          ) : filteredEmails.length === 0 ? (
            <div className="tracking-empty">
              <Mail size={48} />
              <h3>No emails tracked yet</h3>
              <p>Send an email to a client and tracking data will appear here.</p>
            </div>
          ) : (
            filteredEmails.map(email => (
              <div key={email.id} className="tracking-email-item">
                <div
                  className="tracking-email-header"
                  onClick={() => setExpandedEmail(expandedEmail === email.id ? null : email.id)}
                >
                  <div className="tracking-email-status">
                    {email.opened_at ? (
                      <span className="status-badge opened"><Eye size={14} /> Opened</span>
                    ) : (
                      <span className="status-badge pending"><Clock size={14} /> Pending</span>
                    )}
                  </div>
                  <div className="tracking-email-info">
                    <div className="tracking-email-recipient">
                      <User size={14} />
                      <span>{email.recipient_name || email.recipient_email}</span>
                    </div>
                    <div className="tracking-email-subject">{email.subject}</div>
                    <div className="tracking-email-meta">
                      <span>Sent {formatDistanceToNow(new Date(email.sent_at), { addSuffix: true })}</span>
                      {email.email_type && <span className="email-type-badge">{email.email_type}</span>}
                    </div>
                  </div>
                  <div className="tracking-email-stats">
                    {email.opened_at && (
                      <>
                        <span className="mini-stat" title="Times opened">
                          <Eye size={14} /> {email.open_count || 1}
                        </span>
                        <span className="mini-stat" title="Link clicks">
                          <MousePointerClick size={14} /> {email.email_clicks?.length || 0}
                        </span>
                      </>
                    )}
                  </div>
                  <button className="tracking-expand-btn">
                    {expandedEmail === email.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                </div>

                {expandedEmail === email.id && (
                  <div className="tracking-email-details">
                    <div className="tracking-detail-row">
                      <span className="tracking-detail-label">To:</span>
                      <span>{email.recipient_email}</span>
                    </div>
                    <div className="tracking-detail-row">
                      <span className="tracking-detail-label">Sent:</span>
                      <span>{format(new Date(email.sent_at), 'PPpp')}</span>
                    </div>
                    {email.opened_at && (
                      <>
                        <div className="tracking-detail-row">
                          <span className="tracking-detail-label">First Opened:</span>
                          <span>{format(new Date(email.opened_at), 'PPpp')}</span>
                        </div>
                        <div className="tracking-detail-row">
                          <span className="tracking-detail-label">Open Count:</span>
                          <span>{email.open_count || 1} time(s)</span>
                        </div>
                      </>
                    )}

                    {email.email_clicks && email.email_clicks.length > 0 && (
                      <div className="tracking-clicks-section">
                        <h4><MousePointerClick size={14} /> Link Clicks ({email.email_clicks.length})</h4>
                        <div className="tracking-clicks-list">
                          {email.email_clicks.map(click => (
                            <div key={click.id} className="tracking-click-item">
                              <ExternalLink size={12} />
                              <a href={click.link_url} target="_blank" rel="noopener noreferrer">
                                {click.link_url.length > 50 ? click.link_url.substring(0, 50) + '...' : click.link_url}
                              </a>
                              <span className="click-time">
                                {formatDistanceToNow(new Date(click.clicked_at), { addSuffix: true })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
