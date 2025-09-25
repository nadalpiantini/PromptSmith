# PromptSmith MCP Deployment Guide

Complete guide for deploying PromptSmith MCP Server in production environments with best practices for security, performance, and scalability.

## Table of Contents

- [Quick Start](#quick-start)
- [Environment Setup](#environment-setup)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Cloud Platform Setup](#cloud-platform-setup)
- [Database Configuration](#database-configuration)
- [Caching Setup](#caching-setup)
- [Monitoring & Observability](#monitoring--observability)
- [Security Hardening](#security-hardening)
- [Performance Tuning](#performance-tuning)
- [Backup & Disaster Recovery](#backup--disaster-recovery)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Docker and Docker Compose (for containerized deployment)
- [ ] PostgreSQL 14+ database (Supabase recommended)
- [ ] Redis 6+ (for caching)
- [ ] SSL certificates (for production)

### 5-Minute Production Setup

```bash
# 1. Clone and build
git clone https://github.com/promptsmith/promptsmith-mcp.git
cd promptsmith-mcp
npm install
npm run build

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Initialize database
npm run migrate
npm run seed

# 4. Start with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# 5. Verify deployment
curl http://localhost:3000/health
```

---

## Environment Setup

### Environment Variables

```bash
# === CORE CONFIGURATION ===
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# === DATABASE (Required) ===
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
DATABASE_URL=postgresql://user:pass@host:5432/promptsmith

# === CACHING (Recommended) ===
REDIS_URL=redis://localhost:6379
REDIS_TTL_DEFAULT=3600
REDIS_MAX_CONNECTIONS=20

# === EXTERNAL SERVICES (Optional) ===
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo
ANTHROPIC_API_KEY=sk-ant-...

# === TELEMETRY & MONITORING ===
TELEMETRY_ENABLED=true
SENTRY_DSN=https://your-sentry-dsn
DATADOG_API_KEY=your-datadog-key
HEALTH_CHECK_PORT=3001

# === SECURITY ===
CORS_ORIGINS=https://your-frontend.com,https://cursor.sh
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX=100        # requests per window
JWT_SECRET=your-jwt-secret-key

# === PERFORMANCE ===
WORKER_THREADS=4
MAX_MEMORY_MB=2048
CACHE_SIZE_MB=512
ENABLE_CLUSTER=true
```

### Configuration Validation

```typescript
// config/validation.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3000),
  SUPABASE_URL: z.string().url(),
  SUPABASE_KEY: z.string().min(1),
  REDIS_URL: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info')
});

export const config = envSchema.parse(process.env);
```

---

## Docker Deployment

### Production Dockerfile

```dockerfile
# Multi-stage build for optimal size
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS runtime

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S promptsmith -u 1001

# Security updates
RUN apk upgrade --no-cache

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy built application
COPY --from=builder --chown=promptsmith:nodejs /app/dist ./dist
COPY --from=builder --chown=promptsmith:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=promptsmith:nodejs /app/package.json ./package.json

# Health check
COPY --chown=promptsmith:nodejs scripts/health-check.sh ./
RUN chmod +x health-check.sh

USER promptsmith

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD ./health-check.sh

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/cli.js"]
```

### Docker Compose for Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  promptsmith:
    build: .
    image: promptsmith/promptsmith-mcp:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./logs:/app/logs:rw
    depends_on:
      - redis
    networks:
      - promptsmith-network
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    networks:
      - promptsmith-network

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx:rw
    depends_on:
      - promptsmith
    networks:
      - promptsmith-network

volumes:
  redis-data:

networks:
  promptsmith-network:
    driver: bridge
```

### NGINX Configuration

```nginx
# nginx/nginx.conf
upstream promptsmith {
    least_conn;
    server promptsmith:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types application/json text/plain application/javascript;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    location / {
        limit_req zone=api burst=20 nodelay;

        proxy_pass http://promptsmith;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint (no rate limiting)
    location /health {
        proxy_pass http://promptsmith;
        access_log off;
    }

    # Metrics endpoint (restricted)
    location /metrics {
        allow 10.0.0.0/8;
        deny all;
        proxy_pass http://promptsmith;
    }
}
```

---

## Kubernetes Deployment

### Namespace and ConfigMap

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: promptsmith-mcp

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: promptsmith-config
  namespace: promptsmith-mcp
data:
  NODE_ENV: "production"
  PORT: "3000"
  LOG_LEVEL: "info"
  REDIS_URL: "redis://redis-service:6379"
  TELEMETRY_ENABLED: "true"
```

### Secrets

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: promptsmith-secrets
  namespace: promptsmith-mcp
type: Opaque
data:
  SUPABASE_URL: <base64-encoded-url>
  SUPABASE_KEY: <base64-encoded-key>
  OPENAI_API_KEY: <base64-encoded-key>
  JWT_SECRET: <base64-encoded-secret>
```

### Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: promptsmith-mcp
  namespace: promptsmith-mcp
  labels:
    app: promptsmith-mcp
    version: v1.0.0
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      app: promptsmith-mcp
  template:
    metadata:
      labels:
        app: promptsmith-mcp
        version: v1.0.0
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: promptsmith-mcp
      securityContext:
        runAsUser: 1001
        runAsGroup: 1001
        fsGroup: 1001
      containers:
      - name: promptsmith-mcp
        image: promptsmith/promptsmith-mcp:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
          name: http
        - containerPort: 3001
          name: health
        envFrom:
        - configMapRef:
            name: promptsmith-config
        - secretRef:
            name: promptsmith-secrets
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 15"]
        volumeMounts:
        - name: logs
          mountPath: /app/logs
        - name: tmp
          mountPath: /tmp
      volumes:
      - name: logs
        emptyDir: {}
      - name: tmp
        emptyDir: {}
      terminationGracePeriodSeconds: 30
```

### Service and Ingress

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: promptsmith-service
  namespace: promptsmith-mcp
  labels:
    app: promptsmith-mcp
spec:
  selector:
    app: promptsmith-mcp
  ports:
  - name: http
    port: 3000
    targetPort: 3000
    protocol: TCP
  - name: health
    port: 3001
    targetPort: 3001
    protocol: TCP
  type: ClusterIP

---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: promptsmith-ingress
  namespace: promptsmith-mcp
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - api.promptsmith.dev
    secretName: promptsmith-tls
  rules:
  - host: api.promptsmith.dev
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: promptsmith-service
            port:
              number: 3000
```

### Redis Deployment

```yaml
# k8s/redis.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: promptsmith-mcp
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        args:
        - redis-server
        - --maxmemory
        - 256mb
        - --maxmemory-policy
        - allkeys-lru
        ports:
        - containerPort: 6379
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        volumeMounts:
        - name: redis-data
          mountPath: /data
      volumes:
      - name: redis-data
        emptyDir: {}

---
apiVersion: v1
kind: Service
metadata:
  name: redis-service
  namespace: promptsmith-mcp
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
  type: ClusterIP
```

### Horizontal Pod Autoscaler

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: promptsmith-hpa
  namespace: promptsmith-mcp
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: promptsmith-mcp
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 25
        periodSeconds: 60
```

---

## Cloud Platform Setup

### AWS Deployment

#### ECS Fargate Task Definition

```json
{
  "family": "promptsmith-mcp",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/promptsmith-task-role",
  "containerDefinitions": [
    {
      "name": "promptsmith-mcp",
      "image": "promptsmith/promptsmith-mcp:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "SUPABASE_URL",
          "valueFrom": "arn:aws:ssm:region:account:parameter/promptsmith/supabase-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/promptsmith-mcp",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

#### Application Load Balancer

```yaml
# cloudformation/alb.yaml
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: promptsmith-alb
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: promptsmith-tg
      Port: 3000
      Protocol: HTTP
      TargetType: ip
      VpcId: !Ref VPC
      HealthCheckPath: /health
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3

  Listener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref SSLCertificate
```

### Google Cloud Platform

#### Cloud Run Deployment

```yaml
# gcp/cloud-run.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: promptsmith-mcp
  annotations:
    run.googleapis.com/ingress: all
    run.googleapis.com/execution-environment: gen2
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
        autoscaling.knative.dev/minScale: "1"
        run.googleapis.com/cpu-throttling: "false"
        run.googleapis.com/memory: "2Gi"
        run.googleapis.com/cpu: "1000m"
    spec:
      containerConcurrency: 100
      timeoutSeconds: 300
      containers:
      - image: gcr.io/PROJECT_ID/promptsmith-mcp:latest
        env:
        - name: NODE_ENV
          value: production
        - name: SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: promptsmith-secrets
              key: supabase-url
        ports:
        - containerPort: 3000
        resources:
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        startupProbe:
          httpGet:
            path: /health
            port: 3000
          failureThreshold: 10
          periodSeconds: 3
```

### Azure Container Instances

```yaml
# azure/container-group.yaml
apiVersion: '2021-03-01'
type: Microsoft.ContainerInstance/containerGroups
properties:
  containers:
  - name: promptsmith-mcp
    properties:
      image: promptsmith/promptsmith-mcp:latest
      resources:
        requests:
          cpu: 1
          memoryInGB: 2
        limits:
          cpu: 2
          memoryInGB: 4
      ports:
      - port: 3000
        protocol: TCP
      environmentVariables:
      - name: NODE_ENV
        value: production
      - name: SUPABASE_URL
        secureValue: "{{ supabase-url }}"
      - name: SUPABASE_KEY
        secureValue: "{{ supabase-key }}"
      livenessProbe:
        httpGet:
          path: /health
          port: 3000
        initialDelaySeconds: 30
        periodSeconds: 10
  osType: Linux
  restartPolicy: Always
  ipAddress:
    type: Public
    ports:
    - protocol: TCP
      port: 3000
    dnsNameLabel: promptsmith-mcp-demo
```

---

## Database Configuration

### Supabase Production Setup

```sql
-- production-setup.sql
-- Run these commands in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Configure connection pooling
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '512MB';
ALTER SYSTEM SET effective_cache_size = '2GB';
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET maintenance_work_mem = '128MB';

-- Create database roles
CREATE ROLE promptsmith_read WITH LOGIN;
CREATE ROLE promptsmith_write WITH LOGIN;

-- Grant appropriate permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO promptsmith_read;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO promptsmith_write;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO promptsmith_write;

-- Configure Row Level Security
ALTER DATABASE postgres SET "app.user_role" = 'authenticated';
```

### Database Connection Configuration

```typescript
// config/database.ts
import { createClient } from '@supabase/supabase-js';

interface DatabaseConfig {
  url: string;
  key: string;
  options: {
    auth: {
      persistSession: false;
      autoRefreshToken: false;
    };
    db: {
      schema: 'public';
    };
    global: {
      headers: {
        'X-Client-Info': 'promptsmith-mcp';
      };
    };
  };
}

export class DatabaseService {
  private client: SupabaseClient;

  constructor(config: DatabaseConfig) {
    this.client = createClient(config.url, config.key, config.options);
  }

  // Connection pooling for high-traffic scenarios
  async withConnection<T>(operation: (client: SupabaseClient) => Promise<T>): Promise<T> {
    try {
      return await operation(this.client);
    } catch (error) {
      this.handleDatabaseError(error);
      throw error;
    }
  }

  private handleDatabaseError(error: any): void {
    if (error.code === 'PGRST301') {
      // Connection pool exhausted
      throw new Error('Database connection pool exhausted');
    }
    // Handle other database errors
  }
}
```

### Database Backup Strategy

```bash
#!/bin/bash
# scripts/backup-database.sh

set -e

# Configuration
BACKUP_DIR="/backups/promptsmith"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="promptsmith_backup_${TIMESTAMP}.sql"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Perform backup
pg_dump "${DATABASE_URL}" \
  --no-password \
  --clean \
  --if-exists \
  --verbose \
  --file="${BACKUP_DIR}/${BACKUP_FILE}"

# Compress backup
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

# Upload to S3 (optional)
if [ -n "${AWS_S3_BUCKET}" ]; then
  aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}.gz" \
    "s3://${AWS_S3_BUCKET}/backups/${BACKUP_FILE}.gz"
fi

# Cleanup old backups (keep last 7 days)
find "${BACKUP_DIR}" -name "*.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

---

## Caching Setup

### Redis Production Configuration

```conf
# redis/redis.conf
# Network
bind 0.0.0.0
port 6379
protected-mode yes
requirepass your-secure-password

# Memory Management
maxmemory 1gb
maxmemory-policy allkeys-lru
maxmemory-samples 5

# Persistence
save 900 1
save 300 10
save 60 10000
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log

# Performance
tcp-keepalive 300
timeout 0
databases 16

# Security
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""
```

### Redis Cluster Setup

```yaml
# docker-compose.redis-cluster.yml
version: '3.8'

services:
  redis-node-1:
    image: redis:7-alpine
    command: redis-server /etc/redis/redis.conf --cluster-enabled yes --cluster-config-file nodes-6379.conf --cluster-node-timeout 5000
    ports:
      - "7001:6379"
      - "17001:16379"
    volumes:
      - ./redis-cluster.conf:/etc/redis/redis.conf
      - redis-node-1-data:/data

  redis-node-2:
    image: redis:7-alpine
    command: redis-server /etc/redis/redis.conf --cluster-enabled yes --cluster-config-file nodes-6379.conf --cluster-node-timeout 5000
    ports:
      - "7002:6379"
      - "17002:16379"
    volumes:
      - ./redis-cluster.conf:/etc/redis/redis.conf
      - redis-node-2-data:/data

  redis-node-3:
    image: redis:7-alpine
    command: redis-server /etc/redis/redis.conf --cluster-enabled yes --cluster-config-file nodes-6379.conf --cluster-node-timeout 5000
    ports:
      - "7003:6379"
      - "17003:16379"
    volumes:
      - ./redis-cluster.conf:/etc/redis/redis.conf
      - redis-node-3-data:/data

volumes:
  redis-node-1-data:
  redis-node-2-data:
  redis-node-3-data:
```

---

## Monitoring & Observability

### Prometheus Configuration

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'promptsmith-mcp'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 30s
    scrape_timeout: 10s

  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']

  - job_name: 'nginx'
    static_configs:
      - targets: ['localhost:9113']

rule_files:
  - "alerting-rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "PromptSmith MCP Performance",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{ method }} {{ status }}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "process_resident_memory_bytes",
            "legendFormat": "RSS Memory"
          }
        ]
      },
      {
        "title": "Cache Hit Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))",
            "legendFormat": "Hit Rate"
          }
        ]
      }
    ]
  }
}
```

### Application Metrics

```typescript
// monitoring/metrics.ts
import client, { Counter, Histogram, Gauge } from 'prom-client';

export class MetricsService {
  private httpRequests = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status']
  });

  private requestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
  });

  private cacheHits = new Counter({
    name: 'cache_hits_total',
    help: 'Number of cache hits'
  });

  private cacheMisses = new Counter({
    name: 'cache_misses_total',
    help: 'Number of cache misses'
  });

  private promptsProcessed = new Counter({
    name: 'prompts_processed_total',
    help: 'Total number of prompts processed',
    labelNames: ['domain', 'status']
  });

  private qualityScoreGauge = new Gauge({
    name: 'prompt_quality_score',
    help: 'Average quality score of processed prompts',
    labelNames: ['domain']
  });

  recordRequest(method: string, route: string, status: number, duration: number): void {
    this.httpRequests.inc({ method, route, status: status.toString() });
    this.requestDuration.observe({ method, route }, duration);
  }

  recordCacheHit(): void {
    this.cacheHits.inc();
  }

  recordCacheMiss(): void {
    this.cacheMisses.inc();
  }

  recordPromptProcessed(domain: string, status: 'success' | 'error'): void {
    this.promptsProcessed.inc({ domain, status });
  }

  updateQualityScore(domain: string, score: number): void {
    this.qualityScoreGauge.set({ domain }, score);
  }

  getMetrics(): string {
    return client.register.metrics();
  }
}
```

---

## Security Hardening

### Security Headers Middleware

```typescript
// middleware/security.ts
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // HSTS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // CSP
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none';");

  // Remove server information
  res.removeHeader('X-Powered-By');

  next();
}
```

### Rate Limiting

```typescript
// middleware/rateLimiting.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

export const createRateLimiter = (redis: Redis) => {
  return rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: 'rl:',
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (req) => {
      // Different limits for different endpoints
      if (req.path.includes('/process_prompt')) return 60;
      if (req.path.includes('/search_prompts')) return 200;
      return 100;
    },
    message: {
      error: 'Too many requests, please try again later',
      retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};
```

### Input Validation

```typescript
// security/validation.ts
import { body, query, validationResult } from 'express-validator';

export const validateProcessPrompt = [
  body('raw')
    .isString()
    .isLength({ min: 1, max: 10000 })
    .trim()
    .escape(),

  body('domain')
    .optional()
    .isIn(['sql', 'branding', 'cine', 'saas', 'devops', 'general']),

  body('tone')
    .optional()
    .isIn(['professional', 'casual', 'technical', 'creative', 'formal']),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
];
```

---

## Performance Tuning

### Node.js Optimization

```typescript
// config/performance.ts
export const performanceConfig = {
  // V8 optimization flags
  v8Flags: [
    '--max-old-space-size=2048',
    '--max-new-space-size=256',
    '--optimize-for-size',
    '--gc-interval=100'
  ],

  // Cluster configuration
  cluster: {
    enabled: process.env.ENABLE_CLUSTER === 'true',
    workers: process.env.WORKER_THREADS ? parseInt(process.env.WORKER_THREADS) : require('os').cpus().length
  },

  // Keep-alive settings
  keepAlive: {
    enabled: true,
    initialDelay: 0
  }
};

// Worker process initialization
if (performanceConfig.cluster.enabled && cluster.isMaster) {
  for (let i = 0; i < performanceConfig.cluster.workers; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died, restarting...`);
    cluster.fork();
  });
} else {
  // Start application
  startServer();
}
```

### Connection Pooling

```typescript
// services/connectionPool.ts
export class ConnectionPoolService {
  private pools = new Map<string, GenericPool>();

  createDatabasePool() {
    return createPool(
      {
        create: () => new DatabaseConnection(config.database),
        destroy: (connection) => connection.close()
      },
      {
        max: 20,
        min: 5,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200
      }
    );
  }

  createRedisPool() {
    return createPool(
      {
        create: () => new Redis(config.redis),
        destroy: (redis) => redis.disconnect()
      },
      {
        max: 10,
        min: 2
      }
    );
  }
}
```

---

## Backup & Disaster Recovery

### Automated Backup Script

```bash
#!/bin/bash
# scripts/backup-and-restore.sh

# Backup configuration
BACKUP_RETENTION_DAYS=30
S3_BUCKET="promptsmith-backups"
ENCRYPTION_KEY_ID="alias/promptsmith-backup"

backup_database() {
  local timestamp=$(date +"%Y%m%d_%H%M%S")
  local backup_file="database_backup_${timestamp}.sql"

  echo "Starting database backup..."

  # Create backup with compression
  pg_dump "${DATABASE_URL}" \
    --no-password \
    --clean \
    --if-exists \
    --verbose \
    | gzip > "/tmp/${backup_file}.gz"

  # Encrypt and upload to S3
  aws s3 cp "/tmp/${backup_file}.gz" \
    "s3://${S3_BUCKET}/database/${backup_file}.gz" \
    --server-side-encryption aws:kms \
    --ssekms-key-id "${ENCRYPTION_KEY_ID}"

  # Cleanup local file
  rm "/tmp/${backup_file}.gz"

  echo "Database backup completed: ${backup_file}.gz"
}

backup_redis() {
  local timestamp=$(date +"%Y%m%d_%H%M%S")
  local backup_file="redis_backup_${timestamp}.rdb"

  echo "Starting Redis backup..."

  # Create Redis backup
  redis-cli --rdb "/tmp/${backup_file}"

  # Compress and upload
  gzip "/tmp/${backup_file}"
  aws s3 cp "/tmp/${backup_file}.gz" \
    "s3://${S3_BUCKET}/redis/${backup_file}.gz" \
    --server-side-encryption aws:kms \
    --ssekms-key-id "${ENCRYPTION_KEY_ID}"

  rm "/tmp/${backup_file}.gz"

  echo "Redis backup completed: ${backup_file}.gz"
}

cleanup_old_backups() {
  echo "Cleaning up old backups..."

  # Delete backups older than retention period
  aws s3 ls "s3://${S3_BUCKET}/database/" --recursive | while read -r line; do
    backup_date=$(echo "$line" | awk '{print $1}')
    backup_file=$(echo "$line" | awk '{print $4}')

    if [[ $(date -d "$backup_date" +%s) -lt $(date -d "-${BACKUP_RETENTION_DAYS} days" +%s) ]]; then
      aws s3 rm "s3://${S3_BUCKET}/${backup_file}"
      echo "Deleted old backup: ${backup_file}"
    fi
  done
}

restore_database() {
  local backup_file="$1"

  if [[ -z "$backup_file" ]]; then
    echo "Usage: restore_database <backup_file>"
    return 1
  fi

  echo "Restoring database from: ${backup_file}"

  # Download and decrypt backup
  aws s3 cp "s3://${S3_BUCKET}/database/${backup_file}" "/tmp/${backup_file}"

  # Restore database
  gunzip -c "/tmp/${backup_file}" | psql "${DATABASE_URL}"

  rm "/tmp/${backup_file}"
  echo "Database restore completed"
}

# Main execution
case "${1:-backup}" in
  "backup")
    backup_database
    backup_redis
    cleanup_old_backups
    ;;
  "restore-db")
    restore_database "$2"
    ;;
  "cleanup")
    cleanup_old_backups
    ;;
  *)
    echo "Usage: $0 {backup|restore-db <file>|cleanup}"
    exit 1
    ;;
esac
```

### Disaster Recovery Plan

```yaml
# disaster-recovery-plan.yml
recovery_procedures:

  database_failure:
    priority: critical
    rto: 15 minutes  # Recovery Time Objective
    rpo: 5 minutes   # Recovery Point Objective
    steps:
      - Switch to read replica
      - Promote read replica to primary
      - Update application configuration
      - Restore from latest backup if needed

  cache_failure:
    priority: medium
    rto: 5 minutes
    rpo: acceptable data loss
    steps:
      - Application continues without cache
      - Restart Redis service/container
      - Warm up cache with critical data

  application_failure:
    priority: high
    rto: 10 minutes
    rpo: 0
    steps:
      - Health check detects failure
      - Auto-scaling triggers new instances
      - Load balancer routes traffic to healthy instances
      - Investigate and fix root cause

monitoring:
  - Database connectivity checks every 30s
  - Application health checks every 10s
  - Cache availability checks every 60s
  - Automated alerts to on-call team

communication_plan:
  - Status page updates within 5 minutes
  - Customer notifications for >15 minute outages
  - Post-mortem report within 24 hours
```

---

## Troubleshooting

### Common Issues and Solutions

#### High Memory Usage

```bash
# Check memory usage
kubectl top pods -n promptsmith-mcp

# Get detailed memory breakdown
kubectl exec -it promptsmith-mcp-xxx -- node -e "
  console.log('Memory Usage:');
  console.log(process.memoryUsage());
  console.log('V8 Heap Statistics:');
  console.log(require('v8').getHeapStatistics());
"

# Solutions:
# 1. Increase memory limits in deployment
# 2. Enable garbage collection optimization
# 3. Implement memory-efficient caching
```

#### Database Connection Issues

```bash
# Check database connectivity
kubectl exec -it promptsmith-mcp-xxx -- curl -f "$SUPABASE_URL/rest/v1/" \
  -H "apikey: $SUPABASE_KEY"

# Check connection pool status
kubectl logs promptsmith-mcp-xxx | grep "connection pool"

# Solutions:
# 1. Increase connection pool size
# 2. Check database resource limits
# 3. Verify network policies
```

#### Cache Performance Issues

```bash
# Check Redis connectivity and performance
kubectl exec -it redis-xxx -- redis-cli ping
kubectl exec -it redis-xxx -- redis-cli info memory
kubectl exec -it redis-xxx -- redis-cli --latency

# Monitor cache hit rates
curl http://localhost:3000/metrics | grep cache

# Solutions:
# 1. Optimize cache key strategies
# 2. Increase Redis memory limits
# 3. Implement cache warming strategies
```

### Debug Mode

```typescript
// debug/debugMode.ts
export class DebugMode {
  static enable() {
    // Enable detailed logging
    process.env.LOG_LEVEL = 'debug';

    // Enable performance profiling
    process.env.NODE_OPTIONS = '--prof --prof-process';

    // Enable memory leak detection
    process.env.NODE_OPTIONS += ' --trace-gc --trace-gc-verbose';
  }

  static profileMemory() {
    const memUsage = process.memoryUsage();
    const heapStats = require('v8').getHeapStatistics();

    return {
      memory: memUsage,
      heap: heapStats,
      timestamp: new Date().toISOString()
    };
  }

  static async generateHeapSnapshot() {
    const v8 = require('v8');
    const fs = require('fs');

    const snapshot = v8.writeHeapSnapshot();
    console.log(`Heap snapshot written to: ${snapshot}`);

    return snapshot;
  }
}
```

### Health Check Endpoints

```typescript
// health/healthCheck.ts
export class HealthCheckService {
  async checkHealth(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMemory(),
      this.checkDisk()
    ]);

    const results = {
      database: checks[0].status === 'fulfilled' ? checks[0].value : false,
      cache: checks[1].status === 'fulfilled' ? checks[1].value : false,
      memory: checks[2].status === 'fulfilled' ? checks[2].value : false,
      disk: checks[3].status === 'fulfilled' ? checks[3].value : false
    };

    const overall = Object.values(results).every(Boolean) ? 'healthy' : 'unhealthy';

    return {
      status: overall,
      services: results,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      const result = await this.db.query('SELECT 1');
      return result.length === 1;
    } catch {
      return false;
    }
  }

  private async checkRedis(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  private async checkMemory(): Promise<boolean> {
    const usage = process.memoryUsage();
    const threshold = 1024 * 1024 * 1024 * 1.5; // 1.5GB threshold
    return usage.heapUsed < threshold;
  }

  private async checkDisk(): Promise<boolean> {
    const fs = require('fs').promises;
    try {
      const stats = await fs.stat('/tmp');
      return stats.isDirectory();
    } catch {
      return false;
    }
  }
}
```

This comprehensive deployment guide provides everything needed to successfully deploy PromptSmith MCP Server in production environments, from basic Docker setups to enterprise Kubernetes deployments with full monitoring and disaster recovery capabilities.