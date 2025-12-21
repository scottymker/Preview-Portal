import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getAllEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  getAllSentEmails,
  getEmailTrackingStats,
  verifyAdminPassword
} from '../lib/supabase'
import {
  ArrowLeft, Mail, FileText, Eye, Plus, Edit2, Trash2, X,
  ChevronRight, ChevronDown, MousePointerClick, Clock, User,
  ExternalLink, Loader2
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import './EmailPage.css'

const TEMPLATE_VARIABLES = [
  { key: 'client_name', label: 'Client Name', description: 'Recipient name' },
  { key: 'project_name', label: 'Project Name', description: 'Project title' },
  { key: 'access_code', label: 'Access Code', description: 'Preview access code' },
  { key: 'preview_link', label: 'Preview Link', description: 'Direct preview URL' },
  { key: 'invoice_number', label: 'Invoice #', description: 'Invoice reference' },
  { key: 'invoice_amount', label: 'Amount', description: 'Invoice total' },
  { key: 'due_date', label: 'Due Date', description: 'Payment due date' },
  { key: 'custom_message', label: 'Custom Message', description: 'Custom text' },
  { key: 'current_date', label: 'Today', description: 'Current date' }
]

const CATEGORIES = [
  { value: 'preview', label: 'Preview Emails' },
  { value: 'invoice', label: 'Invoice Emails' },
  { value: 'custom', label: 'Custom' }
]

export default function EmailPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tracking') // 'tracking' or 'templates'
  const navigate = useNavigate()

  // Tracking state
  const [emails, setEmails] = useState([])
  const [stats, setStats] = useState(null)
  const [trackingFilter, setTrackingFilter] = useState('all')
  const [expandedEmail, setExpandedEmail] = useState(null)

  // Templates state
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    category: 'preview',
    is_default: false
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const isAuth = sessionStorage.getItem('admin_authenticated')
    if (isAuth === 'true') {
      setAuthenticated(true)
      loadData()
    } else {
      setLoading(false)
    }
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    const isValid = await verifyAdminPassword(password)
    if (isValid) {
      sessionStorage.setItem('admin_authenticated', 'true')
      setAuthenticated(true)
      loadData()
    } else {
      setAuthError('Invalid password')
    }
  }

  async function loadData() {
    try {
      setLoading(true)
      const [emailsData, statsData, templatesData] = await Promise.all([
        getAllSentEmails(),
        getEmailTrackingStats(),
        getAllEmailTemplates()
      ])
      setEmails(emailsData || [])
      setStats(statsData)
      setTemplates(templatesData || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Template functions
  function handleSelectTemplate(template) {
    setSelectedTemplate(template)
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      category: template.category,
      is_default: template.is_default
    })
    setIsEditing(false)
    setShowPreview(false)
  }

  function handleNewTemplate() {
    setSelectedTemplate(null)
    setFormData({
      name: '',
      subject: '',
      body: '',
      category: 'preview',
      is_default: false
    })
    setIsEditing(true)
    setShowPreview(false)
  }

  function insertVariable(variable) {
    const textarea = document.getElementById('template-body')
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = formData.body
      const before = text.substring(0, start)
      const after = text.substring(end)
      const newText = `${before}{{${variable}}}${after}`
      setFormData({ ...formData, body: newText })
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4)
      }, 0)
    } else {
      setFormData({ ...formData, body: formData.body + `{{${variable}}}` })
    }
  }

  async function handleSave() {
    if (!formData.name || !formData.subject || !formData.body) {
      alert('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      if (selectedTemplate) {
        const updated = await updateEmailTemplate(selectedTemplate.id, formData)
        setTemplates(templates.map(t => t.id === updated.id ? updated : t))
        setSelectedTemplate(updated)
      } else {
        const created = await createEmailTemplate(formData)
        setTemplates([created, ...templates])
        setSelectedTemplate(created)
      }
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save template:', error)
      alert('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selectedTemplate) return
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      await deleteEmailTemplate(selectedTemplate.id)
      setTemplates(templates.filter(t => t.id !== selectedTemplate.id))
      setSelectedTemplate(null)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to delete template:', error)
      alert('Failed to delete template')
    }
  }

  function getPreviewHtml() {
    let html = formData.body
    const sampleData = {
      client_name: 'John Smith',
      project_name: 'Acme Website Redesign',
      access_code: 'ABC123',
      preview_link: 'https://preview.example.com/abc123',
      invoice_number: 'INV-2024001',
      invoice_amount: '$2,500.00',
      due_date: 'January 15, 2025',
      custom_message: 'Thank you for your business!',
      current_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    }

    for (const [key, value] of Object.entries(sampleData)) {
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
    }
    return html
  }

  const filteredTemplates = categoryFilter === 'all'
    ? templates
    : templates.filter(t => t.category === categoryFilter)

  const filteredEmails = emails.filter(email => {
    if (trackingFilter === 'opened') return email.opened_at
    if (trackingFilter === 'unopened') return !email.opened_at
    return true
  })

  // Login screen
  if (!authenticated) {
    return (
      <div className="email-page">
        <div className="login-container">
          <h1>Admin Access</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              className="input"
            />
            {authError && <p className="error">{authError}</p>}
            <button type="submit" className="btn btn-primary">Login</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="email-page">
      {/* Header */}
      <header className="email-header">
        <div className="email-header-left">
          <button className="btn btn-ghost" onClick={() => navigate('/admin')}>
            <ArrowLeft size={20} />
            Back to Projects
          </button>
          <h1><Mail size={24} /> Email</h1>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="email-tabs">
        <button
          className={`email-tab ${activeTab === 'tracking' ? 'active' : ''}`}
          onClick={() => setActiveTab('tracking')}
        >
          <Eye size={18} />
          Tracking
          {stats && stats.totalSent > 0 && (
            <span className="tab-badge">{stats.totalSent}</span>
          )}
        </button>
        <button
          className={`email-tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <FileText size={18} />
          Templates
          {templates.length > 0 && (
            <span className="tab-badge">{templates.length}</span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="email-loading">
          <Loader2 size={32} className="spin" />
          <p>Loading...</p>
        </div>
      ) : (
        <main className="email-content">
          {/* ========== TRACKING TAB ========== */}
          {activeTab === 'tracking' && (
            <div className="tracking-section">
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
                  className={`tracking-filter-btn ${trackingFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setTrackingFilter('all')}
                >
                  All ({emails.length})
                </button>
                <button
                  className={`tracking-filter-btn ${trackingFilter === 'opened' ? 'active' : ''}`}
                  onClick={() => setTrackingFilter('opened')}
                >
                  Opened ({emails.filter(e => e.opened_at).length})
                </button>
                <button
                  className={`tracking-filter-btn ${trackingFilter === 'unopened' ? 'active' : ''}`}
                  onClick={() => setTrackingFilter('unopened')}
                >
                  Not Opened ({emails.filter(e => !e.opened_at).length})
                </button>
              </div>

              {/* Email List */}
              <div className="tracking-email-list">
                {filteredEmails.length === 0 ? (
                  <div className="tracking-empty">
                    <Mail size={48} />
                    <h3>No emails tracked yet</h3>
                    <p>Send an email to a client from the Projects page and tracking data will appear here.</p>
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
          )}

          {/* ========== TEMPLATES TAB ========== */}
          {activeTab === 'templates' && (
            <div className="templates-section">
              <div className="templates-layout">
                {/* Sidebar - Template List */}
                <div className="templates-sidebar">
                  <div className="templates-sidebar-header">
                    <select
                      className="input input-sm"
                      value={categoryFilter}
                      onChange={e => setCategoryFilter(e.target.value)}
                    >
                      <option value="all">All Categories</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                    <button className="btn btn-primary btn-sm" onClick={handleNewTemplate}>
                      <Plus size={16} /> New
                    </button>
                  </div>

                  <div className="templates-list">
                    {filteredTemplates.length === 0 ? (
                      <p className="text-muted text-center py-4">No templates found</p>
                    ) : (
                      filteredTemplates.map(template => (
                        <div
                          key={template.id}
                          className={`template-list-item ${selectedTemplate?.id === template.id ? 'active' : ''}`}
                          onClick={() => handleSelectTemplate(template)}
                        >
                          <div className="template-list-item-content">
                            <span className="template-name">{template.name}</span>
                            <span className="template-category">{template.category}</span>
                          </div>
                          {template.is_default && <span className="badge badge-primary">Default</span>}
                          <ChevronRight size={16} className="template-chevron" />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Main Content */}
                <div className="templates-main">
                  {!selectedTemplate && !isEditing ? (
                    <div className="templates-empty">
                      <FileText size={48} />
                      <h3>Select a template or create a new one</h3>
                      <p>Email templates help you send consistent, professional emails to your clients.</p>
                      <button className="btn btn-primary" onClick={handleNewTemplate}>
                        <Plus size={16} /> Create Template
                      </button>
                    </div>
                  ) : showPreview ? (
                    <div className="template-preview-container">
                      <div className="template-preview-header">
                        <h3>Preview</h3>
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowPreview(false)}>
                          Back to Edit
                        </button>
                      </div>
                      <div className="template-preview-subject">
                        <strong>Subject:</strong> {formData.subject.replace(/\{\{(\w+)\}\}/g, (_, key) => {
                          const samples = { client_name: 'John Smith', project_name: 'Acme Website', invoice_number: 'INV-2024001', invoice_amount: '$2,500.00' }
                          return samples[key] || `{{${key}}}`
                        })}
                      </div>
                      <div
                        className="template-preview-body"
                        dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                      />
                    </div>
                  ) : (
                    <div className="template-editor">
                      <div className="template-editor-header">
                        <h3>{selectedTemplate ? (isEditing ? 'Edit Template' : 'Template Details') : 'New Template'}</h3>
                        <div className="template-editor-actions">
                          {selectedTemplate && !isEditing && (
                            <>
                              <button className="btn btn-secondary btn-sm" onClick={() => setShowPreview(true)}>
                                <Eye size={16} /> Preview
                              </button>
                              <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(true)}>
                                <Edit2 size={16} /> Edit
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                                <Trash2 size={16} /> Delete
                              </button>
                            </>
                          )}
                          {isEditing && (
                            <>
                              <button className="btn btn-secondary btn-sm" onClick={() => setShowPreview(true)}>
                                <Eye size={16} /> Preview
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                  if (selectedTemplate) {
                                    handleSelectTemplate(selectedTemplate)
                                  } else {
                                    setIsEditing(false)
                                    setSelectedTemplate(null)
                                  }
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={handleSave}
                                disabled={saving}
                              >
                                {saving ? 'Saving...' : 'Save Template'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="template-form">
                        <div className="form-row">
                          <div className="form-group">
                            <label className="label">Template Name *</label>
                            <input
                              type="text"
                              className="input"
                              value={formData.name}
                              onChange={e => setFormData({ ...formData, name: e.target.value })}
                              placeholder="e.g., Welcome Email"
                              disabled={!isEditing}
                            />
                          </div>
                          <div className="form-group">
                            <label className="label">Category</label>
                            <select
                              className="input"
                              value={formData.category}
                              onChange={e => setFormData({ ...formData, category: e.target.value })}
                              disabled={!isEditing}
                            >
                              {CATEGORIES.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="label">Subject Line *</label>
                          <input
                            type="text"
                            className="input"
                            value={formData.subject}
                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                            placeholder="e.g., Your {{project_name}} Preview is Ready"
                            disabled={!isEditing}
                          />
                        </div>

                        {isEditing && (
                          <div className="variable-chips">
                            <span className="variable-chips-label">Insert variable:</span>
                            {TEMPLATE_VARIABLES.map(v => (
                              <button
                                key={v.key}
                                className="variable-chip"
                                onClick={() => insertVariable(v.key)}
                                title={v.description}
                              >
                                {v.label}
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="form-group">
                          <label className="label">Email Body (HTML) *</label>
                          <textarea
                            id="template-body"
                            className="input template-body-input"
                            value={formData.body}
                            onChange={e => setFormData({ ...formData, body: e.target.value })}
                            placeholder="Enter HTML email content with {{variables}}"
                            disabled={!isEditing}
                            rows={12}
                          />
                        </div>

                        {isEditing && (
                          <div className="form-group">
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={formData.is_default}
                                onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
                              />
                              Set as default template for this category
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  )
}
