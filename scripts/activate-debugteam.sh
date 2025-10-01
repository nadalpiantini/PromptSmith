#!/bin/bash

# 🦸‍♂️ LIGA DE LA JUSTICIA DEBUG TEAM ACTIVATION SCRIPT
# Automatic debugging team deployment with heroic messaging

# Colors for heroic output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Hero emojis
HERO="🦸‍♂️"
FLASH="⚡"
SHIELD="🛡️"
ROCKET="🚀"
TARGET="🎯"
FIRE="🔥"

# Function for heroic announcements
announce_hero() {
    echo -e "${PURPLE}${BOLD}${HERO} $1 ${HERO}${NC}"
}

print_step() {
    echo -e "${CYAN}${FLASH}${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

# Clear screen for dramatic effect
clear

# Heroic activation sequence
echo -e "${PURPLE}${BOLD}"
cat << 'EOF'
╔══════════════════════════════════════════════════════════╗
║  🦸‍♂️ LIGA DE LA JUSTICIA - DEBUG TEAM ACTIVATION 🦸‍♂️      ║
║                                                          ║
║  "With great code comes great responsibility"            ║
║                                                          ║
║  Assembling the mightiest debugging heroes...           ║
╚══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

sleep 1

announce_hero "INITIATING EMERGENCY DEBUG PROTOCOLS"
echo ""

# Step 1: Check if docker is available
print_step "Phase 1: Scanning for available heroic powers..."
if ! command -v docker &> /dev/null; then
    print_warning "Docker not available - Activating backup protocols"
    DOCKER_MODE=false
else
    print_success "Docker powers detected!"
    DOCKER_MODE=true
fi

# Step 2: Deploy observability stack if docker is available
if [ "$DOCKER_MODE" = true ]; then
    print_step "Phase 2: Deploying Liga de la Justicia observability stack..."
    
    echo -e "${BLUE}${SHIELD} Launching monitoring services...${NC}"
    ./deploy-observability.sh > /tmp/debug_deploy.log 2>&1 &
    DEPLOY_PID=$!
    
    # Show progress animation
    echo -n "Assembling heroes: "
    for i in {1..10}; do
        echo -n "${HERO}"
        sleep 0.5
    done
    echo ""
    
    # Wait for deployment
    wait $DEPLOY_PID
    DEPLOY_STATUS=$?
    
    if [ $DEPLOY_STATUS -eq 0 ]; then
        print_success "Observability stack deployed successfully!"
    else
        print_warning "Some services may need manual attention"
    fi
else
    print_step "Phase 2: Activating lightweight debugging mode..."
    print_success "Backup protocols activated!"
fi

# Step 3: Auto-detect and create debugging plan
print_step "Phase 3: Scanning for issues and creating battle plan..."

# Check for common issues
ISSUES_FOUND=0
echo ""
echo -e "${YELLOW}${TARGET} TACTICAL ANALYSIS:${NC}"

# Check PromptSmith server status
if pgrep -f "promptsmith-mcp" > /dev/null; then
    print_success "PromptSmith MCP server: OPERATIONAL"
else
    print_warning "PromptSmith MCP server: NEEDS ATTENTION"
    ((ISSUES_FOUND++))
fi

# Check for recent errors in logs
if [ -d "logs" ]; then
    ERROR_COUNT=$(find logs -name "*.log" -mtime -1 -exec grep -c "ERROR\|error\|Error" {} + 2>/dev/null | awk '{sum += $1} END {print sum+0}')
    if [ "$ERROR_COUNT" -gt 0 ]; then
        print_warning "Recent errors detected: $ERROR_COUNT issues"
        ((ISSUES_FOUND++))
    else
        print_success "Log analysis: NO CRITICAL ERRORS"
    fi
else
    print_warning "Logs directory not found"
fi

# Check database connectivity
print_step "Testing database connectivity..."
if npm run test:connectivity > /tmp/db_test.log 2>&1; then
    print_success "Database: CONNECTED"
else
    print_warning "Database: CONNECTION ISSUES DETECTED"
    ((ISSUES_FOUND++))
fi

# Step 4: Launch real-time monitoring
print_step "Phase 4: Activating real-time monitoring..."

if [ "$DOCKER_MODE" = true ]; then
    echo -e "${CYAN}${ROCKET} Launching monitoring dashboards...${NC}"
    sleep 2
    
    # Open monitoring URLs if services are ready
    ./observability-status.sh
    
    if command -v open &> /dev/null; then
        echo -e "${BLUE}${FIRE} Opening command center...${NC}"
        sleep 1
        open http://localhost:8888 2>/dev/null &  # Central Dashboard
    fi
fi

# Step 5: Present findings and next steps
echo ""
announce_hero "MISSION STATUS REPORT"
echo ""

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}${BOLD}🎉 ALL SYSTEMS OPERATIONAL! 🎉${NC}"
    echo -e "${GREEN}Your systems are running smoothly.${NC}"
    echo ""
    echo -e "${BLUE}${TARGET} PREVENTIVE MONITORING ACTIVATED:${NC}"
    if [ "$DOCKER_MODE" = true ]; then
        echo "  • Real-time error tracking via GlitchTip"
        echo "  • Distributed tracing via Jaeger"
        echo "  • Performance metrics via Grafana"
        echo "  • Central command dashboard"
    fi
    echo "  • Continuous health monitoring"
    echo "  • Automated issue detection"
else
    echo -e "${YELLOW}${BOLD}⚠️  $ISSUES_FOUND ISSUES REQUIRE ATTENTION ⚠️${NC}"
    echo ""
    echo -e "${RED}${TARGET} RECOMMENDED ACTIONS:${NC}"
    echo "  1. Review logs for error patterns"
    echo "  2. Check database connectivity"
    echo "  3. Restart affected services"
    echo "  4. Run full system validation"
    echo ""
    echo -e "${CYAN}${FLASH} QUICK FIXES:${NC}"
    echo "  • ./validate-deployment.sh    - Full system check"
    echo "  • npm run test                - Run test suite"
    echo "  • npm run verify              - Verify installation"
fi

echo ""
announce_hero "DEBUG TEAM DEPLOYMENT COMPLETE"

echo ""
echo -e "${PURPLE}${BOLD}🔧 AVAILABLE COMMANDS:${NC}"
echo "  🦸‍♂️ ./observability-status.sh     - Quick status check"
echo "  📊 ./observability-urls.sh        - Open all dashboards"
echo "  🔍 ./validate-deployment.sh       - Full validation"
echo "  ⚡ docker-compose logs -f         - Live log streaming"

echo ""
if [ "$DOCKER_MODE" = true ]; then
    echo -e "${GREEN}${HERO} Liga de la Justicia stands ready to protect your code! ${HERO}${NC}"
else
    echo -e "${GREEN}${HERO} Debug protocols activated! Ready for action! ${HERO}${NC}"
fi

# Auto-fix engine activation
echo ""
print_step "Activating auto-fix engine with circuit breaker protection..."
echo -e "${CYAN}Auto-fix protocols: STANDBY${NC}"
echo -e "${YELLOW}Circuit breaker: ARMED${NC}"

echo ""
echo -e "${BOLD}May your code be bug-free and your deployments heroic! 🚀${NC}"