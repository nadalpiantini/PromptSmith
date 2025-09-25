import { QualityScore, PromptDomain } from '../types/prompt.js';
import { Json, Database } from '../types/database.js';
import { RuleCategory } from '../types/domain.js';

/**
 * Type conversion utilities for Supabase Json compatibility
 */

/**
 * Convert QualityScore to Json type for database storage
 */
export function qualityScoreToJson(score: QualityScore): Json {
  return {
    clarity: score.clarity,
    specificity: score.specificity,
    structure: score.structure,
    completeness: score.completeness,
    overall: score.overall,
  };
}

/**
 * Convert Json to QualityScore type from database
 */
export function jsonToQualityScore(json: Json): QualityScore {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    throw new Error('Invalid Json format for QualityScore conversion');
  }

  const obj = json as { [key: string]: Json | undefined };

  if (
    typeof obj.clarity !== 'number' ||
    typeof obj.specificity !== 'number' ||
    typeof obj.structure !== 'number' ||
    typeof obj.completeness !== 'number' ||
    typeof obj.overall !== 'number'
  ) {
    throw new Error('Invalid QualityScore structure in Json data');
  }

  return {
    clarity: obj.clarity,
    specificity: obj.specificity,
    structure: obj.structure,
    completeness: obj.completeness,
    overall: obj.overall,
  };
}

/**
 * Convert undefined values to null for database storage
 */
export function undefinedToNull<T>(value: T | undefined): T | null {
  return value === undefined ? null : value;
}

/**
 * Convert null values to undefined for application logic
 */
export function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

/**
 * Safely convert string | null to Date, handling null values
 */
export function safeStringToDate(value: string | null): Date {
  if (value === null) {
    throw new Error('Cannot convert null to Date');
  }
  return new Date(value);
}

/**
 * Convert Date to string | null for database storage
 */
export function dateToStringOrNull(value: Date | undefined | null): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  return value.toISOString();
}

/**
 * Convert database domain type to PromptDomain enum
 */
export function dbDomainToPromptDomain(
  domain: Database['public']['Enums']['promptsmith_domain']
): PromptDomain {
  return domain as PromptDomain;
}

/**
 * Convert PromptDomain enum to database domain type
 */
export function promptDomainToDbDomain(
  domain: PromptDomain
): Database['public']['Enums']['promptsmith_domain'] {
  return domain as Database['public']['Enums']['promptsmith_domain'];
}

/**
 * Convert RuleExample array to Json for database storage
 */
export function ruleExamplesToJson(examples: any[]): Json {
  return examples.map(example => ({
    before: example.before,
    after: example.after,
    explanation: example.explanation,
  }));
}

/**
 * Convert database rule category to RuleCategory enum
 */
export function dbCategoryToRuleCategory(
  category: Database['public']['Enums']['promptsmith_rule_category']
): RuleCategory {
  return category as unknown as RuleCategory;
}

/**
 * Convert RuleCategory enum to database rule category
 */
export function ruleCategoryToDbCategory(
  category: RuleCategory
): Database['public']['Enums']['promptsmith_rule_category'] {
  return category as unknown as Database['public']['Enums']['promptsmith_rule_category'];
}

/**
 * Convert Json to RuleExample array from database
 */
export function jsonToRuleExamples(json: Json): any[] {
  if (!Array.isArray(json)) {
    return [];
  }
  return json.map(item => {
    if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
      return {
        before: item.before || '',
        after: item.after || '',
        explanation: item.explanation || '',
      };
    }
    return { before: '', after: '', explanation: '' };
  });
}