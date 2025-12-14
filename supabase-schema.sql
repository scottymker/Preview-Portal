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
