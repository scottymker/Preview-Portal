import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Bot,
  Search,
  Globe,
  Zap,
  Eye,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Plus,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Trash2,
  Play,
  Pause,
  Settings,
  BarChart3,
  Target,
  TrendingUp,
  Loader2
} from 'lucide-react'
import { supabase, getAutomationLeads, getAutomationJobs, createAutomationLead, deleteAutomationLead, runDiscovery, runAnalysis, runGeneration, verifyAdminPassword } from '../lib/supabase'
import './AutomationPage.css'

export default function AutomationPage() {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [activeTab, setActiveTab] = useState('dashboard')
  const [leads, setLeads] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedLead, setExpandedLead] = useState(null)

  // Discovery form state
  const [discoveryMode, setDiscoveryMode] = useState('manual') // 'manual', 'search'
  const [manualUrl, setManualUrl] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLocation, setSearchLocation] = useState('')
  const [searchLimit, setSearchLimit] = useState(10)
  const [isDiscovering, setIsDiscovering] = useState(false)

  // Filter state
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    // Use same session storage as AdminPage
    const saved = sessionStorage.getItem('admin_authenticated')
    if (saved === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated])

  const handleLogin = async (e) => {
    e.preventDefault()
    const isValid = await verifyAdminPassword(password)
    if (isValid) {
      setIsAuthenticated(true)
      sessionStorage.setItem('admin_authenticated', 'true')
      setLoginError('')
    } else {
      setLoginError('Invalid password')
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [leadsData, jobsData] = await Promise.all([
        getAutomationLeads(),
        getAutomationJobs()
      ])
      setLeads(leadsData || [])
      setJobs(jobsData || [])
    } catch (error) {
      console.error('Error loading automation data:', error)
    }
    setLoading(false)
  }

  const handleManualAdd = async (e) => {
    e.preventDefault()
    if (!manualUrl.trim()) return

    setIsDiscovering(true)
    try {
      // Normalize URL
      let url = manualUrl.trim()
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url
      }

      const lead = await createAutomationLead({
        business_url: url,
        source: 'manual',
        workflow_status: 'discovered'
      })

      if (lead) {
        setLeads(prev => [lead, ...prev])
        setManualUrl('')
      }
    } catch (error) {
      console.error('Error adding lead:', error)
    }
    setIsDiscovering(false)
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsDiscovering(true)
    try {
      const result = await runDiscovery({
        query: searchQuery,
        location: searchLocation,
        limit: searchLimit
      })

      if (result?.leads) {
        setLeads(prev => [...result.leads, ...prev])
        setSearchQuery('')
        setSearchLocation('')
      }
    } catch (error) {
      console.error('Error running discovery:', error)
    }
    setIsDiscovering(false)
  }

  const handleAnalyzeLead = async (leadId) => {
    try {
      // Update local state to show analyzing
      setLeads(prev => prev.map(l =>
        l.id === leadId ? { ...l, analysis_status: 'analyzing' } : l
      ))

      const result = await runAnalysis(leadId)

      if (result) {
        setLeads(prev => prev.map(l =>
          l.id === leadId ? { ...l, ...result } : l
        ))
      }
    } catch (error) {
      console.error('Error analyzing lead:', error)
      setLeads(prev => prev.map(l =>
        l.id === leadId ? { ...l, analysis_status: 'failed', analysis_error: error.message } : l
      ))
    }
  }

  const handleGenerateSite = async (leadId) => {
    try {
      setLeads(prev => prev.map(l =>
        l.id === leadId ? { ...l, generation_status: 'generating' } : l
      ))

      const result = await runGeneration(leadId)

      if (result) {
        setLeads(prev => prev.map(l =>
          l.id === leadId ? { ...l, ...result } : l
        ))
      }
    } catch (error) {
      console.error('Error generating site:', error)
      setLeads(prev => prev.map(l =>
        l.id === leadId ? { ...l, generation_status: 'failed', generation_error: error.message } : l
      ))
    }
  }

  const handleDeleteLead = async (leadId) => {
    if (!confirm('Delete this lead?')) return

    try {
      await deleteAutomationLead(leadId)
      setLeads(prev => prev.filter(l => l.id !== leadId))
    } catch (error) {
      console.error('Error deleting lead:', error)
    }
  }

  const handleDeleteAllLeads = async () => {
    if (!confirm(`Delete all ${leads.length} leads? This cannot be undone.`)) return

    try {
      // Delete all leads one by one
      for (const lead of leads) {
        await deleteAutomationLead(lead.id)
      }
      setLeads([])
    } catch (error) {
      console.error('Error deleting all leads:', error)
      // Reload to get current state
      loadData()
    }
  }

  const filteredLeads = leads.filter(lead => {
    if (statusFilter === 'all') return true
    return lead.workflow_status === statusFilter
  })

  // Stats calculations
  const stats = {
    total: leads.length,
    discovered: leads.filter(l => l.workflow_status === 'discovered').length,
    analyzed: leads.filter(l => l.workflow_status === 'analyzed').length,
    generated: leads.filter(l => l.workflow_status === 'generated').length,
    readyToSend: leads.filter(l => l.workflow_status === 'ready_to_send').length,
    needsRefresh: leads.filter(l => l.needs_refresh === true).length,
    avgDesignScore: leads.filter(l => l.design_score).length > 0
      ? Math.round(leads.filter(l => l.design_score).reduce((a, b) => a + b.design_score, 0) / leads.filter(l => l.design_score).length)
      : 0
  }

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <h1>Automation</h1>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
          <button type="submit" className="btn btn-primary">Login</button>
          {loginError && <p className="error">{loginError}</p>}
        </form>
      </div>
    )
  }

  return (
    <div className="automation-page">
      {/* Header */}
      <header className="automation-header">
        <div className="automation-header-left">
          <button className="btn btn-ghost" onClick={() => navigate('/admin')}>
            <ArrowLeft size={20} />
          </button>
          <h1><Bot size={28} /> Automation</h1>
        </div>
        <div className="automation-header-right">
          <button className="btn btn-secondary" onClick={loadData}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="automation-tabs">
        <button
          className={`automation-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <BarChart3 size={18} /> Dashboard
        </button>
        <button
          className={`automation-tab ${activeTab === 'leads' ? 'active' : ''}`}
          onClick={() => setActiveTab('leads')}
        >
          <Target size={18} /> Leads
          <span className="tab-badge">{leads.length}</span>
        </button>
        <button
          className={`automation-tab ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => setActiveTab('discover')}
        >
          <Search size={18} /> Discover
        </button>
        <button
          className={`automation-tab ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          <Zap size={18} /> Jobs
          <span className="tab-badge">{jobs.filter(j => j.status === 'running').length}</span>
        </button>
      </div>

      {/* Content */}
      <div className="automation-content">
        {loading ? (
          <div className="automation-loading">
            <Loader2 size={32} className="spin" />
            <p>Loading automation data...</p>
          </div>
        ) : (
          <>
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="dashboard-section">
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon"><Target /></div>
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Total Leads</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon discovered"><Globe /></div>
                    <div className="stat-value">{stats.discovered}</div>
                    <div className="stat-label">Discovered</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon analyzed"><Eye /></div>
                    <div className="stat-value">{stats.analyzed}</div>
                    <div className="stat-label">Analyzed</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon generated"><Zap /></div>
                    <div className="stat-value">{stats.generated}</div>
                    <div className="stat-label">Sites Generated</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon ready"><Send /></div>
                    <div className="stat-value">{stats.readyToSend}</div>
                    <div className="stat-label">Ready to Send</div>
                  </div>
                  <div className="stat-card highlight">
                    <div className="stat-icon refresh"><RefreshCw /></div>
                    <div className="stat-value">{stats.needsRefresh}</div>
                    <div className="stat-label">Need Refresh</div>
                  </div>
                </div>

                <div className="dashboard-actions">
                  <h3>Quick Actions</h3>
                  <div className="action-buttons">
                    <button className="action-btn" onClick={() => setActiveTab('discover')}>
                      <Search size={20} />
                      <span>Discover New Leads</span>
                    </button>
                    <button className="action-btn" onClick={() => {
                      const pending = leads.filter(l => l.analysis_status === 'pending')
                      if (pending.length > 0) {
                        handleAnalyzeLead(pending[0].id)
                      }
                    }} disabled={!leads.some(l => l.analysis_status === 'pending')}>
                      <Eye size={20} />
                      <span>Analyze Pending ({leads.filter(l => l.analysis_status === 'pending').length})</span>
                    </button>
                    <button className="action-btn" onClick={() => {
                      const ready = leads.filter(l => l.analysis_status === 'completed' && l.generation_status === 'pending' && l.needs_refresh)
                      if (ready.length > 0) {
                        handleGenerateSite(ready[0].id)
                      }
                    }} disabled={!leads.some(l => l.analysis_status === 'completed' && l.generation_status === 'pending' && l.needs_refresh)}>
                      <Zap size={20} />
                      <span>Generate Sites ({leads.filter(l => l.needs_refresh && l.generation_status === 'pending').length})</span>
                    </button>
                  </div>
                </div>

                {/* Recent Leads */}
                <div className="recent-leads">
                  <h3>Recent Leads</h3>
                  {leads.slice(0, 5).map(lead => (
                    <div key={lead.id} className="recent-lead-item">
                      <div className="recent-lead-info">
                        <span className="recent-lead-name">{lead.business_name || new URL(lead.business_url).hostname}</span>
                        <span className={`workflow-badge ${lead.workflow_status}`}>{lead.workflow_status.replace('_', ' ')}</span>
                      </div>
                      <span className="recent-lead-date">{new Date(lead.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                  {leads.length === 0 && (
                    <p className="no-data">No leads yet. Start by discovering businesses.</p>
                  )}
                </div>
              </div>
            )}

            {/* Leads Tab */}
            {activeTab === 'leads' && (
              <div className="leads-section">
                <div className="leads-header-bar">
                  <div className="leads-filters">
                  <button
                    className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('all')}
                  >All ({leads.length})</button>
                  <button
                    className={`filter-btn ${statusFilter === 'discovered' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('discovered')}
                  >Discovered ({stats.discovered})</button>
                  <button
                    className={`filter-btn ${statusFilter === 'analyzed' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('analyzed')}
                  >Analyzed ({stats.analyzed})</button>
                  <button
                    className={`filter-btn ${statusFilter === 'generated' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('generated')}
                  >Generated ({stats.generated})</button>
                  <button
                    className={`filter-btn ${statusFilter === 'ready_to_send' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('ready_to_send')}
                  >Ready ({stats.readyToSend})</button>
                  </div>
                  {leads.length > 0 && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={handleDeleteAllLeads}
                    >
                      <Trash2 size={14} /> Delete All
                    </button>
                  )}
                </div>

                <div className="leads-list">
                  {filteredLeads.length === 0 ? (
                    <div className="leads-empty">
                      <Target size={48} />
                      <h3>No leads found</h3>
                      <p>Start by discovering businesses or adding URLs manually.</p>
                      <button className="btn btn-primary" onClick={() => setActiveTab('discover')}>
                        <Search size={16} /> Discover Leads
                      </button>
                    </div>
                  ) : (
                    filteredLeads.map(lead => (
                      <div key={lead.id} className="lead-card">
                        <div
                          className="lead-header"
                          onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                        >
                          <div className="lead-info">
                            <h4>{lead.business_name || 'Unknown Business'}</h4>
                            <a
                              href={lead.business_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="lead-url"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {new URL(lead.business_url).hostname} <ExternalLink size={12} />
                            </a>
                          </div>
                          <div className="lead-badges">
                            <span className={`workflow-badge ${lead.workflow_status}`}>
                              {lead.workflow_status.replace('_', ' ')}
                            </span>
                            {lead.needs_refresh && (
                              <span className="refresh-badge">Needs Refresh</span>
                            )}
                            {lead.design_score && (
                              <span className={`score-badge ${lead.design_score < 50 ? 'low' : lead.design_score < 75 ? 'medium' : 'high'}`}>
                                Score: {lead.design_score}
                              </span>
                            )}
                          </div>
                          <div className="lead-actions">
                            {lead.analysis_status === 'pending' && (
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={(e) => { e.stopPropagation(); handleAnalyzeLead(lead.id); }}
                              >
                                <Eye size={14} /> Analyze
                              </button>
                            )}
                            {lead.analysis_status === 'analyzing' && (
                              <span className="status-indicator analyzing">
                                <Loader2 size={14} className="spin" /> Analyzing...
                              </span>
                            )}
                            {lead.analysis_status === 'completed' && lead.needs_refresh && lead.generation_status === 'pending' && (
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={(e) => { e.stopPropagation(); handleGenerateSite(lead.id); }}
                              >
                                <Zap size={14} /> Generate Site
                              </button>
                            )}
                            {lead.generation_status === 'generating' && (
                              <span className="status-indicator generating">
                                <Loader2 size={14} className="spin" /> Generating...
                              </span>
                            )}
                            {lead.generated_preview_url && (
                              <a
                                href={lead.generated_preview_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-success"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Eye size={14} /> View Site
                              </a>
                            )}
                            <button
                              className="btn btn-sm btn-ghost"
                              onClick={(e) => { e.stopPropagation(); handleDeleteLead(lead.id); }}
                            >
                              <Trash2 size={14} />
                            </button>
                            {expandedLead === lead.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </div>

                        {expandedLead === lead.id && (
                          <div className="lead-details">
                            <div className="detail-grid">
                              <div className="detail-section">
                                <h5>Business Info</h5>
                                {lead.business_phone && <p><strong>Phone:</strong> {lead.business_phone}</p>}
                                {lead.business_email && <p><strong>Email:</strong> {lead.business_email}</p>}
                                {lead.business_address && <p><strong>Address:</strong> {lead.business_address}</p>}
                                {lead.business_category && <p><strong>Category:</strong> {lead.business_category}</p>}
                                {lead.business_description && <p><strong>Description:</strong> {lead.business_description}</p>}
                              </div>
                              <div className="detail-section">
                                <h5>Analysis Results</h5>
                                <p><strong>Status:</strong> {lead.analysis_status}</p>
                                {lead.design_score !== null && <p><strong>Design Score:</strong> {lead.design_score}/100</p>}
                                {lead.mobile_score !== null && <p><strong>Mobile Score:</strong> {lead.mobile_score}/100</p>}
                                {lead.speed_score !== null && <p><strong>Speed Score:</strong> {lead.speed_score}/100</p>}
                                {lead.ssl_status !== null && <p><strong>SSL:</strong> {lead.ssl_status ? 'Yes' : 'No'}</p>}
                                {lead.refresh_reasons?.length > 0 && (
                                  <div className="refresh-reasons">
                                    <strong>Refresh Reasons:</strong>
                                    <ul>
                                      {lead.refresh_reasons.map((reason, i) => (
                                        <li key={i}>{reason}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                              <div className="detail-section">
                                <h5>Generation</h5>
                                <p><strong>Status:</strong> {lead.generation_status}</p>
                                {lead.generated_site_name && <p><strong>Site Name:</strong> {lead.generated_site_name}</p>}
                                {lead.generated_preview_url && (
                                  <p><strong>Preview:</strong> <a href={lead.generated_preview_url} target="_blank" rel="noopener noreferrer">{lead.generated_preview_url}</a></p>
                                )}
                              </div>
                              <div className="detail-section">
                                <h5>Source</h5>
                                <p><strong>Source:</strong> {lead.source}</p>
                                {lead.source_query && <p><strong>Query:</strong> {lead.source_query}</p>}
                                {lead.source_location && <p><strong>Location:</strong> {lead.source_location}</p>}
                                <p><strong>Discovered:</strong> {new Date(lead.discovered_at).toLocaleString()}</p>
                              </div>
                            </div>
                            {lead.screenshot_url && (
                              <div className="screenshot-preview">
                                <h5>Screenshot</h5>
                                <img src={lead.screenshot_url} alt="Website screenshot" />
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

            {/* Discover Tab */}
            {activeTab === 'discover' && (
              <div className="discover-section">
                <div className="discover-modes">
                  <button
                    className={`mode-btn ${discoveryMode === 'manual' ? 'active' : ''}`}
                    onClick={() => setDiscoveryMode('manual')}
                  >
                    <Plus size={18} /> Add URL Manually
                  </button>
                  <button
                    className={`mode-btn ${discoveryMode === 'search' ? 'active' : ''}`}
                    onClick={() => setDiscoveryMode('search')}
                  >
                    <Search size={18} /> Search for Businesses
                  </button>
                </div>

                {discoveryMode === 'manual' ? (
                  <form className="discover-form" onSubmit={handleManualAdd}>
                    <div className="form-group">
                      <label>Website URL</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g., example.com or https://example.com"
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                      />
                      <p className="form-hint">Enter a business website URL to analyze</p>
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isDiscovering || !manualUrl.trim()}
                    >
                      {isDiscovering ? (
                        <><Loader2 size={16} className="spin" /> Adding...</>
                      ) : (
                        <><Plus size={16} /> Add Lead</>
                      )}
                    </button>
                  </form>
                ) : (
                  <form className="discover-form" onSubmit={handleSearch}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Search Query</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g., plumber, restaurant, law firm"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Location</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g., Austin, TX"
                          value={searchLocation}
                          onChange={(e) => setSearchLocation(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Results Limit</label>
                      <select
                        className="input"
                        value={searchLimit}
                        onChange={(e) => setSearchLimit(parseInt(e.target.value))}
                      >
                        <option value={5}>5 results</option>
                        <option value={10}>10 results</option>
                        <option value={20}>20 results</option>
                        <option value={50}>50 results</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isDiscovering || !searchQuery.trim()}
                    >
                      {isDiscovering ? (
                        <><Loader2 size={16} className="spin" /> Searching...</>
                      ) : (
                        <><Search size={16} /> Search</>
                      )}
                    </button>
                  </form>
                )}

                <div className="discover-tips">
                  <h4>Tips for finding leads</h4>
                  <ul>
                    <li><strong>Local services:</strong> Search for "plumber [city]", "electrician [city]", "landscaper [city]"</li>
                    <li><strong>Professional services:</strong> Search for "accountant [city]", "lawyer [city]", "real estate agent [city]"</li>
                    <li><strong>Retail/Food:</strong> Search for "restaurant [city]", "salon [city]", "gym [city]"</li>
                    <li>Add "small business" or "local" to your queries for better targeting</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Jobs Tab */}
            {activeTab === 'jobs' && (
              <div className="jobs-section">
                {jobs.length === 0 ? (
                  <div className="jobs-empty">
                    <Zap size={48} />
                    <h3>No jobs yet</h3>
                    <p>Jobs are created when you run batch operations like discovery or analysis.</p>
                  </div>
                ) : (
                  <div className="jobs-list">
                    {jobs.map(job => (
                      <div key={job.id} className={`job-card ${job.status}`}>
                        <div className="job-header">
                          <span className="job-type">{job.job_type.replace('_', ' ')}</span>
                          <span className={`job-status ${job.status}`}>
                            {job.status === 'running' && <Loader2 size={14} className="spin" />}
                            {job.status === 'completed' && <CheckCircle size={14} />}
                            {job.status === 'failed' && <AlertCircle size={14} />}
                            {job.status}
                          </span>
                        </div>
                        <div className="job-progress">
                          <div
                            className="job-progress-bar"
                            style={{ width: `${job.total_items > 0 ? (job.processed_items / job.total_items) * 100 : 0}%` }}
                          />
                        </div>
                        <div className="job-stats">
                          <span>Processed: {job.processed_items}/{job.total_items}</span>
                          <span>Success: {job.successful_items}</span>
                          <span>Failed: {job.failed_items}</span>
                        </div>
                        <div className="job-time">
                          {job.started_at && <span>Started: {new Date(job.started_at).toLocaleString()}</span>}
                          {job.completed_at && <span>Completed: {new Date(job.completed_at).toLocaleString()}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
