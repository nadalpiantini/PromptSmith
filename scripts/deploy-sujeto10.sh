#!/bin/bash

# PromptSmith MCP Deployment Script for sujeto10 infrastructure
# Deploy target: prompsmith.sujeto10.com
# Supabase: sujeto10.supabase.co with "promptsmith_" table prefix

set -e

echo "🚀 PromptSmith MCP - Sujeto10 Deployment"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_NAME="promptsmith-mcp"
DEPLOY_DOMAIN="prompsmith.sujeto10.com"
DB_PREFIX="promptsmith_"

echo ""
echo "${BLUE}📋 Deployment Configuration${NC}"
echo "Project: ${PROJECT_NAME}"
echo "Domain: ${DEPLOY_DOMAIN}"
echo "DB Prefix: ${DB_PREFIX}"
echo "Environment: sujeto10 laboratory"
echo ""

# Function to prompt for input
prompt_input() {
  local prompt="$1"
  local var_name="$2"
  local default="$3"

  if [ -n "$default" ]; then
    read -p "${prompt} [${default}]: " input
    eval $var_name="${input:-$default}"
  else
    read -p "${prompt}: " input
    eval $var_name="$input"
  fi
}

# Step 1: Collect Supabase credentials
echo "${YELLOW}Step 1: Supabase Configuration${NC}"
echo "Please provide your sujeto10 Supabase credentials:"
echo ""

prompt_input "Supabase URL" SUPABASE_URL
prompt_input "Supabase Anon Key" SUPABASE_ANON_KEY
prompt_input "Supabase Service Key (optional)" SUPABASE_SERVICE_KEY

# Validate URL format
if [[ ! $SUPABASE_URL =~ ^https://.*\.supabase\.co$ ]]; then
  echo "${RED}❌ Invalid Supabase URL format${NC}"
  echo "Expected: https://your-project.supabase.co"
  exit 1
fi

echo "${GREEN}✅ Supabase configuration collected${NC}"
echo ""

# Step 2: Create environment file
echo "${YELLOW}Step 2: Creating environment configuration${NC}"

cat > .env << EOF
# PromptSmith MCP Configuration for sujeto10
# Generated: $(date)

# Supabase Configuration
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EOF

if [ -n "$SUPABASE_SERVICE_KEY" ]; then
  echo "SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY" >> .env
fi

cat >> .env << EOF

# Application Configuration
APP_VERSION=1.0.0
NODE_ENV=production
LOG_LEVEL=info

# MCP Server Configuration
MCP_SERVER_NAME=promptsmith-mcp
MCP_SERVER_VERSION=1.0.0

# Analytics and Telemetry
TELEMETRY_ENABLED=true

# Laboratory Configuration
LAB_ENVIRONMENT=sujeto10
PROJECT_PREFIX=promptsmith_
DEPLOY_DOMAIN=$DEPLOY_DOMAIN
EOF

echo "${GREEN}✅ Environment file created: .env${NC}"
echo ""

# Step 3: Build the project
echo "${YELLOW}Step 3: Building project${NC}"
echo "Installing dependencies..."
npm install --production

echo "Building TypeScript..."
npm run build

echo "${GREEN}✅ Project built successfully${NC}"
echo ""

# Step 4: Database setup
echo "${YELLOW}Step 4: Database Setup${NC}"
echo "📋 To complete the setup, run these SQL commands in your Supabase SQL editor:"
echo ""
echo "${BLUE}--- Copy and paste this into Supabase SQL Editor ---${NC}"
echo ""
cat sql/001_promptsmith_production_schema.sql
echo ""
echo "${BLUE}--- End of SQL commands ---${NC}"
echo ""

read -p "Have you run the SQL schema in Supabase? (y/n): " confirm_sql
if [[ $confirm_sql != [Yy]* ]]; then
  echo "${YELLOW}⚠️  Please run the SQL schema first, then re-run this script${NC}"
  exit 1
fi

echo "${GREEN}✅ Database schema confirmed${NC}"
echo ""

# Step 5: Test the server
echo "${YELLOW}Step 5: Testing MCP Server${NC}"
echo "Testing server startup..."

if timeout 5s node dist/cli.js --help > /dev/null 2>&1; then
  echo "${GREEN}✅ Server starts successfully${NC}"
else
  echo "${RED}❌ Server startup failed${NC}"
  echo "Check the error messages above and verify your configuration"
  exit 1
fi

echo ""

# Step 6: Generate Cursor integration config
echo "${YELLOW}Step 6: Cursor IDE Configuration${NC}"

cat > mcp-config-sujeto10.json << EOF
{
  "mcpServers": {
    "promptsmith": {
      "command": "node",
      "args": ["$(pwd)/dist/cli.js"],
      "env": {
        "SUPABASE_URL": "$SUPABASE_URL",
        "SUPABASE_ANON_KEY": "$SUPABASE_ANON_KEY",
        "NODE_ENV": "production",
        "LAB_ENVIRONMENT": "sujeto10"
      }
    }
  }
}
EOF

echo "${GREEN}✅ Cursor configuration created: mcp-config-sujeto10.json${NC}"
echo ""

# Step 7: Final instructions
echo "${GREEN}🎉 Deployment Complete!${NC}"
echo "=========================="
echo ""
echo "${BLUE}📋 Next Steps:${NC}"
echo ""
echo "1. Copy the MCP configuration to Cursor:"
echo "   ${YELLOW}cp mcp-config-sujeto10.json ~/.claude/mcp_servers.json${NC}"
echo ""
echo "2. Restart Cursor IDE to load the new configuration"
echo ""
echo "3. Test the integration:"
echo '   - Use the "process_prompt" tool to optimize prompts'
echo '   - Try "evaluate_prompt" for quality assessment'
echo '   - Save prompts with "save_prompt" for reuse'
echo ""
echo "${BLUE}📊 Monitoring:${NC}"
echo "- Check Supabase dashboard for database activity"
echo "- Monitor table: ${DB_PREFIX}prompts for stored prompts"
echo "- Review analytics in: ${DB_PREFIX}analytics"
echo ""
echo "${BLUE}🔗 Resources:${NC}"
echo "- Documentation: ./CURSOR_INTEGRATION.md"
echo "- Setup Guide: ./SETUP.md"
echo "- Schema File: ./sql/001_promptsmith_production_schema.sql"
echo ""
echo "${GREEN}Happy prompt engineering with PromptSmith MCP! 🚀${NC}"

# Optional: Create a quick verification test
cat > test-integration.js << 'EOF'
// Quick integration test for PromptSmith MCP
const readline = require('readline');
const { spawn } = require('child_process');

console.log('🧪 Testing PromptSmith MCP Integration...\n');

const mcpServer = spawn('node', ['dist/cli.js']);
let output = '';

mcpServer.stdout.on('data', (data) => {
  output += data.toString();
});

mcpServer.stderr.on('data', (data) => {
  console.error('Error:', data.toString());
});

// Test tools/list request
const testRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/list",
  params: {}
};

mcpServer.stdin.write(JSON.stringify(testRequest) + '\n');
mcpServer.stdin.end();

mcpServer.on('close', (code) => {
  if (code === 0 && output.includes('"name":"process_prompt"')) {
    console.log('✅ Integration test PASSED');
    console.log('MCP server is responding correctly');
  } else {
    console.log('❌ Integration test FAILED');
    console.log('Output:', output);
  }

  // Cleanup
  require('fs').unlinkSync('test-integration.js');
});
EOF

echo ""
echo "${BLUE}🧪 Running integration test...${NC}"
node test-integration.js