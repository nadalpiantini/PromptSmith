// Template system exports
export { TemplateEngine } from './engine.js';
export type { TemplateContext, ExampleContext, TemplateDefinition } from './engine.js';
export { TemplateManager } from './manager.js';
export type { TemplateGenerationOptions, TemplateValidationResult } from './manager.js';
export { registerDomainTemplates } from './domain-templates.js';

// Import for singleton
import { TemplateManager } from './manager.js';

// Singleton template manager instance
export const templateManager = new TemplateManager();

// Re-export types from main types (commented out to avoid export issues)
// export {
//   TemplateType,
//   TemplateResult
// } from '../types/prompt.js';