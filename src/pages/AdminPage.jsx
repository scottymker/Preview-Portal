import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllProjects, createProject, updateProject, deleteProject, verifyAdminPassword } from '../lib/supabase'
import { Plus, ExternalLink, Copy, Trash2, Edit2, X, Check, Link, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import './AdminPage.css'

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
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
      const data = await getAllProjects()
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

    try {
      const project = await createProject({
        name: formData.get('name'),
        preview_url: formData.get('preview_url'),
        assets_url: formData.get('assets_url') || null,
        client_name: formData.get('client_name') || null,
        client_email: formData.get('client_email') || null
      })

      setProjects([project, ...projects])
      setShowCreateModal(false)
    } catch (err) {
      console.error('Failed to create project:', err)
    }
  }

  async function handleUpdateProject(e) {
    e.preventDefault()
    const formData = new FormData(e.target)

    try {
      const updated = await updateProject(editingProject.id, {
        name: formData.get('name'),
        preview_url: formData.get('preview_url'),
        assets_url: formData.get('assets_url') || null,
        client_name: formData.get('client_name') || null,
        client_email: formData.get('client_email') || null
      })

      setProjects(projects.map(p => p.id === updated.id ? updated : p))
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

  function copyPreviewLink(token) {
    const url = `${window.location.origin}/p/${token}`
    navigator.clipboard.writeText(url)
    setCopiedId(token)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function getPreviewUrl(token) {
    return `${window.location.origin}/p/${token}`
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
          <h1>Preview Portal</h1>
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
            <div className="projects-grid">
              {projects.map(project => (
                <div key={project.id} className="project-card card">
                  <div className="card-body">
                    <div className="project-header">
                      <h3>{project.name}</h3>
                      <div className="project-actions">
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

                    {project.client_name && (
                      <p className="project-client text-sm text-gray-500">
                        Client: {project.client_name}
                      </p>
                    )}

                    <p className="project-date text-xs text-gray-400 mt-2">
                      Created {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                    </p>

                    <div className="project-link-box mt-4">
                      <div className="link-display">
                        <Link size={14} className="text-gray-400" />
                        <span className="link-text">/p/{project.token}</span>
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
                            <><Copy size={14} /> Copy</>
                          )}
                        </button>
                        <a
                          href={getPreviewUrl(project.token)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-sm"
                          title="Open preview"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
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
                  <label className="label">Preview URL *</label>
                  <input
                    type="url"
                    name="preview_url"
                    className="input"
                    placeholder="https://example.com or file:// path"
                    required
                  />
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
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Project
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
                  <label className="label">Preview URL *</label>
                  <input
                    type="url"
                    name="preview_url"
                    className="input"
                    defaultValue={editingProject.preview_url}
                    required
                  />
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
    </div>
  )
}
