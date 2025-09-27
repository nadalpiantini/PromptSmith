/**
 * Domain Mapper Utility
 * Maps detected domains to valid database domains
 */

import { PromptDomain } from '../types/prompt.js';

// Valid database domains (updated schema with all domains)
type ValidDatabaseDomain = 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general' | 'mobile' | 'web' | 'backend' | 'frontend' | 'ai' | 'gaming' | 'crypto' | 'education' | 'healthcare' | 'finance' | 'legal';

/**
 * Maps any domain to a valid database domain
 * @param domain The detected domain
 * @returns A valid database domain
 */
export function mapToValidDomain(domain: PromptDomain | string): ValidDatabaseDomain {
  const domainMap: Record<string, ValidDatabaseDomain> = {
    // Direct mappings - all supported domains
    'sql': 'sql',
    'branding': 'branding',
    'cine': 'cine',
    'saas': 'saas',
    'devops': 'devops',
    'general': 'general',
    'mobile': 'mobile',
    'web': 'web',
    'backend': 'backend',
    'frontend': 'frontend',
    'ai': 'ai',
    'gaming': 'gaming',
    'crypto': 'crypto',
    'education': 'education',
    'healthcare': 'healthcare',
    'finance': 'finance',
    'legal': 'legal',
  };
  
  return domainMap[domain.toLowerCase()] || 'general';
}

/**
 * Checks if a domain is valid for database storage
 * @param domain The domain to check
 * @returns True if the domain is valid for database storage
 */
export function isValidDatabaseDomain(domain: string): domain is ValidDatabaseDomain {
  const validDomains: ValidDatabaseDomain[] = [
    'sql', 'branding', 'cine', 'saas', 'devops', 'general',
    'mobile', 'web', 'backend', 'frontend', 'ai', 'gaming',
    'crypto', 'education', 'healthcare', 'finance', 'legal'
  ];
  return validDomains.includes(domain as ValidDatabaseDomain);
}

/**
 * Gets the best mapping for a detected domain
 * @param detectedDomain The domain detected by the system
 * @returns The best database domain mapping
 */
export function getBestDomainMapping(detectedDomain: string): {
  databaseDomain: ValidDatabaseDomain;
  confidence: number;
  reason: string;
} {
  const domain = detectedDomain.toLowerCase();
  
  // Direct matches have high confidence
  if (isValidDatabaseDomain(domain)) {
    return {
      databaseDomain: domain,
      confidence: 1.0,
      reason: 'Direct match with database domain'
    };
  }
  
  // Direct mappings for all supported domains (after database update)
  const directMappings: Record<string, { databaseDomain: ValidDatabaseDomain; confidence: number; reason: string }> = {
    'mobile': { databaseDomain: 'mobile', confidence: 1.0, reason: 'Direct match with mobile domain' },
    'web': { databaseDomain: 'web', confidence: 1.0, reason: 'Direct match with web domain' },
    'backend': { databaseDomain: 'backend', confidence: 1.0, reason: 'Direct match with backend domain' },
    'frontend': { databaseDomain: 'frontend', confidence: 1.0, reason: 'Direct match with frontend domain' },
    'ai': { databaseDomain: 'ai', confidence: 1.0, reason: 'Direct match with AI domain' },
    'gaming': { databaseDomain: 'gaming', confidence: 1.0, reason: 'Direct match with gaming domain' },
    'crypto': { databaseDomain: 'crypto', confidence: 1.0, reason: 'Direct match with crypto domain' },
    'education': { databaseDomain: 'education', confidence: 1.0, reason: 'Direct match with education domain' },
    'healthcare': { databaseDomain: 'healthcare', confidence: 1.0, reason: 'Direct match with healthcare domain' },
    'finance': { databaseDomain: 'finance', confidence: 1.0, reason: 'Direct match with finance domain' },
    'legal': { databaseDomain: 'legal', confidence: 1.0, reason: 'Direct match with legal domain' },
  };
  
  const mapping = directMappings[domain];
  if (mapping) {
    return mapping;
  }
  
  // Default fallback
  return {
    databaseDomain: 'general',
    confidence: 0.5,
    reason: 'Unknown domain, mapped to general'
  };
}
