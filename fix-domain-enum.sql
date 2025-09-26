-- Fix domain enum to include missing domains
-- This script adds the missing domains that are being detected by the system

-- First, let's see what domains are currently being used
-- Based on the code analysis, we need to add: mobile, web, backend, frontend, ai, gaming, crypto, education, healthcare, finance, legal

-- Update the domain enum to include all detected domains
ALTER TYPE promptsmith_domain ADD VALUE IF NOT EXISTS 'mobile';
ALTER TYPE promptsmith_domain ADD VALUE IF NOT EXISTS 'web';
ALTER TYPE promptsmith_domain ADD VALUE IF NOT EXISTS 'backend';
ALTER TYPE promptsmith_domain ADD VALUE IF NOT EXISTS 'frontend';
ALTER TYPE promptsmith_domain ADD VALUE IF NOT EXISTS 'ai';
ALTER TYPE promptsmith_domain ADD VALUE IF NOT EXISTS 'gaming';
ALTER TYPE promptsmith_domain ADD VALUE IF NOT EXISTS 'crypto';
ALTER TYPE promptsmith_domain ADD VALUE IF NOT EXISTS 'education';
ALTER TYPE promptsmith_domain ADD VALUE IF NOT EXISTS 'healthcare';
ALTER TYPE promptsmith_domain ADD VALUE IF NOT EXISTS 'finance';
ALTER TYPE promptsmith_domain ADD VALUE IF NOT EXISTS 'legal';

-- Update any existing records that might have invalid domains
-- This will set them to 'general' as a fallback
UPDATE promptsmith_prompts 
SET domain = 'general' 
WHERE domain::text NOT IN (
  'sql', 'branding', 'cine', 'saas', 'devops', 'general',
  'mobile', 'web', 'backend', 'frontend', 'ai', 'gaming', 
  'crypto', 'education', 'healthcare', 'finance', 'legal'
);

-- Verify the enum now includes all domains
SELECT unnest(enum_range(NULL::promptsmith_domain)) as domain;
