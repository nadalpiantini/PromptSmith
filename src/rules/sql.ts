import { DomainRule, RuleCategory, DomainConfig } from '../types/domain.js';
import { PromptDomain, AnalysisResult } from '../types/prompt.js';

export class SQLRules {
  private patterns = {
    vague: [
      {
        match: /bonit[oa]s?\s+(tabla[s]?|table[s]?)/gi,
        replace: 'well-structured, normalized database table',
        description: 'Replace vague Spanish "bonita tabla" with professional SQL terminology'
      },
      {
        match: /buen[oa]s?\s+(query|consulta)/gi,
        replace: 'optimized SQL query with proper indexing',
        description: 'Enhance vague "buena query" with performance considerations'
      },
      {
        match: /mal[oa]\s+(query|consulta)/gi,
        replace: 'inefficient query that needs optimization',
        description: 'Clarify what makes a query problematic'
      },
      {
        match: /tabla[s]?\s+sql/gi,
        replace: 'database table schema',
        description: 'Remove redundant "SQL" when referring to tables'
      },
      {
        match: /bd|base\s+de\s+datos/gi,
        replace: 'relational database',
        description: 'Use proper English database terminology'
      },
      {
        match: /hacer\s+(query|consulta)/gi,
        replace: 'execute SQL query',
        description: 'Use proper SQL action verbs'
      }
    ],

    structure: [
      {
        match: /^(hazme|dame|necesito)/gi,
        replace: 'Generate a database schema for',
        description: 'Convert command to professional request'
      },
      {
        match: /^(create|make|build)\s+table/gi,
        replace: 'Design a database table',
        description: 'Use design-oriented language for better results'
      },
      {
        match: /con\s+join/gi,
        replace: 'including appropriate JOIN operations',
        description: 'Clarify JOIN requirements'
      },
      {
        match: /optimizad[oa]/gi,
        replace: 'with performance optimizations including indexes',
        description: 'Specify optimization techniques'
      },
      {
        match: /fast\s+query/gi,
        replace: 'performance-optimized query with appropriate indexes',
        description: 'Specify how to achieve query performance'
      }
    ],

    enhancements: [
      {
        trigger: /table|schema/i,
        enhancement: 'Include appropriate data types, constraints, and foreign key relationships'
      },
      {
        trigger: /query|select/i,
        enhancement: 'Consider query performance with proper indexing strategy'
      },
      {
        trigger: /database|db/i,
        enhancement: 'Specify database engine (PostgreSQL, MySQL, SQLite) if relevant'
      },
      {
        trigger: /migration|update/i,
        enhancement: 'Include rollback strategy and data safety considerations'
      },
      {
        trigger: /analytics|report/i,
        enhancement: 'Consider aggregation performance and materialized views if needed'
      }
    ],

    technicalPatterns: [
      {
        pattern: /\b(user|customer|client)\b/gi,
        replacement: 'users',
        context: 'table_name',
        description: 'Standardize entity naming in table context'
      },
      {
        pattern: /\b(product|item)\b/gi,
        replacement: 'products',
        context: 'table_name',
        description: 'Use plural form for table names'
      },
      {
        pattern: /\b(order|pedido)\b/gi,
        replacement: 'orders',
        context: 'table_name',
        description: 'Handle Spanish/English order terminology'
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
        const before = refined;
        refined = refined.replace(pattern.match, pattern.replace);
        rulesApplied.push(`vague_${pattern.description}`);
        improvements.push(`Replaced vague terminology: "${pattern.match.source}" → "${pattern.replace}"`);
      }
    });

    // Apply structural improvements
    this.patterns.structure.forEach(pattern => {
      if (pattern.match.test(refined)) {
        const before = refined;
        refined = refined.replace(pattern.match, pattern.replace);
        rulesApplied.push(`structure_${pattern.description}`);
        improvements.push(`Improved structure: ${pattern.description}`);
      }
    });

    // Apply technical pattern standardization
    this.patterns.technicalPatterns.forEach(pattern => {
      if (pattern.pattern.test(refined)) {
        refined = refined.replace(pattern.pattern, pattern.replacement);
        rulesApplied.push(`technical_${pattern.description}`);
        improvements.push(`Standardized terminology: ${pattern.description}`);
      }
    });

    // Add context-specific enhancements
    const contextEnhancements = this.addContextualEnhancements(refined);
    if (contextEnhancements.enhanced !== refined) {
      refined = contextEnhancements.enhanced;
      rulesApplied.push(...contextEnhancements.rulesApplied);
      improvements.push(...contextEnhancements.improvements);
    }

    // Ensure SQL best practices
    const bestPractices = this.ensureBestPractices(refined);
    if (bestPractices.enhanced !== refined) {
      refined = bestPractices.enhanced;
      rulesApplied.push(...bestPractices.rulesApplied);
      improvements.push(...bestPractices.improvements);
    }

    return {
      refined: refined.trim(),
      rulesApplied,
      improvements
    };
  }

  private addContextualEnhancements(prompt: string): {
    enhanced: string;
    rulesApplied: string[];
    improvements: string[];
  } {
    let enhanced = prompt;
    const rulesApplied: string[] = [];
    const improvements: string[] = [];

    // Add sample data suggestion for table creation
    if (/\b(table|schema)\b/i.test(prompt) && !/sample|example/i.test(prompt)) {
      enhanced += '\n\nPlease include sample data (5-10 rows) to illustrate the table structure.';
      rulesApplied.push('add_sample_data_request');
      improvements.push('Added request for sample data');
    }

    // Add index considerations for performance queries
    if (/\b(performance|fast|slow|optimize)\b/i.test(prompt) && !/index/i.test(prompt)) {
      enhanced += '\n\nConsider appropriate indexes for performance optimization.';
      rulesApplied.push('add_index_considerations');
      improvements.push('Added indexing considerations');
    }

    // Add relationship specifications for multi-table requests
    if (/\b(join|relationship|foreign|key)\b/i.test(prompt)) {
      if (!/constraint/i.test(prompt)) {
        enhanced += '\n\nInclude foreign key constraints and relationship definitions.';
        rulesApplied.push('add_relationship_specs');
        improvements.push('Added relationship specifications');
      }
    }

    // Add data type specifications for table creation
    if (/\b(create|table|schema)\b/i.test(prompt) && !/data\s+type/i.test(prompt)) {
      enhanced += '\n\nSpecify appropriate data types for each column (VARCHAR, INTEGER, TIMESTAMP, etc.).';
      rulesApplied.push('add_data_type_specs');
      improvements.push('Added data type specifications');
    }

    return { enhanced, rulesApplied, improvements };
  }

  private ensureBestPractices(prompt: string): {
    enhanced: string;
    rulesApplied: string[];
    improvements: string[];
  } {
    let enhanced = prompt;
    const rulesApplied: string[] = [];
    const improvements: string[] = [];

    // Add naming convention guidance
    if (/\b(table|column|field)\b/i.test(prompt) && !/naming/i.test(prompt)) {
      enhanced += '\n\nUse snake_case naming convention for tables and columns.';
      rulesApplied.push('add_naming_conventions');
      improvements.push('Added naming convention guidance');
    }

    // Add comment requirements for complex structures
    if (/\b(complex|multiple|join|subquery)\b/i.test(prompt)) {
      enhanced += '\n\nInclude explanatory comments for complex queries and table structures.';
      rulesApplied.push('add_comment_requirements');
      improvements.push('Added comment requirements');
    }

    // Add normalization considerations for database design
    if (/\b(database|schema|design|table)\b/i.test(prompt) && !/normal/i.test(prompt)) {
      enhanced += '\n\nEnsure proper database normalization (3NF) while considering performance trade-offs.';
      rulesApplied.push('add_normalization_guidance');
      improvements.push('Added normalization considerations');
    }

    // Add backup and migration considerations
    if (/\b(production|deploy|migration|update)\b/i.test(prompt)) {
      enhanced += '\n\nConsider migration scripts and rollback procedures for production deployment.';
      rulesApplied.push('add_migration_considerations');
      improvements.push('Added migration and deployment considerations');
    }

    return { enhanced, rulesApplied, improvements };
  }

  generateSystemPrompt(analysis?: AnalysisResult, context?: string): string {
    const basePrompt = `You are a senior database architect and SQL expert with extensive experience in:

**Database Design:**
- Relational database modeling and normalization (1NF, 2NF, 3NF, BCNF)
- Entity-relationship diagrams and schema design
- Data integrity, constraints, and referential integrity
- Performance optimization through proper indexing strategies

**SQL Expertise:**
- Advanced SQL query optimization and execution plans
- Complex joins, subqueries, window functions, and CTEs
- Database-specific features (PostgreSQL, MySQL, SQLite, SQL Server, Oracle)
- Query performance tuning and bottleneck identification

**Best Practices:**
- Secure coding practices and SQL injection prevention
- Database transaction management and ACID properties
- Backup strategies, disaster recovery, and high availability
- Code documentation and maintainable SQL structure

**Performance & Scalability:**
- Index design and query optimization
- Partitioning strategies for large datasets
- Caching mechanisms and materialized views
- Database monitoring and performance metrics

Always provide:
- Clean, well-formatted SQL with consistent indentation
- Descriptive comments explaining complex logic
- Proper naming conventions (snake_case for tables/columns)
- Appropriate data types and constraints
- Sample data when requested
- Performance considerations and optimization tips
- Security best practices

Consider the specific database engine when relevant, and explain trade-offs between different approaches.`;

    // Add context-specific guidance
    if (context) {
      return `${basePrompt}\n\nAdditional Context: ${context}`;
    }

    // Add analysis-based guidance
    if (analysis?.complexity && analysis.complexity > 0.7) {
      return `${basePrompt}\n\nNote: This is a complex request. Break down the solution into logical components and provide step-by-step explanations.`;
    }

    return basePrompt;
  }

  getDomainConfig(): DomainConfig {
    return {
      domain: PromptDomain.SQL,
      description: 'Database design, SQL queries, and database optimization',
      defaultRules: this.getDefaultRules(),
      systemPromptTemplate: this.generateSystemPrompt(),
      commonPatterns: [
        {
          name: 'table_creation',
          regex: /\b(create|table|schema)\b/gi,
          description: 'Database table creation patterns'
        },
        {
          name: 'query_optimization',
          regex: /\b(select|query|performance|optimize)\b/gi,
          description: 'SQL query and performance patterns'
        },
        {
          name: 'relationship_design',
          regex: /\b(join|foreign|key|relationship)\b/gi,
          description: 'Database relationship patterns'
        }
      ],
      qualityWeights: {
        clarity: 0.3,      // High importance for SQL clarity
        specificity: 0.35, // Very important for technical accuracy
        structure: 0.2,    // Important for SQL formatting
        completeness: 0.15 // Moderate importance
      },
      examples: [
        {
          title: 'Vague Table Request Enhancement',
          before: 'hazme una bonita tabla para usuarios',
          after: 'Design a well-structured, normalized database table for users including:\n- Appropriate data types and constraints\n- Primary and foreign key relationships\n- Proper indexing for performance\n- Sample data (5-10 rows) to illustrate usage\n\nUse snake_case naming convention and include explanatory comments.',
          explanation: 'Transformed vague Spanish request into specific technical requirements',
          score_improvement: 0.65
        },
        {
          title: 'Query Performance Enhancement',
          before: 'make fast query for sales data',
          after: 'Create a performance-optimized SQL query for sales data analysis including:\n- Appropriate JOIN operations for related tables\n- Proper indexing strategy for query performance\n- Query execution plan considerations\n- Sample output format\n\nConsider database-specific optimizations (PostgreSQL, MySQL, etc.) and include explanatory comments for complex logic.',
          explanation: 'Enhanced generic performance request with specific optimization techniques',
          score_improvement: 0.58
        }
      ]
    };
  }

  private getDefaultRules(): DomainRule[] {
    const rules: DomainRule[] = [];

    // Vague term replacement rules
    this.patterns.vague.forEach((pattern, index) => {
      rules.push({
        id: `sql_vague_${index}`,
        domain: PromptDomain.SQL,
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
        id: `sql_structure_${index}`,
        domain: PromptDomain.SQL,
        pattern: pattern.match,
        replacement: pattern.replace,
        priority: 7,
        active: true,
        description: pattern.description,
        category: RuleCategory.STRUCTURE,
      });
    });

    // Enhancement rules
    this.patterns.enhancements.forEach((enhancement, index) => {
      rules.push({
        id: `sql_enhancement_${index}`,
        domain: PromptDomain.SQL,
        pattern: enhancement.trigger,
        replacement: (match: string) => `${match} (${enhancement.enhancement})`,
        priority: 5,
        active: true,
        description: `Add context: ${enhancement.enhancement}`,
        category: RuleCategory.ENHANCEMENT,
      });
    });

    return rules;
  }
}