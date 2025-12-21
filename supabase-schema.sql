-- Supabase Database Schema for Preview Portal
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  token VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  preview_url TEXT NOT NULL,
  assets_url TEXT,
  client_name VARCHAR(255),
  client_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  x_position DECIMAL(5,2) NOT NULL,
  y_position DECIMAL(5,2) NOT NULL,
  message TEXT NOT NULL,
  author_name VARCHAR(255) DEFAULT 'Anonymous',
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_projects_token ON projects(token);
CREATE INDEX idx_comments_project_id ON comments(project_id);
CREATE INDEX idx_comments_resolved ON comments(resolved);

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policies for projects table
-- Anyone can read projects (needed for preview page)
CREATE POLICY "Allow public read access to projects" ON projects
  FOR SELECT USING (true);

-- Only authenticated users can insert/update/delete projects
-- For simplicity, we'll allow all operations (you can tighten this later)
CREATE POLICY "Allow all operations on projects" ON projects
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for comments table
-- Anyone can read comments (needed for preview page)
CREATE POLICY "Allow public read access to comments" ON comments
  FOR SELECT USING (true);

-- Anyone can insert comments (clients need to add feedback)
CREATE POLICY "Allow public insert on comments" ON comments
  FOR INSERT WITH CHECK (true);

-- Anyone can update/delete comments (for resolve/delete functionality)
CREATE POLICY "Allow all operations on comments" ON comments
  FOR ALL USING (true) WITH CHECK (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- EMAIL TEMPLATES & TRACKING TABLES
-- ============================================

-- Email templates table
CREATE TABLE email_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'preview', -- 'preview', 'invoice', 'custom'
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_email_templates_category ON email_templates(category);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on email_templates" ON email_templates
  FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sent emails table (for tracking)
CREATE TABLE sent_emails (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tracking_id VARCHAR(64) UNIQUE NOT NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  subject VARCHAR(500) NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  invoice_id UUID,
  email_type VARCHAR(50) NOT NULL, -- 'preview', 'invoice', 'custom'
  variables JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opened_at TIMESTAMP WITH TIME ZONE,
  open_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sent_emails_tracking_id ON sent_emails(tracking_id);
CREATE INDEX idx_sent_emails_project_id ON sent_emails(project_id);
CREATE INDEX idx_sent_emails_invoice_id ON sent_emails(invoice_id);
CREATE INDEX idx_sent_emails_sent_at ON sent_emails(sent_at);

ALTER TABLE sent_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on sent_emails" ON sent_emails
  FOR ALL USING (true) WITH CHECK (true);

-- Email clicks table
CREATE TABLE email_clicks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sent_email_id UUID REFERENCES sent_emails(id) ON DELETE CASCADE,
  link_url TEXT NOT NULL,
  link_label VARCHAR(255),
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address VARCHAR(45)
);

CREATE INDEX idx_email_clicks_sent_email_id ON email_clicks(sent_email_id);
CREATE INDEX idx_email_clicks_clicked_at ON email_clicks(clicked_at);

ALTER TABLE email_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on email_clicks" ON email_clicks
  FOR ALL USING (true) WITH CHECK (true);

-- Function to increment open count
CREATE OR REPLACE FUNCTION increment_open_count(row_tracking_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE sent_emails
  SET open_count = open_count + 1
  WHERE tracking_id = row_tracking_id;
END;
$$ LANGUAGE plpgsql;

-- Seed default email templates (based on existing hardcoded styles)
INSERT INTO email_templates (name, subject, body, category, is_default) VALUES
(
  'Dark Tech Style',
  'Your Website Preview is Ready - {{project_name}}',
  '<div style="background-color: #0a0a0a; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid #2d3748;">
      <div style="padding: 40px; text-align: center; border-bottom: 1px solid #2d3748;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Your Preview is Ready</h1>
      </div>
      <div style="padding: 40px;">
        <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6;">Hi {{client_name}},</p>
        <p style="color: #a0aec0; font-size: 16px; line-height: 1.6;">Your website preview for <strong style="color: #ffffff;">{{project_name}}</strong> is ready for review.</p>
        <div style="background: #2d3748; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
          <p style="color: #a0aec0; margin: 0 0 8px 0; font-size: 14px;">Your Access Code</p>
          <p style="color: #ffffff; font-size: 32px; font-weight: bold; margin: 0; letter-spacing: 4px;">{{access_code}}</p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="{{preview_link}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Your Preview</a>
        </div>
        <p style="color: #a0aec0; font-size: 14px; line-height: 1.6;">{{custom_message}}</p>
      </div>
    </div>
  </div>',
  'preview',
  true
),
(
  'Light Professional Style',
  'Website Preview Ready for Review - {{project_name}}',
  '<div style="background-color: #f8fafc; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
      <div style="padding: 32px; text-align: center; background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Preview Ready</h1>
      </div>
      <div style="padding: 40px;">
        <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">Hello {{client_name}},</p>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">Your website preview for <strong>{{project_name}}</strong> is now available for your review.</p>
        <div style="background: #f1f5f9; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center; border: 2px dashed #cbd5e1;">
          <p style="color: #64748b; margin: 0 0 8px 0; font-size: 14px;">Access Code</p>
          <p style="color: #0f172a; font-size: 28px; font-weight: bold; margin: 0; letter-spacing: 3px;">{{access_code}}</p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="{{preview_link}}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 14px 36px; border-radius: 6px; text-decoration: none; font-weight: 600;">View Preview</a>
        </div>
        <p style="color: #64748b; font-size: 14px; line-height: 1.6;">{{custom_message}}</p>
      </div>
    </div>
  </div>',
  'preview',
  false
),
(
  'Minimal Elegant Style',
  '{{project_name}} - Preview Available',
  '<div style="background-color: #ffffff; padding: 60px 20px; font-family: ''Georgia'', serif;">
    <div style="max-width: 520px; margin: 0 auto;">
      <div style="text-align: center; padding-bottom: 40px; border-bottom: 1px solid #e5e5e5;">
        <h1 style="color: #171717; margin: 0; font-size: 20px; font-weight: normal; letter-spacing: 2px;">PREVIEW READY</h1>
      </div>
      <div style="padding: 40px 0;">
        <p style="color: #171717; font-size: 16px; line-height: 1.8;">Dear {{client_name}},</p>
        <p style="color: #525252; font-size: 16px; line-height: 1.8;">Your preview for {{project_name}} awaits your review.</p>
        <div style="text-align: center; margin: 40px 0; padding: 32px; border: 1px solid #e5e5e5;">
          <p style="color: #737373; margin: 0 0 12px 0; font-size: 12px; letter-spacing: 2px;">ACCESS CODE</p>
          <p style="color: #171717; font-size: 24px; margin: 0; letter-spacing: 6px;">{{access_code}}</p>
        </div>
        <div style="text-align: center; margin: 40px 0;">
          <a href="{{preview_link}}" style="display: inline-block; background: #171717; color: #ffffff; padding: 14px 48px; text-decoration: none; font-size: 14px; letter-spacing: 1px;">VIEW PREVIEW</a>
        </div>
        <p style="color: #737373; font-size: 14px; line-height: 1.8;">{{custom_message}}</p>
      </div>
    </div>
  </div>',
  'preview',
  false
),
(
  'Invoice Email Template',
  'Invoice #{{invoice_number}} - {{invoice_amount}} Due',
  '<div style="background-color: #f8fafc; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
      <div style="padding: 32px; text-align: center; background: #059669;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Invoice</h1>
      </div>
      <div style="padding: 40px;">
        <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">Hello {{client_name}},</p>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">Please find your invoice for <strong>{{project_name}}</strong>.</p>
        <div style="background: #f1f5f9; border-radius: 8px; padding: 24px; margin: 24px 0;">
          <p style="color: #64748b; margin: 0 0 8px 0; font-size: 14px;">Amount Due</p>
          <p style="color: #059669; font-size: 32px; font-weight: bold; margin: 0;">{{invoice_amount}}</p>
          <p style="color: #64748b; margin: 16px 0 0 0; font-size: 14px;">Due by: {{due_date}}</p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="{{preview_link}}" style="display: inline-block; background: #059669; color: #ffffff; padding: 14px 36px; border-radius: 6px; text-decoration: none; font-weight: 600;">Pay Now</a>
        </div>
        <p style="color: #64748b; font-size: 14px; line-height: 1.6;">{{custom_message}}</p>
      </div>
    </div>
  </div>',
  'invoice',
  true
);