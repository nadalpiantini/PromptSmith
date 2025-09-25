import { DomainRule, RuleCategory, DomainConfig } from '../types/domain.js';
import { PromptDomain, AnalysisResult } from '../types/prompt.js';

export class DevOpsRules {
  private patterns = {
    vague: [
      {
        match: /bonit[oa]\s+(deploy|deployment|despliegue)/gi,
        replace: 'automated, reliable deployment pipeline',
        description: 'Replace vague deployment terminology with professional DevOps language'
      },
      {
        match: /buen[oa]\s+(pipeline|flujo)/gi,
        replace: 'efficient CI/CD pipeline with comprehensive testing',
        description: 'Specify pipeline quality and testing requirements'
      },
      {
        match: /fast\s+(deploy|build|compilation)/gi,
        replace: 'optimized deployment process with minimal downtime',
        description: 'Focus on deployment efficiency and reliability'
      },
      {
        match: /secure\s+(server|servidor)/gi,
        replace: 'hardened infrastructure with security best practices',
        description: 'Specify security implementation approach'
      },
      {
        match: /scalable\s+(infrastructure|infraestructura)/gi,
        replace: 'auto-scaling infrastructure with load balancing',
        description: 'Define scalability mechanisms'
      },
      {
        match: /monitoring\s+(system|sistema)/gi,
        replace: 'comprehensive observability stack with alerting',
        description: 'Specify monitoring scope and capabilities'
      }
    ],

    structure: [
      {
        match: /^(setup|configure|create)\s+(server|infrastructure)/gi,
        replace: 'Design and provision cloud infrastructure for',
        description: 'Frame as comprehensive infrastructure design'
      },
      {
        match: /^(automate|automatizar)\s+(deploy|deployment)/gi,
        replace: 'Implement automated deployment pipeline for',
        description: 'Focus on automation and pipeline implementation'
      },
      {
        match: /^(monitor|monitoring)\s+(app|application)/gi,
        replace: 'Establish comprehensive observability for',
        description: 'Emphasize complete monitoring strategy'
      },
      {
        match: /docker\s+(container|contenedor)/gi,
        replace: 'containerized application with Docker orchestration',
        description: 'Specify containerization strategy'
      }
    ],

    cloudProviders: {
      aws: {
        services: ['EC2', 'ECS/EKS', 'RDS', 'S3', 'CloudWatch', 'IAM', 'VPC', 'Route53'],
        patterns: ['Auto Scaling Groups', 'Application Load Balancer', 'CloudFormation/CDK'],
        monitoring: 'CloudWatch with custom metrics and dashboards'
      },
      gcp: {
        services: ['Compute Engine', 'GKE', 'Cloud SQL', 'Cloud Storage', 'Stackdriver'],
        patterns: ['Managed Instance Groups', 'Cloud Load Balancing', 'Deployment Manager'],
        monitoring: 'Google Cloud Monitoring with custom dashboards'
      },
      azure: {
        services: ['Virtual Machines', 'AKS', 'Azure SQL', 'Blob Storage', 'Azure Monitor'],
        patterns: ['Virtual Machine Scale Sets', 'Application Gateway', 'ARM Templates'],
        monitoring: 'Azure Monitor with Application Insights'
      }
    },

    containerOrchestration: [
      {
        trigger: /kubernetes|k8s|container/i,
        specifications: [
          'Kubernetes cluster configuration with proper resource limits',
          'Pod security policies and network policies',
          'Horizontal Pod Autoscaler (HPA) for scaling',
          'Ingress controllers and service mesh configuration',
          'Persistent volume management and backup strategies'
        ]
      },
      {
        trigger: /docker|containerize/i,
        specifications: [
          'Multi-stage Dockerfiles for optimized image sizes',
          'Container security scanning and vulnerability assessment',
          'Docker Compose for local development environments',
          'Container registry management and image versioning',
          'Health checks and graceful shutdown handling'
        ]
      }
    ],

    cicdPipeline: [
      {
        trigger: /ci\/cd|pipeline|jenkins|github\s+actions/i,
        requirements: [
          'Automated testing stages (unit, integration, security)',
          'Code quality gates and static analysis',
          'Environment-specific deployment strategies',
          'Rollback mechanisms and blue-green deployments',
          'Pipeline monitoring and failure notifications'
        ]
      },
      {
        trigger: /build|compilation|artifact/i,
        requirements: [
          'Dependency caching for faster build times',
          'Artifact versioning and storage strategies',
          'Build optimization and parallel execution',
          'Security scanning for dependencies and code',
          'Build environment consistency and reproducibility'
        ]
      }
    ],

    securityCompliance: [
      {
        trigger: /security|secure|compliance/i,
        implementations: [
          'Infrastructure as Code (IaC) security scanning',
          'Secrets management with HashiCorp Vault or cloud-native solutions',
          'Network security with firewalls and VPN access',
          'Identity and Access Management (IAM) with least privilege',
          'Compliance frameworks (SOC2, GDPR, HIPAA) implementation'
        ]
      },
      {
        trigger: /backup|disaster|recovery/i,
        implementations: [
          'Automated backup strategies with point-in-time recovery',
          'Disaster recovery planning with RTO/RPO objectives',
          'Cross-region replication and failover mechanisms',
          'Backup validation and restoration testing procedures',
          'Business continuity planning and incident response'
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
        improvements.push(`Enhanced DevOps terminology: "${pattern.match.source}" → "${pattern.replace}"`);
      }
    });

    // Apply structural improvements
    this.patterns.structure.forEach(pattern => {
      if (pattern.match.test(refined)) {
        refined = refined.replace(pattern.match, pattern.replace);
        rulesApplied.push(`structure_${pattern.description}`);
        improvements.push(`Improved DevOps approach: ${pattern.description}`);
      }
    });

    // Add cloud provider specifics
    const cloudEnhancements = this.addCloudProviderGuidance(refined);
    if (cloudEnhancements.enhanced !== refined) {
      refined = cloudEnhancements.enhanced;
      rulesApplied.push(...cloudEnhancements.rulesApplied);
      improvements.push(...cloudEnhancements.improvements);
    }

    // Add container orchestration guidance
    const containerEnhancements = this.addContainerOrchestration(refined);
    if (containerEnhancements.enhanced !== refined) {
      refined = containerEnhancements.enhanced;
      rulesApplied.push(...containerEnhancements.rulesApplied);
      improvements.push(...containerEnhancements.improvements);
    }

    // Add CI/CD pipeline requirements
    const pipelineEnhancements = this.addCICDRequirements(refined);
    if (pipelineEnhancements.enhanced !== refined) {
      refined = pipelineEnhancements.enhanced;
      rulesApplied.push(...pipelineEnhancements.rulesApplied);
      improvements.push(...pipelineEnhancements.improvements);
    }

    // Add security and compliance
    const securityEnhancements = this.addSecurityCompliance(refined);
    if (securityEnhancements.enhanced !== refined) {
      refined = securityEnhancements.enhanced;
      rulesApplied.push(...securityEnhancements.rulesApplied);
      improvements.push(...securityEnhancements.improvements);
    }

    return {
      refined: refined.trim(),
      rulesApplied,
      improvements
    };
  }

  private addCloudProviderGuidance(prompt: string): {
    enhanced: string;
    rulesApplied: string[];
    improvements: string[];
  } {
    let enhanced = prompt;
    const rulesApplied: string[] = [];
    const improvements: string[] = [];

    // Add cloud-specific guidance
    Object.entries(this.patterns.cloudProviders).forEach(([provider, config]) => {
      const providerRegex = new RegExp(`\\b${provider}\\b`, 'gi');
      if (providerRegex.test(prompt)) {
        enhanced += `\n\n${provider.toUpperCase()} Cloud Services:\n`;
        enhanced += `- Core Services: ${config.services.join(', ')}\n`;
        enhanced += `- Architecture Patterns: ${config.patterns.join(', ')}\n`;
        enhanced += `- Monitoring: ${config.monitoring}`;

        rulesApplied.push(`cloud_provider_${provider}`);
        improvements.push(`Added ${provider.toUpperCase()} cloud-specific service recommendations`);
      }
    });

    return { enhanced, rulesApplied, improvements };
  }

  private addContainerOrchestration(prompt: string): {
    enhanced: string;
    rulesApplied: string[];
    improvements: string[];
  } {
    let enhanced = prompt;
    const rulesApplied: string[] = [];
    const improvements: string[] = [];

    // Add container-specific guidance
    this.patterns.containerOrchestration.forEach(container => {
      if (container.trigger.test(prompt)) {
        const triggerName = container.trigger.source.replace(/\\b|\\g|[()]/g, '');
        enhanced += `\n\nContainer Orchestration - ${triggerName.toUpperCase()}:\n`;
        container.specifications.forEach(spec => {
          enhanced += `- ${spec}\n`;
        });

        rulesApplied.push(`container_${triggerName}`);
        improvements.push(`Added ${triggerName} container orchestration specifications`);
      }
    });

    return { enhanced, rulesApplied, improvements };
  }

  private addCICDRequirements(prompt: string): {
    enhanced: string;
    rulesApplied: string[];
    improvements: string[];
  } {
    let enhanced = prompt;
    const rulesApplied: string[] = [];
    const improvements: string[] = [];

    // Add CI/CD pipeline guidance
    this.patterns.cicdPipeline.forEach(pipeline => {
      if (pipeline.trigger.test(prompt)) {
        const triggerName = pipeline.trigger.source.replace(/\\b|\\g|[()]/g, '');
        enhanced += `\n\nCI/CD Pipeline Requirements:\n`;
        pipeline.requirements.forEach(req => {
          enhanced += `- ${req}\n`;
        });

        rulesApplied.push(`cicd_${triggerName}`);
        improvements.push(`Added CI/CD pipeline requirements and best practices`);
      }
    });

    // Add general DevOps practices if missing
    if (/deploy|pipeline|automation|devops/i.test(prompt) && !/testing|quality|monitoring/i.test(prompt)) {
      enhanced += '\n\nDevOps Best Practices:\n';
      enhanced += '- Infrastructure as Code (IaC) with version control\n';
      enhanced += '- Automated testing and quality gates\n';
      enhanced += '- Configuration management and drift detection\n';
      enhanced += '- Observability with metrics, logs, and traces\n';
      enhanced += '- Incident response and post-mortem procedures';

      rulesApplied.push('add_devops_best_practices');
      improvements.push('Added comprehensive DevOps methodology framework');
    }

    return { enhanced, rulesApplied, improvements };
  }

  private addSecurityCompliance(prompt: string): {
    enhanced: string;
    rulesApplied: string[];
    improvements: string[];
  } {
    let enhanced = prompt;
    const rulesApplied: string[] = [];
    const improvements: string[] = [];

    // Add security-specific guidance
    this.patterns.securityCompliance.forEach(security => {
      if (security.trigger.test(prompt)) {
        const triggerName = security.trigger.source.replace(/\\b|\\g|[()]/g, '');
        enhanced += `\n\nSecurity & Compliance - ${triggerName.toUpperCase()}:\n`;
        security.implementations.forEach(impl => {
          enhanced += `- ${impl}\n`;
        });

        rulesApplied.push(`security_${triggerName}`);
        improvements.push(`Added ${triggerName} security and compliance requirements`);
      }
    });

    // Add general security considerations
    if (/infrastructure|server|deploy|production/i.test(prompt) && !/security|secure|compliance/i.test(prompt)) {
      enhanced += '\n\nSecurity Considerations:\n';
      enhanced += '- Network security with proper firewall configurations\n';
      enhanced += '- Identity and Access Management (IAM) with principle of least privilege\n';
      enhanced += '- Encryption at rest and in transit\n';
      enhanced += '- Regular security audits and vulnerability assessments\n';
      enhanced += '- Compliance with relevant industry standards';

      rulesApplied.push('add_security_considerations');
      improvements.push('Added comprehensive security and compliance framework');
    }

    return { enhanced, rulesApplied, improvements };
  }

  generateSystemPrompt(analysis?: AnalysisResult, context?: string): string {
    const basePrompt = `You are a senior DevOps engineer and Site Reliability Engineer with extensive experience in:

**Infrastructure & Cloud:**
- Cloud-native architecture design (AWS, GCP, Azure)
- Infrastructure as Code (Terraform, CloudFormation, Pulumi)
- Container orchestration with Kubernetes and Docker
- Auto-scaling, load balancing, and high availability design

**CI/CD & Automation:**
- Continuous integration and deployment pipeline design
- Build automation, artifact management, and release strategies
- Configuration management (Ansible, Chef, Puppet)
- GitOps workflows and deployment automation

**Monitoring & Observability:**
- Comprehensive monitoring stack implementation (Prometheus, Grafana, ELK)
- Application Performance Monitoring (APM) and distributed tracing
- Log aggregation, analysis, and alerting strategies
- SLA/SLO definition and incident response procedures

**Security & Compliance:**
- Infrastructure security hardening and compliance frameworks
- Secrets management and identity access management
- Security scanning, vulnerability assessment, and remediation
- Disaster recovery planning and business continuity

Always provide:
- Scalable, resilient infrastructure designs
- Automated solutions that reduce manual intervention
- Security-first approach with defense in depth
- Comprehensive monitoring and alerting strategies
- Cost-optimized solutions with performance considerations
- Detailed implementation steps and best practices

Consider operational excellence, reliability, performance efficiency, security, and cost optimization in all recommendations.`;

    // Add context-specific guidance
    if (context) {
      return `${basePrompt}\n\nAdditional Context: ${context}`;
    }

    // Add analysis-based guidance
    if (analysis?.complexity && analysis.complexity > 0.7) {
      return `${basePrompt}\n\nNote: This is a complex infrastructure project. Provide comprehensive architecture design with phased implementation approach and scalability planning.`;
    }

    // Add cloud-specific guidance
    if (analysis?.technicalTerms.some(term => ['aws', 'azure', 'gcp', 'cloud'].includes(term.toLowerCase()))) {
      return `${basePrompt}\n\nCloud Focus: Emphasize cloud-native best practices, managed services optimization, and multi-region considerations for high availability.`;
    }

    return basePrompt;
  }

  getDomainConfig(): DomainConfig {
    return {
      domain: PromptDomain.DEVOPS,
      description: 'DevOps, infrastructure, deployment automation, and site reliability engineering',
      defaultRules: this.getDefaultRules(),
      systemPromptTemplate: this.generateSystemPrompt(),
      commonPatterns: [
        {
          name: 'infrastructure_design',
          regex: /\b(infrastructure|server|cloud|architecture)\b/gi,
          description: 'Infrastructure design and architecture patterns'
        },
        {
          name: 'deployment_automation',
          regex: /\b(deploy|deployment|pipeline|automation|ci\/cd)\b/gi,
          description: 'Deployment and automation pipeline patterns'
        },
        {
          name: 'container_orchestration',
          regex: /\b(docker|kubernetes|container|orchestration)\b/gi,
          description: 'Container and orchestration technology patterns'
        },
        {
          name: 'monitoring_observability',
          regex: /\b(monitor|monitoring|observability|metrics|logging)\b/gi,
          description: 'Monitoring and observability implementation patterns'
        }
      ],
      qualityWeights: {
        clarity: 0.2,      // Important for clear technical communication
        specificity: 0.4,  // Very critical for technical accuracy and implementation
        structure: 0.25,   // Important for systematic approach
        completeness: 0.15 // Important for comprehensive solutions
      },
      examples: [
        {
          title: 'Vague Deployment Request Enhancement',
          before: 'setup bonita deployment for my app that works fast',
          after: 'Design and provision cloud infrastructure for automated, reliable deployment pipeline with optimized deployment process and minimal downtime.\n\nCI/CD Pipeline Requirements:\n- Automated testing stages (unit, integration, security)\n- Code quality gates and static analysis\n- Environment-specific deployment strategies\n- Rollback mechanisms and blue-green deployments\n- Pipeline monitoring and failure notifications\n\nDevOps Best Practices:\n- Infrastructure as Code (IaC) with version control\n- Automated testing and quality gates\n- Configuration management and drift detection\n- Observability with metrics, logs, and traces\n- Incident response and post-mortem procedures',
          explanation: 'Transformed vague deployment request into comprehensive DevOps implementation framework',
          score_improvement: 0.82
        },
        {
          title: 'Container Orchestration Enhancement',
          before: 'use docker and kubernetes for scalable infrastructure',
          after: 'Implement containerized application with Docker orchestration using comprehensive Kubernetes cluster configuration.\n\nContainer Orchestration - KUBERNETES:\n- Kubernetes cluster configuration with proper resource limits\n- Pod security policies and network policies\n- Horizontal Pod Autoscaler (HPA) for scaling\n- Ingress controllers and service mesh configuration\n- Persistent volume management and backup strategies\n\nContainer Orchestration - DOCKER:\n- Multi-stage Dockerfiles for optimized image sizes\n- Container security scanning and vulnerability assessment\n- Container registry management and image versioning\n- Health checks and graceful shutdown handling',
          explanation: 'Enhanced generic container request with specific Kubernetes and Docker implementation requirements',
          score_improvement: 0.76
        }
      ]
    };
  }

  private getDefaultRules(): DomainRule[] {
    const rules: DomainRule[] = [];

    // Vague term replacement rules
    this.patterns.vague.forEach((pattern, index) => {
      rules.push({
        id: `devops_vague_${index}`,
        domain: PromptDomain.DEVOPS,
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
        id: `devops_structure_${index}`,
        domain: PromptDomain.DEVOPS,
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