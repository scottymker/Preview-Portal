import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { getProjectByToken, getCommentsByProject, createComment, updateComment, deleteComment, supabase, recordProjectView } from '../lib/supabase'
import { MessageCircle, X, Send, Check, Trash2, Monitor, Tablet, Smartphone, Download, ChevronRight, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import './PreviewPage.css'

export default function PreviewPage() {
  const { token } = useParams()
  const [project, setProject] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('desktop')
  const [commentMode, setCommentMode] = useState(false)
  const [selectedComment, setSelectedComment] = useState(null)
  const [newComment, setNewComment] = useState({ x: 0, y: 0, visible: false })
  const [showAssets, setShowAssets] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const iframeRef = useRef(null)
  const previewContainerRef = useRef(null)

  useEffect(() => {
    loadProject()
  }, [token])

  async function loadProject() {
    try {
      setLoading(true)
      const projectData = await getProjectByToken(token)
      setProject(projectData)
      const commentsData = await getCommentsByProject(projectData.id)
      setComments(commentsData)

      // Record that client viewed the preview
      recordProjectView(projectData.id)
    } catch (err) {
      setError('Project not found or link has expired')
    } finally {
      setLoading(false)
    }
  }

  function handlePreviewClick(e) {
    if (!commentMode) return

    const rect = previewContainerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setNewComment({ x, y, visible: true })
    setSelectedComment(null)
  }

  async function handleSubmitComment(e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    const authorName = formData.get('author') || 'Anonymous'
    const message = formData.get('message')

    try {
      const comment = await createComment({
        project_id: project.id,
        x_position: newComment.x,
        y_position: newComment.y,
        message: message,
        author_name: authorName,
        resolved: false
      })

      setComments([...comments, comment])
      setNewComment({ x: 0, y: 0, visible: false })
      setCommentMode(false)

      // Send notification to admin (fire and forget)
      supabase.functions.invoke('notify-comment', {
        body: {
          projectName: project.name,
          projectToken: token,
          authorName: authorName,
          message: message,
          xPosition: newComment.x,
          yPosition: newComment.y,
          previewUrl: window.location.href,
          adminUrl: `${window.location.origin}/admin`
        }
      }).catch(err => console.log('Notification skipped:', err))
    } catch (err) {
      console.error('Failed to create comment:', err)
    }
  }

  async function handleResolveComment(id) {
    try {
      const updated = await updateComment(id, { resolved: true })
      setComments(comments.map(c => c.id === id ? updated : c))
    } catch (err) {
      console.error('Failed to resolve comment:', err)
    }
  }

  async function handleDeleteComment(id) {
    try {
      await deleteComment(id)
      setComments(comments.filter(c => c.id !== id))
      setSelectedComment(null)
    } catch (err) {
      console.error('Failed to delete comment:', err)
    }
  }

  const viewportWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px'
  }

  if (loading) {
    return (
      <div className="preview-loading">
        <Loader2 className="spinner" size={32} />
        <p>Loading preview...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="preview-error">
        <h1>Preview Not Found</h1>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="preview-page">
      {/* Header */}
      <header className="preview-header">
        <div className="preview-header-left">
          <h1 className="preview-title">{project.name}</h1>
          <span className="badge badge-primary">Preview</span>
        </div>

        <div className="preview-controls">
          {/* Viewport switcher */}
          <div className="viewport-switcher">
            <button
              className={`viewport-btn ${viewMode === 'desktop' ? 'active' : ''}`}
              onClick={() => setViewMode('desktop')}
              title="Desktop view"
            >
              <Monitor size={18} />
            </button>
            <button
              className={`viewport-btn ${viewMode === 'tablet' ? 'active' : ''}`}
              onClick={() => setViewMode('tablet')}
              title="Tablet view"
            >
              <Tablet size={18} />
            </button>
            <button
              className={`viewport-btn ${viewMode === 'mobile' ? 'active' : ''}`}
              onClick={() => setViewMode('mobile')}
              title="Mobile view"
            >
              <Smartphone size={18} />
            </button>
          </div>

          {/* Comment mode toggle */}
          <button
            className={`btn ${commentMode ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setCommentMode(!commentMode)
              setSidebarOpen(true)
              setNewComment({ x: 0, y: 0, visible: false })
            }}
          >
            <MessageCircle size={16} />
            {commentMode ? 'Done' : 'Add Comment'}
          </button>

          {/* Assets button */}
          {project.assets_url && (
            <button
              className="btn btn-secondary"
              onClick={() => setShowAssets(true)}
            >
              <Download size={16} />
              Brand Assets
            </button>
          )}

          {/* Toggle sidebar */}
          <button
            className={`btn ${sidebarOpen ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <MessageCircle size={16} />
            {comments.filter(c => !c.resolved).length > 0 && (
              <span className="comment-badge">{comments.filter(c => !c.resolved).length}</span>
            )}
          </button>
        </div>
      </header>

      {/* Comment mode banner */}
      {commentMode && (
        <div className="comment-mode-banner">
          <MessageCircle size={16} />
          Click anywhere on the preview to add a comment
        </div>
      )}

      {/* Main preview area */}
      <div className="preview-main">
        {/* Preview container */}
        <div
          ref={previewContainerRef}
          className={`preview-container ${commentMode ? 'comment-mode' : ''}`}
          style={{ maxWidth: viewportWidths[viewMode] }}
          onClick={handlePreviewClick}
        >
          <iframe
            ref={iframeRef}
            src={project.preview_url}
            className="preview-iframe"
            title={`Preview of ${project.name}`}
          />

          {/* Comment pins */}
          {comments.filter(c => !c.resolved).map(comment => (
            <div
              key={comment.id}
              className={`comment-pin ${selectedComment?.id === comment.id ? 'active' : ''}`}
              style={{ left: `${comment.x_position}%`, top: `${comment.y_position}%` }}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedComment(selectedComment?.id === comment.id ? null : comment)
              }}
            >
              <MessageCircle size={14} />
            </div>
          ))}

          {/* New comment form */}
          {newComment.visible && (
            <div
              className="new-comment-popup animate-slide-up"
              style={{ left: `${newComment.x}%`, top: `${newComment.y}%` }}
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSubmitComment}>
                <input
                  type="text"
                  name="author"
                  placeholder="Your name (optional)"
                  className="input"
                />
                <textarea
                  name="message"
                  placeholder="Add your feedback..."
                  className="textarea"
                  required
                  autoFocus
                />
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary btn-sm">
                    <Send size={14} />
                    Post
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setNewComment({ x: 0, y: 0, visible: false })}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Comments sidebar */}
        <aside className={`comments-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <button className="btn btn-ghost btn-icon sidebar-close" onClick={() => setSidebarOpen(false)}>
              <X size={18} />
            </button>
            <h2>Comments</h2>
            <span className="comment-count">{comments.filter(c => !c.resolved).length}</span>
          </div>

          <div className="comments-list">
            {comments.length === 0 ? (
              <div className="no-comments">
                <MessageCircle size={24} className="text-gray-400" />
                <p>No comments yet</p>
                <p className="text-sm text-gray-400">Click "Add Comment" to leave feedback</p>
              </div>
            ) : (
              <>
                {/* Active comments */}
                {comments.filter(c => !c.resolved).map(comment => (
                  <div
                    key={comment.id}
                    className={`comment-card ${selectedComment?.id === comment.id ? 'selected' : ''}`}
                    onClick={() => setSelectedComment(comment)}
                  >
                    <div className="comment-header">
                      <span className="comment-author">{comment.author_name}</span>
                      <span className="comment-time">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="comment-message">{comment.message}</p>
                    <div className="comment-actions">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleResolveComment(comment.id)
                        }}
                      >
                        <Check size={14} />
                        Resolve
                      </button>
                      <button
                        className="btn btn-ghost btn-sm text-danger"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteComment(comment.id)
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Resolved comments */}
                {comments.filter(c => c.resolved).length > 0 && (
                  <details className="resolved-comments">
                    <summary>
                      <ChevronRight size={16} />
                      Resolved ({comments.filter(c => c.resolved).length})
                    </summary>
                    {comments.filter(c => c.resolved).map(comment => (
                      <div key={comment.id} className="comment-card resolved">
                        <div className="comment-header">
                          <span className="comment-author">{comment.author_name}</span>
                          <span className="badge badge-success">Resolved</span>
                        </div>
                        <p className="comment-message">{comment.message}</p>
                      </div>
                    ))}
                  </details>
                )}
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Assets Modal */}
      {showAssets && (
        <div className="modal-overlay" onClick={() => setShowAssets(false)}>
          <div className="modal animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Brand Assets</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAssets(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p className="text-gray-500 mb-4">
                Download the brand kit for {project.name}
              </p>
              <a
                href={project.assets_url}
                className="btn btn-primary w-full"
                download
              >
                <Download size={16} />
                Download Brand Kit
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
