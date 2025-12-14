import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Project functions
export async function getProjectByToken(token) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('token', token)
    .single()

  if (error) throw error
  return data
}

export async function getAllProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createProject(project) {
  const token = generateToken()
  const { data, error } = await supabase
    .from('projects')
    .insert([{ ...project, token }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProject(id, updates) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteProject(id) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Comment functions
export async function getCommentsByProject(projectId) {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

// Get all projects with comment counts
export async function getAllProjectsWithComments() {
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (projectsError) throw projectsError

  // Get comments for all projects
  const { data: comments, error: commentsError } = await supabase
    .from('comments')
    .select('*')
    .order('created_at', { ascending: false })

  if (commentsError) throw commentsError

  // Attach comments to projects
  return projects.map(project => ({
    ...project,
    comments: comments.filter(c => c.project_id === project.id),
    unresolvedCount: comments.filter(c => c.project_id === project.id && !c.resolved).length
  }))
}

export async function createComment(comment) {
  const { data, error } = await supabase
    .from('comments')
    .insert([comment])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateComment(id, updates) {
  const { data, error } = await supabase
    .from('comments')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteComment(id) {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Utility functions
function generateToken(length = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

// Admin auth (simple password check)
export async function verifyAdminPassword(password) {
  // In production, use proper auth. This is a simple check.
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD
  return password === adminPassword
}

// Track when a client views a preview
export async function recordProjectView(projectId) {
  const { error } = await supabase
    .from('projects')
    .update({ last_viewed_at: new Date().toISOString() })
    .eq('id', projectId)

  if (error) console.error('Failed to record view:', error)
}

// ============ BILLING FUNCTIONS ============

// Get all invoices
export async function getAllInvoices() {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Get invoice by ID
export async function getInvoiceById(id) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// Create invoice
export async function createInvoice(invoice) {
  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`
  const { data, error } = await supabase
    .from('invoices')
    .insert([{ ...invoice, invoice_number: invoiceNumber }])
    .select()
    .single()

  if (error) throw error
  return data
}

// Update invoice
export async function updateInvoice(id, updates) {
  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Delete invoice
export async function deleteInvoice(id) {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Mark invoice as paid
export async function markInvoicePaid(id) {
  const { data, error } = await supabase
    .from('invoices')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
