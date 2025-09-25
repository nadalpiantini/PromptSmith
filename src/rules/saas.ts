import { DomainRule, RuleCategory, DomainConfig } from '../types/domain.js';
import { PromptDomain, AnalysisResult } from '../types/prompt.js';

export class SaaSRules {
  private patterns = {
    vague: [
      {
        match: /bonit[oa]\s+(app|aplicación|application)/gi,
        replace: 'user-friendly, scalable SaaS application',
        description: 'Replace vague app terminology with professional SaaS language'
      },
      {
        match: /buen[oa]\s+(feature|función|característica)/gi,
        replace: 'user-centric feature that solves specific pain points',
        description: 'Focus features on user value and problem-solving'
      },
      {
        match: /cool\s+(dashboard|panel)/gi,
        replace: 'intuitive dashboard with actionable insights',
        description: 'Specify dashboard value and usability'
      },
      {
        match: /easy\s+(interface|ui|interfaz)/gi,
        replace: 'intuitive user interface with minimal learning curve',
        description: 'Specify usability characteristics'
      },
      {
        match: /simple\s+(workflow|proceso)/gi,
        replace: 'streamlined workflow that reduces user friction',
        description: 'Focus on efficiency and user experience'
      },
      {
        match: /powerful\s+(tool|herramienta)/gi,
        replace: 'comprehensive solution with advanced capabilities',
        description: 'Specify tool capabilities and scope'
      }
    ],

    structure: [
      {
        match: /^(build|create|make)\s+(app|software|platform)/gi,
        replace: 'Design and develop a SaaS platform that',
        description: 'Frame as comprehensive SaaS development'
      },
      {
        match: /^(need|want|require)\s+(system|sistema)/gi,
        replace: 'Seeking development of a scalable system that',
        description: 'Emphasize scalability and system design'
      },
      {
        match: /for\s+(users|customers|clients)/gi,
        replace: 'that empowers {{target_users}} to',
        description: 'Focus on user empowerment and value creation'
      },
      {
        match: /manage\s+(data|información)/gi,
        replace: 'efficiently organize and leverage business data',
        description: 'Specify data value and business impact'
      }
    ],

    userExperience: [
      {
        trigger: /ux|user\s+experience|interfaz/i,
        enhancements: [
          'Conduct user research and persona development',
          'Design mobile-responsive interface',
          'Implement accessibility standards (WCAG 2.1)',
          'Create intuitive navigation and information architecture',
          'Plan user onboarding and feature discovery flow'
        ]
      },
      {
        trigger: /dashboard|panel|analytics/i,
        enhancements: [
          'Design customizable dashboard layouts',
          'Implement real-time data visualization',
          'Provide actionable insights and KPI tracking',
          'Enable data export and reporting capabilities',
          'Create role-based access and permissions'
        ]
      }
    ],

    technicalArchitecture: [
      {
        trigger: /scalable|scale|growth/i,
        specifications: [
          'Microservices architecture for independent scaling',
          'Auto-scaling infrastructure (AWS/GCP/Azure)',
          'Database optimization and caching strategies',
          'CDN integration for global performance',
          'Load balancing and redundancy planning'
        ]
      },
      {
        trigger: /integration|api|connect/i,
        specifications: [
          'RESTful API design with comprehensive documentation',
          'Webhook support for real-time notifications',
          'Third-party service integrations (payment, email, etc.)',
          'Data import/export capabilities',
          'Single Sign-On (SSO) implementation'
        ]
      },
      {
        trigger: /security|secure|protection/i,
        specifications: [
          'End-to-end encryption for data at rest and in transit',
          'Multi-factor authentication (MFA)',
          'Role-based access control (RBAC)',
          'Security audit logging and monitoring',
          'Compliance with relevant standards (GDPR, HIPAA, etc.)'
        ]
      }
    ],

    businessModel: [
      {
        trigger: /subscription|pricing|monetization/i,
        considerations: [
          'Tiered pricing strategy with clear value differentiation',
          'Freemium model considerations and conversion tactics',
          'Usage-based billing for scalable pricing',
          'Annual vs monthly subscription incentives',
          'Enterprise pricing and custom solutions'
        ]
      },
      {
        trigger: /customer|retention|churn/i,
        considerations: [
          'Customer lifecycle management and engagement',
          'Onboarding optimization and time-to-value',
          'In-app help and customer support integration',
          'Feature adoption tracking and user guidance',
          'Customer feedback loops and product iteration'
        ]
      }
    ]
  };

  apply(prompt: string, analysis?: AnalysisResult): {
    refined: string;
    rulesApplied: string[];
    improvements: string[];
  } {
    let refined = prompt;
    const rulesApplied: string[] = [];
    const improvements: string[] = [];

    // Apply vague term replacements
    this.patterns.vague.forEach(pattern => {
      if (pattern.match.test(refined)) {
        refined = refined.replace(pattern.match, pattern.replace);
        rulesApplied.push(`vague_${pattern.description}`);
        improvements.push(`Enhanced SaaS terminology: "${pattern.match.source}" → "${pattern.replace}"`);
      }
    });

    // Apply structural improvements
    this.patterns.structure.forEach(pattern => {
      if (pattern.match.test(refined)) {
        refined = refined.replace(pattern.match, pattern.replace);
        rulesApplied.push(`structure_${pattern.description}`);
        improvements.push(`Improved SaaS approach: ${pattern.description}`);
      }
    });

    // Add user experience considerations
    const uxEnhancements = this.addUXConsiderations(refined);
    if (uxEnhancements.enhanced !== refined) {
      refined = uxEnhancements.enhanced;
      rulesApplied.push(...uxEnhancements.rulesApplied);
      improvements.push(...uxEnhancements.improvements);
    }

    // Add technical architecture guidance
    const techEnhancements = this.addTechnicalArchitecture(refined);
    if (techEnhancements.enhanced !== refined) {
      refined = techEnhancements.enhanced;
      rulesApplied.push(...techEnhancements.rulesApplied);
      improvements.push(...techEnhancements.improvements);
    }

    // Add business model considerations
    const businessEnhancements = this.addBusinessConsiderations(refined);
    if (businessEnhancements.enhanced !== refined) {
      refined = businessEnhancements.enhanced;
      rulesApplied.push(...businessEnhancements.rulesApplied);
      improvements.push(...businessEnhancements.improvements);
    }

    return {
      refined: refined.trim(),
      rulesApplied,
      improvements
    };
  }

  private addUXConsiderations(prompt: string): {
    enhanced: string;
    rulesApplied: string[];
    improvements: string[];
  } {
    let enhanced = prompt;
    const rulesApplied: string[] = [];
    const improvements: string[] = [];

    // Add UX/UI guidance
    this.patterns.userExperience.forEach(ux => {
      if (ux.trigger.test(prompt)) {
        const triggerName = ux.trigger.source.replace(/\\b|\\g|[()]/g, '');
        enhanced += `\n\nUser Experience Considerations:\n`;
        ux.enhancements.forEach(enhancement => {
          enhanced += `- ${enhancement}\n`;
        });

        rulesApplied.push(`ux_${triggerName}`);
        improvements.push(`Added ${triggerName} user experience framework`);
      }
    });

    // Add general UX principles if missing
    if (/app|platform|software|interface/i.test(prompt) && !/user\s+experience|usability/i.test(prompt)) {
      enhanced += '\n\nCore UX Principles:\n';
      enhanced += '- Intuitive navigation with consistent design patterns\n';
      enhanced += '- Mobile-responsive design for cross-device compatibility\n';
      enhanced += '- Accessibility compliance (WCAG 2.1 standards)\n';
      enhanced += '- Performance optimization for fast loading times\n';
      enhanced += '- Clear visual hierarchy and information architecture';

      rulesApplied.push('add_core_ux_principles');
      improvements.push('Added fundamental UX design principles');
    }

    return { enhanced, rulesApplied, improvements };
  }

  private addTechnicalArchitecture(prompt: string): {
    enhanced: string;
    rulesApplied: string[];
    improvements: string[];
  } {
    let enhanced = prompt;
    const rulesApplied: string[] = [];
    const improvements: string[] = [];

    // Add architecture-specific guidance
    this.patterns.technicalArchitecture.forEach(arch => {
      if (arch.trigger.test(prompt)) {
        const triggerName = arch.trigger.source.replace(/\\b|\\g|[()]/g, '');
        enhanced += `\n\nTechnical Architecture - ${triggerName.toUpperCase()}:\n`;
        arch.specifications.forEach(spec => {
          enhanced += `- ${spec}\n`;
        });

        rulesApplied.push(`architecture_${triggerName}`);
        improvements.push(`Added ${triggerName} technical architecture specifications`);
      }
    });

    // Add general architecture considerations
    if (/platform|system|software|saas/i.test(prompt) && !/architecture|infrastructure/i.test(prompt)) {
      enhanced += '\n\nTechnical Foundation:\n';
      enhanced += '- Cloud-native architecture for scalability and reliability\n';
      enhanced += '- Microservices design for modular development and deployment\n';
      enhanced += '- Database design optimized for SaaS multi-tenancy\n';
      enhanced += '- API-first development for integration capabilities\n';
      enhanced += '- Monitoring and logging for operational excellence';

      rulesApplied.push('add_technical_foundation');
      improvements.push('Added comprehensive technical architecture framework');
    }

    return { enhanced, rulesApplied, improvements };
  }

  private addBusinessConsiderations(prompt: string): {
    enhanced: string;
    rulesApplied: string[];
    improvements: string[];
  } {
    let enhanced = prompt;
    const rulesApplied: string[] = [];
    const improvements: string[] = [];

    // Add business model guidance
    this.patterns.businessModel.forEach(business => {
      if (business.trigger.test(prompt)) {
        const triggerName = business.trigger.source.replace(/\\b|\\g|[()]/g, '');
        enhanced += `\n\nBusiness Strategy - ${triggerName.toUpperCase()}:\n`;
        business.considerations.forEach(consideration => {
          enhanced += `- ${consideration}\n`;
        });

        rulesApplied.push(`business_${triggerName}`);
        improvements.push(`Added ${triggerName} business strategy considerations`);
      }
    });

    // Add general business considerations for SaaS
    if (/saas|platform|subscription|business/i.test(prompt) && !/revenue|pricing|customer/i.test(prompt)) {
      enhanced += '\n\nSaaS Business Model:\n';
      enhanced += '- Value-based pricing strategy with clear tier differentiation\n';
      enhanced += '- Customer acquisition and retention optimization\n';
      enhanced += '- Product-led growth through freemium or trial experiences\n';
      enhanced += '- Metrics tracking for MRR, churn, and customer lifetime value\n';
      enhanced += '- Scalable customer support and success programs';

      rulesApplied.push('add_saas_business_model');
      improvements.push('Added comprehensive SaaS business strategy framework');
    }

    return { enhanced, rulesApplied, improvements };
  }

  generateSystemPrompt(analysis?: AnalysisResult, context?: string): string {
    const basePrompt = `You are a senior product manager and SaaS architect with extensive experience in:

**Product Strategy & Development:**
- SaaS product development lifecycle and go-to-market strategies
- User research, persona development, and customer journey mapping
- Feature prioritization using frameworks like RICE, Kano, and Jobs-to-be-Done
- Product-market fit validation and growth optimization

**Technical Architecture:**
- Cloud-native, scalable SaaS architecture design
- Microservices, APIs, and integration best practices
- Database design for multi-tenant SaaS applications
- Security, compliance, and data privacy implementation

**User Experience & Design:**
- UX/UI design principles for SaaS applications
- Mobile-responsive and accessible interface design
- Dashboard design and data visualization best practices
- User onboarding optimization and feature adoption

**Business & Operations:**
- SaaS business models, pricing strategies, and revenue optimization
- Customer acquisition, retention, and expansion strategies
- SaaS metrics (MRR, churn, CAC, LTV) and KPI tracking
- Operational scaling and customer success programs

Always provide:
- User-centric solutions that solve real business problems
- Scalable technical architecture suitable for growth
- Clear business value propositions and success metrics
- Comprehensive UX considerations for optimal user adoption
- Security and compliance best practices
- Integration capabilities for ecosystem connectivity

Consider market positioning, competitive landscape, and long-term product strategy in all recommendations.`;

    // Add context-specific guidance
    if (context) {
      return `${basePrompt}\n\nAdditional Context: ${context}`;
    }

    // Add analysis-based guidance
    if (analysis?.complexity && analysis.complexity > 0.7) {
      return `${basePrompt}\n\nNote: This is a complex SaaS development project. Provide comprehensive architecture planning with phased development approach and scalability considerations.`;
    }

    // Add user-focused guidance for customer-centric requests
    if (analysis?.technicalTerms.some(term => ['user', 'customer', 'client'].includes(term.toLowerCase()))) {
      return `${basePrompt}\n\nUser Focus: Prioritize user experience, customer value, and adoption optimization in all solution recommendations.`;
    }

    return basePrompt;
  }

  getDomainConfig(): DomainConfig {
    return {
      domain: PromptDomain.SAAS,
      description: 'Software as a Service development, product management, and business strategy',
      defaultRules: this.getDefaultRules(),
      systemPromptTemplate: this.generateSystemPrompt(),
      commonPatterns: [
        {
          name: 'product_development',
          regex: /\b(product|feature|development|build|create)\b/gi,
          description: 'Product development and feature creation patterns'
        },
        {
          name: 'user_experience',
          regex: /\b(user|ux|ui|interface|dashboard|experience)\b/gi,
          description: 'User experience and interface design patterns'
        },
        {
          name: 'business_model',
          regex: /\b(business|revenue|pricing|subscription|customer)\b/gi,
          description: 'SaaS business model and strategy patterns'
        },
        {
          name: 'technical_architecture',
          regex: /\b(architecture|scalable|api|integration|platform)\b/gi,
          description: 'Technical architecture and scalability patterns'
        }
      ],
      qualityWeights: {
        clarity: 0.25,     // Important for user-facing solutions
        specificity: 0.3,  // Critical for technical and business requirements
        structure: 0.25,   // Important for systematic approach
        completeness: 0.2  // Important for comprehensive solutions
      },
      examples: [
        {
          title: 'Vague App Request Enhancement',
          before: 'build bonita app for users to manage their stuff easily',
          after: 'Design and develop a user-friendly, scalable SaaS application that empowers {{target_users}} to efficiently organize and leverage business data through streamlined workflow that reduces user friction.\n\nCore UX Principles:\n- Intuitive navigation with consistent design patterns\n- Mobile-responsive design for cross-device compatibility\n- Accessibility compliance (WCAG 2.1 standards)\n- Performance optimization for fast loading times\n\nTechnical Foundation:\n- Cloud-native architecture for scalability and reliability\n- Microservices design for modular development\n- Database design optimized for SaaS multi-tenancy\n- API-first development for integration capabilities\n\nSaaS Business Model:\n- Value-based pricing strategy with clear tier differentiation\n- Customer acquisition and retention optimization\n- Product-led growth through freemium experiences',
          explanation: 'Transformed vague app request into comprehensive SaaS development framework',
          score_improvement: 0.75
        },
        {
          title: 'Dashboard Enhancement',
          before: 'create cool dashboard with good features for data management',
          after: 'Design and develop an intuitive dashboard with actionable insights that empowers users to efficiently organize and leverage business data.\n\nUser Experience Considerations:\n- Design customizable dashboard layouts\n- Implement real-time data visualization\n- Provide actionable insights and KPI tracking\n- Enable data export and reporting capabilities\n- Create role-based access and permissions\n\nTechnical Architecture - INTEGRATION:\n- RESTful API design with comprehensive documentation\n- Webhook support for real-time notifications\n- Third-party service integrations\n- Data import/export capabilities\n- Single Sign-On (SSO) implementation',
          explanation: 'Enhanced generic dashboard request with specific UX and technical requirements',
          score_improvement: 0.69
        }
      ]
    };
  }

  private getDefaultRules(): DomainRule[] {
    const rules: DomainRule[] = [];

    // Vague term replacement rules
    this.patterns.vague.forEach((pattern, index) => {
      rules.push({
        id: `saas_vague_${index}`,
        domain: PromptDomain.SAAS,
        pattern: pattern.match,
        replacement: pattern.replace,
        priority: 8,
        active: true,
        description: pattern.description,
        category: RuleCategory.VAGUE_TERMS,
        examples: [
          {
            before: pattern.match.source,
            after: pattern.replace,
            explanation: pattern.description
          }
        ]
      });
    });

    // Structure improvement rules
    this.patterns.structure.forEach((pattern, index) => {
      rules.push({
        id: `saas_structure_${index}`,
        domain: PromptDomain.SAAS,
        pattern: pattern.match,
        replacement: pattern.replace,
        priority: 7,
        active: true,
        description: pattern.description,
        category: RuleCategory.STRUCTURE,
      });
    });

    return rules;
  }
}