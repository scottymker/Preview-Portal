-- Migration: Add Automation Tables
-- Run this in your Supabase SQL Editor

-- ============================================
-- WEBSITE AUTOMATION TABLES
-- ============================================

-- Automation leads table - stores discovered businesses
CREATE TABLE IF NOT EXISTS automation_leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Business info
  business_name VARCHAR(255),
  business_url TEXT NOT NULL,
  business_phone VARCHAR(50),
  business_email VARCHAR(255),
  business_address TEXT,
  business_description TEXT,
  business_category VARCHAR(100),
  business_services JSONB DEFAULT '[]',

  -- Discovery source
  source VARCHAR(50) NOT NULL DEFAULT 'manual', -- 'google_search', 'yelp', 'google_maps', 'manual'
  source_query TEXT,
  source_location VARCHAR(255),
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Analysis results
  analysis_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'analyzing', 'completed', 'failed'
  analysis_error TEXT,
  design_score INTEGER, -- 0-100
  mobile_score INTEGER, -- 0-100
  speed_score INTEGER, -- 0-100
  ssl_status BOOLEAN,
  needs_refresh BOOLEAN,
  refresh_confidence INTEGER, -- 0-100
  refresh_reasons JSONB DEFAULT '[]',

  -- Extracted content
  extracted_images JSONB DEFAULT '[]',
  extracted_text TEXT,
  extracted_colors JSONB DEFAULT '[]',
  extracted_contact JSONB DEFAULT '{}',
  screenshot_url TEXT,

  -- Generation
  generation_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'generating', 'completed', 'failed'
  generation_error TEXT,
  generated_site_name VARCHAR(255),
  generated_preview_url TEXT,
  template_id UUID,

  -- Project link
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

  -- Workflow
  workflow_status VARCHAR(50) DEFAULT 'discovered', -- 'discovered', 'analyzed', 'generated', 'ready_to_send', 'sent', 'converted'
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_leads_source ON automation_leads(source);
CREATE INDEX IF NOT EXISTS idx_automation_leads_analysis_status ON automation_leads(analysis_status);
CREATE INDEX IF NOT EXISTS idx_automation_leads_generation_status ON automation_leads(generation_status);
CREATE INDEX IF NOT EXISTS idx_automation_leads_workflow_status ON automation_leads(workflow_status);
CREATE INDEX IF NOT EXISTS idx_automation_leads_needs_refresh ON automation_leads(needs_refresh);
CREATE INDEX IF NOT EXISTS idx_automation_leads_created_at ON automation_leads(created_at);

ALTER TABLE automation_leads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on automation_leads') THEN
    CREATE POLICY "Allow all operations on automation_leads" ON automation_leads
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_automation_leads_updated_at ON automation_leads;
CREATE TRIGGER update_automation_leads_updated_at
  BEFORE UPDATE ON automation_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Automation jobs table - tracks batch processing jobs
CREATE TABLE IF NOT EXISTS automation_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  job_type VARCHAR(50) NOT NULL, -- 'discovery', 'analysis', 'generation', 'full_pipeline'
  config JSONB DEFAULT '{}', -- Search params, limits, etc.

  status VARCHAR(50) DEFAULT 'queued', -- 'queued', 'running', 'completed', 'failed', 'cancelled'

  -- Progress tracking
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  successful_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,

  -- Results
  results JSONB DEFAULT '[]', -- Lead IDs processed
  errors JSONB DEFAULT '[]',

  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_jobs_status ON automation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_job_type ON automation_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_created_at ON automation_jobs(created_at);

ALTER TABLE automation_jobs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on automation_jobs') THEN
    CREATE POLICY "Allow all operations on automation_jobs" ON automation_jobs
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Automation schedules table - recurring automation
CREATE TABLE IF NOT EXISTS automation_schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  name VARCHAR(255) NOT NULL,
  description TEXT,

  job_type VARCHAR(50) NOT NULL, -- 'discovery', 'full_pipeline'
  job_config JSONB DEFAULT '{}',

  schedule_type VARCHAR(50) DEFAULT 'daily', -- 'daily', 'weekly', 'manual'
  schedule_time TIME DEFAULT '09:00:00',
  schedule_days JSONB DEFAULT '[]', -- [1,2,3,4,5] for weekdays

  enabled BOOLEAN DEFAULT true,

  last_run_at TIMESTAMP WITH TIME ZONE,
  last_job_id UUID REFERENCES automation_jobs(id) ON DELETE SET NULL,
  next_run_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_schedules_enabled ON automation_schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_automation_schedules_next_run_at ON automation_schedules(next_run_at);

ALTER TABLE automation_schedules ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on automation_schedules') THEN
    CREATE POLICY "Allow all operations on automation_schedules" ON automation_schedules
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_automation_schedules_updated_at ON automation_schedules;
CREATE TRIGGER update_automation_schedules_updated_at
  BEFORE UPDATE ON automation_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Website templates table - for generated sites
CREATE TABLE IF NOT EXISTS website_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  name VARCHAR(255) NOT NULL,
  description TEXT,
  preview_image TEXT,

  business_categories JSONB DEFAULT '[]', -- ['restaurant', 'plumber', 'lawyer']

  html_template TEXT,
  css_template TEXT,
  structure JSONB DEFAULT '{}', -- Available sections, layout options

  default_colors JSONB DEFAULT '{}', -- {primary, secondary, accent}
  default_fonts JSONB DEFAULT '{}', -- {heading, body}

  is_default BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_website_templates_is_default ON website_templates(is_default);

ALTER TABLE website_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations on website_templates') THEN
    CREATE POLICY "Allow all operations on website_templates" ON website_templates
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_website_templates_updated_at ON website_templates;
CREATE TRIGGER update_website_templates_updated_at
  BEFORE UPDATE ON website_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key for template_id in automation_leads (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_automation_leads_template'
  ) THEN
    ALTER TABLE automation_leads
      ADD CONSTRAINT fk_automation_leads_template
      FOREIGN KEY (template_id) REFERENCES website_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Automation tables created successfully!';
END $$;
