// Service layer exports
export { RefineService, type RefinementResult, type ExampleSet } from './refine.js';
export { ScoreService } from './score.js';
export { StoreService } from './store.js';
export { CacheService, type CacheStats, type CacheOptions } from './cache.js';
export {
  TelemetryService,
  type TelemetryEvent,
  type ErrorEvent,
  type MetricEvent,
  type TelemetryStats
} from './telemetry.js';
export {
  ObservabilityService,
  type ObservabilityConfig,
  type TraceSpan,
  type MetricPoint
} from './observability.js';

// Import classes for internal use
import { RefineService } from './refine.js';
import { ScoreService } from './score.js';
import { StoreService } from './store.js';
import { CacheService } from './cache.js';
import { TelemetryService } from './telemetry.js';
import { ObservabilityService } from './observability.js';

// Service layer convenience factory
export class ServiceContainer {
  private static instance: ServiceContainer;

  public readonly refine: RefineService;
  public readonly score: ScoreService;
  public readonly store: StoreService;
  public readonly cache: CacheService;
  public readonly telemetry: TelemetryService;
  public readonly observability: ObservabilityService;

  private constructor() {
    this.refine = new RefineService();
    this.score = new ScoreService();
    this.store = new StoreService();
    this.cache = new CacheService();
    this.telemetry = new TelemetryService();
    this.observability = new ObservabilityService();
  }

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  async healthCheck(): Promise<{
    refine: boolean;
    score: boolean;
    store: boolean;
    cache: boolean;
    telemetry: boolean;
    observability: boolean;
  }> {
    const results = {
      refine: true, // RefineService is always healthy if constructed
      score: true,  // ScoreService is always healthy if constructed
      store: false,
      cache: false,
      telemetry: false,
      observability: false
    };

    try {
      // Test database connection
      await this.store.getStats();
      results.store = true;
    } catch (error) {
      console.error('Store health check failed:', error);
    }

    try {
      // Test cache connection
      results.cache = await this.cache.ping();
    } catch (error) {
      console.error('Cache health check failed:', error);
    }

    try {
      // Test telemetry (basic tracking)
      await this.telemetry.track('health_check', { timestamp: Date.now() });
      results.telemetry = true;
    } catch (error) {
      console.error('Telemetry health check failed:', error);
    }

    try {
      // Test observability stack integration
      const spanId = await this.observability.startSpan('health_check');
      await this.observability.finishSpan(spanId);
      results.observability = true;
    } catch (error) {
      console.error('Observability health check failed:', error);
    }

    return results;
  }

  async shutdown(): Promise<void> {
    await Promise.all([
      this.cache.disconnect(),
      this.telemetry.shutdown()
    ]);
  }
}

// Global singleton instance
export const services = ServiceContainer.getInstance();