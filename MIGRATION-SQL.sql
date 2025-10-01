-- PromptSmith Domain Migration
-- This adds all missing domain values to the promptsmith_domain enum
-- Generated on: 2025-09-27T13:50:34.383Z

-- Add mobile domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'mobile';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Add web domain  
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'web';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Add backend domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'backend';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Add frontend domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'frontend';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Add ai domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'ai';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Add gaming domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'gaming';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Add crypto domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'crypto';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Add education domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'education';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Add healthcare domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'healthcare';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Add finance domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'finance';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Add legal domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'legal';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Verify all domains are available
SELECT unnest(enum_range(NULL::promptsmith_domain)) as domain_value ORDER BY domain_value;
