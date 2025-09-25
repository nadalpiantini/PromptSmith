import { DomainRule, RuleCategory, DomainConfig } from '../types/domain.js';
import { PromptDomain, AnalysisResult } from '../types/prompt.js';

export class BrandingRules {
  private patterns = {
    vague: [
      {
        match: /bonit[oa]\s+(brand|marca|campaign|campaña)/gi,
        replace: 'compelling and memorable brand identity',
        description: 'Replace vague brand terminology with professional language'
      },
      {
        match: /buen[oa]\s+(copy|texto|content)/gi,
        replace: 'engaging, conversion-focused copy',
        description: 'Enhance vague copy requests with marketing objectives'
      },
      {
        match: /nice\s+(logo|design)/gi,
        replace: 'professional, brand-aligned visual identity',
        description: 'Specify design quality and brand consistency'
      },
      {
        match: /attract\s+(people|gente|customers)/gi,
        replace: 'engage target audience and drive conversion',
        description: 'Be specific about marketing objectives'
      },
      {
        match: /viral|popular/gi,
        replace: 'shareable and engaging',
        description: 'Use realistic marketing terms instead of unrealistic goals'
      },
      {
        match: /catchy\s+(slogan|tagline)/gi,
        replace: 'memorable slogan that reinforces brand values',
        description: 'Connect slogans to brand strategy'
      }
    ],

    structure: [
      {
        match: /^(make|create|design)\s+(brand|logo|campaign)/gi,
        replace: 'Develop a comprehensive brand strategy for',
        description: 'Focus on strategic approach rather than just creation'
      },
      {
        match: /^(need|want|require)\s+(marketing|branding)/gi,
        replace: 'Seeking strategic marketing consultation for',
        description: 'Position as professional consultation'
      },
      {
        match: /sell\s+(more|products|stuff)/gi,
        replace: 'increase conversion rates and customer engagement',
        description: 'Use professional marketing terminology'
      },
      {
        match: /get\s+(famous|known)/gi,
        replace: 'build brand awareness and market recognition',
        description: 'Use measurable marketing objectives'
      }
    ],

    audienceRefinement: [
      {
        trigger: /audience|target|customer/i,
        questions: [
          'What is the primary demographic (age, gender, income level)?',
          'What are their key pain points and motivations?',
          'Where do they typically consume content or make purchasing decisions?',
          'What brands do they currently trust and why?'
        ]
      },
      {
        trigger: /brand\s+(voice|tone|personality)/i,
        questions: [
          'Should the brand voice be formal or casual?',
          'What emotions should the brand evoke?',
          'What are the core brand values and principles?',
          'How should the brand differentiate from competitors?'
        ]
      }
    ],

    brandingEnhancements: [
      {
        trigger: /logo|visual|design/i,
        enhancement: 'Consider brand positioning, color psychology, and visual hierarchy'
      },
      {
        trigger: /campaign|marketing/i,
        enhancement: 'Define campaign objectives, target metrics, and success measurements'
      },
      {
        trigger: /content|copy|messaging/i,
        enhancement: 'Align messaging with brand voice, audience needs, and conversion goals'
      },
      {
        trigger: /social\s+media/i,
        enhancement: 'Specify platform strategy, content calendar, and engagement tactics'
      },
      {
        trigger: /launch|product/i,
        enhancement: 'Include go-to-market strategy, positioning, and competitive differentiation'
      }
    ],

    industrySpecific: [
      {
        pattern: /\b(tech|technology|software|app)\b/gi,
        replacements: {
          'audience': 'tech-savvy early adopters and enterprise decision makers',
          'tone': 'innovative, forward-thinking, and solution-oriented',
          'messaging': 'focus on efficiency, innovation, and technological advancement'
        }
      },
      {
        pattern: /\b(health|medical|wellness|fitness)\b/gi,
        replacements: {
          'audience': 'health-conscious consumers and healthcare professionals',
          'tone': 'trustworthy, empathetic, and science-backed',
          'messaging': 'emphasize safety, efficacy, and professional credibility'
        }
      },
      {
        pattern: /\b(luxury|premium|high.end)\b/gi,
        replacements: {
          'audience': 'affluent consumers who value exclusivity and quality',
          'tone': 'sophisticated, exclusive, and aspirational',
          'messaging': 'highlight craftsmanship, heritage, and exclusive benefits'
        }
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
        improvements.push(`Enhanced terminology: "${pattern.match.source}" → "${pattern.replace}"`);
      }
    });

    // Apply structural improvements
    this.patterns.structure.forEach(pattern => {
      if (pattern.match.test(refined)) {
        refined = refined.replace(pattern.match, pattern.replace);
        rulesApplied.push(`structure_${pattern.description}`);
        improvements.push(`Improved approach: ${pattern.description}`);
      }
    });

    // Add audience-specific enhancements
    const audienceEnhancements = this.addAudienceGuidance(refined);
    if (audienceEnhancements.enhanced !== refined) {
      refined = audienceEnhancements.enhanced;
      rulesApplied.push(...audienceEnhancements.rulesApplied);
      improvements.push(...audienceEnhancements.improvements);
    }

    // Add strategic context
    const strategicEnhancements = this.addStrategicContext(refined);
    if (strategicEnhancements.enhanced !== refined) {
      refined = strategicEnhancements.enhanced;
      rulesApplied.push(...strategicEnhancements.rulesApplied);
      improvements.push(...strategicEnhancements.improvements);
    }

    // Apply industry-specific optimizations
    const industryEnhancements = this.applyIndustrySpecifics(refined);
    if (industryEnhancements.enhanced !== refined) {
      refined = industryEnhancements.enhanced;
      rulesApplied.push(...industryEnhancements.rulesApplied);
      improvements.push(...industryEnhancements.improvements);
    }

    return {
      refined: refined.trim(),
      rulesApplied,
      improvements
    };
  }

  private addAudienceGuidance(prompt: string): {
    enhanced: string;
    rulesApplied: string[];
    improvements: string[];
  } {
    let enhanced = prompt;
    const rulesApplied: string[] = [];
    const improvements: string[] = [];

    // Add audience specification if missing
    if (/brand|marketing|campaign/i.test(prompt) && !/audience|target|demographic/i.test(prompt)) {
      enhanced += '\n\nTarget Audience Considerations:\n- Define primary demographic (age, income, lifestyle)\n- Identify key pain points and motivations\n- Specify preferred communication channels\n- Consider psychographic characteristics and values';
      rulesApplied.push('add_audience_guidance');
      improvements.push('Added comprehensive target audience framework');
    }

    // Add brand voice guidance if missing
    if (/brand|messaging|copy/i.test(prompt) && !/voice|tone|personality/i.test(prompt)) {
      enhanced += '\n\nBrand Voice Guidelines:\n- Define brand personality traits (professional, friendly, innovative, etc.)\n- Specify emotional tone and communication style\n- Align voice with target audience preferences\n- Ensure consistency across all touchpoints';
      rulesApplied.push('add_brand_voice_guidance');
      improvements.push('Added brand voice and personality framework');
    }

    // Add competitive positioning if missing
    if (/brand|product|launch/i.test(prompt) && !/competitor|differentiat|position/i.test(prompt)) {
      enhanced += '\n\nCompetitive Positioning:\n- Identify key competitors and their messaging\n- Define unique value proposition and differentiators\n- Highlight competitive advantages\n- Position against market alternatives';
      rulesApplied.push('add_competitive_positioning');
      improvements.push('Added competitive analysis and positioning');
    }

    return { enhanced, rulesApplied, improvements };
  }

  private addStrategicContext(prompt: string): {
    enhanced: string;
    rulesApplied: string[];
    improvements: string[];
  } {
    let enhanced = prompt;
    const rulesApplied: string[] = [];
    const improvements: string[] = [];

    // Add campaign objectives if missing
    if (/campaign|marketing/i.test(prompt) && !/objective|goal|metric|kpi/i.test(prompt)) {
      enhanced += '\n\nCampaign Objectives:\n- Define primary goals (awareness, conversion, retention)\n- Specify measurable KPIs and success metrics\n- Set realistic timelines and budget considerations\n- Plan measurement and optimization strategies';
      rulesApplied.push('add_campaign_objectives');
      improvements.push('Added strategic objectives and measurement framework');
    }

    // Add channel strategy if missing
    if (/marketing|campaign|content/i.test(prompt) && !/channel|platform|distribution/i.test(prompt)) {
      enhanced += '\n\nChannel Strategy:\n- Select appropriate marketing channels (social, email, paid, organic)\n- Tailor content for each platform\'s best practices\n- Consider cross-channel integration and consistency\n- Plan content distribution and engagement tactics';
      rulesApplied.push('add_channel_strategy');
      improvements.push('Added multi-channel distribution strategy');
    }

    // Add brand guidelines if missing
    if (/brand|visual|design/i.test(prompt) && !/guideline|standard|consistency/i.test(prompt)) {
      enhanced += '\n\nBrand Guidelines:\n- Establish visual identity standards (colors, fonts, imagery)\n- Define logo usage and brand asset requirements\n- Ensure consistency across all marketing materials\n- Create scalable brand system for future growth';
      rulesApplied.push('add_brand_guidelines');
      improvements.push('Added comprehensive brand guidelines framework');
    }

    return { enhanced, rulesApplied, improvements };
  }

  private applyIndustrySpecifics(prompt: string): {
    enhanced: string;
    rulesApplied: string[];
    improvements: string[];
  } {
    let enhanced = prompt;
    const rulesApplied: string[] = [];
    const improvements: string[] = [];

    // Apply industry-specific optimizations
    this.patterns.industrySpecific.forEach(industry => {
      if (industry.pattern.test(prompt)) {
        const industryName = industry.pattern.source.replace(/\\b|\\g|[()]/g, '');
        enhanced += `\n\n${industryName.toUpperCase()} Industry Considerations:\n`;
        enhanced += `- Target Audience: ${industry.replacements.audience}\n`;
        enhanced += `- Brand Tone: ${industry.replacements.tone}\n`;
        enhanced += `- Key Messaging: ${industry.replacements.messaging}`;

        rulesApplied.push(`industry_specific_${industryName}`);
        improvements.push(`Added ${industryName} industry-specific branding guidance`);
      }
    });

    return { enhanced, rulesApplied, improvements };
  }

  generateSystemPrompt(analysis?: AnalysisResult, context?: string): string {
    const basePrompt = `You are a senior brand strategist and marketing expert with extensive experience in:

**Brand Strategy & Positioning:**
- Brand identity development and visual design systems
- Competitive analysis and market positioning
- Brand voice, personality, and messaging frameworks
- Customer journey mapping and touchpoint optimization

**Marketing & Communications:**
- Integrated marketing campaign development
- Content strategy across multiple channels and platforms
- Audience segmentation and persona development
- Conversion optimization and performance marketing

**Creative Direction:**
- Visual identity design and brand asset creation
- Copy writing and messaging that drives action
- Campaign creative development and execution
- Brand consistency and guideline enforcement

**Business Acumen:**
- Go-to-market strategy and product positioning
- Customer acquisition and retention strategies
- Brand metrics, KPIs, and ROI measurement
- Crisis communication and reputation management

Always provide:
- Strategic thinking that connects creative to business objectives
- Audience-first approach with clear demographic targeting
- Measurable goals and success metrics for all recommendations
- Brand consistency guidelines and implementation standards
- Competitive differentiation and unique positioning
- Scalable solutions that grow with the business

Consider industry-specific best practices, cultural sensitivities, and current market trends in all recommendations.`;

    // Add context-specific guidance
    if (context) {
      return `${basePrompt}\n\nAdditional Context: ${context}`;
    }

    // Add analysis-based guidance
    if (analysis?.complexity && analysis.complexity > 0.7) {
      return `${basePrompt}\n\nNote: This is a complex branding challenge. Provide comprehensive strategic framework with phased implementation approach.`;
    }

    if (analysis?.domainHints.includes('tech')) {
      return `${basePrompt}\n\nTech Industry Focus: Emphasize innovation, efficiency, and forward-thinking messaging that resonates with tech-savvy audiences.`;
    }

    return basePrompt;
  }

  getDomainConfig(): DomainConfig {
    return {
      domain: PromptDomain.BRANDING,
      description: 'Brand strategy, marketing campaigns, and creative communications',
      defaultRules: this.getDefaultRules(),
      systemPromptTemplate: this.generateSystemPrompt(),
      commonPatterns: [
        {
          name: 'brand_identity',
          regex: /\b(brand|identity|logo|visual)\b/gi,
          description: 'Brand identity and visual design patterns'
        },
        {
          name: 'marketing_campaign',
          regex: /\b(campaign|marketing|promotion|advertising)\b/gi,
          description: 'Marketing campaign development patterns'
        },
        {
          name: 'content_strategy',
          regex: /\b(content|copy|messaging|communication)\b/gi,
          description: 'Content and messaging strategy patterns'
        },
        {
          name: 'audience_targeting',
          regex: /\b(audience|target|customer|demographic)\b/gi,
          description: 'Audience analysis and targeting patterns'
        }
      ],
      qualityWeights: {
        clarity: 0.25,     // Important for clear messaging
        specificity: 0.3,  // Critical for targeted campaigns
        structure: 0.25,   // Important for strategic approach
        completeness: 0.2  // Important for comprehensive strategy
      },
      examples: [
        {
          title: 'Vague Brand Request Enhancement',
          before: 'make nice brand for my business that attracts people',
          after: 'Develop a comprehensive brand strategy that:\n- Creates compelling brand identity aligned with target audience values\n- Engages specific demographic with measurable conversion goals\n- Differentiates from competitors through unique positioning\n- Includes brand voice guidelines and visual identity standards\n\nTarget Audience Considerations:\n- Define primary demographic and psychographic characteristics\n- Identify key pain points and motivations\n- Specify preferred communication channels\n\nBrand Voice Guidelines:\n- Define brand personality and emotional tone\n- Ensure consistency across all touchpoints\n- Align with target audience preferences',
          explanation: 'Transformed generic brand request into strategic framework with audience focus',
          score_improvement: 0.72
        },
        {
          title: 'Campaign Strategy Enhancement',
          before: 'create viral marketing campaign for product launch',
          after: 'Develop a strategic product launch campaign that:\n- Creates shareable and engaging content with realistic growth targets\n- Builds brand awareness and drives measurable conversion\n- Targets specific audience segments with tailored messaging\n- Utilizes appropriate channels for maximum reach and impact\n\nCampaign Objectives:\n- Define primary goals (awareness, conversion, retention)\n- Specify measurable KPIs and success metrics\n- Plan measurement and optimization strategies\n\nChannel Strategy:\n- Select appropriate marketing channels based on audience behavior\n- Tailor content for each platform\'s best practices\n- Plan integrated cross-channel approach',
          explanation: 'Enhanced unrealistic viral goal with strategic campaign framework',
          score_improvement: 0.68
        }
      ]
    };
  }

  private getDefaultRules(): DomainRule[] {
    const rules: DomainRule[] = [];

    // Vague term replacement rules
    this.patterns.vague.forEach((pattern, index) => {
      rules.push({
        id: `branding_vague_${index}`,
        domain: PromptDomain.BRANDING,
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
        id: `branding_structure_${index}`,
        domain: PromptDomain.BRANDING,
        pattern: pattern.match,
        replacement: pattern.replace,
        priority: 7,
        active: true,
        description: pattern.description,
        category: RuleCategory.STRUCTURE,
      });
    });

    // Enhancement rules
    this.patterns.brandingEnhancements.forEach((enhancement, index) => {
      rules.push({
        id: `branding_enhancement_${index}`,
        domain: PromptDomain.BRANDING,
        pattern: enhancement.trigger,
        replacement: (match: string) => `${match} (${enhancement.enhancement})`,
        priority: 6,
        active: true,
        description: `Add context: ${enhancement.enhancement}`,
        category: RuleCategory.ENHANCEMENT,
      });
    });

    return rules;
  }
}