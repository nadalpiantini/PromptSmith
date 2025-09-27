#!/bin/bash

# 🦸‍♂️ LIGA DE LA JUSTICIA - OBSERVABILITY VALIDATION SCRIPT
# Comprehensive validation of the observability stack deployment

echo "🦸‍♂️ LIGA DE LA JUSTICIA - VALIDATING DEPLOYMENT"
echo "=============================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Counters
passed=0
failed=0
total=0

# Test function
run_test() {
    local name="$1"
    local command="$2"
    local expected="$3"
    
    total=$((total + 1))
    echo -n "Testing $name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        passed=$((passed + 1))
    else
        echo -e "${RED}❌ FAIL${NC}"
        failed=$((failed + 1))
    fi
}

# HTTP endpoint test
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    
    total=$((total + 1))
    echo -n "Testing $name endpoint... "
    
    local status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$url" 2>/dev/null)
    
    if [[ "$status" == "$expected_status" ]]; then
        echo -e "${GREEN}✅ PASS ($status)${NC}"
        passed=$((passed + 1))
    else
        echo -e "${RED}❌ FAIL ($status, expected $expected_status)${NC}"
        failed=$((failed + 1))
    fi
}

# Docker container test
test_container() {
    local container_name="$1"
    
    total=$((total + 1))
    echo -n "Testing container $container_name... "
    
    if docker ps --format "table {{.Names}}" | grep -q "$container_name"; then
        local status=$(docker inspect --format='{{.State.Health.Status}}' $(docker ps -q --filter "name=$container_name") 2>/dev/null || echo "running")
        if [[ "$status" == "healthy" ]] || [[ "$status" == "running" ]]; then
            echo -e "${GREEN}✅ PASS ($status)${NC}"
            passed=$((passed + 1))
        else
            echo -e "${YELLOW}⚠️  WARN ($status)${NC}"
            passed=$((passed + 1))
        fi
    else
        echo -e "${RED}❌ FAIL (not running)${NC}"
        failed=$((failed + 1))
    fi
}

echo "🔍 Starting comprehensive validation..."
echo ""

# Test Docker containers
echo "🐳 Testing Docker Containers:"
echo "=============================="
test_container "jaeger"
test_container "glitchtip"
test_container "grafana" 
test_container "prometheus"
test_container "redis-commander"
test_container "mcp-inspector"
test_container "monitoring-dashboard"

echo ""

# Test HTTP endpoints
echo "🌐 Testing HTTP Endpoints:"
echo "=========================="
test_endpoint "Jaeger UI" "http://localhost:16686/"
test_endpoint "GlitchTip" "http://localhost:8000/"
test_endpoint "Grafana" "http://localhost:3001/" "302"  # Redirects to login
test_endpoint "Prometheus" "http://localhost:9090/"
test_endpoint "Redis Commander" "http://localhost:8081/"
test_endpoint "MCP Inspector Health" "http://localhost:6274/health"
test_endpoint "Central Dashboard" "http://localhost:8888/"

echo ""

# Test API endpoints
echo "🔌 Testing API Endpoints:"
echo "========================="
test_endpoint "MCP Inspector API" "http://localhost:6274/api/stats"
test_endpoint "Central Dashboard API" "http://localhost:8888/api/status"
test_endpoint "Prometheus Metrics" "http://localhost:9090/metrics"
test_endpoint "Grafana Health" "http://localhost:3001/api/health"

echo ""

# Test observability data flow
echo "📊 Testing Observability Data Flow:"
echo "===================================="

# Test if Prometheus is scraping targets
echo -n "Testing Prometheus target scraping... "
targets_response=$(curl -s "http://localhost:9090/api/v1/targets" 2>/dev/null)
if echo "$targets_response" | grep -q '"health":"up"'; then
    echo -e "${GREEN}✅ PASS (targets are up)${NC}"
    passed=$((passed + 1))
else
    echo -e "${YELLOW}⚠️  WARN (check target health)${NC}"
    failed=$((failed + 1))
fi
total=$((total + 1))

# Test Grafana datasources
echo -n "Testing Grafana datasources... "
if curl -s -u admin:admin123 "http://localhost:3001/api/datasources" | grep -q "Prometheus"; then
    echo -e "${GREEN}✅ PASS (datasources configured)${NC}"
    passed=$((passed + 1))
else
    echo -e "${YELLOW}⚠️  WARN (check datasource config)${NC}"
    failed=$((failed + 1))
fi
total=$((total + 1))

echo ""

# Test file structure
echo "📁 Testing File Structure:"
echo "=========================="
run_test "Observability config directory" "test -d observability"
run_test "Prometheus config" "test -f observability/prometheus/prometheus.yml"
run_test "Grafana datasources" "test -f observability/grafana/provisioning/datasources/datasources.yml"
run_test "Grafana dashboard" "test -f observability/grafana/dashboards/promptsmith-overview.json"
run_test "Docker compose file" "test -f docker-compose.observability.yml"
run_test "Deployment script" "test -x deploy-observability.sh"
run_test "URL access script" "test -x observability-urls.sh"

echo ""

# Test environment configuration
echo "⚙️  Testing Environment Configuration:"
echo "======================================"
run_test ".env file exists" "test -f .env"
run_test ".env.observability template exists" "test -f .env.observability"

if [[ -f .env ]]; then
    echo -n "Checking observability environment variables... "
    missing_vars=()
    
    for var in JAEGER_ENDPOINT PROMETHEUS_ENDPOINT MCP_INSPECTOR_ENDPOINT; do
        if ! grep -q "^$var=" .env 2>/dev/null; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -eq 0 ]]; then
        echo -e "${GREEN}✅ PASS${NC}"
        passed=$((passed + 1))
    else
        echo -e "${YELLOW}⚠️  WARN (missing: ${missing_vars[*]})${NC}"
        failed=$((failed + 1))
    fi
    total=$((total + 1))
fi

echo ""

# Network connectivity test
echo "🌐 Testing Network Connectivity:"
echo "================================="

# Test internal Docker network connectivity
if docker network ls | grep -q "observability"; then
    echo -e "${GREEN}✅ PASS${NC} Docker observability network exists"
    passed=$((passed + 1))
else
    echo -e "${RED}❌ FAIL${NC} Docker observability network missing"
    failed=$((failed + 1))
fi
total=$((total + 1))

# Test service-to-service communication
echo -n "Testing service-to-service communication... "
if docker exec $(docker ps -q --filter "name=grafana") wget -q --spider http://prometheus:9090 2>/dev/null; then
    echo -e "${GREEN}✅ PASS (Grafana → Prometheus)${NC}"
    passed=$((passed + 1))
else
    echo -e "${RED}❌ FAIL (Grafana → Prometheus)${NC}"
    failed=$((failed + 1))
fi
total=$((total + 1))

echo ""

# Performance test
echo "⚡ Testing Performance:"
echo "======================"

# Test response times
services=("jaeger:16686" "grafana:3001" "prometheus:9090" "8888:monitoring")
for service in "${services[@]}"; do
    IFS=':' read -r name port service_name <<< "$service"
    echo -n "Testing ${service_name:-$name} response time... "
    
    response_time=$(curl -w "%{time_total}" -s -o /dev/null "http://localhost:$port/" 2>/dev/null)
    
    # Check if response time is reasonable (less than 5 seconds)
    if (( $(echo "$response_time < 5.0" | bc -l 2>/dev/null || echo 0) )); then
        echo -e "${GREEN}✅ PASS (${response_time}s)${NC}"
        passed=$((passed + 1))
    else
        echo -e "${YELLOW}⚠️  WARN (${response_time}s - slow)${NC}"
        failed=$((failed + 1))
    fi
    total=$((total + 1))
done

echo ""

# Resource usage check
echo "💾 Testing Resource Usage:"
echo "=========================="

echo -n "Testing memory usage... "
memory_usage=$(docker stats --no-stream --format "table {{.MemPerc}}" | tail -n +2 | sed 's/%//' | awk '{sum+=$1} END {print sum}')
if (( $(echo "$memory_usage < 80" | bc -l 2>/dev/null || echo 0) )); then
    echo -e "${GREEN}✅ PASS (${memory_usage}%)${NC}"
    passed=$((passed + 1))
else
    echo -e "${YELLOW}⚠️  WARN (${memory_usage}% - high memory usage)${NC}"
    failed=$((failed + 1))
fi
total=$((total + 1))

echo ""

# Final summary
echo "🎯 VALIDATION SUMMARY"
echo "===================="
echo -e "Total Tests: $total"
echo -e "${GREEN}Passed: $passed${NC}"
echo -e "${RED}Failed: $failed${NC}"

if [[ $failed -eq 0 ]]; then
    echo ""
    echo -e "${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
    echo -e "${PURPLE}🦸‍♂️ LIGA DE LA JUSTICIA IS FULLY OPERATIONAL! 🦸‍♂️${NC}"
    echo ""
    echo "🚀 Your observability stack is ready for heroic action!"
    echo ""
    echo "🌟 Access Points:"
    echo "   Central Command: http://localhost:8888"
    echo "   Jaeger Tracing:  http://localhost:16686"
    echo "   Grafana Metrics: http://localhost:3001"
    echo "   Error Tracking:  http://localhost:8000"
    echo "   MCP Inspector:   http://localhost:6274"
    echo ""
    echo "💡 Recommended next steps:"
    echo "   1. Integrate PromptSmith: node integrate-observability.js"
    echo "   2. Restart your MCP server to enable tracing"
    echo "   3. Generate some test traffic"
    echo "   4. Monitor dashboards for data flow"
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
    echo ""
    echo "🔧 Troubleshooting suggestions:"
    echo "   1. Check Docker container logs:"
    echo "      docker-compose -f docker-compose.observability.yml logs"
    echo "   2. Restart failed services:"
    echo "      docker-compose -f docker-compose.observability.yml restart [service]"
    echo "   3. Check port conflicts:"
    echo "      lsof -i :16686,8000,3001,9090,8081,6274,8888"
    echo "   4. Verify Docker resources:"
    echo "      docker system df"
    echo ""
    exit 1
fi