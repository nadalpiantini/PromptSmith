import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface TelemetryEvent {
  id?: string;
  event_name: string;
  event_data: Record<string, any>;
  timestamp: string;
  session_id: string;
  user_id: string;
  version: string;
  environment: string;
}

export interface ErrorEvent {
  id?: string;
  error_name: string;
  error_message: string;
  error_stack: string;
  context_data: Record<string, any>;
  timestamp: string;
  session_id: string;
  user_id: string;
  version: string;
  environment: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface MetricEvent {
  id?: string;
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  dimensions: Record<string, any>;
  timestamp: string;
  session_id?: string;
}

export interface TelemetryStats {
  eventsToday: number;
  errorsToday: number;
  errorRate: number;
  avgProcessingTime: number;
  topDomains: Array<{ domain: string; count: number }>;
  qualityTrends: Array<{ date: string; avgScore: number }>;
}

export class TelemetryService {
  private supabase!: SupabaseClient;
  private sessionId: string;
  private version: string;
  private environment: string;
  private isEnabled: boolean;
  private eventBuffer: TelemetryEvent[] = [];
  private errorBuffer: ErrorEvent[] = [];
  private metricBuffer: MetricEvent[] = [];
  private bufferSize: number = 100;
  private flushInterval: number = 60000; // 1 minute
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    this.isEnabled = process.env.TELEMETRY_ENABLED !== 'false';
    this.version = process.env.APP_VERSION || '1.0.0';
    this.environment = process.env.NODE_ENV || 'development';
    this.sessionId = this.generateSessionId();

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase configuration missing. Telemetry will be disabled.');
      this.isEnabled = false;
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);

    if (this.isEnabled) {
      this.startBackgroundFlush();
      this.trackSessionStart();
    }
  }

  async track(
    eventName: string,
    data: Record<string, any> = {},
    userId?: string
  ): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const event: TelemetryEvent = {
        event_name: eventName,
        event_data: {
          ...data,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        session_id: this.sessionId,
        user_id: userId ?? 'anonymous',
        version: this.version,
        environment: this.environment
      };

      this.eventBuffer.push(event);

      // Flush if buffer is full
      if (this.eventBuffer.length >= this.bufferSize) {
        await this.flushEvents();
      }

    } catch (error) {
      console.error('Failed to track event:', error);
      // Don't throw - telemetry failures shouldn't break the app
    }
  }

  async error(
    errorName: string,
    error: Error | any,
    context: Record<string, any> = {},
    userId?: string
  ): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const errorEvent: ErrorEvent = {
        error_name: errorName,
        error_message: error instanceof Error ? error.message : String(error),
        error_stack: error instanceof Error ? (error.stack ?? 'No stack trace') : 'No stack trace',
        context_data: {
          ...context,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        session_id: this.sessionId,
        user_id: userId ?? 'anonymous',
        version: this.version,
        environment: this.environment,
        severity: this.determineSeverity(errorName, error)
      };

      this.errorBuffer.push(errorEvent);

      // Flush if buffer is full or if it's a critical error
      if (this.errorBuffer.length >= this.bufferSize || errorEvent.severity === 'critical') {
        await this.flushErrors();
      }

    } catch (telemetryError) {
      console.error('Failed to track error:', telemetryError);
      // Don't throw - telemetry failures shouldn't break the app
    }
  }

  async metric(
    metricName: string,
    value: number,
    unit: string = 'count',
    dimensions: Record<string, any> = {}
  ): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const metricEvent: MetricEvent = {
        metric_name: metricName,
        metric_value: value,
        metric_unit: unit,
        dimensions: {
          ...dimensions,
          environment: this.environment,
          version: this.version
        },
        timestamp: new Date().toISOString(),
        session_id: this.sessionId
      };

      this.metricBuffer.push(metricEvent);

      // Flush if buffer is full
      if (this.metricBuffer.length >= this.bufferSize) {
        await this.flushMetrics();
      }

    } catch (error) {
      console.error('Failed to track metric:', error);
      // Don't throw - telemetry failures shouldn't break the app
    }
  }

  async timing(
    operationName: string,
    duration: number,
    context: Record<string, any> = {}
  ): Promise<void> {
    await this.metric(
      `${operationName}_duration`,
      duration,
      'milliseconds',
      context
    );
  }

  async counter(
    counterName: string,
    increment: number = 1,
    dimensions: Record<string, any> = {}
  ): Promise<void> {
    await this.metric(counterName, increment, 'count', dimensions);
  }

  async getStats(days: number = 7): Promise<TelemetryStats> {
    if (!this.isEnabled) {
      return this.getEmptyStats();
    }

    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      // Get events today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: eventsData } = await this.supabase
        .from('telemetry_events')
        .select('*')
        .gte('timestamp', todayStart.toISOString());

      const { data: errorsData } = await this.supabase
        .from('telemetry_errors')
        .select('*')
        .gte('timestamp', todayStart.toISOString());

      const eventsToday = eventsData?.length || 0;
      const errorsToday = errorsData?.length || 0;
      const errorRate = eventsToday > 0 ? errorsToday / eventsToday : 0;

      // Get processing time metrics
      const { data: timingData } = await this.supabase
        .from('telemetry_metrics')
        .select('metric_value')
        .eq('metric_name', 'processing_duration')
        .gte('timestamp', since.toISOString());

      const timings = timingData?.map(d => d.metric_value) || [];
      const avgProcessingTime = timings.length > 0
        ? timings.reduce((a, b) => a + b, 0) / timings.length
        : 0;

      // Get top domains
      const { data: domainData } = await this.supabase
        .from('telemetry_events')
        .select('event_data')
        .gte('timestamp', since.toISOString())
        .not('event_data->>domain', 'is', null);

      const domainCounts: Record<string, number> = {};
      domainData?.forEach(event => {
        const domain = event.event_data?.domain;
        if (domain) {
          domainCounts[domain] = (domainCounts[domain] || 0) + 1;
        }
      });

      const topDomains = Object.entries(domainCounts)
        .map(([domain, count]) => ({ domain, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Get quality trends (placeholder - would need proper implementation)
      const qualityTrends = await this.getQualityTrends(days);

      return {
        eventsToday,
        errorsToday,
        errorRate,
        avgProcessingTime,
        topDomains,
        qualityTrends
      };

    } catch (error) {
      console.error('Failed to get telemetry stats:', error);
      return this.getEmptyStats();
    }
  }

  async flush(): Promise<void> {
    if (!this.isEnabled) return;

    await Promise.all([
      this.flushEvents(),
      this.flushErrors(),
      this.flushMetrics()
    ]);
  }

  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    await this.flush();

    if (this.isEnabled) {
      await this.trackSessionEnd();
    }
  }

  // Private methods

  private async flushEvents(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    try {
      const events = [...this.eventBuffer];
      this.eventBuffer = [];

      const { error } = await this.supabase
        .from('telemetry_events')
        .insert(events);

      if (error) {
        console.error('Failed to flush events:', error);
        // Put events back in buffer for retry
        this.eventBuffer.unshift(...events);
      }

    } catch (error) {
      console.error('Error flushing events:', error);
    }
  }

  private async flushErrors(): Promise<void> {
    if (this.errorBuffer.length === 0) return;

    try {
      const errors = [...this.errorBuffer];
      this.errorBuffer = [];

      const { error } = await this.supabase
        .from('telemetry_errors')
        .insert(errors);

      if (error) {
        console.error('Failed to flush errors:', error);
        // Put errors back in buffer for retry
        this.errorBuffer.unshift(...errors);
      }

    } catch (error) {
      console.error('Error flushing errors:', error);
    }
  }

  private async flushMetrics(): Promise<void> {
    if (this.metricBuffer.length === 0) return;

    try {
      const metrics = [...this.metricBuffer];
      this.metricBuffer = [];

      const { error } = await this.supabase
        .from('telemetry_metrics')
        .insert(metrics);

      if (error) {
        console.error('Failed to flush metrics:', error);
        // Put metrics back in buffer for retry
        this.metricBuffer.unshift(...metrics);
      }

    } catch (error) {
      console.error('Error flushing metrics:', error);
    }
  }

  private startBackgroundFlush(): void {
    this.flushTimer = setInterval(async () => {
      await this.flush();
    }, this.flushInterval);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async trackSessionStart(): Promise<void> {
    await this.track('session_start', {
      version: this.version,
      environment: this.environment,
      startup_time: Date.now()
    });
  }

  private async trackSessionEnd(): Promise<void> {
    await this.track('session_end', {
      version: this.version,
      environment: this.environment,
      shutdown_time: Date.now()
    });
  }

  private determineSeverity(errorName: string, _error: any): 'low' | 'medium' | 'high' | 'critical' {
    // Critical errors that break core functionality
    if (errorName.includes('processing_error') ||
        errorName.includes('database_connection') ||
        errorName.includes('authentication_failed')) {
      return 'critical';
    }

    // High priority errors that impact user experience
    if (errorName.includes('validation_error') ||
        errorName.includes('template_error') ||
        errorName.includes('scoring_error')) {
      return 'high';
    }

    // Medium priority errors that are recoverable
    if (errorName.includes('cache_error') ||
        errorName.includes('optimization_error')) {
      return 'medium';
    }

    // Low priority errors (warnings, minor issues)
    return 'low';
  }

  private async getQualityTrends(_days: number): Promise<Array<{ date: string; avgScore: number }>> {
    try {
      // This would ideally query actual quality score data
      // For now, return mock trends
      const trends = [];
      for (let i = _days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        trends.push({
          date: date.toISOString().split('T')[0],
          avgScore: 0.75 + Math.random() * 0.2 // Mock score between 0.75-0.95
        });
      }

      return trends;
    } catch (error) {
      console.error('Failed to get quality trends:', error);
      return [];
    }
  }

  private getEmptyStats(): TelemetryStats {
    return {
      eventsToday: 0,
      errorsToday: 0,
      errorRate: 0,
      avgProcessingTime: 0,
      topDomains: [],
      qualityTrends: []
    };
  }
}