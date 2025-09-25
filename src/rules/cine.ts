import { DomainRule, RuleCategory, DomainConfig } from '../types/domain.js';
import { PromptDomain, AnalysisResult } from '../types/prompt.js';

export class CinemaRules {
  private patterns = {
    vague: [
      {
        match: /bonit[oa]\s+(película|film|movie|script)/gi,
        replace: 'compelling cinematic narrative with strong character development',
        description: 'Replace vague film terminology with professional screenwriting language'
      },
      {
        match: /buen\s+(guión|script|screenplay)/gi,
        replace: 'well-structured screenplay with industry-standard formatting',
        description: 'Specify professional screenwriting requirements'
      },
      {
        match: /interesting\s+(story|historia)/gi,
        replace: 'engaging narrative with clear dramatic arc',
        description: 'Define story structure elements'
      },
      {
        match: /cool\s+(character|personaje)/gi,
        replace: 'multi-dimensional character with clear motivations',
        description: 'Specify character development requirements'
      },
      {
        match: /exciting\s+(scene|escena)/gi,
        replace: 'dramatically compelling scene with visual storytelling',
        description: 'Focus on cinematic storytelling techniques'
      },
      {
        match: /good\s+(dialogue|diálogo)/gi,
        replace: 'authentic dialogue that reveals character and advances plot',
        description: 'Specify dialogue quality and purpose'
      }
    ],

    structure: [
      {
        match: /^(write|create|make)\s+(movie|film|script)/gi,
        replace: 'Develop a screenplay for',
        description: 'Use professional screenwriting terminology'
      },
      {
        match: /^(need|want|require)\s+(story|historia)/gi,
        replace: 'Seeking narrative development for',
        description: 'Position as professional story consultation'
      },
      {
        match: /about\s+(character|person|guy|girl)/gi,
        replace: 'featuring a protagonist who',
        description: 'Use proper character description format'
      },
      {
        match: /with\s+(action|drama|comedy|romance)/gi,
        replace: 'in the {{genre}} genre with elements of',
        description: 'Properly categorize genre elements'
      }
    ],

    genreSpecific: {
      action: {
        elements: ['high-stakes conflict', 'physical challenges', 'escalating tension', 'heroic journey'],
        structure: 'three-act structure with action sequences driving plot progression',
        tone: 'dynamic pacing with moments of tension and release'
      },
      drama: {
        elements: ['character-driven conflict', 'emotional depth', 'realistic dialogue', 'thematic resonance'],
        structure: 'character arc development with internal and external conflicts',
        tone: 'authentic emotional beats with naturalistic performance'
      },
      comedy: {
        elements: ['comedic timing', 'character-based humor', 'situational comedy', 'comedic relief'],
        structure: 'setup and payoff structure with escalating comic situations',
        tone: 'light-hearted with appropriate comedic pacing'
      },
      thriller: {
        elements: ['suspense building', 'plot twists', 'psychological tension', 'mystery elements'],
        structure: 'mounting tension with strategic revelation of information',
        tone: 'sustained suspense with carefully timed reveals'
      },
      horror: {
        elements: ['atmospheric tension', 'psychological fear', 'visual scares', 'supernatural elements'],
        structure: 'escalating dread with climactic confrontation',
        tone: 'ominous atmosphere with strategic use of fear elements'
      }
    },

    formatSpecific: [
      {
        trigger: /feature|película|film/i,
        specifications: [
          'Standard feature length: 90-120 pages (90-120 minutes)',
          'Three-act structure with clear turning points',
          'Industry-standard Final Draft or similar formatting',
          'Character development across full narrative arc'
        ]
      },
      {
        trigger: /short\s+film|cortometraje/i,
        specifications: [
          'Short film length: 5-30 pages (5-30 minutes)',
          'Focused narrative with single dramatic arc',
          'Efficient character introduction and development',
          'Strong visual storytelling due to time constraints'
        ]
      },
      {
        trigger: /series|serie|episod/i,
        specifications: [
          'Episodic structure with series bible development',
          'Character arcs spanning multiple episodes',
          'Consistent tone and world-building',
          'Cliffhangers and episode-specific resolutions'
        ]
      },
      {
        trigger: /treatment|synopsis/i,
        specifications: [
          'Present tense, third person narrative format',
          'Plot summary without dialogue',
          '2-10 pages depending on project scope',
          'Clear story beats and character motivations'
        ]
      }
    ],

    characterDevelopment: [
      {
        trigger: /character|personaje|protagonist/i,
        enhancement: 'Include character backstory, motivation, goal, and character arc development'
      },
      {
        trigger: /villain|antagonist/i,
        enhancement: 'Develop compelling antagonist with understandable motivations and clear opposition to protagonist'
      },
      {
        trigger: /relationship|romance/i,
        enhancement: 'Create authentic relationship dynamics with clear emotional stakes and character growth'
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
        improvements.push(`Enhanced film terminology: "${pattern.match.source}" → "${pattern.replace}"`);
      }
    });

    // Apply structural improvements
    this.patterns.structure.forEach(pattern => {
      if (pattern.match.test(refined)) {
        refined = refined.replace(pattern.match, pattern.replace);
        rulesApplied.push(`structure_${pattern.description}`);
        improvements.push(`Improved screenplay approach: ${pattern.description}`);
      }
    });

    // Add genre-specific guidance
    const genreEnhancements = this.addGenreSpecifics(refined);
    if (genreEnhancements.enhanced !== refined) {
      refined = genreEnhancements.enhanced;
      rulesApplied.push(...genreEnhancements.rulesApplied);
      improvements.push(...genreEnhancements.improvements);
    }

    // Add format specifications
    const formatEnhancements = this.addFormatSpecifications(refined);
    if (formatEnhancements.enhanced !== refined) {
      refined = formatEnhancements.enhanced;
      rulesApplied.push(...formatEnhancements.rulesApplied);
      improvements.push(...formatEnhancements.improvements);
    }

    // Add cinematic storytelling elements
    const cinematicEnhancements = this.addCinematicElements(refined);
    if (cinematicEnhancements.enhanced !== refined) {
      refined = cinematicEnhancements.enhanced;
      rulesApplied.push(...cinematicEnhancements.rulesApplied);
      improvements.push(...cinematicEnhancements.improvements);
    }

    return {
      refined: refined.trim(),
      rulesApplied,
      improvements
    };
  }

  private addGenreSpecifics(prompt: string): {
    enhanced: string;
    rulesApplied: string[];
    improvements: string[];
  } {
    let enhanced = prompt;
    const rulesApplied: string[] = [];
    const improvements: string[] = [];

    // Detect and enhance based on genre
    Object.entries(this.patterns.genreSpecific).forEach(([genre, specs]) => {
      const genreRegex = new RegExp(`\\b${genre}\\b`, 'gi');
      if (genreRegex.test(prompt)) {
        enhanced += `\n\n${genre.toUpperCase()} Genre Specifications:\n`;
        enhanced += `- Key Elements: ${specs.elements.join(', ')}\n`;
        enhanced += `- Structure: ${specs.structure}\n`;
        enhanced += `- Tone: ${specs.tone}`;

        rulesApplied.push(`genre_specific_${genre}`);
        improvements.push(`Added ${genre} genre-specific storytelling guidance`);
      }
    });

    return { enhanced, rulesApplied, improvements };
  }

  private addFormatSpecifications(prompt: string): {
    enhanced: string;
    rulesApplied: string[];
    improvements: string[];
  } {
    let enhanced = prompt;
    const rulesApplied: string[] = [];
    const improvements: string[] = [];

    // Add format-specific requirements
    this.patterns.formatSpecific.forEach(format => {
      if (format.trigger.test(prompt)) {
        const formatType = format.trigger.source.replace(/\\b|\\g|[()]/g, '');
        enhanced += `\n\nFormat Requirements:\n`;
        format.specifications.forEach(spec => {
          enhanced += `- ${spec}\n`;
        });

        rulesApplied.push(`format_specific_${formatType}`);
        improvements.push(`Added ${formatType} format specifications`);
      }
    });

    return { enhanced, rulesApplied, improvements };
  }

  private addCinematicElements(prompt: string): {
    enhanced: string;
    rulesApplied: string[];
    improvements: string[];
  } {
    let enhanced = prompt;
    const rulesApplied: string[] = [];
    const improvements: string[] = [];

    // Add character development guidance
    if (/character|protagonist|hero|villain/i.test(prompt) && !/backstory|motivation|arc/i.test(prompt)) {
      enhanced += '\n\nCharacter Development Framework:\n';
      enhanced += '- Backstory: Define character history and formative experiences\n';
      enhanced += '- Motivation: Establish clear wants, needs, and internal conflicts\n';
      enhanced += '- Character Arc: Plan transformation journey throughout story\n';
      enhanced += '- Relationships: Develop dynamics with other characters';

      rulesApplied.push('add_character_development');
      improvements.push('Added comprehensive character development framework');
    }

    // Add visual storytelling elements
    if (/scene|visual|cinematic/i.test(prompt) && !/visual\s+storytelling/i.test(prompt)) {
      enhanced += '\n\nVisual Storytelling Elements:\n';
      enhanced += '- Scene composition and visual metaphors\n';
      enhanced += '- Camera movement and shot selection considerations\n';
      enhanced += '- Visual motifs and symbolic elements\n';
      enhanced += '- Show don\'t tell approach to narrative advancement';

      rulesApplied.push('add_visual_storytelling');
      improvements.push('Added visual storytelling and cinematic technique guidance');
    }

    // Add theme and subtext guidance
    if (/story|narrative|script/i.test(prompt) && !/theme|subtext|meaning/i.test(prompt)) {
      enhanced += '\n\nThematic Development:\n';
      enhanced += '- Central theme and universal message\n';
      enhanced += '- Subtext in dialogue and character interactions\n';
      enhanced += '- Symbolic elements supporting thematic content\n';
      enhanced += '- Audience takeaway and emotional resonance';

      rulesApplied.push('add_thematic_development');
      improvements.push('Added thematic depth and subtext guidance');
    }

    // Add industry formatting standards
    if (/script|screenplay|guión/i.test(prompt) && !/format|standard|industry/i.test(prompt)) {
      enhanced += '\n\nIndustry Formatting Standards:\n';
      enhanced += '- Follow Final Draft or industry-standard screenplay format\n';
      enhanced += '- Proper scene headers, action lines, and dialogue formatting\n';
      enhanced += '- Consistent character name formatting throughout\n';
      enhanced += '- Professional presentation for industry submission';

      rulesApplied.push('add_industry_formatting');
      improvements.push('Added professional screenplay formatting requirements');
    }

    return { enhanced, rulesApplied, improvements };
  }

  generateSystemPrompt(analysis?: AnalysisResult, context?: string): string {
    const basePrompt = `You are a professional screenwriter and story consultant with extensive experience in:

**Screenwriting & Story Structure:**
- Three-act structure and dramatic story beats
- Character development and compelling character arcs
- Dialogue writing that reveals character and advances plot
- Genre-specific storytelling techniques and conventions

**Cinematic Storytelling:**
- Visual storytelling and "show don't tell" principles
- Scene construction and dramatic tension building
- Subtext, theme development, and symbolic elements
- Pacing, rhythm, and narrative flow

**Industry Knowledge:**
- Professional screenplay formatting (Final Draft standards)
- Genre conventions and audience expectations
- Film industry submission requirements and standards
- Contemporary cinema trends and storytelling innovations

**Character & Theme:**
- Multi-dimensional character creation with clear motivations
- Relationship dynamics and character interaction
- Thematic resonance and universal human experiences
- Cultural authenticity and diverse representation

Always provide:
- Industry-standard screenplay formatting and structure
- Rich character development with clear motivations and arcs
- Visual storytelling techniques appropriate for cinema
- Genre-appropriate pacing and story elements
- Professional presentation suitable for industry submission
- Thematic depth with emotional resonance

Consider the target audience, production budget implications, and current market trends when developing narrative content.`;

    // Add context-specific guidance
    if (context) {
      return `${basePrompt}\n\nAdditional Context: ${context}`;
    }

    // Add analysis-based guidance
    if (analysis?.complexity && analysis.complexity > 0.7) {
      return `${basePrompt}\n\nNote: This is a complex narrative project. Provide comprehensive story structure with detailed character development and thematic layers.`;
    }

    // Add genre-specific guidance based on detected patterns
    if (analysis?.technicalTerms.some(term => ['action', 'thriller', 'horror'].includes(term.toLowerCase()))) {
      return `${basePrompt}\n\nGenre Focus: Emphasize pacing, tension building, and visual storytelling techniques appropriate for high-energy cinematic experiences.`;
    }

    return basePrompt;
  }

  getDomainConfig(): DomainConfig {
    return {
      domain: PromptDomain.CINE,
      description: 'Screenwriting, film production, and cinematic storytelling',
      defaultRules: this.getDefaultRules(),
      systemPromptTemplate: this.generateSystemPrompt(),
      commonPatterns: [
        {
          name: 'screenplay_format',
          regex: /\b(script|screenplay|guión|treatment)\b/gi,
          description: 'Screenplay writing and formatting patterns'
        },
        {
          name: 'character_development',
          regex: /\b(character|protagonist|hero|villain|personaje)\b/gi,
          description: 'Character creation and development patterns'
        },
        {
          name: 'story_structure',
          regex: /\b(story|plot|narrative|structure|arc)\b/gi,
          description: 'Story structure and narrative development patterns'
        },
        {
          name: 'genre_elements',
          regex: /\b(action|drama|comedy|thriller|horror|romance)\b/gi,
          description: 'Genre-specific storytelling patterns'
        }
      ],
      qualityWeights: {
        clarity: 0.2,      // Important for clear narrative
        specificity: 0.35, // Critical for character and plot detail
        structure: 0.3,    // Very important for story structure
        completeness: 0.15 // Moderate importance
      },
      examples: [
        {
          title: 'Vague Film Concept Enhancement',
          before: 'write bonita película about interesting character who does cool things',
          after: 'Develop a screenplay featuring a multi-dimensional protagonist with clear motivations who embarks on a compelling cinematic narrative with strong character development.\n\nCharacter Development Framework:\n- Backstory: Define character history and formative experiences\n- Motivation: Establish clear wants, needs, and internal conflicts\n- Character Arc: Plan transformation journey throughout story\n- Relationships: Develop dynamics with other characters\n\nFormat Requirements:\n- Standard feature length: 90-120 pages (90-120 minutes)\n- Three-act structure with clear turning points\n- Industry-standard Final Draft formatting\n- Professional presentation for industry submission',
          explanation: 'Transformed vague film idea into professional screenplay development framework',
          score_improvement: 0.78
        },
        {
          title: 'Genre-Specific Enhancement',
          before: 'make action movie with exciting scenes and good characters',
          after: 'Develop a screenplay in the ACTION genre with elements of high-stakes conflict, physical challenges, escalating tension, and heroic journey.\n\nACTION Genre Specifications:\n- Key Elements: high-stakes conflict, physical challenges, escalating tension, heroic journey\n- Structure: three-act structure with action sequences driving plot progression\n- Tone: dynamic pacing with moments of tension and release\n\nCharacter Development Framework:\n- Multi-dimensional protagonist with clear physical and emotional goals\n- Compelling antagonist with understandable motivations\n- Character growth through physical and emotional challenges\n\nVisual Storytelling Elements:\n- Action sequences that advance character development\n- Cinematic set pieces with clear spatial geography\n- Visual metaphors supporting thematic content',
          explanation: 'Enhanced generic action request with genre-specific professional framework',
          score_improvement: 0.71
        }
      ]
    };
  }

  private getDefaultRules(): DomainRule[] {
    const rules: DomainRule[] = [];

    // Vague term replacement rules
    this.patterns.vague.forEach((pattern, index) => {
      rules.push({
        id: `cinema_vague_${index}`,
        domain: PromptDomain.CINE,
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
        id: `cinema_structure_${index}`,
        domain: PromptDomain.CINE,
        pattern: pattern.match,
        replacement: pattern.replace,
        priority: 7,
        active: true,
        description: pattern.description,
        category: RuleCategory.STRUCTURE,
      });
    });

    // Character development enhancement rules
    this.patterns.characterDevelopment.forEach((enhancement, index) => {
      rules.push({
        id: `cinema_character_${index}`,
        domain: PromptDomain.CINE,
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