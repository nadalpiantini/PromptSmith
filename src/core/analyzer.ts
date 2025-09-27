import nlp from 'compromise';
import natural from 'natural';
import {
  AnalysisResult,
  Token,
  Entity,
  Intent,
} from '../types/prompt.js';

export class PromptAnalyzer {
  private tokenizer: any;
  private stemmer: any;
  private sentiment: any;

  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.sentiment = new natural.SentimentAnalyzer(
      'English',
      natural.PorterStemmer,
      'afinn'
    );
  }

  async analyze(rawPrompt: string): Promise<AnalysisResult> {
    try {
      // Clean and validate input
      const cleanedPrompt = this.cleanInput(rawPrompt);
      const startTime = Date.now();

      // Tokenization and basic processing
      const tokens = this.tokenizeText(cleanedPrompt);

      // Entity extraction
      const entities = this.extractEntities(cleanedPrompt);

      // Intent classification
      const intent = this.detectIntent(cleanedPrompt, tokens);

      // Complexity calculation
      const complexity = this.calculateComplexity(cleanedPrompt, tokens);

      // Ambiguity scoring
      const ambiguityScore = this.calculateAmbiguity(cleanedPrompt, tokens);

      // Variable detection
      const hasVariables = this.detectVariables(cleanedPrompt);

      // Language detection
      const language = this.detectLanguage(cleanedPrompt);

      // Domain hints extraction
      const domainHints = this.extractDomainHints(cleanedPrompt, tokens);

      // Sentiment analysis
      const sentimentScore = this.analyzeSentiment(cleanedPrompt);

      // Readability scoring
      const readabilityScore = this.calculateReadability(cleanedPrompt);

      // Technical terms extraction
      const technicalTerms = this.extractTechnicalTerms(cleanedPrompt, tokens);

      const _processingTime = Date.now() - startTime;

      return {
        tokens,
        entities,
        intent,
        complexity,
        ambiguityScore,
        hasVariables,
        language,
        domainHints,
        sentimentScore,
        readabilityScore,
        technicalTerms,
      };

    } catch (error) {
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private tokenizeText(text: string): Token[] {
    try {
      const doc = nlp(text);
      const tokens: Token[] = [];

      doc.terms().forEach((term: any) => {
        const token: Token = {
          text: term.text(),
          pos: term.pos().tag || 'unknown',
          lemma: term.root().text() || term.text(),
          isStopWord: this.isStopWord(term.text()),
          sentiment: this.getTokenSentiment(term.text()),
        };
        tokens.push(token);
      });

      return tokens;
    } catch (error) {
      // Fallback to basic tokenization
      return this.basicTokenize(text);
    }
  }

  private basicTokenize(text: string): Token[] {
    const words = this.tokenizer.tokenize(text) || []; // Preserve original case
    return words.map((word: string) => ({
      text: word,
      pos: 'unknown',
      lemma: this.stemmer.stem(word.toLowerCase()), // Stem on lowercase version
      isStopWord: this.isStopWord(word),
      sentiment: this.getTokenSentiment(word),
    }));
  }

  private extractEntities(text: string): Entity[] {
    try {
      const doc = nlp(text);
      const entities: Entity[] = [];

      // Person names
      doc.people().forEach((person: any) => {
        entities.push({
          text: person.text(),
          label: 'PERSON',
          start: person.offset().start,
          end: person.offset().start + person.text().length,
          confidence: 0.8,
        });
      });

      // Places
      doc.places().forEach((place: any) => {
        entities.push({
          text: place.text(),
          label: 'PLACE',
          start: place.offset().start,
          end: place.offset().start + place.text().length,
          confidence: 0.7,
        });
      });

      // Organizations
      doc.organizations().forEach((org: any) => {
        entities.push({
          text: org.text(),
          label: 'ORGANIZATION',
          start: org.offset().start,
          end: org.offset().start + org.text().length,
          confidence: 0.6,
        });
      });

      // Technical patterns
      const techPatterns = [
        { pattern: /\b[A-Z]{2,}\b/g, label: 'TECH_ACRONYM' },
        { pattern: /\b\w+\.(js|ts|py|sql|html|css|java|cpp|c|php|rb|go|rs)\b/gi, label: 'FILE_EXTENSION' },
        { pattern: /\bhttps?:\/\/\S+/g, label: 'URL' },
        { pattern: /\b\d+(\.\d+)*\b/g, label: 'VERSION' },
        { pattern: /\$\w+/g, label: 'VARIABLE' },
        { pattern: /\{\{\s*\w+\s*\}\}/g, label: 'TEMPLATE_VARIABLE' },
        // Database technologies
        { pattern: /\b(PostgreSQL|MySQL|MongoDB|Redis|SQLite|MariaDB|Oracle|SQL\s*Server)\b/gi, label: 'DATABASE' },
        // Programming languages and frameworks
        { pattern: /\b(React|Vue|Angular|Node\.?js|Python|JavaScript|TypeScript|Java|C\+\+|PHP|Ruby|Go|Rust)\b/gi, label: 'TECHNOLOGY' },
        // Authentication systems
        { pattern: /\b(OAuth2?|JWT|SAML|OpenID|SSO|2FA|MFA)\b/gi, label: 'AUTH_TECH' },
      ];

      techPatterns.forEach(({ pattern, label }) => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          entities.push({
            text: match[0],
            label,
            start: match.index,
            end: match.index + match[0].length,
            confidence: 0.9,
          });
        }
      });

      return entities;
    } catch (error) {
      return [];
    }
  }

  private detectIntent(text: string, tokens: Token[]): Intent {
    const lowerText = text.toLowerCase();
    const tokenTexts = tokens.map(t => t.text.toLowerCase());

    // Intent patterns
    const intentPatterns = [
      {
        category: 'create',
        keywords: ['create', 'generate', 'make', 'build', 'write', 'develop', 'design'],
        confidence: 0.0,
      },
      {
        category: 'modify',
        keywords: ['update', 'change', 'modify', 'edit', 'alter', 'adjust', 'improve'],
        confidence: 0.0,
      },
      {
        category: 'analyze',
        keywords: ['analyze', 'examine', 'review', 'assess', 'evaluate', 'check'],
        confidence: 0.0,
      },
      {
        category: 'explain',
        keywords: ['explain', 'describe', 'tell', 'show', 'help', 'guide'],
        confidence: 0.0,
      },
      {
        category: 'debug',
        keywords: ['fix', 'debug', 'solve', 'troubleshoot', 'error', 'issue'],
        confidence: 0.0,
      },
      {
        category: 'optimize',
        keywords: ['optimize', 'improve', 'enhance', 'refactor', 'performance'],
        confidence: 0.0,
      },
    ];

    // Calculate confidence for each intent
    intentPatterns.forEach(pattern => {
      pattern.keywords.forEach(keyword => {
        if (tokenTexts.includes(keyword) || lowerText.includes(keyword)) {
          pattern.confidence += 0.2;
        }
      });

      // Boost confidence for exact matches
      if (lowerText.startsWith(pattern.keywords[0])) {
        pattern.confidence += 0.3;
      }
    });

    // Find the intent with highest confidence
    const bestIntent = intentPatterns.reduce((prev, current) =>
      prev.confidence > current.confidence ? prev : current
    );

    // Get subcategories based on the primary intent
    const subcategories = this.getIntentSubcategories(bestIntent.category, lowerText);

    return {
      category: bestIntent.category,
      confidence: Math.min(bestIntent.confidence, 1.0),
      subcategories,
    };
  }

  private getIntentSubcategories(category: string, text: string): string[] {
    const subcategoryMap: Record<string, string[]> = {
      create: ['table', 'function', 'class', 'component', 'api', 'query', 'script'],
      modify: ['refactor', 'update', 'style', 'structure', 'logic'],
      analyze: ['performance', 'security', 'quality', 'code', 'data'],
      explain: ['concept', 'code', 'process', 'algorithm', 'pattern'],
      debug: ['error', 'bug', 'issue', 'performance', 'logic'],
      optimize: ['performance', 'memory', 'speed', 'efficiency', 'size'],
    };

    const subcategories = subcategoryMap[category] || [];
    return subcategories.filter(sub => text.includes(sub));
  }

  private calculateComplexity(text: string, tokens: Token[]): number {
    // Handle empty text case
    if (text.length === 0 || tokens.length === 0) {
      return 0; // Zero complexity for empty text
    }

    let complexity = 0;

    // Length complexity - much higher weight for long texts
    const lengthFactor = Math.min(text.length / 100, 2.0) * 0.35; // Much higher weight
    complexity += lengthFactor;

    // Sentence complexity
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 0) {
      const avgSentenceLength = text.length / sentences.length;
      const sentenceFactor = Math.min(avgSentenceLength / 30, 1.5) * 0.25; // Higher weight
      complexity += sentenceFactor;
    }

    // Vocabulary complexity
    const uniqueWords = new Set(tokens.map(t => t.lemma));
    const vocabularyRichness = uniqueWords.size / tokens.length;
    complexity += vocabularyRichness * 0.15;

    // Technical term complexity
    const techTermCount = tokens.filter(t =>
      this.isTechnicalTerm(t.text) || t.pos === 'Acronym'
    ).length;
    const techFactor = Math.min(techTermCount / tokens.length * 5, 1.0) * 0.15;
    complexity += techFactor;

    // Syntactic complexity
    const conjunctions = tokens.filter(t => ['CC', 'IN'].includes(t.pos)).length;
    const syntacticFactor = Math.min(conjunctions / tokens.length * 2, 1.0) * 0.1;
    complexity += syntacticFactor;

    return Math.min(complexity, 1.0);
  }

  private calculateAmbiguity(text: string, tokens: Token[]): number {
    // Handle empty text case
    if (tokens.length === 0) {
      return 1.0; // Maximum ambiguity for empty text
    }

    let ambiguityScore = 0;

    // Vague terms
    const vagueTerms = [
      'good', 'bad', 'nice', 'bonito', 'bonita', 'bueno', 'malo',
      'stuff', 'things', 'something', 'anything', 'some', 'many',
      'big', 'small', 'fast', 'slow', 'easy', 'hard', 'simple',
    ];

    const vagueCount = tokens.filter(t =>
      vagueTerms.includes(t.text.toLowerCase())
    ).length;
    ambiguityScore += (vagueCount / tokens.length) * 0.4;

    // Indefinite pronouns
    const indefinitePronouns = ['it', 'this', 'that', 'these', 'those', 'they'];
    const pronounCount = tokens.filter(t =>
      indefinitePronouns.includes(t.text.toLowerCase())
    ).length;
    ambiguityScore += (pronounCount / tokens.length) * 0.3;

    // Modal verbs indicating uncertainty
    const modalVerbs = ['might', 'could', 'should', 'would', 'may'];
    const modalCount = tokens.filter(t =>
      modalVerbs.includes(t.text.toLowerCase())
    ).length;
    ambiguityScore += (modalCount / tokens.length) * 0.2;

    // Hedge words
    const hedgeWords = ['probably', 'maybe', 'perhaps', 'possibly', 'somewhat'];
    const hedgeCount = tokens.filter(t =>
      hedgeWords.includes(t.text.toLowerCase())
    ).length;
    ambiguityScore += (hedgeCount / tokens.length) * 0.1;

    return Math.min(ambiguityScore, 1.0);
  }

  private detectVariables(text: string): boolean {
    const variablePatterns = [
      /\{\{\s*\w+\s*\}\}/g,  // {{variable}}
      /\$\w+/g,              // $variable
      /:\w+/g,               // :variable
      /%\w+%/g,              // %variable%
      /\[[\w\s]+\]/g,        // [placeholder]
      /<[\w\s]+>/g,          // <placeholder>
    ];

    return variablePatterns.some(pattern => pattern.test(text));
  }

  private detectLanguage(text: string): string {
    // Simple language detection based on common patterns
    const spanishPatterns = /\b(el|la|los|las|un|una|de|del|en|con|por|para|que|es|son|esta|esta|muy|bonit[ao]|bueno|malo)\b/gi;
    const englishPatterns = /\b(the|a|an|and|or|but|in|on|at|to|for|of|with|by|is|are|was|were|good|bad|nice)\b/gi;

    const spanishMatches = (text.match(spanishPatterns) || []).length;
    const englishMatches = (text.match(englishPatterns) || []).length;

    if (spanishMatches > englishMatches) {
      return 'es';
    } else if (englishMatches > spanishMatches) {
      return 'en';
    } else {
      return 'unknown';
    }
  }

  private extractDomainHints(text: string, tokens: Token[]): string[] {
    const domainKeywords = {
      sql: ['table', 'query', 'database', 'select', 'insert', 'update', 'delete', 'join', 'sql', 'db', 'schema'],
      branding: ['brand', 'marketing', 'campaign', 'logo', 'copy', 'audience', 'message', 'slogan'],
      cine: ['script', 'screenplay', 'film', 'movie', 'cinema', 'character', 'scene', 'dialogue'],
      saas: ['app', 'application', 'feature', 'user', 'dashboard', 'api', 'integration', 'subscription'],
      devops: ['deploy', 'deployment', 'docker', 'kubernetes', 'aws', 'cloud', 'pipeline', 'infrastructure'],
    };

    const hints: string[] = [];
    const lowerText = text.toLowerCase();

    Object.entries(domainKeywords).forEach(([domain, keywords]) => {
      const matchCount = keywords.filter(keyword => lowerText.includes(keyword)).length;
      if (matchCount > 0) {
        hints.push(domain);
      }
    });

    return hints;
  }

  private analyzeSentiment(text: string): number {
    try {
      const tokens = this.tokenizer.tokenize(text.toLowerCase()) || [];
      const score = this.sentiment.getSentiment(tokens);
      return Math.max(-1, Math.min(1, score));
    } catch {
      return 0;
    }
  }

  private calculateReadability(text: string): number {
    // Simplified Flesch Reading Ease score
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);

    if (sentences.length === 0 || words.length === 0) return 0;

    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    const fleschScore = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;

    // Normalize to 0-1 scale (0 = difficult, 1 = easy)
    return Math.max(0, Math.min(1, fleschScore / 100));
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;

    const vowels = 'aeiouy';
    let syllableCount = 0;
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        syllableCount++;
      }
      previousWasVowel = isVowel;
    }

    // Adjust for silent 'e'
    if (word.endsWith('e')) {
      syllableCount--;
    }

    return Math.max(1, syllableCount);
  }

  private extractTechnicalTerms(text: string, tokens: Token[]): string[] {
    const technicalTerms: string[] = [];

    tokens.forEach(token => {
      if (this.isTechnicalTerm(token.text)) {
        // Preserve case for technical terms
        technicalTerms.push(token.text);
      }
    });

    // Also check for case-insensitive matches to preserve original casing
    const originalWords = text.match(/\b\w+\b/g) || [];
    originalWords.forEach(word => {
      if (this.isTechnicalTerm(word) && !technicalTerms.some(term => 
        term.toLowerCase() === word.toLowerCase())) {
        technicalTerms.push(word);
      }
    });

    // Remove duplicates (case-insensitive)
    const uniqueTerms: string[] = [];
    const seen = new Set<string>();
    technicalTerms.forEach(term => {
      if (!seen.has(term.toLowerCase())) {
        seen.add(term.toLowerCase());
        uniqueTerms.push(term);
      }
    });

    return uniqueTerms;
  }

  private isTechnicalTerm(word: string): boolean {
    const techPatterns = [
      /^[A-Z]{2,}$/, // Acronyms
      /^\w+\.(js|ts|py|sql|html|css|java)$/i, // File extensions
      /^(API|HTTP|JSON|XML|CSS|HTML|SQL|NoSQL|REST|GraphQL)$/i, // Common tech terms
      /^(React|Vue|Angular|Node|Express|Django|Flask)$/i, // Frameworks
      /^(Docker|Kubernetes|AWS|GCP|Azure)$/i, // DevOps tools
      /^(OAuth2?|JWT|SAML|SSO|2FA|MFA)$/i, // Authentication
      /^(PostgreSQL|MySQL|MongoDB|Redis|SQLite)$/i, // Databases
      /^(JavaScript|TypeScript|Python|Java|PHP|Ruby|Go|Rust)$/i, // Languages
      /^(function|class|interface|component|method|endpoint|database|schema|table)$/i, // Programming concepts
    ];

    return techPatterns.some(pattern => pattern.test(word));
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
      'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
      'to', 'was', 'will', 'with', 'el', 'la', 'los', 'las', 'de', 'en',
    ]);

    return stopWords.has(word.toLowerCase());
  }

  private cleanInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    // Remove null characters and control characters except newlines and tabs
    const cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Trim excessive whitespace
    const trimmed = cleaned.replace(/\s+/g, ' ').trim();
    
    // Limit length to prevent performance issues
    const maxLength = 10000;
    return trimmed.length > maxLength ? trimmed.substring(0, maxLength) : trimmed;
  }

  private getTokenSentiment(word: string): number {
    // Simple sentiment scoring
    const positiveWords = new Set(['good', 'great', 'awesome', 'excellent', 'nice', 'wonderful']);
    const negativeWords = new Set(['bad', 'terrible', 'awful', 'horrible', 'wrong', 'error']);

    if (positiveWords.has(word.toLowerCase())) return 1;
    if (negativeWords.has(word.toLowerCase())) return -1;
    return 0;
  }
}