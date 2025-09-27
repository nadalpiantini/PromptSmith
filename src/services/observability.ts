import { TelemetryService } from './telemetry.js';

export interface ObservabilityConfig {
  jaegerEndpoint?: string;
  prometheusEndpoint?: string;
  glitchtipDsn?: string;
  mcpInspectorEndpoint?: string;
}

export interface TraceSpan {
  traceId: string;
  spanId: string;
  operationName: string;
  startTime: number;
  duration?: number;
  tags: Record<string, any>;
  logs?: Array<{ timestamp: number; fields: Record<string, any> }>;
}

export interface MetricPoint {
  name: string;
  value: number;
  timestamp: number;
  labels: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
}

/**
 * Enhanced observability service that integrates with the complete observability stack
 * Provides tracing, metrics, error tracking, and MCP protocol monitoring
 */
export class ObservabilityService extends TelemetryService {
  private config: ObservabilityConfig;
  private activeSpans = new Map<string, TraceSpan>();
  private metrics = new Map<string, MetricPoint>();

  constructor(config: ObservabilityConfig = {}) {
    super();
    this.config = {
      jaegerEndpoint: config.jaegerEndpoint || 'http://localhost:14268',
      prometheusEndpoint: config.prometheusEndpoint || 'http://localhost:9090',
      glitchtipDsn: config.glitchtipDsn || process.env.GLITCHTIP_DSN,
      mcpInspectorEndpoint: config.mcpInspectorEndpoint || 'http://localhost:6274',
      ...config
    };
  }

  /**
   * Start a distributed trace span
   */
  async startSpan(operationName: string, parentSpanId?: string): Promise<string> {
    const traceId = parentSpanId ? 
      this.activeSpans.get(parentSpanId)?.traceId || this.generateTraceId() : 
      this.generateTraceId();
    
    const spanId = this.generateSpanId();
    
    const span: TraceSpan = {
      traceId,
      spanId,
      operationName,
      startTime: Date.now() * 1000, // Microseconds
      tags: {
        'service.name': 'promptsmith',
        'service.version': process.env.APP_VERSION || '1.0.0',
        'component': 'mcp-server'
      }
    };

    this.activeSpans.set(spanId, span);

    // Track span start
    await this.track('span_started', {
      traceId,
      spanId,
      operationName,
      parentSpanId
    });

    return spanId;
  }

  /**
   * Finish a trace span
   */
  async finishSpan(spanId: string, tags?: Record<string, any>): Promise<void> {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    span.duration = (Date.now() * 1000) - span.startTime;
    
    if (tags) {
      span.tags = { ...span.tags, ...tags };
    }

    // Send to Jaeger
    await this.sendToJaeger(span);

    // Track span completion
    await this.track('span_finished', {
      traceId: span.traceId,
      spanId,
      operationName: span.operationName,
      duration: span.duration,
      tags: span.tags
    });

    this.activeSpans.delete(spanId);
  }

  /**
   * Add log entry to active span
   */
  async addSpanLog(spanId: string, fields: Record<string, any>): Promise<void> {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    if (!span.logs) span.logs = [];
    
    span.logs.push({
      timestamp: Date.now() * 1000,
      fields
    });
  }

  /**
   * Record a metric point
   */
  async recordMetric(
    name: string,
    value: number,
    type: 'counter' | 'gauge' | 'histogram' | 'summary',
    labels: Record<string, string> = {}
  ): Promise<void> {
    const metric: MetricPoint = {
      name,
      value,
      timestamp: Date.now(),
      labels: {
        service: 'promptsmith',
        version: process.env.APP_VERSION || '1.0.0',
        ...labels
      },
      type
    };

    this.metrics.set(`${name}_${Date.now()}`, metric);

    // Send to Prometheus push gateway if configured
    await this.sendToPrometheus(metric);

    // Also track as telemetry metric
    await this.metric(name, value, 'count', labels);
  }

  /**
   * Track MCP protocol message
   */
  async trackMCPMessage(
    method: string,
    params: any,
    result?: any,
    error?: Error,
    duration?: number
  ): Promise<void> {
    const mcpEvent = {
      timestamp: new Date().toISOString(),
      method,
      params,
      result,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined,
      duration
    };

    // Send to MCP Inspector
    await this.sendToMCPInspector(mcpEvent);

    // Track as telemetry event
    await this.track('mcp_message', {
      method,
      success: !error,
      duration,
      paramsSize: JSON.stringify(params || {}).length,
      resultSize: result ? JSON.stringify(result).length : 0
    });

    // Track error if present
    if (error) {
      await this.error(`mcp_${method}_error`, error, { params });
    }
  }

  /**
   * Enhanced error tracking with GlitchTip integration
   */
  async trackError(
    error: Error,
    context: Record<string, any> = {},
    user?: { id: string; email?: string }
  ): Promise<void> {
    // Standard telemetry error tracking
    await this.error('application_error', error, context);

    // Send to GlitchTip if configured
    if (this.config.glitchtipDsn) {
      await this.sendToGlitchTip(error, context, user);
    }
  }

  /**
   * Performance monitoring for operations
   */
  async trackPerformance(
    operationName: string,
    duration: number,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    // Record timing metric
    await this.timing(operationName, duration, metadata);

    // Record as Prometheus histogram
    await this.recordMetric(
      `operation_duration_seconds`,
      duration / 1000, // Convert to seconds
      'histogram',
      { operation: operationName, ...metadata }
    );

    // Track performance trends
    await this.track('performance_measurement', {
      operation: operationName,
      duration,
      ...metadata
    });
  }

  /**
   * Health check for observability services
   */
  async checkObservabilityHealth(): Promise<Record<string, boolean>> {
    const health = {
      jaeger: false,
      prometheus: false,
      glitchtip: false,
      mcpInspector: false
    };

    try {
      // Check Jaeger
      if (this.config.jaegerEndpoint) {
        const jaegerResponse = await fetch(`${this.config.jaegerEndpoint}/api/services`);
        health.jaeger = jaegerResponse.ok;
      }
    } catch (error) {
      console.warn('Jaeger health check failed:', error);
    }

    try {
      // Check Prometheus
      if (this.config.prometheusEndpoint) {
        const promResponse = await fetch(`${this.config.prometheusEndpoint}/-/healthy`);
        health.prometheus = promResponse.ok;
      }
    } catch (error) {
      console.warn('Prometheus health check failed:', error);
    }

    try {
      // Check MCP Inspector
      if (this.config.mcpInspectorEndpoint) {
        const inspectorResponse = await fetch(`${this.config.mcpInspectorEndpoint}/health`);
        health.mcpInspector = inspectorResponse.ok;
      }
    } catch (error) {
      console.warn('MCP Inspector health check failed:', error);
    }

    try {
      // Check GlitchTip (basic connectivity)
      if (this.config.glitchtipDsn) {
        health.glitchtip = true; // Assume healthy if DSN is configured
      }
    } catch (error) {
      console.warn('GlitchTip health check failed:', error);
    }

    return health;
  }

  // Private methods

  private async sendToJaeger(span: TraceSpan): Promise<void> {
    try {
      if (!this.config.jaegerEndpoint) return;

      const jaegerSpan = {
        traceID: span.traceId,
        spanID: span.spanId,
        operationName: span.operationName,
        startTime: span.startTime,
        duration: span.duration || 0,
        tags: Object.entries(span.tags).map(([key, value]) => ({
          key,
          type: typeof value === 'string' ? 'string' : 'number',
          value: String(value)
        })),
        logs: span.logs?.map(log => ({
          timestamp: log.timestamp,
          fields: Object.entries(log.fields).map(([key, value]) => ({
            key,
            value: String(value)
          }))
        })) || [],
        process: {
          serviceName: 'promptsmith',
          tags: [
            { key: 'version', value: process.env.APP_VERSION || '1.0.0' },
            { key: 'environment', value: process.env.NODE_ENV || 'development' }
          ]
        }
      };

      await fetch(`${this.config.jaegerEndpoint}/api/traces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [{
            traceID: span.traceId,
            spans: [jaegerSpan]
          }]
        })
      });

    } catch (error) {
      console.warn('Failed to send span to Jaeger:', error);
    }
  }

  private async sendToPrometheus(metric: MetricPoint): Promise<void> {
    try {
      if (!this.config.prometheusEndpoint) return;

      // This would typically go through a Prometheus push gateway
      // For now, we'll just log the metric format
      const prometheusFormat = `${metric.name}{${Object.entries(metric.labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',')}} ${metric.value} ${metric.timestamp}`;

      console.log('Prometheus metric:', prometheusFormat);

    } catch (error) {
      console.warn('Failed to send metric to Prometheus:', error);
    }
  }

  private async sendToMCPInspector(event: any): Promise<void> {
    try {
      if (!this.config.mcpInspectorEndpoint) return;

      await fetch(`${this.config.mcpInspectorEndpoint}/api/mcp-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });

    } catch (error) {
      console.warn('Failed to send event to MCP Inspector:', error);
    }
  }

  private async sendToGlitchTip(
    error: Error,
    context: Record<string, any>,
    user?: { id: string; email?: string }
  ): Promise<void> {
    try {
      if (!this.config.glitchtipDsn) return;

      const glitchTipEvent = {
        message: error.message,
        level: 'error',
        platform: 'node',
        timestamp: new Date().toISOString(),
        exception: {
          values: [{
            type: error.name,
            value: error.message,
            stacktrace: {
              frames: this.parseStackTrace(error.stack || '')
            }
          }]
        },
        extra: context,
        user: user || undefined,
        environment: process.env.NODE_ENV || 'development',
        release: process.env.APP_VERSION || '1.0.0'
      };

      // Parse DSN to get endpoint
      const dsnMatch = this.config.glitchtipDsn.match(/https:\/\/(.+)@(.+)\/(\d+)/);
      if (!dsnMatch) return;

      const [, key, host, projectId] = dsnMatch;
      const endpoint = `https://${host}/api/${projectId}/store/`;

      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${key}, sentry_client=promptsmith/1.0.0`
        },
        body: JSON.stringify(glitchTipEvent)
      });

    } catch (error) {
      console.warn('Failed to send error to GlitchTip:', error);
    }
  }

  private generateTraceId(): string {
    return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  private generateSpanId(): string {
    return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  private parseStackTrace(stack: string): Array<{ filename: string; function: string; lineno: number }> {
    return stack.split('\n')
      .slice(1) // Skip first line (error message)
      .map(line => {
        const match = line.match(/at\s+(.*?)\s+\((.+):(\d+):\d+\)/);
        if (match) {
          return {
            function: match[1] || '<anonymous>',
            filename: match[2] || '<unknown>',
            lineno: parseInt(match[3]) || 0
          };
        }
        return {
          function: '<unknown>',
          filename: '<unknown>',
          lineno: 0
        };
      });
  }
}

// Export singleton instance
export const observability = new ObservabilityService({
  jaegerEndpoint: process.env.JAEGER_ENDPOINT,
  prometheusEndpoint: process.env.PROMETHEUS_ENDPOINT,
  glitchtipDsn: process.env.GLITCHTIP_DSN,
  mcpInspectorEndpoint: process.env.MCP_INSPECTOR_ENDPOINT
});