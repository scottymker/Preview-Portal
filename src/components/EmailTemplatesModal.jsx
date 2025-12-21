import { useState, useEffect } from 'react'
import { X, Plus, Edit2, Trash2, Mail, FileText, ChevronRight, Eye } from 'lucide-react'
import {
  getAllEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate
} from '../lib/supabase'

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

export default function EmailTemplatesModal({ isOpen, onClose }) {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
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
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen])

  async function loadTemplates() {
    try {
      setLoading(true)
      const data = await getAllEmailTemplates()
      setTemplates(data || [])
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }

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

  function handleEditTemplate() {
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
      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4)
      }, 0)
    } else {
      // Fallback: append to end
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
        // Update existing
        const updated = await updateEmailTemplate(selectedTemplate.id, formData)
        setTemplates(templates.map(t => t.id === updated.id ? updated : t))
        setSelectedTemplate(updated)
      } else {
        // Create new
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
    // Replace variables with sample data
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

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal templates-modal animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2><Mail size={20} /> Email Templates</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

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
              {loading ? (
                <p className="text-muted text-center py-4">Loading...</p>
              ) : filteredTemplates.length === 0 ? (
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
                        <button className="btn btn-secondary btn-sm" onClick={handleEditTemplate}>
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
    </div>
  )
}
