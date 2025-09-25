// Template system exports
export { TemplateEngine, TemplateContext, ExampleContext, TemplateDefinition } from './engine.js';
export { TemplateManager, TemplateGenerationOptions, TemplateValidationResult } from './manager.js';
export { registerDomainTemplates } from './domain-templates.js';

// Import for singleton
import { TemplateManager } from './manager.js';

// Singleton template manager instance
export const templateManager = new TemplateManager();

// Re-export types from main types
export {
  TemplateType,
  TemplateResult
} from '../types/prompt.js';