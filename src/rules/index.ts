import { PromptDomain, AnalysisResult } from '../types/prompt.js';
import { DomainRegistry, DomainConfig, DomainRule, Pattern } from '../types/domain.js';
import { SQLRules } from './sql.js';
import { BrandingRules } from './branding.js';
import { CinemaRules } from './cine.js';
import { SaaSRules } from './saas.js';
import { DevOpsRules } from './devops.js';

export class PromptDomainRegistry implements DomainRegistry {
  domains: Map<PromptDomain, DomainConfig> = new Map();

  private ruleEngines: Map<PromptDomain, any> = new Map();

  constructor() {
    this.initializeDomains();
  }

  private initializeDomains(): void {
    // Initialize rule engines
    const sqlRules = new SQLRules();
    const brandingRules = new BrandingRules();
    const cinemaRules = new CinemaRules();
    const saasRules = new SaaSRules();
    const devopsRules = new DevOpsRules();

    this.ruleEngines.set(PromptDomain.SQL, sqlRules);
    this.ruleEngines.set(PromptDomain.BRANDING, brandingRules);
    this.ruleEngines.set(PromptDomain.CINE, cinemaRules);
    this.ruleEngines.set(PromptDomain.SAAS, saasRules);
    this.ruleEngines.set(PromptDomain.DEVOPS, devopsRules);

    // Register domain configurations
    this.register(PromptDomain.SQL, sqlRules.getDomainConfig());
    this.register(PromptDomain.BRANDING, brandingRules.getDomainConfig());
    this.register(PromptDomain.CINE, cinemaRules.getDomainConfig());
    this.register(PromptDomain.SAAS, saasRules.getDomainConfig());
    this.register(PromptDomain.DEVOPS, devopsRules.getDomainConfig());

    // Add general domain configuration
    this.addGeneralDomain();
  }

  register(domain: PromptDomain, config: DomainConfig): void {
    this.domains.set(domain, config);
  }

  get(domain: PromptDomain): DomainConfig | undefined {
    return this.domains.get(domain);
  }

  list(): PromptDomain[] {
    return Array.from(this.domains.keys());
  }

  getPatterns(domain: PromptDomain): Pattern[] {
    const config = this.domains.get(domain);
    return config?.commonPatterns || [];
  }

  getRules(domain: PromptDomain): DomainRule[] {
    const config = this.domains.get(domain);
    return config?.defaultRules || [];
  }

  // Apply domain-specific rules
  applyDomainRules(
    prompt: string,
    domain: PromptDomain,
    analysis?: AnalysisResult
  ): {
    refined: string;
    rulesApplied: string[];
    improvements: string[];
  } {
    const ruleEngine = this.ruleEngines.get(domain);

    if (!ruleEngine || !ruleEngine.apply) {
      // Fallback to general improvements
      return this.applyGeneralRules(prompt, analysis);
    }

    return ruleEngine.apply(prompt, analysis);
  }

  // Generate system prompt for domain
  generateSystemPrompt(
    domain: PromptDomain,
    analysis?: AnalysisResult,
    context?: string
  ): string {
    const ruleEngine = this.ruleEngines.get(domain);

    if (!ruleEngine || !ruleEngine.generateSystemPrompt) {
      return this.getGeneralSystemPrompt(context);
    }

    return ruleEngine.generateSystemPrompt(analysis, context);
  }

  // Detect domain from prompt content
  detectDomain(prompt: string, analysis?: AnalysisResult): PromptDomain {
    const domainScores: Map<PromptDomain, number> = new Map();

    // Initialize scores
    this.list().forEach(domain => {
      domainScores.set(domain, 0);
    });

    // Score based on domain patterns
    this.list().forEach(domain => {
      const patterns = this.getPatterns(domain);
      let score = 0;

      patterns.forEach(pattern => {
        const matches = (prompt.match(pattern.regex) || []).length;
        score += matches * 2; // Weight pattern matches highly
      });

      domainScores.set(domain, score);
    });

    // Boost score based on analysis domain hints
    if (analysis?.domainHints) {
      analysis.domainHints.forEach(hint => {
        const domain = this.mapHintToDomain(hint);
        if (domain) {
          const currentScore = domainScores.get(domain) || 0;
          domainScores.set(domain, currentScore + 3);
        }
      });
    }

    // Find the domain with the highest score
    let bestDomain = PromptDomain.GENERAL;
    let bestScore = 0;

    domainScores.forEach((score, domain) => {
      if (score > bestScore) {
        bestScore = score;
        bestDomain = domain;
      }
    });

    // Only return specific domain if confidence is high enough
    return bestScore >= 2 ? bestDomain : PromptDomain.GENERAL;
  }

  // Get domain-specific quality weights
  getQualityWeights(domain: PromptDomain): {
    clarity: number;
    specificity: number;
    structure: number;
    completeness: number;
  } {
    const config = this.domains.get(domain);
    return config?.qualityWeights || {
      clarity: 0.25,
      specificity: 0.25,
      structure: 0.25,
      completeness: 0.25
    };
  }

  // Get domain examples
  getDomainExamples(domain: PromptDomain): any[] {
    const config = this.domains.get(domain);
    return config?.examples || [];
  }

  // Get all domain statistics
  getDomainStatistics(): Record<string, any> {
    const stats: Record<string, any> = {};

    this.list().forEach(domain => {
      const config = this.domains.get(domain);
      if (config) {
        stats[domain] = {
          ruleCount: config.defaultRules.length,
          patternCount: config.commonPatterns.length,
          exampleCount: config.examples.length,
          description: config.description
        };
      }
    });

    return stats;
  }

  private addGeneralDomain(): void {
    const generalConfig: DomainConfig = {
      domain: PromptDomain.GENERAL,
      description: 'General purpose prompt optimization with universal improvements',
      defaultRules: this.getGeneralRules(),
      systemPromptTemplate: this.getGeneralSystemPrompt(),
      commonPatterns: [
        {
          name: 'general_improvements',
          regex: /\b(improve|enhance|optimize|better|good|best)\b/gi,
          description: 'General improvement and optimization patterns'
        }
      ],
      qualityWeights: {
        clarity: 0.25,
        specificity: 0.25,
        structure: 0.25,
        completeness: 0.25
      },
      examples: [
        {
          title: 'Generic Improvement',
          before: 'make something good that works nice',
          after: 'Create a well-designed solution that effectively addresses the specified requirements with clear functionality and user benefits.',
          explanation: 'Replaced vague terms with specific, actionable language',
          score_improvement: 0.45
        }
      ]
    };

    this.register(PromptDomain.GENERAL, generalConfig);
  }

  private applyGeneralRules(prompt: string, analysis?: AnalysisResult): {
    refined: string;
    rulesApplied: string[];
    improvements: string[];
  } {
    let refined = prompt;
    const rulesApplied: string[] = [];
    const improvements: string[] = [];

    // Apply basic improvements
    const generalImprovements = [
      {
        pattern: /\bbonit[oa]\b/gi,
        replacement: 'well-designed',
        description: 'Replace vague aesthetic terms'
      },
      {
        pattern: /\bbuen[oa]\b/gi,
        replacement: 'high-quality',
        description: 'Replace vague quality terms'
      },
      {
        pattern: /\bnice\b/gi,
        replacement: 'well-crafted',
        description: 'Replace generic positive terms'
      },
      {
        pattern: /\bcool\b/gi,
        replacement: 'impressive',
        description: 'Replace casual terms with professional language'
      }
    ];

    generalImprovements.forEach(improvement => {
      if (improvement.pattern.test(refined)) {
        refined = refined.replace(improvement.pattern, improvement.replacement);
        rulesApplied.push(`general_${improvement.description}`);
        improvements.push(improvement.description);
      }
    });

    // Ensure proper capitalization
    if (!refined.match(/^[A-Z]/)) {
      refined = refined.charAt(0).toUpperCase() + refined.slice(1);
      rulesApplied.push('general_capitalization');
      improvements.push('Capitalized first letter');
    }

    // Ensure proper ending
    if (!refined.match(/[.!?]$/)) {
      refined = `${refined.trim()  }.`;
      rulesApplied.push('general_punctuation');
      improvements.push('Added proper ending punctuation');
    }

    return { refined, rulesApplied, improvements };
  }

  private getGeneralRules(): DomainRule[] {
    return [
      {
        id: 'general_vague_bonito',
        domain: PromptDomain.GENERAL,
        pattern: /\bbonit[oa]\b/gi,
        replacement: 'well-designed',
        priority: 5,
        active: true,
        description: 'Replace vague Spanish aesthetic terms',
        category: 'vague_terms' as any,
      },
      {
        id: 'general_vague_bueno',
        domain: PromptDomain.GENERAL,
        pattern: /\bbuen[oa]\b/gi,
        replacement: 'high-quality',
        priority: 5,
        active: true,
        description: 'Replace vague Spanish quality terms',
        category: 'vague_terms' as any,
      }
    ];
  }

  private getGeneralSystemPrompt(context?: string): string {
    const basePrompt = `You are a professional assistant with expertise across multiple domains. You provide:

**Clear Communication:**
- Well-structured responses with logical flow
- Professional language appropriate for the context
- Specific, actionable recommendations and guidance

**Quality Focus:**
- Attention to detail and accuracy in all responses
- Best practices and industry standards
- Comprehensive solutions that address user needs

**Adaptability:**
- Appropriate tone and complexity for the audience
- Context-aware recommendations and suggestions
- Integration of relevant domain knowledge

Always strive for clarity, specificity, and professionalism in your responses.`;

    if (context) {
      return `${basePrompt}\n\nAdditional Context: ${context}`;
    }

    return basePrompt;
  }

  private mapHintToDomain(hint: string): PromptDomain | null {
    const hintMap: Record<string, PromptDomain> = {
      'sql': PromptDomain.SQL,
      'branding': PromptDomain.BRANDING,
      'cine': PromptDomain.CINE,
      'saas': PromptDomain.SAAS,
      'devops': PromptDomain.DEVOPS
    };

    return hintMap[hint.toLowerCase()] || null;
  }
}

// Export singleton instance
export const domainRegistry = new PromptDomainRegistry();

// Export individual rule classes for direct use
export {
  SQLRules,
  BrandingRules,
  CinemaRules,
  SaaSRules,
  DevOpsRules
};