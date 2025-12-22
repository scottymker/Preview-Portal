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
  console.log('Fetching invoices from Supabase...')
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })

  console.log('Invoices response:', { data, error })
  if (error) {
    console.error('Supabase error:', error)
    throw error
  }
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

// ============ EMAIL TEMPLATE FUNCTIONS ============

// Get all email templates
export async function getAllEmailTemplates() {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Get templates by category
export async function getEmailTemplatesByCategory(category) {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('category', category)
    .order('is_default', { ascending: false })

  if (error) throw error
  return data
}

// Get template by ID
export async function getEmailTemplateById(id) {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// Create email template
export async function createEmailTemplate(template) {
  const { data, error } = await supabase
    .from('email_templates')
    .insert([template])
    .select()
    .single()

  if (error) throw error
  return data
}

// Update email template
export async function updateEmailTemplate(id, updates) {
  const { data, error } = await supabase
    .from('email_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Delete email template
export async function deleteEmailTemplate(id) {
  const { error } = await supabase
    .from('email_templates')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============ EMAIL TRACKING FUNCTIONS ============

// Get sent emails by project
export async function getSentEmailsByProject(projectId) {
  const { data, error } = await supabase
    .from('sent_emails')
    .select(`
      *,
      email_clicks (*)
    `)
    .eq('project_id', projectId)
    .order('sent_at', { ascending: false })

  if (error) throw error
  return data
}

// Get sent emails by invoice
export async function getSentEmailsByInvoice(invoiceId) {
  const { data, error } = await supabase
    .from('sent_emails')
    .select(`
      *,
      email_clicks (*)
    `)
    .eq('invoice_id', invoiceId)
    .order('sent_at', { ascending: false })

  if (error) throw error
  return data
}

// Get all sent emails with tracking data
export async function getAllSentEmails() {
  const { data, error } = await supabase
    .from('sent_emails')
    .select(`
      *,
      email_clicks (*)
    `)
    .order('sent_at', { ascending: false })

  if (error) throw error
  return data
}

// Get email tracking stats summary
export async function getEmailTrackingStats() {
  const { data, error } = await supabase
    .from('sent_emails')
    .select('id, opened_at, open_count, email_clicks(id)')

  if (error) throw error

  const totalSent = data.length
  const totalOpened = data.filter(e => e.opened_at).length
  const totalClicks = data.reduce((sum, e) => sum + (e.email_clicks?.length || 0), 0)

  return {
    totalSent,
    totalOpened,
    totalClicks,
    openRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : 0,
    clickRate: totalOpened > 0 ? ((totalClicks / totalOpened) * 100).toFixed(1) : 0
  }
}

// Get tracking stats for a specific project
export async function getProjectEmailStats(projectId) {
  const { data, error } = await supabase
    .from('sent_emails')
    .select('id, opened_at, open_count, email_clicks(id)')
    .eq('project_id', projectId)

  if (error) throw error

  const totalSent = data.length
  const totalOpened = data.filter(e => e.opened_at).length
  const totalClicks = data.reduce((sum, e) => sum + (e.email_clicks?.length || 0), 0)

  return {
    totalSent,
    totalOpened,
    totalClicks,
    openRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : 0
  }
}

// ============ AUTOMATION FUNCTIONS ============

// Get all automation leads
export async function getAutomationLeads(filters = {}) {
  let query = supabase
    .from('automation_leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters.workflow_status) {
    query = query.eq('workflow_status', filters.workflow_status)
  }
  if (filters.analysis_status) {
    query = query.eq('analysis_status', filters.analysis_status)
  }
  if (filters.needs_refresh !== undefined) {
    query = query.eq('needs_refresh', filters.needs_refresh)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

// Get single lead by ID
export async function getAutomationLeadById(id) {
  const { data, error } = await supabase
    .from('automation_leads')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// Create automation lead
export async function createAutomationLead(lead) {
  const { data, error } = await supabase
    .from('automation_leads')
    .insert([{
      ...lead,
      discovered_at: new Date().toISOString()
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

// Update automation lead
export async function updateAutomationLead(id, updates) {
  const { data, error } = await supabase
    .from('automation_leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Delete automation lead
export async function deleteAutomationLead(id) {
  const { error } = await supabase
    .from('automation_leads')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Get all automation jobs
export async function getAutomationJobs(filters = {}) {
  let query = supabase
    .from('automation_jobs')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.job_type) {
    query = query.eq('job_type', filters.job_type)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

// Create automation job
export async function createAutomationJob(job) {
  const { data, error } = await supabase
    .from('automation_jobs')
    .insert([job])
    .select()
    .single()

  if (error) throw error
  return data
}

// Update automation job
export async function updateAutomationJob(id, updates) {
  const { data, error } = await supabase
    .from('automation_jobs')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Get all automation schedules
export async function getAutomationSchedules() {
  const { data, error } = await supabase
    .from('automation_schedules')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Create automation schedule
export async function createAutomationSchedule(schedule) {
  const { data, error } = await supabase
    .from('automation_schedules')
    .insert([schedule])
    .select()
    .single()

  if (error) throw error
  return data
}

// Update automation schedule
export async function updateAutomationSchedule(id, updates) {
  const { data, error } = await supabase
    .from('automation_schedules')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Delete automation schedule
export async function deleteAutomationSchedule(id) {
  const { error } = await supabase
    .from('automation_schedules')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Get website templates
export async function getWebsiteTemplates() {
  const { data, error } = await supabase
    .from('website_templates')
    .select('*')
    .order('is_default', { ascending: false })

  if (error) throw error
  return data
}

// ============ AUTOMATION EDGE FUNCTION CALLS ============

// Run discovery via Edge Function
export async function runDiscovery(params) {
  const { data, error } = await supabase.functions.invoke('discover-businesses', {
    body: params
  })

  if (error) throw error

  // Check if the response contains an error message from the Edge Function
  if (data?.error) {
    throw new Error(data.error)
  }

  return data
}

// Run analysis on a lead via Edge Function
export async function runAnalysis(leadId) {
  const { data, error } = await supabase.functions.invoke('analyze-website', {
    body: { leadId }
  })

  if (error) throw error
  return data
}

// Run website generation via Edge Function
export async function runGeneration(leadId) {
  const { data, error } = await supabase.functions.invoke('generate-website', {
    body: { leadId }
  })

  if (error) throw error
  return data
}

// Run full automation pipeline
export async function runAutomationPipeline(params) {
  const { data, error } = await supabase.functions.invoke('run-automation-pipeline', {
    body: params
  })

  if (error) throw error
  return data
}
