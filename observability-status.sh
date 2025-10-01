#!/bin/bash

# 🦸‍♂️ QUICK STATUS CHECK FOR OBSERVABILITY SERVICES

echo "🦸‍♂️ LIGA DE LA JUSTICIA - STATUS CHECK"
echo "========================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if services are running
# Service definitions (compatible with older bash versions)
SERVICES=(
    "Central_Dashboard:localhost:8888"
    "Jaeger_Tracing:localhost:16686"
    "GlitchTip_Errors:localhost:8000"
    "Grafana_Metrics:localhost:3001"
    "Prometheus:localhost:9090"
    "Redis_Commander:localhost:8081"
    "MCP_Inspector:localhost:6274"
)

echo "Service Status:"
echo "==============="

healthy=0
total=${#SERVICES[@]}

for service_entry in "${SERVICES[@]}"; do
    # Split service entry by colon
    service_name=$(echo "$service_entry" | cut -d: -f1)
    service_url=$(echo "$service_entry" | cut -d: -f2,3)
    url="http://$service_url"
    
    if curl -f -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $service_name${NC} - $url"
        ((healthy++))
    else
        echo -e "${RED}❌ $service_name${NC} - $url"
    fi
done

echo ""
echo "Summary: $healthy/$total services healthy"

if [[ $healthy -eq $total ]]; then
    echo -e "${GREEN}🎉 All services operational!${NC}"
    echo ""
    echo "🚀 Quick Access:"
    echo "   ./observability-urls.sh - Open all dashboards"
    echo ""
    echo "⚡ Quick Commands:"
    echo "   docker-compose -f docker-compose.observability.yml logs -f"
    echo "   docker-compose -f docker-compose.observability.yml ps"
    echo "   ./validate-deployment.sh"
else
    echo -e "${YELLOW}⚠️  Some services need attention${NC}"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   ./deploy-observability.sh     - Redeploy services"
    echo "   ./validate-deployment.sh      - Full validation"
    echo "   docker-compose -f docker-compose.observability.yml restart"
fi

echo ""
echo "📊 Container Status:"
docker-compose -f docker-compose.observability.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Services not running"