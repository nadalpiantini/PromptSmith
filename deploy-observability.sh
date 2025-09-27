#!/bin/bash

# 🦸‍♂️ LIGA DE LA JUSTICIA - OBSERVABILITY DEPLOYMENT SCRIPT
# Complete observability stack deployment for PromptSmith

echo "🦸‍♂️ LIGA DE LA JUSTICIA - DEPLOYING OBSERVABILITY STACK"
echo "=============================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored status
print_status() {
    echo -e "${GREEN}[✅ SUCCESS]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[ℹ️  INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠️  WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[❌ ERROR]${NC} $1"
}

print_hero() {
    echo -e "${PURPLE}[🦸‍♂️ HERO]${NC} $1"
}

# Check if Docker and Docker Compose are installed
print_info "Checking prerequisites..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Docker and Docker Compose are available"

# Stop existing services
print_info "Stopping existing services..."
docker-compose -f docker-compose.observability.yml down 2>/dev/null || true

# Create necessary directories
print_info "Creating observability directories..."
mkdir -p logs/observability
mkdir -p observability/prometheus/rules

# Create Prometheus rules file
print_info "Creating Prometheus alerting rules..."
cat > observability/prometheus/rules/promptsmith.yml << 'EOF'
groups:
  - name: promptsmith
    rules:
      - alert: PromptSmithDown
        expr: up{job="promptsmith"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "PromptSmith service is down"
          description: "PromptSmith has been down for more than 1 minute"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is above 10% for 5 minutes"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is above 1 second"
EOF

print_status "Prometheus rules created"

# Build custom images
print_info "Building custom Docker images..."
print_hero "SUPERMAN: Building MCP Inspector..."
docker build -t promptsmith-mcp-inspector -f Dockerfile.mcp-inspector . || {
    print_error "Failed to build MCP Inspector image"
    exit 1
}

print_hero "BATMAN: Building Monitoring Dashboard..."
docker build -t promptsmith-monitoring -f Dockerfile.monitoring . || {
    print_error "Failed to build Monitoring Dashboard image"
    exit 1
}

print_status "Custom images built successfully"

# Start the observability stack
print_info "Starting observability stack..."
print_hero "WONDER WOMAN: Deploying all services..."

# Start services in stages for better reliability
echo "Starting infrastructure services..."
docker-compose -f docker-compose.observability.yml up -d postgres_glitchtip redis_glitchtip prometheus node-exporter

# Wait a bit for databases to initialize
sleep 10

echo "Starting monitoring services..."
docker-compose -f docker-compose.observability.yml up -d jaeger glitchtip glitchtip-worker glitchtip-beat grafana

# Wait for core services
sleep 15

echo "Starting application monitoring..."
docker-compose -f docker-compose.observability.yml up -d redis-commander mcp-inspector monitoring-dashboard

print_status "All services started"

# Wait for services to be ready
print_info "Waiting for services to be ready..."
sleep 30

# Function to check service health
check_service() {
    local name=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            print_status "$name is ready at $url"
            return 0
        fi
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_warning "$name is not responding at $url after $max_attempts attempts"
    return 1
}

# Health check all services
print_info "Performing health checks..."

declare -A SERVICES=(
    ["Jaeger Tracing"]="http://localhost:16686/"
    ["GlitchTip Error Tracking"]="http://localhost:8000/"
    ["Grafana Dashboard"]="http://localhost:3001/"
    ["Prometheus Metrics"]="http://localhost:9090/"
    ["Redis Commander"]="http://localhost:8081/"
    ["MCP Inspector"]="http://localhost:6274/health"
    ["Monitoring Dashboard"]="http://localhost:8888/health"
)

healthy_services=0
total_services=${#SERVICES[@]}

for service_name in "${!SERVICES[@]}"; do
    url="${SERVICES[$service_name]}"
    if check_service "$service_name" "$url"; then
        ((healthy_services++))
    fi
done

# Create quick access script
print_info "Creating quick access script..."
cat > observability-urls.sh << 'EOF'
#!/bin/bash

echo "🦸‍♂️ LIGA DE LA JUSTICIA - OBSERVABILITY URLS"
echo "=============================================="
echo ""
echo "🕵️  Central Dashboard:    http://localhost:8888"
echo "🔍 Jaeger Tracing:       http://localhost:16686"
echo "🐛 GlitchTip Errors:     http://localhost:8000"
echo "📊 Grafana Dashboard:    http://localhost:3001"
echo "📈 Prometheus Metrics:   http://localhost:9090"
echo "💾 Redis Commander:      http://localhost:8081"
echo "🕵️  MCP Inspector:        http://localhost:6274"
echo ""
echo "🔑 Default Credentials:"
echo "   Grafana: admin / admin123"
echo "   GlitchTip: Create account on first visit"
echo ""

# Open all services in browser (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🚀 Opening services in browser..."
    open http://localhost:8888  # Central dashboard first
    sleep 2
    open http://localhost:16686 # Jaeger
    open http://localhost:3001  # Grafana
    open http://localhost:6274  # MCP Inspector
fi
EOF

chmod +x observability-urls.sh

# Display final status
echo ""
echo "🦸‍♂️ LIGA DE LA JUSTICIA DEPLOYMENT COMPLETE!"
echo "=============================================="
echo ""
print_hero "DEPLOYMENT STATUS: $healthy_services/$total_services services healthy"
echo ""

if [ $healthy_services -eq $total_services ]; then
    print_status "🎉 ALL SERVICES ARE OPERATIONAL! 🎉"
    echo ""
    echo -e "${GREEN}🕵️  Central Dashboard:${NC}    http://localhost:8888"
    echo -e "${CYAN}🔍 Jaeger Tracing:${NC}       http://localhost:16686"
    echo -e "${RED}🐛 GlitchTip Errors:${NC}     http://localhost:8000"
    echo -e "${BLUE}📊 Grafana Dashboard:${NC}    http://localhost:3001 (admin/admin123)"
    echo -e "${YELLOW}📈 Prometheus Metrics:${NC}   http://localhost:9090"
    echo -e "${PURPLE}💾 Redis Commander:${NC}      http://localhost:8081"
    echo -e "${CYAN}🕵️  MCP Inspector:${NC}        http://localhost:6274"
    echo ""
    print_hero "Your observability superhero team is ready for action!"
    echo ""
    echo "💡 Quick commands:"
    echo "   ./observability-urls.sh    - Open all dashboards"
    echo "   docker-compose -f docker-compose.observability.yml logs -f    - View logs"
    echo "   docker-compose -f docker-compose.observability.yml down       - Stop all services"
else
    print_warning "Some services may need more time to start. Check individual URLs."
fi

# Show container status
echo ""
print_info "Container Status:"
docker-compose -f docker-compose.observability.yml ps

echo ""
print_hero "🦸‍♂️ LIGA DE LA JUSTICIA STANDS READY TO PROTECT YOUR OBSERVABILITY! 🦸‍♂️"