import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllInvoices, createInvoice, updateInvoice, deleteInvoice, markInvoicePaid, verifyAdminPassword, getAllProjects } from '../lib/supabase'
import { Plus, X, Check, Trash2, Edit2, Loader2, DollarSign, Clock, CheckCircle, AlertCircle, Send, FileText, ArrowLeft } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import './BillingPage.css'

export default function BillingPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [filter, setFilter] = useState('all') // all, pending, paid, overdue
  const [projects, setProjects] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const isAuth = sessionStorage.getItem('admin_authenticated')
    if (isAuth === 'true') {
      setAuthenticated(true)
      loadInvoices()
      loadProjects()
    } else {
      setLoading(false)
    }
  }, [])

  async function loadProjects() {
    try {
      const data = await getAllProjects()
      setProjects(data || [])
    } catch (err) {
      console.error('Failed to load projects:', err)
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    const isValid = await verifyAdminPassword(password)
    if (isValid) {
      sessionStorage.setItem('admin_authenticated', 'true')
      setAuthenticated(true)
      loadInvoices()
    } else {
      setAuthError('Invalid password')
    }
  }

  async function loadInvoices() {
    try {
      setLoading(true)
      const data = await getAllInvoices()
      setInvoices(data || [])
    } catch (err) {
      console.error('Failed to load invoices:', err)
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateInvoice(e) {
    e.preventDefault()
    const formData = new FormData(e.target)

    // Parse line items from the form
    const lineItems = []
    const descriptions = formData.getAll('item_description')
    const quantities = formData.getAll('item_quantity')
    const rates = formData.getAll('item_rate')

    for (let i = 0; i < descriptions.length; i++) {
      if (descriptions[i]) {
        lineItems.push({
          description: descriptions[i],
          quantity: parseFloat(quantities[i]) || 1,
          rate: parseFloat(rates[i]) || 0
        })
      }
    }

    const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0)

    try {
      const invoice = await createInvoice({
        client_name: formData.get('client_name'),
        client_email: formData.get('client_email'),
        project_name: formData.get('project_name'),
        line_items: lineItems,
        subtotal: subtotal,
        total: subtotal,
        due_date: formData.get('due_date'),
        notes: formData.get('notes') || null,
        status: 'pending'
      })

      setInvoices([invoice, ...invoices])
      setShowCreateModal(false)
    } catch (err) {
      console.error('Failed to create invoice:', err)
    }
  }

  async function handleUpdateInvoice(e) {
    e.preventDefault()
    const formData = new FormData(e.target)

    const lineItems = []
    const descriptions = formData.getAll('item_description')
    const quantities = formData.getAll('item_quantity')
    const rates = formData.getAll('item_rate')

    for (let i = 0; i < descriptions.length; i++) {
      if (descriptions[i]) {
        lineItems.push({
          description: descriptions[i],
          quantity: parseFloat(quantities[i]) || 1,
          rate: parseFloat(rates[i]) || 0
        })
      }
    }

    const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0)

    try {
      const updated = await updateInvoice(editingInvoice.id, {
        client_name: formData.get('client_name'),
        client_email: formData.get('client_email'),
        project_name: formData.get('project_name'),
        line_items: lineItems,
        subtotal: subtotal,
        total: subtotal,
        due_date: formData.get('due_date'),
        notes: formData.get('notes') || null
      })

      setInvoices(invoices.map(inv => inv.id === updated.id ? updated : inv))
      setEditingInvoice(null)
    } catch (err) {
      console.error('Failed to update invoice:', err)
    }
  }

  async function handleDeleteInvoice(id) {
    if (!confirm('Are you sure you want to delete this invoice?')) return

    try {
      await deleteInvoice(id)
      setInvoices(invoices.filter(inv => inv.id !== id))
    } catch (err) {
      console.error('Failed to delete invoice:', err)
    }
  }

  async function handleMarkPaid(id) {
    try {
      const updated = await markInvoicePaid(id)
      setInvoices(invoices.map(inv => inv.id === updated.id ? updated : inv))
    } catch (err) {
      console.error('Failed to mark invoice as paid:', err)
    }
  }

  function getStatusColor(invoice) {
    if (invoice.status === 'paid') return 'success'
    if (new Date(invoice.due_date) < new Date() && invoice.status !== 'paid') return 'danger'
    return 'warning'
  }

  function getStatusLabel(invoice) {
    if (invoice.status === 'paid') return 'Paid'
    if (new Date(invoice.due_date) < new Date()) return 'Overdue'
    return 'Pending'
  }

  const filteredInvoices = invoices.filter(inv => {
    if (filter === 'all') return true
    if (filter === 'paid') return inv.status === 'paid'
    if (filter === 'pending') return inv.status === 'pending' && new Date(inv.due_date) >= new Date()
    if (filter === 'overdue') return inv.status !== 'paid' && new Date(inv.due_date) < new Date()
    return true
  })

  const stats = {
    total: invoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
    paid: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0),
    pending: invoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0),
    overdue: invoices.filter(inv => inv.status !== 'paid' && new Date(inv.due_date) < new Date()).reduce((sum, inv) => sum + (inv.total || 0), 0)
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
    <div className="billing-page">
      {/* Header */}
      <header className="billing-header">
        <div className="container">
          <div className="header-left">
            <button className="btn btn-ghost" onClick={() => navigate('/admin')}>
              <ArrowLeft size={16} />
              Back to Projects
            </button>
            <h1>Billing</h1>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            New Invoice
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="billing-stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon total">
                <DollarSign size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Total Billed</span>
                <span className="stat-value">${stats.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon success">
                <CheckCircle size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Paid</span>
                <span className="stat-value">${stats.paid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon warning">
                <Clock size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Pending</span>
                <span className="stat-value">${stats.pending.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon danger">
                <AlertCircle size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Overdue</span>
                <span className="stat-value">${stats.overdue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="billing-filters">
        <div className="container">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({invoices.length})
            </button>
            <button
              className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending
            </button>
            <button
              className={`filter-tab ${filter === 'paid' ? 'active' : ''}`}
              onClick={() => setFilter('paid')}
            >
              Paid
            </button>
            <button
              className={`filter-tab ${filter === 'overdue' ? 'active' : ''}`}
              onClick={() => setFilter('overdue')}
            >
              Overdue
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="billing-main">
        <div className="container">
          {loading ? (
            <div className="loading-state">
              <Loader2 className="spinner" size={32} />
              <p>Loading invoices...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="empty-state card">
              <div className="card-body">
                <FileText size={48} className="text-gray-300" />
                <h2>No invoices yet</h2>
                <p className="text-gray-500">Create your first invoice to get started</p>
                <button className="btn btn-primary mt-4" onClick={() => setShowCreateModal(true)}>
                  <Plus size={16} />
                  Create Invoice
                </button>
              </div>
            </div>
          ) : (
            <div className="invoices-list">
              {filteredInvoices.map(invoice => (
                <div key={invoice.id} className="invoice-card card">
                  <div className="card-body">
                    <div className="invoice-header">
                      <div className="invoice-info">
                        <span className="invoice-number">{invoice.invoice_number}</span>
                        <h3 className="invoice-client">{invoice.client_name}</h3>
                        <span className="invoice-project">{invoice.project_name}</span>
                      </div>
                      <div className="invoice-amount">
                        <span className="amount">${(invoice.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        <span className={`badge badge-${getStatusColor(invoice)}`}>
                          {getStatusLabel(invoice)}
                        </span>
                      </div>
                    </div>

                    <div className="invoice-meta">
                      <span className="meta-item">
                        <Clock size={14} />
                        Due: {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                      </span>
                      <span className="meta-item">
                        Created {formatDistanceToNow(new Date(invoice.created_at), { addSuffix: true })}
                      </span>
                      {invoice.paid_at && (
                        <span className="meta-item paid">
                          <CheckCircle size={14} />
                          Paid {formatDistanceToNow(new Date(invoice.paid_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>

                    {invoice.line_items && invoice.line_items.length > 0 && (
                      <div className="invoice-items">
                        {invoice.line_items.slice(0, 3).map((item, idx) => (
                          <span key={idx} className="line-item-preview">
                            {item.description}
                          </span>
                        ))}
                        {invoice.line_items.length > 3 && (
                          <span className="line-item-more">+{invoice.line_items.length - 3} more</span>
                        )}
                      </div>
                    )}

                    <div className="invoice-actions">
                      {invoice.status !== 'paid' && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleMarkPaid(invoice.id)}
                        >
                          <Check size={14} />
                          Mark Paid
                        </button>
                      )}
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setEditingInvoice(invoice)}
                      >
                        <Edit2 size={14} />
                        Edit
                      </button>
                      <button
                        className="btn btn-ghost btn-sm text-danger"
                        onClick={() => handleDeleteInvoice(invoice.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Invoice Modal */}
      {(showCreateModal || editingInvoice) && (
        <InvoiceModal
          invoice={editingInvoice}
          projects={projects}
          onClose={() => {
            setShowCreateModal(false)
            setEditingInvoice(null)
          }}
          onSubmit={editingInvoice ? handleUpdateInvoice : handleCreateInvoice}
        />
      )}
    </div>
  )
}

// Invoice Modal Component
function InvoiceModal({ invoice, projects, onClose, onSubmit }) {
  const [lineItems, setLineItems] = useState(
    invoice?.line_items || [{ description: '', quantity: 1, rate: 0 }]
  )
  const [clientName, setClientName] = useState(invoice?.client_name || '')
  const [clientEmail, setClientEmail] = useState(invoice?.client_email || '')
  const [projectName, setProjectName] = useState(invoice?.project_name || '')
  const [selectedProjectId, setSelectedProjectId] = useState('')

  function handleProjectSelect(projectId) {
    setSelectedProjectId(projectId)
    if (projectId) {
      const project = projects.find(p => p.id === projectId)
      if (project) {
        setClientName(project.client_name || '')
        setClientEmail(project.client_email || '')
        setProjectName(project.name || '')
      }
    }
  }

  function addLineItem() {
    setLineItems([...lineItems, { description: '', quantity: 1, rate: 0 }])
  }

  function removeLineItem(index) {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  function updateLineItem(index, field, value) {
    const updated = [...lineItems]
    updated[index][field] = value
    setLineItems(updated)
  }

  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{invoice ? 'Edit Invoice' : 'Create New Invoice'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-body">
            {/* Link to Project */}
            {!invoice && projects.length > 0 && (
              <div className="form-group">
                <label className="label">Link to Project (Optional)</label>
                <select
                  className="input"
                  value={selectedProjectId}
                  onChange={(e) => handleProjectSelect(e.target.value)}
                >
                  <option value="">-- Select a project to auto-fill --</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} {project.client_name ? `(${project.client_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="label">Client Name *</label>
                <input
                  type="text"
                  name="client_name"
                  className="input"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Client Email</label>
                <input
                  type="email"
                  name="client_email"
                  className="input"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Project Name *</label>
                <input
                  type="text"
                  name="project_name"
                  className="input"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Due Date *</label>
                <input
                  type="date"
                  name="due_date"
                  className="input"
                  defaultValue={invoice?.due_date?.split('T')[0]}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Line Items</label>
              <div className="line-items-editor">
                {lineItems.map((item, index) => (
                  <div key={index} className="line-item-row">
                    <input
                      type="text"
                      name="item_description"
                      className="input"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    />
                    <input
                      type="number"
                      name="item_quantity"
                      className="input quantity"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.5"
                    />
                    <input
                      type="number"
                      name="item_rate"
                      className="input rate"
                      placeholder="Rate"
                      value={item.rate}
                      onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                    <span className="line-total">
                      ${(item.quantity * item.rate).toFixed(2)}
                    </span>
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => removeLineItem(index)}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-ghost btn-sm" onClick={addLineItem}>
                  <Plus size={14} />
                  Add Line Item
                </button>
              </div>
            </div>

            <div className="invoice-total">
              <span>Total:</span>
              <span className="total-amount">${subtotal.toFixed(2)}</span>
            </div>

            <div className="form-group">
              <label className="label">Notes</label>
              <textarea
                name="notes"
                className="textarea"
                placeholder="Additional notes or payment instructions..."
                defaultValue={invoice?.notes}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {invoice ? 'Save Changes' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
