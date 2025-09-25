// Main exports for PromptSmith MCP
export * from './types/prompt.js';
export * from './types/domain.js';
export * from './types/mcp.js';

export * from './core/analyzer.js';
export * from './core/optimizer.js';
export * from './core/validator.js';
export * from './core/orchestrator.js';

export * from './rules/index.js';
export * from './templates/index.js';
export * from './scoring/scorer.js';
export * from './services/index.js';

export { PromptSmithServer } from './server/index.js';

// For backwards compatibility and convenience
import { PromptOrchestrator } from './core/orchestrator.js';
import { services } from './services/index.js';

export const promptSmith = {
  orchestrator: new PromptOrchestrator(),
  services,

  // Convenience methods
  async process(raw: string, options?: any) {
    return this.orchestrator.process({
      raw,
      domain: options?.domain || 'general',
      tone: options?.tone || 'professional',
      context: options?.context,
      variables: options?.variables || {},
      targetModel: options?.targetModel || 'general'
    });
  },

  async evaluate(prompt: string, criteria?: string[], domain?: string) {
    return this.orchestrator.evaluate(prompt, criteria, domain);
  },

  async compare(variants: string[], testInput?: string) {
    return this.orchestrator.compare(variants, testInput);
  }
};

export default promptSmith;