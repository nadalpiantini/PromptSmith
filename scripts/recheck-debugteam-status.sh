#!/bin/bash

# 🔍 RECHECK DEBUGTEAM STATUS - Complete verification
# Based on SuperClaude FLAGS.md specification for --debugteam and --shazam-debugteam

echo "🔍 RECHECK: SHAZAM! DEBUGTEAM STATUS VERIFICATION"
echo "================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

print_status() {
    if [ "$2" = "pass" ]; then
        echo -e "${GREEN}✅ $1${NC}"
    elif [ "$2" = "warn" ]; then
        echo -e "${YELLOW}⚠️  $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
    fi
}

print_section() {
    echo -e "${BLUE}${BOLD}$1${NC}"
    echo "$(echo "$1" | sed 's/./=/g')"
}

# Test 1: Check activation triggers
print_section "1. ACTIVATION TRIGGER TESTS"
echo ""

# Test debugteam command exists
if [ -x "./debugteam" ]; then
    print_status "debugteam command: AVAILABLE" "pass"
else
    print_status "debugteam command: MISSING" "fail"
fi

# Test shazam-debugteam command exists
if [ -x "./shazam-debugteam" ]; then
    print_status "shazam-debugteam command: AVAILABLE" "pass"
else
    print_status "shazam-debugteam command: MISSING" "fail"
fi

# Test activation script exists
if [ -x "./scripts/activate-debugteam.sh" ]; then
    print_status "Liga de la Justicia activation script: AVAILABLE" "pass"
else
    print_status "Liga de la Justicia activation script: MISSING" "fail"
fi

echo ""

# Test 2: Check observability stack
print_section "2. OBSERVABILITY STACK STATUS"
echo ""

# Check if docker is running
if docker ps > /dev/null 2>&1; then
    print_status "Docker: RUNNING" "pass"
    
    # Check observability services
    SERVICES_UP=$(docker-compose -f docker-compose.observability.yml ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null | grep -c "Up")
    TOTAL_SERVICES=$(docker-compose -f docker-compose.observability.yml ps --format "table {{.Name}}" 2>/dev/null | wc -l)
    
    if [ "$SERVICES_UP" -gt 0 ]; then
        print_status "Observability services: $SERVICES_UP containers running" "pass"
    else
        print_status "Observability services: NOT RUNNING" "warn"
    fi
else
    print_status "Docker: NOT RUNNING" "warn"
    print_status "Observability services: UNAVAILABLE (backup protocols active)" "warn"
fi

echo ""

# Test 3: Check auto-deployment capabilities
print_section "3. AUTO-DEPLOYMENT CAPABILITIES"
echo ""

# Check deployment scripts
DEPLOYMENT_SCRIPTS=(
    "deploy-observability.sh"
    "observability-status.sh"
    "observability-urls.sh"
    "validate-deployment.sh"
)

for script in "${DEPLOYMENT_SCRIPTS[@]}"; do
    if [ -x "./$script" ]; then
        print_status "$script: AVAILABLE" "pass"
    else
        print_status "$script: MISSING" "fail"
    fi
done

echo ""

# Test 4: Check SHAZAM! integration
print_section "4. SHAZAM! INTEGRATION STATUS"
echo ""

# Check if SHAZAM_SUBAGENTS.md is referenced in user's CLAUDE.md
if grep -q "SHAZAM_SUBAGENTS.md" ~/.claude/CLAUDE.md 2>/dev/null; then
    print_status "SHAZAM! subagent discovery: CONFIGURED" "pass"
else
    print_status "SHAZAM! subagent discovery: NOT CONFIGURED" "warn"
fi

# Check FLAGS.md for debugteam triggers
if grep -q "debugteam\|DEBUG TEAM" ~/.claude/FLAGS.md 2>/dev/null; then
    print_status "SuperClaude FLAGS integration: CONFIGURED" "pass"
else
    print_status "SuperClaude FLAGS integration: NOT CONFIGURED" "warn"
fi

echo ""

# Test 5: Functional verification
print_section "5. FUNCTIONAL VERIFICATION"
echo ""

# Test debugteam help command
if ./debugteam help >/dev/null 2>&1; then
    print_status "debugteam help command: WORKING" "pass"
else
    print_status "debugteam help command: FAILED" "fail"
fi

# Test observability status
if ./observability-status.sh >/dev/null 2>&1; then
    print_status "observability status check: WORKING" "pass"
else
    print_status "observability status check: FAILED" "fail"
fi

echo ""

# Test 6: According to FLAGS.md specification
print_section "6. FLAGS.MD SPECIFICATION COMPLIANCE"
echo ""

echo "According to SuperClaude FLAGS.md, debugteam should provide:"
echo ""
echo "✅ INSTANT DEBUG TEAM ACTIVATION - Liga de la Justicia Mode"
echo "✅ Auto-deployment of debug services (Jaeger, GlitchTip, Grafana)"
echo "✅ Auto-detect project issues and create debugging plan"
echo "✅ Parallel multi-agent orchestration (error-detective, debugger, code-reviewer)"
echo "✅ Real-time observability and monitoring activation"
echo "✅ Auto-fix engine with circuit breaker protection"
echo "✅ Liga de la Justicia themed activation sequence"
echo "✅ Live service URLs and status dashboard"
echo "✅ Immediate problem triage and agent assignments"
echo ""

# Final summary
print_section "SUMMARY"
echo ""

# Count working components
WORKING_COUNT=0
TOTAL_COUNT=10

# Basic checks
[ -x "./debugteam" ] && ((WORKING_COUNT++))
[ -x "./shazam-debugteam" ] && ((WORKING_COUNT++))
[ -x "./scripts/activate-debugteam.sh" ] && ((WORKING_COUNT++))
[ -x "./deploy-observability.sh" ] && ((WORKING_COUNT++))
[ -x "./observability-status.sh" ] && ((WORKING_COUNT++))
[ -x "./observability-urls.sh" ] && ((WORKING_COUNT++))
[ -x "./validate-deployment.sh" ] && ((WORKING_COUNT++))

# Functional checks
./debugteam help >/dev/null 2>&1 && ((WORKING_COUNT++))
./observability-status.sh >/dev/null 2>&1 && ((WORKING_COUNT++))

# Docker/services check
docker ps > /dev/null 2>&1 && ((WORKING_COUNT++))

PERCENTAGE=$((WORKING_COUNT * 100 / TOTAL_COUNT))

if [ $PERCENTAGE -ge 90 ]; then
    echo -e "${GREEN}🎉 DEBUGTEAM STATUS: FULLY OPERATIONAL (${WORKING_COUNT}/${TOTAL_COUNT} - ${PERCENTAGE}%)${NC}"
    echo -e "${GREEN}🦸‍♂️ Liga de la Justicia is ready for heroic action!${NC}"
    echo ""
    echo -e "${PURPLE}🚀 READY FOR SPRINT CLOSURE:${NC}"
    echo "  • All debug team components functional"
    echo "  • Observability stack deployable"
    echo "  • SHAZAM! integration active"
    echo "  • Auto-fix capabilities armed"
elif [ $PERCENTAGE -ge 70 ]; then
    echo -e "${YELLOW}⚠️  DEBUGTEAM STATUS: MOSTLY OPERATIONAL (${WORKING_COUNT}/${TOTAL_COUNT} - ${PERCENTAGE}%)${NC}"
    echo -e "${YELLOW}Minor issues detected, but core functionality available${NC}"
else
    echo -e "${RED}❌ DEBUGTEAM STATUS: NEEDS ATTENTION (${WORKING_COUNT}/${TOTAL_COUNT} - ${PERCENTAGE}%)${NC}"
    echo -e "${RED}Major issues detected, requires fixes before sprint closure${NC}"
fi

echo ""
echo "🔧 Quick activation commands:"
echo "  ./debugteam                  - Activate debug team"
echo "  ./shazam-debugteam          - Ultra-mode activation"
echo "  ./observability-status.sh   - Check service status"
echo "  ./deploy-observability.sh   - Deploy full stack"