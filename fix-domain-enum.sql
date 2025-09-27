-- Fix domain enum to support all domains from PromptDomain
-- This migration extends the existing domain enum to include all domains defined in types/prompt.ts

-- First, let's add the missing values to the existing enum using ALTER TYPE
-- This approach is safer than recreating the enum

-- Note: We need to add one value at a time with ALTER TYPE ADD VALUE
-- This works even with existing data in the enum

-- Add mobile domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'mobile';
    EXCEPTION
        WHEN duplicate_object THEN
            -- Value already exists, skip
            NULL;
    END;
END $$;

-- Add web domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'web';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
END $$;

-- Add backend domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'backend';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
END $$;

-- Add frontend domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'frontend';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
END $$;

-- Add ai domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'ai';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
END $$;

-- Add gaming domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'gaming';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
END $$;

-- Add crypto domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'crypto';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
END $$;

-- Add education domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'education';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
END $$;

-- Add healthcare domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'healthcare';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
END $$;

-- Add finance domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'finance';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
END $$;

-- Add legal domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'legal';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
END $$;

-- Verify the migration worked by listing all enum values
SELECT unnest(enum_range(NULL::promptsmith_domain)) as available_domains ORDER BY available_domains;