import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllProjectsWithComments, createProject, updateProject, deleteProject, verifyAdminPassword, updateComment, deleteComment, supabase } from '../lib/supabase'
import { Plus, ExternalLink, Copy, Trash2, Edit2, X, Check, Link, Loader2, MessageCircle, ChevronDown, ChevronRight, MapPin, Mail, Send, Eye, DollarSign, Upload, FolderArchive } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import './AdminPage.css'

// Convert site name or URL to full preview URL
function convertToPreviewUrl(input) {
  if (!input) return input

  const trimmed = input.trim()

  // If it's already a full URL, return as-is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  // Otherwise, treat it as a site folder name and build the preview URL
  // Remove any leading/trailing slashes and spaces
  const siteName = trimmed.replace(/^\/+|\/+$/g, '').toLowerCase().replace(/\s+/g, '-')
  return `https://preview.thedevside.com/sites/${siteName}/`
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [expandedProjects, setExpandedProjects] = useState({})
  const [showEmailModal, setShowEmailModal] = useState(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(null)
  const [emailStyle, setEmailStyle] = useState('dark')
  const [zipFile, setZipFile] = useState(null)
  const [uploadingZip, setUploadingZip] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(null)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if already authenticated in session
    const isAuth = sessionStorage.getItem('admin_authenticated')
    if (isAuth === 'true') {
      setAuthenticated(true)
      loadProjects()
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
      loadProjects()
    } else {
      setAuthError('Invalid password')
    }
  }

  async function loadProjects() {
    try {
      setLoading(true)
      const data = await getAllProjectsWithComments()
      setProjects(data)
    } catch (err) {
      console.error('Failed to load projects:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateProject(e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    let previewUrl = formData.get('preview_url')

    try {
      // If ZIP file is provided, upload it first
      if (zipFile) {
        const siteName = previewUrl || formData.get('name')
        const uploadedUrl = await handleZipUpload(siteName)
        if (uploadedUrl) {
          previewUrl = uploadedUrl
        } else if (uploadError) {
          // Upload failed, don't create project
          return
        }
      } else {
        previewUrl = convertToPreviewUrl(previewUrl)
      }

      const project = await createProject({
        name: formData.get('name'),
        preview_url: previewUrl,
        assets_url: formData.get('assets_url') || null,
        client_name: formData.get('client_name') || null,
        client_email: formData.get('client_email') || null
      })

      setProjects([{ ...project, comments: [], unresolvedCount: 0 }, ...projects])
      setShowCreateModal(false)
      clearZipFile()
    } catch (err) {
      console.error('Failed to create project:', err)
    }
  }

  async function handleUpdateProject(e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    const previewUrl = convertToPreviewUrl(formData.get('preview_url'))

    try {
      const updated = await updateProject(editingProject.id, {
        name: formData.get('name'),
        preview_url: previewUrl,
        assets_url: formData.get('assets_url') || null,
        client_name: formData.get('client_name') || null,
        client_email: formData.get('client_email') || null
      })

      setProjects(projects.map(p => p.id === updated.id ? { ...updated, comments: p.comments, unresolvedCount: p.unresolvedCount } : p))
      setEditingProject(null)
    } catch (err) {
      console.error('Failed to update project:', err)
    }
  }

  async function handleDeleteProject(id) {
    if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) return

    try {
      await deleteProject(id)
      setProjects(projects.filter(p => p.id !== id))
    } catch (err) {
      console.error('Failed to delete project:', err)
    }
  }

  async function handleResolveComment(projectId, commentId) {
    try {
      await updateComment(commentId, { resolved: true })
      setProjects(projects.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            comments: p.comments.map(c => c.id === commentId ? { ...c, resolved: true } : c),
            unresolvedCount: p.unresolvedCount - 1
          }
        }
        return p
      }))
    } catch (err) {
      console.error('Failed to resolve comment:', err)
    }
  }

  async function handleDeleteComment(projectId, commentId) {
    if (!confirm('Delete this comment?')) return
    try {
      await deleteComment(commentId)
      setProjects(projects.map(p => {
        if (p.id === projectId) {
          const comment = p.comments.find(c => c.id === commentId)
          return {
            ...p,
            comments: p.comments.filter(c => c.id !== commentId),
            unresolvedCount: comment && !comment.resolved ? p.unresolvedCount - 1 : p.unresolvedCount
          }
        }
        return p
      }))
    } catch (err) {
      console.error('Failed to delete comment:', err)
    }
  }

  function copyPreviewLink(token) {
    const url = `${window.location.origin}/p/${token}`
    navigator.clipboard.writeText(url)
    setCopiedId(token)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function getPreviewUrl(token) {
    return `${window.location.origin}/p/${token}`
  }

  function toggleProjectExpanded(projectId) {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }))
  }

  function generateEmailTemplate(project) {
    const previewUrl = getPreviewUrl(project.token)
    return `Hi ${project.client_name || 'there'},

Your website preview is ready for review!

Preview Link: ${previewUrl}
Access Code: ${project.token.toUpperCase()}

You can view the preview by:
1. Going to ${window.location.origin}
2. Entering the code: ${project.token.toUpperCase()}

Or click this direct link: ${previewUrl}

Once you're viewing the preview, you can:
- Switch between desktop, tablet, and mobile views
- Click "Add Comment" to leave feedback directly on the design
- Download your brand assets (if provided)

Please let me know if you have any questions!

Best regards,
The Dev Side`
  }

  function handleCopyEmail(project) {
    const template = generateEmailTemplate(project)
    navigator.clipboard.writeText(template)
    setShowEmailModal(null)
  }

  async function handleSendEmail(project) {
    if (!project.client_email) {
      alert('No client email address set for this project. Please edit the project to add a client email.')
      return
    }

    setSendingEmail(true)
    setEmailSent(null)

    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: project.client_email,
          clientName: project.client_name || '',
          projectName: project.name,
          previewUrl: getPreviewUrl(project.token),
          accessCode: project.token,
          portalUrl: window.location.origin,
          style: emailStyle
        }
      })

      if (error) throw error

      setEmailSent('success')
      setTimeout(() => {
        setShowEmailModal(null)
        setEmailSent(null)
      }, 2000)
    } catch (err) {
      console.error('Failed to send email:', err)
      setEmailSent('error')
    } finally {
      setSendingEmail(false)
    }
  }

  async function handleZipUpload(siteName) {
    if (!zipFile || !siteName) return null

    setUploadingZip(true)
    setUploadError(null)
    setUploadSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', zipFile)
      formData.append('siteName', siteName.trim().toLowerCase().replace(/\s+/g, '-'))

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-site`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: formData
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Upload failed')
      }

      setUploadSuccess(result)
      return result.previewUrl
    } catch (err) {
      console.error('ZIP upload error:', err)
      setUploadError(err.message)
      return null
    } finally {
      setUploadingZip(false)
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0]
    if (file && file.name.endsWith('.zip')) {
      setZipFile(file)
      setUploadError(null)
    } else if (file) {
      setUploadError('Please select a ZIP file')
      setZipFile(null)
    }
  }

  function clearZipFile() {
    setZipFile(null)
    setUploadError(null)
    setUploadSuccess(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Login screen
  if (!authenticated) {
    return (
      <div className="admin-login">
        <div className="login-card card">
          <div className="card-body">
            <h1>Admin Access</h1>
            <p className="text-gray-500">Enter your admin password to continue</p>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <input
                  type="password"
                  className="input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </div>
              {authError && <p className="text-danger text-sm mb-4">{authError}</p>}
              <button type="submit" className="btn btn-primary w-full">
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <header className="admin-header">
        <div className="container">
          <div className="header-left">
            <h1>Preview Portal</h1>
            <nav className="admin-nav">
              <button className="nav-tab active">Projects</button>
              <button className="nav-tab" onClick={() => navigate('/admin/billing')}>
                <DollarSign size={16} />
                Billing
              </button>
            </nav>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            New Project
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="admin-main">
        <div className="container">
          {loading ? (
            <div className="loading-state">
              <Loader2 className="spinner" size={32} />
              <p>Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-state card">
              <div className="card-body">
                <h2>No projects yet</h2>
                <p className="text-gray-500">Create your first project to get started</p>
                <button className="btn btn-primary mt-4" onClick={() => setShowCreateModal(true)}>
                  <Plus size={16} />
                  Create Project
                </button>
              </div>
            </div>
          ) : (
            <div className="projects-list">
              {projects.map(project => (
                <div key={project.id} className="project-card card">
                  <div className="card-body">
                    <div className="project-header">
                      <div className="project-title-row">
                        <button
                          className="expand-btn"
                          onClick={() => toggleProjectExpanded(project.id)}
                        >
                          {expandedProjects[project.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                        <h3>{project.name}</h3>
                        {project.unresolvedCount > 0 && (
                          <span className="comment-badge">{project.unresolvedCount} new</span>
                        )}
                      </div>
                      <div className="project-actions">
                        <button
                          className="btn btn-ghost btn-icon"
                          onClick={() => setShowEmailModal(project)}
                          title="Send to client"
                        >
                          <Mail size={16} />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon"
                          onClick={() => setEditingProject(project)}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon text-danger"
                          onClick={() => handleDeleteProject(project.id)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="project-meta">
                      {project.client_name && (
                        <span className="meta-item">
                          Client: {project.client_name}
                        </span>
                      )}
                      <span className="meta-item">
                        {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                      </span>
                      <span className="meta-item">
                        <MessageCircle size={14} />
                        {project.comments.length} comments
                      </span>
                      <span className={`meta-item ${project.last_viewed_at ? 'viewed' : 'not-viewed'}`}>
                        <Eye size={14} />
                        {project.last_viewed_at
                          ? `Viewed ${formatDistanceToNow(new Date(project.last_viewed_at), { addSuffix: true })}`
                          : 'Not viewed yet'
                        }
                      </span>
                    </div>

                    <div className="project-link-box">
                      <div className="link-display">
                        <Link size={14} className="text-gray-400" />
                        <span className="link-text">Code: {project.token.toUpperCase()}</span>
                      </div>
                      <div className="link-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => copyPreviewLink(project.token)}
                          title="Copy link"
                        >
                          {copiedId === project.token ? (
                            <><Check size={14} /> Copied</>
                          ) : (
                            <><Copy size={14} /> Copy Link</>
                          )}
                        </button>
                        <a
                          href={getPreviewUrl(project.token)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-sm"
                          title="Open preview"
                        >
                          <ExternalLink size={14} /> View
                        </a>
                      </div>
                    </div>

                    {/* Expandable Comments Section */}
                    {expandedProjects[project.id] && (
                      <div className="comments-section">
                        <h4>
                          <MessageCircle size={16} />
                          Comments ({project.comments.length})
                        </h4>
                        {project.comments.length === 0 ? (
                          <p className="no-comments-text">No comments yet</p>
                        ) : (
                          <div className="comments-list-admin">
                            {project.comments.filter(c => !c.resolved).map(comment => (
                              <div key={comment.id} className="comment-item">
                                <div className="comment-location">
                                  <MapPin size={14} />
                                  <span>Position: {Math.round(comment.x_position)}%, {Math.round(comment.y_position)}%</span>
                                </div>
                                <div className="comment-content">
                                  <div className="comment-meta">
                                    <span className="comment-author">{comment.author_name}</span>
                                    <span className="comment-time">
                                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                    </span>
                                  </div>
                                  <p className="comment-message">{comment.message}</p>
                                </div>
                                <div className="comment-actions-admin">
                                  <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => handleResolveComment(project.id, comment.id)}
                                  >
                                    <Check size={14} /> Resolve
                                  </button>
                                  <button
                                    className="btn btn-ghost btn-sm text-danger"
                                    onClick={() => handleDeleteComment(project.id, comment.id)}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {project.comments.filter(c => c.resolved).length > 0 && (
                              <details className="resolved-section">
                                <summary>
                                  Resolved ({project.comments.filter(c => c.resolved).length})
                                </summary>
                                {project.comments.filter(c => c.resolved).map(comment => (
                                  <div key={comment.id} className="comment-item resolved">
                                    <div className="comment-location">
                                      <MapPin size={14} />
                                      <span>Position: {Math.round(comment.x_position)}%, {Math.round(comment.y_position)}%</span>
                                    </div>
                                    <div className="comment-content">
                                      <div className="comment-meta">
                                        <span className="comment-author">{comment.author_name}</span>
                                        <span className="badge badge-success">Resolved</span>
                                      </div>
                                      <p className="comment-message">{comment.message}</p>
                                    </div>
                                  </div>
                                ))}
                              </details>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Project</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="label">Project Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="input"
                    placeholder="e.g., Brain Health Website"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Site Name or URL {!zipFile && '*'}</label>
                  <input
                    type="text"
                    name="preview_url"
                    className="input"
                    placeholder="brain-health or https://custom-url.com"
                    required={!zipFile}
                  />
                  <span className="input-hint">Enter folder name (e.g., "brain-health") or full URL</span>
                </div>

                {/* ZIP Upload Section */}
                <div className="form-group">
                  <label className="label">Or Upload Site Files</label>
                  <div className="zip-upload-area">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".zip"
                      onChange={handleFileSelect}
                      className="file-input-hidden"
                      id="zip-upload"
                    />
                    {!zipFile ? (
                      <label htmlFor="zip-upload" className="zip-upload-label">
                        <FolderArchive size={24} />
                        <span>Click to upload ZIP file</span>
                        <span className="upload-hint">Contains your site files (HTML, CSS, JS, images)</span>
                      </label>
                    ) : (
                      <div className="zip-file-selected">
                        <div className="zip-file-info">
                          <FolderArchive size={20} />
                          <span className="zip-file-name">{zipFile.name}</span>
                          <span className="zip-file-size">({(zipFile.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={clearZipFile}>
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  {uploadError && (
                    <span className="input-error">{uploadError}</span>
                  )}
                  {uploadingZip && (
                    <div className="upload-progress">
                      <Loader2 size={16} className="spinner" />
                      <span>Uploading and deploying site...</span>
                    </div>
                  )}
                  {uploadSuccess && (
                    <div className="upload-success-msg">
                      <Check size={16} />
                      <span>Deployed {uploadSuccess.filesUploaded} files to {uploadSuccess.siteName}</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="label">Brand Assets URL</label>
                  <input
                    type="url"
                    name="assets_url"
                    className="input"
                    placeholder="Link to downloadable brand kit"
                  />
                </div>
                <div className="form-group">
                  <label className="label">Client Name</label>
                  <input
                    type="text"
                    name="client_name"
                    className="input"
                    placeholder="Client's name"
                  />
                </div>
                <div className="form-group">
                  <label className="label">Client Email</label>
                  <input
                    type="email"
                    name="client_email"
                    className="input"
                    placeholder="client@example.com"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowCreateModal(false); clearZipFile(); }} disabled={uploadingZip}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploadingZip}>
                  {uploadingZip ? (
                    <><Loader2 size={16} className="spinner" /> Deploying...</>
                  ) : zipFile ? (
                    <><Upload size={16} /> Upload & Create</>
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingProject && (
        <div className="modal-overlay" onClick={() => setEditingProject(null)}>
          <div className="modal animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Project</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setEditingProject(null)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateProject}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="label">Project Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="input"
                    defaultValue={editingProject.name}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Site Name or URL *</label>
                  <input
                    type="text"
                    name="preview_url"
                    className="input"
                    defaultValue={editingProject.preview_url}
                    placeholder="brain-health or https://custom-url.com"
                    required
                  />
                  <span className="input-hint">Enter folder name (e.g., "brain-health") or full URL</span>
                </div>
                <div className="form-group">
                  <label className="label">Brand Assets URL</label>
                  <input
                    type="url"
                    name="assets_url"
                    className="input"
                    defaultValue={editingProject.assets_url || ''}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Client Name</label>
                  <input
                    type="text"
                    name="client_name"
                    className="input"
                    defaultValue={editingProject.client_name || ''}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Client Email</label>
                  <input
                    type="email"
                    name="client_email"
                    className="input"
                    defaultValue={editingProject.client_email || ''}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingProject(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Template Modal */}
      {showEmailModal && (
        <div className="modal-overlay" onClick={() => setShowEmailModal(null)}>
          <div className="modal modal-lg animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Send to Client</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowEmailModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {emailSent === 'success' ? (
                <div className="email-success">
                  <Check size={48} />
                  <h3>Email Sent!</h3>
                  <p>The preview invitation has been sent to {showEmailModal.client_email}</p>
                </div>
              ) : emailSent === 'error' ? (
                <div className="email-error">
                  <X size={48} />
                  <h3>Failed to Send</h3>
                  <p>There was an error sending the email. Please try copying the template instead.</p>
                </div>
              ) : (
                <>
                  {showEmailModal.client_email ? (
                    <div className="email-recipient">
                      <span className="label">Send to:</span>
                      <span className="email">{showEmailModal.client_email}</span>
                    </div>
                  ) : (
                    <div className="email-no-recipient">
                      <p>No client email set. Add a client email to send directly, or copy the template below.</p>
                    </div>
                  )}

                  <p className="text-gray-500 mt-4 mb-2">Choose email style:</p>
                  <div className="email-style-selector">
                    <button
                      type="button"
                      className={`style-option ${emailStyle === 'dark' ? 'active' : ''}`}
                      onClick={() => setEmailStyle('dark')}
                    >
                      <div className="style-preview dark-preview">
                        <div className="preview-header"></div>
                        <div className="preview-code"></div>
                        <div className="preview-btn"></div>
                      </div>
                      <span>Dark Tech</span>
                    </button>
                    <button
                      type="button"
                      className={`style-option ${emailStyle === 'light' ? 'active' : ''}`}
                      onClick={() => setEmailStyle('light')}
                    >
                      <div className="style-preview light-preview">
                        <div className="preview-header"></div>
                        <div className="preview-code"></div>
                        <div className="preview-btn"></div>
                      </div>
                      <span>Light Pro</span>
                    </button>
                    <button
                      type="button"
                      className={`style-option ${emailStyle === 'minimal' ? 'active' : ''}`}
                      onClick={() => setEmailStyle('minimal')}
                    >
                      <div className="style-preview minimal-preview">
                        <div className="preview-header"></div>
                        <div className="preview-code"></div>
                        <div className="preview-btn"></div>
                      </div>
                      <span>Minimal</span>
                    </button>
                  </div>

                  <p className="text-gray-500 mt-4 mb-2">Email preview:</p>
                  <div className="email-template">
                    <pre>{generateEmailTemplate(showEmailModal)}</pre>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEmailModal(null)}>
                Close
              </button>
              <button className="btn btn-secondary" onClick={() => handleCopyEmail(showEmailModal)}>
                <Copy size={16} />
                Copy Template
              </button>
              {showEmailModal.client_email && !emailSent && (
                <button
                  className="btn btn-primary"
                  onClick={() => handleSendEmail(showEmailModal)}
                  disabled={sendingEmail}
                >
                  {sendingEmail ? (
                    <><Loader2 size={16} className="spinner" /> Sending...</>
                  ) : (
                    <><Send size={16} /> Send Email</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
