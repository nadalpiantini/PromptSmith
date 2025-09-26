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

  getRules(): DomainRule[] {
    return this.getDefaultRules();
  }

  private getDomainRules(): DomainRule[] {
    // Return the domain rules for SQL
    return this.getDefaultRules();
  }

  private enhancePrompt(prompt: string): { improvements: any[] } {
    // Basic enhancement logic
    return { improvements: [] };
  }

  getSystemPrompt(): string {
    return this.generateSystemPrompt();
  }

  enhance(prompt: string): any[] {
    const result = this.apply(prompt);
    const enhancements: any[] = [];
    const lowerPrompt = prompt.toLowerCase();
    
    // Add structural enhancements
    if (result.rulesApplied.some(rule => rule.includes('structure'))) {
      enhancements.push({
        type: 'structure',
        enhancement: 'Improved prompt structure and clarity',
        priority: 8,
        category: 'sql_enhancement'
      });
    }
    
    // Add performance enhancements
    if (lowerPrompt.includes('performance') || lowerPrompt.includes('optimize') || lowerPrompt.includes('fast') || lowerPrompt.includes('slow')) {
      enhancements.push({
        type: 'performance',
        enhancement: 'Consider query optimization with EXPLAIN, indexes, and proper WHERE clauses',
        priority: 9,
        category: 'sql_enhancement'
      });
    }
    
    // Add security enhancements
    if (lowerPrompt.includes('user') || lowerPrompt.includes('password') || lowerPrompt.includes('auth')) {
      enhancements.push({
        type: 'security',
        enhancement: 'Implement proper authentication and parameterized queries to prevent SQL injection',
        priority: 10,
        category: 'sql_enhancement'
      });
    }
    
    // Add column specification enhancements
    if (lowerPrompt.includes('table') && !lowerPrompt.includes('column')) {
      enhancements.push({
        type: 'structure',
        enhancement: 'Specify column names, data types, and constraints for better table design',
        priority: 7,
        category: 'sql_enhancement'
      });
    }
    
    // Add JOIN enhancements
    if (lowerPrompt.includes('join') || lowerPrompt.includes('relationship')) {
      enhancements.push({
        type: 'structure',
        enhancement: 'Define proper foreign key relationships and JOIN conditions',
        priority: 8,
        category: 'sql_enhancement'
      });
    }
    
    // Add schema design enhancements
    if (lowerPrompt.includes('schema') || lowerPrompt.includes('database design')) {
      enhancements.push({
        type: 'schema',
        enhancement: 'Consider normalization, relationships, and data integrity constraints',
        priority: 8,
        category: 'sql_enhancement'
      });
    }
    
    // Add normalization enhancements
    if (lowerPrompt.includes('normalize') || lowerPrompt.includes('normalization')) {
      enhancements.push({
        type: 'structure',
        enhancement: 'Apply proper database normalization (1NF, 2NF, 3NF) to eliminate redundancy',
        priority: 8,
        category: 'sql_enhancement'
      });
    }
    
    // Add migration enhancements
    if (lowerPrompt.includes('migration') || lowerPrompt.includes('migrate')) {
      enhancements.push({
        type: 'migration',
        enhancement: 'Include rollback procedures and data safety considerations',
        priority: 9,
        category: 'sql_enhancement'
      });
    }
    
    // Add transaction enhancements
    if (lowerPrompt.includes('transaction') || lowerPrompt.includes('commit') || lowerPrompt.includes('rollback')) {
      enhancements.push({
        type: 'structure',
        enhancement: 'Implement proper transaction handling with BEGIN, COMMIT, and ROLLBACK',
        priority: 8,
        category: 'sql_enhancement'
      });
    }
    
    // Add backup and recovery enhancements
    if (lowerPrompt.includes('backup') || lowerPrompt.includes('recovery') || lowerPrompt.includes('restore')) {
      enhancements.push({
        type: 'structure',
        enhancement: 'Implement comprehensive backup and disaster recovery procedures',
        priority: 9,
        category: 'sql_enhancement'
      });
    }
    
    // Add stored procedure enhancements
    if (lowerPrompt.includes('procedure') || lowerPrompt.includes('function') || lowerPrompt.includes('stored')) {
      enhancements.push({
        type: 'structure',
        enhancement: 'Define proper stored procedures with error handling and documentation',
        priority: 8,
        category: 'sql_enhancement'
      });
    }
    
    // Add naming convention enhancements
    if (lowerPrompt.includes('naming') || lowerPrompt.includes('convention')) {
      enhancements.push({
        type: 'structure',
        enhancement: 'Use consistent naming conventions (snake_case for tables/columns)',
        priority: 7,
        category: 'sql_enhancement'
      });
    }
    
    // Add NoSQL to SQL conversion enhancements
    if (lowerPrompt.includes('nosql') || lowerPrompt.includes('mongodb') || lowerPrompt.includes('convert')) {
      enhancements.push({
        type: 'structure',
        enhancement: 'Design relational schema structure with proper relationships and constraints',
        priority: 8,
        category: 'sql_enhancement'
      });
    }
    
    return enhancements;
  }

  validate(prompt: string): any {
    const warnings: any[] = [];
    const suggestions: string[] = [];
    const errors: any[] = [];
    
    // Check for SELECT * usage
    if (prompt.toLowerCase().includes('select *')) {
      warnings.push({
        type: 'performance',
        message: 'SELECT * can impact performance. Consider specifying columns.',
        severity: 'medium'
      });
      suggestions.push('Use specific columns instead of SELECT *');
    }
    
    // Check for missing WHERE clause in UPDATE/DELETE
    if ((prompt.toLowerCase().includes('update') || prompt.toLowerCase().includes('delete')) && 
        !prompt.toLowerCase().includes('where')) {
      warnings.push({
        type: 'security',
        message: 'UPDATE/DELETE without WHERE clause can affect all rows.',
        severity: 'high'
      });
      suggestions.push('Add WHERE clause to limit affected rows');
    }
    
    // Check for vague table creation
    if (prompt.toLowerCase().includes('create table') && !prompt.toLowerCase().includes('columns')) {
      suggestions.push('Specify column names and data types');
    }
    
    // Check for vague prompts
    if (prompt.toLowerCase().includes('make database') || prompt.toLowerCase().includes('create database')) {
      suggestions.push('Be more specific about database requirements and structure');
    }
    
    // Check for SQL injection patterns
    if (prompt.includes("'") && prompt.includes('OR') && prompt.includes('=')) {
      warnings.push({
        type: 'security',
        message: 'Potential SQL injection pattern detected.',
        severity: 'high'
      });
      suggestions.push('Use parameterized queries to prevent SQL injection');
    }
    
    // Check for JOIN syntax
    if (prompt.toLowerCase().includes('join') && !prompt.toLowerCase().includes('on')) {
      warnings.push({
        type: 'syntax',
        message: 'JOIN statement missing ON clause.',
        severity: 'medium'
      });
      suggestions.push('Add proper ON clause for JOIN conditions');
    }
    
    // Check for index creation
    if (prompt.toLowerCase().includes('create index')) {
      suggestions.push('Consider the impact on write performance when creating indexes');
    }
    
    // Check for database type specification
    if (prompt.toLowerCase().includes('database') && !prompt.toLowerCase().includes('postgresql') && 
        !prompt.toLowerCase().includes('mysql') && !prompt.toLowerCase().includes('sqlite')) {
      suggestions.push('Specify database type (PostgreSQL, MySQL, SQLite) for better optimization');
    }
    
    return {
      isValid: warnings.length === 0 && errors.length === 0,
      errors,
      warnings,
      suggestions,
      domainSpecificChecks: {
        sql: {
          syntaxValid: !prompt.toLowerCase().includes('select *') && 
                      !((prompt.toLowerCase().includes('update') || prompt.toLowerCase().includes('delete')) && 
                        !prompt.toLowerCase().includes('where')),
          hasJoins: prompt.toLowerCase().includes('join'),
          hasIndexes: prompt.toLowerCase().includes('index')
        }
      }
    };
  }

  getExamples(type: string): string[] {
    // Return example prompts based on type
    const examples: Record<string, string[]> = {
      'create table': [
        'CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100), email VARCHAR(255) UNIQUE);',
        'CREATE TABLE products (id SERIAL PRIMARY KEY, name VARCHAR(255), price DECIMAL(10,2));',
        'CREATE TABLE orders (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), total DECIMAL(10,2));'
      ],
      'select query': [
        'SELECT * FROM users WHERE active = true;',
        'SELECT name, email FROM users WHERE created_at > \'2024-01-01\';',
        'SELECT COUNT(*) FROM orders WHERE status = \'completed\';'
      ],
      'join tables': [
        'SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id;',
        'SELECT p.name, c.name FROM products p JOIN categories c ON p.category_id = c.id;',
        'SELECT u.name, o.total, o.created_at FROM users u INNER JOIN orders o ON u.id = o.user_id WHERE o.status = \'completed\';'
      ]
    };
    
    return examples[type] || [];
  }
}