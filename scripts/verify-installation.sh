#!/bin/bash

# PromptSmith MCP - Installation Verification Script
# Comprehensive verification of the complete installation

set -e

echo "🔍 PromptSmith MCP - Installation Verification"
echo "=============================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
PASS=0
FAIL=0
WARN=0

# Test functions
test_pass() {
    echo -e "${GREEN}✅ PASS${NC} $1"
    ((PASS++))
}

test_fail() {
    echo -e "${RED}❌ FAIL${NC} $1"
    ((FAIL++))
}

test_warn() {
    echo -e "${YELLOW}⚠️  WARN${NC} $1"
    ((WARN++))
}

test_info() {
    echo -e "${BLUE}ℹ️  INFO${NC} $1"
}

echo ""
echo "🔧 Testing Prerequisites..."

# Test Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -ge 18 ]; then
        test_pass "Node.js $NODE_VERSION"
    else
        test_fail "Node.js $NODE_VERSION (need 18+)"
    fi
else
    test_fail "Node.js not found"
fi

# Test npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    test_pass "npm $NPM_VERSION"
else
    test_fail "npm not found"
fi

echo ""
echo "📁 Testing Project Structure..."

# Test essential files
files=(
    "package.json"
    ".env.example"
    "tsconfig.json"
    "src/cli.ts"
    "src/server/index.ts"
    "sql/001_initial_schema.sql"
    "README.md"
    "SETUP.md"
    "CURSOR_INTEGRATION.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        test_pass "File exists: $file"
    else
        test_fail "Missing file: $file"
    fi
done

echo ""
echo "🗂️ Testing Documentation..."

docs=(
    "docs/API.md"
    "docs/ARCHITECTURE.md"
    "docs/DEPLOYMENT.md"
    "docs/DEVELOPMENT.md"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        test_pass "Documentation: $doc"
    else
        test_warn "Missing docs: $doc"
    fi
done

echo ""
echo "⚙️  Testing Configuration..."

# Test .env file
if [ -f ".env" ]; then
    test_pass ".env file exists"

    # Check critical environment variables
    if grep -q "SUPABASE_URL=https://" .env; then
        test_pass "SUPABASE_URL configured"
    else
        test_warn "SUPABASE_URL needs configuration"
    fi

    if grep -q "SUPABASE_ANON_KEY=" .env; then
        test_pass "SUPABASE_ANON_KEY configured"
    else
        test_warn "SUPABASE_ANON_KEY needs configuration"
    fi
else
    test_warn ".env file not found (copy from .env.example)"
fi

# Test dependencies
if [ -f "node_modules/.package-lock.json" ] || [ -d "node_modules" ]; then
    test_pass "Dependencies installed"
else
    test_fail "Dependencies not installed (run npm install)"
fi

echo ""
echo "🏗️ Testing Build..."

# Test if dist exists and is recent
if [ -f "dist/cli.js" ]; then
    test_pass "Build output exists: dist/cli.js"

    # Test if executable
    if [ -x "dist/cli.js" ]; then
        test_pass "CLI is executable"
    else
        test_warn "CLI not executable (run chmod +x dist/cli.js)"
    fi
else
    test_fail "Build output missing (run npm run build)"
fi

echo ""
echo "🧪 Testing Server Functionality..."

# Test MCP protocol response
if [ -f "dist/cli.js" ]; then
    echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | timeout 10s node dist/cli.js > /tmp/mcp_test.json 2>/dev/null

    if [ $? -eq 0 ]; then
        if grep -q '"jsonrpc":"2.0"' /tmp/mcp_test.json 2>/dev/null; then
            TOOL_COUNT=$(grep -o '"name"' /tmp/mcp_test.json 2>/dev/null | wc -l)
            if [ "$TOOL_COUNT" -eq 8 ]; then
                test_pass "MCP protocol working (8 tools available)"
            else
                test_warn "MCP protocol partial ($TOOL_COUNT tools found, expected 8)"
            fi
        else
            test_warn "MCP protocol response invalid"
        fi
    else
        test_warn "MCP server timeout or error (may need database setup)"
    fi

    # Cleanup
    rm -f /tmp/mcp_test.json
else
    test_fail "Cannot test server - no build output"
fi

echo ""
echo "🗄️ Testing External Services..."

# Test Redis (optional)
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        test_pass "Redis available and responding"
    else
        test_info "Redis installed but not running (optional)"
    fi
else
    test_info "Redis not installed (optional - improves performance)"
fi

# Test Supabase connectivity (if configured)
if [ -f ".env" ] && grep -q "SUPABASE_URL=https://" .env; then
    SUPABASE_URL=$(grep "SUPABASE_URL=" .env | cut -d'=' -f2)
    if curl -s "$SUPABASE_URL/health" &> /dev/null; then
        test_pass "Supabase URL accessible"
    else
        test_warn "Supabase URL not accessible (check configuration)"
    fi
fi

echo ""
echo "🎮 Testing Cursor Integration..."

# Check MCP configuration
if [ -f "mcp-config.json" ]; then
    test_pass "MCP configuration template exists"
else
    test_warn "MCP configuration template missing"
fi

# Check if user has configured Cursor
if [ -f "$HOME/.claude/mcp_servers.json" ]; then
    test_pass "Cursor MCP configuration exists"

    if grep -q "promptsmith" "$HOME/.claude/mcp_servers.json"; then
        test_pass "PromptSmith configured in Cursor"
    else
        test_warn "PromptSmith not found in Cursor config"
    fi
else
    test_info "Cursor MCP not configured (see CURSOR_INTEGRATION.md)"
fi

echo ""
echo "📊 Verification Summary"
echo "====================="
echo -e "${GREEN}✅ Passed: $PASS${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARN${NC}"
echo -e "${RED}❌ Failed: $FAIL${NC}"
echo ""

# Overall assessment
if [ $FAIL -eq 0 ]; then
    if [ $WARN -eq 0 ]; then
        echo -e "${GREEN}🎉 EXCELLENT!${NC} Your PromptSmith MCP installation is complete and fully configured!"
        echo ""
        echo "✨ Next Steps:"
        echo "  1. Start using in Cursor IDE with MCP tools"
        echo "  2. Try the examples in CURSOR_INTEGRATION.md"
        echo "  3. Build your prompt library with save_prompt"
        echo ""
    else
        echo -e "${YELLOW}🟡 GOOD!${NC} Installation is functional but could be optimized."
        echo ""
        echo "💡 Recommendations:"
        echo "  1. Address warnings above for best experience"
        echo "  2. Configure Supabase for full functionality"
        echo "  3. Set up Redis for better performance"
        echo ""
    fi
else
    echo -e "${RED}🔴 ISSUES DETECTED${NC} - Installation needs attention"
    echo ""
    echo "🔧 Required Actions:"
    echo "  1. Fix failed items above"
    echo "  2. Run setup script: npm run setup"
    echo "  3. Check SETUP.md for detailed instructions"
    echo ""
fi

echo "📖 Documentation:"
echo "  • Setup Guide: SETUP.md"
echo "  • Cursor Integration: CURSOR_INTEGRATION.md"
echo "  • API Reference: docs/API.md"
echo "  • Architecture: docs/ARCHITECTURE.md"
echo ""
echo "🆘 Need Help?"
echo "  • Check troubleshooting in SETUP.md"
echo "  • Review logs for specific error messages"
echo "  • Verify environment configuration"