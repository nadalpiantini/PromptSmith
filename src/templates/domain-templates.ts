import { TemplateEngine, TemplateDefinition } from './engine.js';
import { PromptDomain, TemplateType } from '../types/prompt.js';

export function registerDomainTemplates(engine: TemplateEngine): void {
  registerSQLTemplates(engine);
  registerBrandingTemplates(engine);
  registerCinemaTemplates(engine);
  registerSaaSTemplates(engine);
  registerDevOpsTemplates(engine);
}

function registerSQLTemplates(engine: TemplateEngine): void {
  // SQL Basic Template
  const sqlBasic: TemplateDefinition = {
    id: 'basic_sql',
    name: 'SQL Basic Template',
    type: TemplateType.BASIC,
    domain: PromptDomain.SQL,
    description: 'Professional SQL development template',
    template: `{{ refined_prompt | capitalize }}

Database Requirements:
- Use appropriate data types and constraints
- Follow snake_case naming conventions
- Include primary keys and foreign key relationships
- Add indexes for performance optimization
- Provide explanatory comments for complex logic

{% if variables.database_type %}Database Engine: {{ variables.database_type }}{% endif %}
{% if variables.tables %}
Tables to work with:
{{ variables.tables | bullets }}
{% endif %}

{% if userContext %}Additional Requirements: {{ userContext }}{% endif %}

Please include sample data (5-10 rows) to demonstrate the structure.`,
    systemPrompt: `You are a senior database architect with expertise in relational database design and SQL optimization.

Always provide:
- Clean, well-formatted SQL with proper indentation
- Descriptive comments explaining complex logic
- Appropriate data types and constraints
- Performance optimization considerations
- Sample data when requested

Focus on:
- Database normalization best practices
- Query performance and indexing strategies
- Data integrity and referential constraints
- Scalable design patterns`,
    requiredVariables: ['refined_prompt'],
    optionalVariables: ['database_type', 'tables', 'userContext'],
    examples: [
      {
        input: 'Create user table',
        output: `CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`,
        explanation: 'Simple user table with constraints'
      }
    ]
  };

  // SQL Step-by-Step Template
  const sqlStepByStep: TemplateDefinition = {
    id: 'step_by_step_sql',
    name: 'SQL Step-by-Step Template',
    type: TemplateType.STEP_BY_STEP,
    domain: PromptDomain.SQL,
    description: 'Systematic database development approach',
    template: `{{ refined_prompt | capitalize }}

## Database Development Process:

### Step 1: Requirements Analysis
- [ ] Identify all entities and their attributes
- [ ] Define relationships between entities
- [ ] Determine data types and constraints
- [ ] Plan for scalability and performance

### Step 2: Schema Design
- [ ] Create normalized table structures (3NF)
- [ ] Define primary and foreign keys
- [ ] Plan indexing strategy
- [ ] Design for data integrity

### Step 3: Implementation
{% if variables.tables %}
Tables to create:
{{ variables.tables | numbered }}
{% else %}
1. Create base tables with primary keys
2. Add foreign key constraints
3. Create indexes for performance
4. Add check constraints and defaults
{% endif %}

### Step 4: Testing & Validation
- [ ] Insert sample data for testing
- [ ] Verify constraint behavior
- [ ] Test query performance
- [ ] Validate backup and recovery procedures

{% if userContext %}Special Considerations: {{ userContext }}{% endif %}`,
    systemPrompt: `You are a database architect who follows systematic development methodologies.

Guide users through:
1. Proper requirements gathering and analysis
2. Normalized database design principles
3. Performance optimization strategies
4. Comprehensive testing and validation

Ensure each step includes clear deliverables and validation criteria.`,
    requiredVariables: ['refined_prompt'],
    optionalVariables: ['tables', 'userContext']
  };

  engine.registerTemplate(sqlBasic);
  engine.registerTemplate(sqlStepByStep);
}

function registerBrandingTemplates(engine: TemplateEngine): void {
  // Branding Strategic Template
  const brandingStrategic: TemplateDefinition = {
    id: 'role_based_branding',
    name: 'Brand Strategy Template',
    type: TemplateType.ROLE_BASED,
    domain: PromptDomain.BRANDING,
    description: 'Strategic brand development approach',
    template: `As a strategic brand consultant, {{ refined_prompt }}

## Brand Strategy Framework:

### Target Audience Analysis
{% if variables.target_audience %}
Primary Audience: {{ variables.target_audience }}
{% else %}
- Define demographic characteristics (age, income, lifestyle)
- Identify psychographic traits (values, interests, behaviors)
- Map customer journey and touchpoints
{% endif %}

### Brand Positioning
- Unique value proposition and differentiation
- Competitive landscape and positioning gaps
- Brand personality and voice characteristics
- Core messaging pillars and key messages

### Creative Direction
{% if variables.brand_attributes %}
Brand Attributes: {{ variables.brand_attributes | join_and }}
{% endif %}
- Visual identity guidelines and standards
- Tone of voice and communication style
- Content strategy and messaging frameworks

### Implementation & Measurement
- Campaign objectives and success metrics
- Channel strategy and media planning
- Brand guidelines and consistency standards
- Performance tracking and optimization

{% if userContext %}Brand Context: {{ userContext }}{% endif %}`,
    systemPrompt: `You are a senior brand strategist with expertise in positioning, creative direction, and integrated marketing.

Always consider:
- Strategic business objectives and market positioning
- Target audience insights and behavioral patterns
- Competitive landscape and differentiation opportunities
- Measurable outcomes and brand performance metrics

Provide comprehensive strategic frameworks that connect creative expression to business results.`,
    requiredVariables: ['refined_prompt'],
    optionalVariables: ['target_audience', 'brand_attributes', 'userContext']
  };

  // Branding Campaign Template
  const brandingCampaign: TemplateDefinition = {
    id: 'step_by_step_branding',
    name: 'Brand Campaign Development',
    type: TemplateType.STEP_BY_STEP,
    domain: PromptDomain.BRANDING,
    description: 'Systematic campaign development process',
    template: `{{ refined_prompt | capitalize }}

## Campaign Development Process:

### Phase 1: Strategic Foundation
- [ ] Define campaign objectives and KPIs
- [ ] Analyze target audience and customer insights
- [ ] Research competitive landscape and positioning
- [ ] Establish budget parameters and resource requirements

### Phase 2: Creative Development
- [ ] Develop core messaging and value proposition
- [ ] Create brand voice and visual identity guidelines
- [ ] Design campaign creative assets and materials
- [ ] Plan content calendar and messaging sequence

### Phase 3: Channel Strategy & Execution
{% if variables.channels %}
Priority Channels: {{ variables.channels | join_and }}
{% else %}
- [ ] Select optimal marketing channels and platforms
- [ ] Adapt creative for each channel's best practices
- [ ] Plan media buying and budget allocation
- [ ] Coordinate integrated cross-channel approach
{% endif %}

### Phase 4: Launch & Optimization
- [ ] Execute soft launch with performance monitoring
- [ ] Analyze initial results and optimize messaging
- [ ] Scale successful elements across all channels
- [ ] Document learnings and best practices

{% if userContext %}Campaign Context: {{ userContext }}{% endif %}`,
    systemPrompt: `You are a campaign strategist who specializes in integrated marketing and brand development.

Focus on:
- Data-driven decision making and measurable outcomes
- Multi-channel integration and consistent messaging
- Creative excellence balanced with strategic objectives
- Continuous optimization based on performance insights`,
    requiredVariables: ['refined_prompt'],
    optionalVariables: ['channels', 'userContext']
  };

  engine.registerTemplate(brandingStrategic);
  engine.registerTemplate(brandingCampaign);
}

function registerCinemaTemplates(engine: TemplateEngine): void {
  // Cinema Screenplay Template
  const cinemaScreenplay: TemplateDefinition = {
    id: 'basic_cine',
    name: 'Screenplay Development Template',
    type: TemplateType.BASIC,
    domain: PromptDomain.CINE,
    description: 'Professional screenplay development framework',
    template: `{{ refined_prompt | capitalize }}

## Screenplay Development Requirements:

### Story Structure
- Three-act structure with clear turning points
- Character development and compelling character arcs
- Visual storytelling and cinematic techniques
- Genre-appropriate pacing and tone

### Format & Style
{% if variables.genre %}Genre: {{ variables.genre | title }}{% endif %}
{% if variables.format %}Format: {{ variables.format }}{% else %}Feature screenplay format (Final Draft standard){% endif %}
- Industry-standard formatting and presentation
- Professional scene headers and action lines
- Authentic dialogue and character voice

### Character Framework
{% if variables.characters %}
Key Characters:
{{ variables.characters | bullets }}
{% else %}
- Protagonist with clear motivation and goals
- Compelling antagonist with understandable opposition
- Supporting characters that advance plot and theme
{% endif %}

### Thematic Elements
- Central theme and universal message
- Subtext in dialogue and character interactions
- Visual metaphors and symbolic elements
- Emotional resonance and audience connection

{% if userContext %}Creative Context: {{ userContext }}{% endif %}`,
    systemPrompt: `You are a professional screenwriter with extensive industry experience in story development and screenplay formatting.

Always provide:
- Industry-standard screenplay format
- Rich character development with clear arcs
- Visual storytelling appropriate for cinema
- Professional presentation suitable for industry submission

Focus on:
- Three-act structure and dramatic story beats
- Character motivation and authentic dialogue
- Genre conventions and audience expectations
- Thematic depth and emotional resonance`,
    requiredVariables: ['refined_prompt'],
    optionalVariables: ['genre', 'format', 'characters', 'userContext']
  };

  // Cinema Step-by-Step Template
  const cinemaStoryDevelopment: TemplateDefinition = {
    id: 'step_by_step_cine',
    name: 'Story Development Process',
    type: TemplateType.STEP_BY_STEP,
    domain: PromptDomain.CINE,
    description: 'Systematic screenplay development methodology',
    template: `{{ refined_prompt | capitalize }}

## Story Development Process:

### Phase 1: Concept & Foundation
- [ ] Develop logline and core concept
- [ ] Define genre and target audience
- [ ] Establish central theme and message
- [ ] Create character profiles and backstories

### Phase 2: Structure & Outline
- [ ] Build three-act structure with turning points
- [ ] Map character arcs and transformation
- [ ] Plan major plot points and conflicts
- [ ] Develop subplot integration and pacing

### Phase 3: Scene Development
{% if variables.scenes %}
Key Scenes to Develop:
{{ variables.scenes | numbered }}
{% else %}
1. Opening sequence establishing character and world
2. Inciting incident and call to action
3. Major obstacles and character challenges
4. Climax and character transformation
5. Resolution and thematic conclusion
{% endif %}

### Phase 4: Script Polish & Revision
- [ ] Dialogue refinement and character voice
- [ ] Visual storytelling and action line clarity
- [ ] Format compliance and professional presentation
- [ ] Industry feedback integration and final draft

{% if userContext %}Project Context: {{ userContext }}{% endif %}`,
    systemPrompt: `You are a story development expert who guides writers through systematic screenplay creation.

Emphasize:
- Strong story foundation and character development
- Professional industry standards and formatting
- Visual storytelling and cinematic techniques
- Revision and feedback integration processes`,
    requiredVariables: ['refined_prompt'],
    optionalVariables: ['scenes', 'userContext']
  };

  engine.registerTemplate(cinemaScreenplay);
  engine.registerTemplate(cinemaStoryDevelopment);
}

function registerSaaSTemplates(engine: TemplateEngine): void {
  // SaaS Product Template
  const saasProduct: TemplateDefinition = {
    id: 'basic_saas',
    name: 'SaaS Product Development Template',
    type: TemplateType.BASIC,
    domain: PromptDomain.SAAS,
    description: 'Comprehensive SaaS product development framework',
    template: `{{ refined_prompt | capitalize }}

## SaaS Product Requirements:

### User Experience Design
- Intuitive interface with minimal learning curve
- Mobile-responsive design for cross-device access
- Accessibility compliance (WCAG 2.1 standards)
- Performance optimization for fast loading times

### Technical Architecture
{% if variables.tech_stack %}Tech Stack: {{ variables.tech_stack | join_and }}{% endif %}
- Cloud-native, scalable infrastructure design
- Microservices architecture for modular development
- API-first approach for integration capabilities
- Security best practices and data protection

### Business Model Integration
{% if variables.pricing_model %}Pricing Strategy: {{ variables.pricing_model }}{% endif %}
- Value-based pricing with clear tier differentiation
- Customer acquisition and retention optimization
- Usage analytics and feature adoption tracking
- Customer success and support integration

### Feature Specifications
{% if variables.core_features %}
Core Features:
{{ variables.core_features | bullets }}
{% else %}
- User authentication and account management
- Core functionality addressing primary use case
- Dashboard with actionable insights and analytics
- Integration capabilities and API access
{% endif %}

{% if userContext %}Product Context: {{ userContext }}{% endif %}`,
    systemPrompt: `You are a senior product manager specializing in SaaS development with expertise in user experience, technical architecture, and business strategy.

Focus on:
- User-centered design and optimal user experience
- Scalable technical solutions and integration capabilities
- Business model alignment and revenue optimization
- Data-driven product decisions and feature prioritization`,
    requiredVariables: ['refined_prompt'],
    optionalVariables: ['tech_stack', 'pricing_model', 'core_features', 'userContext']
  };

  // SaaS Role-Based Template
  const saasProductManager: TemplateDefinition = {
    id: 'role_based_saas',
    name: 'Product Manager Consultation',
    type: TemplateType.ROLE_BASED,
    domain: PromptDomain.SAAS,
    description: 'Expert product management consultation',
    template: `As a senior SaaS product manager, {{ refined_prompt }}

## Product Strategy Framework:

### Market & User Analysis
- Target market size and competition landscape
- User persona development and journey mapping
- Problem-solution fit validation and testing
- Product-market fit metrics and indicators

### Feature Prioritization
{% if variables.features %}
Requested Features: {{ variables.features | join_and }}
{% endif %}
- Jobs-to-be-done framework for feature evaluation
- Impact vs. effort matrix for development planning
- Customer feedback integration and validation
- Roadmap planning and milestone definition

### Growth & Metrics
- Key performance indicators (KPIs) and success metrics
- Customer acquisition cost (CAC) and lifetime value (LTV)
- Feature adoption rates and user engagement
- Retention optimization and churn reduction

### Technical Product Requirements
- Scalability requirements and performance targets
- Integration needs and API strategy
- Security and compliance considerations
- Mobile and accessibility requirements

{% if userContext %}Strategic Context: {{ userContext }}{% endif %}`,
    systemPrompt: `You are a seasoned SaaS product manager with deep expertise in product strategy, user research, and growth optimization.

Provide strategic guidance on:
- Product-market fit and user validation
- Feature prioritization and roadmap planning
- Growth metrics and business model optimization
- Technical requirements and scalability planning`,
    requiredVariables: ['refined_prompt'],
    optionalVariables: ['features', 'userContext']
  };

  engine.registerTemplate(saasProduct);
  engine.registerTemplate(saasProductManager);
}

function registerDevOpsTemplates(engine: TemplateEngine): void {
  // DevOps Infrastructure Template
  const devopsInfrastructure: TemplateDefinition = {
    id: 'basic_devops',
    name: 'Infrastructure Design Template',
    type: TemplateType.BASIC,
    domain: PromptDomain.DEVOPS,
    description: 'Comprehensive infrastructure design and automation',
    template: `{{ refined_prompt | capitalize }}

## Infrastructure Requirements:

### Cloud Architecture
{% if variables.cloud_provider %}Cloud Provider: {{ variables.cloud_provider }}{% endif %}
- Scalable, high-availability infrastructure design
- Auto-scaling policies and load balancing
- Multi-region deployment for disaster recovery
- Cost optimization and resource management

### CI/CD Pipeline
- Automated build, test, and deployment processes
- Code quality gates and security scanning
- Environment-specific deployment strategies
- Rollback mechanisms and blue-green deployments

### Security & Compliance
{% if variables.compliance_requirements %}
Compliance: {{ variables.compliance_requirements | join_and }}
{% endif %}
- Infrastructure as Code (IaC) with security scanning
- Identity and Access Management (IAM) with least privilege
- Secrets management and encryption at rest/transit
- Network security and firewall configurations

### Monitoring & Observability
- Comprehensive logging, metrics, and alerting
- Application Performance Monitoring (APM)
- Infrastructure monitoring and capacity planning
- Incident response and post-mortem procedures

{% if userContext %}Infrastructure Context: {{ userContext }}{% endif %}`,
    systemPrompt: `You are a senior DevOps engineer and Site Reliability Engineer with expertise in cloud infrastructure, automation, and operational excellence.

Always provide:
- Scalable, resilient infrastructure designs
- Automated solutions reducing manual intervention
- Security-first approach with defense in depth
- Comprehensive monitoring and alerting strategies

Focus on:
- Infrastructure as Code and GitOps workflows
- Continuous integration and deployment automation
- Site reliability engineering best practices
- Cost optimization and performance efficiency`,
    requiredVariables: ['refined_prompt'],
    optionalVariables: ['cloud_provider', 'compliance_requirements', 'userContext']
  };

  // DevOps Step-by-Step Template
  const devopsImplementation: TemplateDefinition = {
    id: 'step_by_step_devops',
    name: 'Infrastructure Implementation Process',
    type: TemplateType.STEP_BY_STEP,
    domain: PromptDomain.DEVOPS,
    description: 'Systematic infrastructure deployment methodology',
    template: `{{ refined_prompt | capitalize }}

## Infrastructure Implementation Process:

### Phase 1: Planning & Design
- [ ] Analyze requirements and constraints
- [ ] Design scalable architecture with HA considerations
- [ ] Plan security and compliance implementation
- [ ] Define monitoring and alerting strategy

### Phase 2: Infrastructure as Code
- [ ] Create IaC templates (Terraform/CloudFormation)
- [ ] Implement security scanning for infrastructure code
- [ ] Set up version control and review processes
- [ ] Plan modular, reusable infrastructure components

### Phase 3: CI/CD Pipeline Setup
{% if variables.pipeline_tools %}
Pipeline Tools: {{ variables.pipeline_tools | join_and }}
{% else %}
- [ ] Configure build and test automation
- [ ] Implement quality gates and security scanning
- [ ] Set up environment-specific deployments
- [ ] Create rollback and disaster recovery procedures
{% endif %}

### Phase 4: Monitoring & Operations
- [ ] Deploy comprehensive monitoring stack
- [ ] Configure alerting and incident response
- [ ] Implement log aggregation and analysis
- [ ] Document operational procedures and runbooks

### Phase 5: Security & Compliance
- [ ] Implement security hardening and best practices
- [ ] Configure backup and disaster recovery
- [ ] Set up compliance monitoring and reporting
- [ ] Conduct security audits and penetration testing

{% if userContext %}Implementation Context: {{ userContext }}{% endif %}`,
    systemPrompt: `You are a DevOps architect who specializes in systematic infrastructure implementation and operational excellence.

Guide users through:
- Comprehensive planning and architectural design
- Infrastructure as Code best practices and automation
- Security-first implementation with compliance considerations
- Operational excellence and monitoring strategies

Ensure each phase includes validation criteria and operational readiness checks.`,
    requiredVariables: ['refined_prompt'],
    optionalVariables: ['pipeline_tools', 'userContext']
  };

  engine.registerTemplate(devopsInfrastructure);
  engine.registerTemplate(devopsImplementation);
}