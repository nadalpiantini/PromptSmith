#!/bin/bash

# PromptSmith Web Deployment Script
# Target: pimpprompt.sujeto10.com via Vercel
# Shared database: sujeto10.supabase.co

set -e

echo "🚀 PromptSmith Web Deployment to pimpprompt.sujeto10.com"
echo "========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_NAME="promptsmith-mcp"
DEPLOY_DOMAIN="pimpprompt.sujeto10.com"
DB_PREFIX="promptsmith_"

echo ""
echo "${BLUE}📋 Deployment Configuration${NC}"
echo "Project: ${PROJECT_NAME}"
echo "Domain: ${DEPLOY_DOMAIN}"
echo "DB Prefix: ${DB_PREFIX}"
echo "Target: Vercel + sujeto10 Supabase"
echo ""

# Step 1: Pre-deployment checks
echo "${YELLOW}Step 1: Pre-deployment Checks${NC}"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
  echo "${RED}❌ .env.production file not found${NC}"
  echo "Creating from template..."
  cp .env .env.production
  echo "${GREEN}✅ Created .env.production from .env${NC}"
fi

# Check if vercel.json exists
if [ ! -f "vercel.json" ]; then
  echo "${RED}❌ vercel.json file not found${NC}"
  exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
  npm install -g vercel
  echo "${GREEN}✅ Vercel CLI installed${NC}"
fi

echo "${GREEN}✅ Pre-deployment checks passed${NC}"
echo ""

# Step 2: Build the project
echo "${YELLOW}Step 2: Building Production Assets${NC}"

# Clean previous builds
echo "Cleaning previous builds..."
npm run clean

# Install dependencies
echo "Installing dependencies..."
npm install

# Build TypeScript with production environment
echo "Building TypeScript for production..."
NODE_ENV=production npm run build

# Verify build output
if [ ! -f "dist/server/http-server.js" ]; then
  echo "${RED}❌ Build failed - http-server.js not found${NC}"
  exit 1
fi

if [ ! -f "src/web/app.html" ]; then
  echo "${RED}❌ Web interface files not found${NC}"
  exit 1
fi

echo "${GREEN}✅ Production build completed${NC}"
echo ""

# Step 3: Configure Vercel environment variables
echo "${YELLOW}Step 3: Configuring Vercel Environment${NC}"

# Set Supabase environment variables in Vercel
echo "Setting Supabase configuration..."
vercel env add SUPABASE_URL production --value="https://nqzhxukuvmdlpewqytpv.supabase.co" --yes || true
vercel env add SUPABASE_ANON_KEY production --value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xemh4dWt1dm1kbHBld3F5dHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTk0MDksImV4cCI6MjA2MjIzNTQwOX0.9raKtf_MAUoZ7lUOek4lazhWTfmxPvufW1-al82UHmk" --yes || true
vercel env add SUPABASE_SERVICE_KEY production --value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xemh4dWt1dm1kbHBld3F5dHB2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY1OTQwOSwiZXhwIjoyMDYyMjM1NDA5fQ.KUbJb8fCHADnITIhr-x8R49_BsmicsYAzW9qG2YlTFA" --yes || true

echo "${GREEN}✅ Environment variables configured${NC}"
echo ""

# Step 4: Deploy to Vercel
echo "${YELLOW}Step 4: Deploying to Vercel${NC}"

# Deploy to production
echo "Deploying to production..."
vercel --prod --yes

# Add custom domain if not already configured
echo "Configuring custom domain..."
vercel domains add ${DEPLOY_DOMAIN} --yes || echo "${YELLOW}⚠️  Domain may already be configured${NC}"

echo "${GREEN}✅ Deployment completed${NC}"
echo ""

# Step 5: Verify deployment
echo "${YELLOW}Step 5: Verifying Deployment${NC}"

echo "Waiting for deployment to be ready..."
sleep 10

# Test health endpoint
echo "Testing health endpoint..."
if curl -s -f "https://${DEPLOY_DOMAIN}/health" > /dev/null; then
  echo "${GREEN}✅ Health endpoint responding${NC}"
else
  echo "${RED}❌ Health endpoint not responding${NC}"
  echo "Please check Vercel deployment logs"
fi

# Test main interface
echo "Testing main interface..."
if curl -s -f "https://${DEPLOY_DOMAIN}/" > /dev/null; then
  echo "${GREEN}✅ Main interface responding${NC}"
else
  echo "${RED}❌ Main interface not responding${NC}"
fi

echo ""

# Step 6: Final instructions
echo "${GREEN}🎉 Web Deployment Complete!${NC}"
echo "================================="
echo ""
echo "${BLUE}📋 Deployment Summary:${NC}"
echo "- Domain: https://${DEPLOY_DOMAIN}"
echo "- API Docs: https://${DEPLOY_DOMAIN}/docs"
echo "- Health Check: https://${DEPLOY_DOMAIN}/health"
echo "- Legacy Interface: https://${DEPLOY_DOMAIN}/legacy"
echo ""
echo "${BLUE}🔗 Useful Links:${NC}"
echo "- Vercel Dashboard: https://vercel.com/dashboard"
echo "- Supabase Dashboard: https://supabase.com/dashboard/project/nqzhxukuvmdlpewqytpv"
echo "- Domain Management: https://vercel.com/dashboard/domains"
echo ""
echo "${BLUE}📊 Monitoring:${NC}"
echo "- Check Vercel Analytics for traffic"
echo "- Monitor Supabase for database activity"
echo "- Review function logs in Vercel dashboard"
echo ""
echo "${BLUE}🛠️ Troubleshooting:${NC}"
echo "- Function logs: vercel logs"
echo "- Environment variables: vercel env ls"
echo "- Domain settings: vercel domains ls"
echo ""
echo "${GREEN}🌐 Your PromptSmith web interface is now live at:${NC}"
echo "${BLUE}https://${DEPLOY_DOMAIN}${NC}"
echo ""
echo "${GREEN}Happy prompt engineering! 🚀${NC}"

# Optional: Open the deployed site
read -p "Open the deployed site in browser? (y/n): " open_site
if [[ $open_site == [Yy]* ]]; then
  if command -v open &> /dev/null; then
    open "https://${DEPLOY_DOMAIN}"
  elif command -v xdg-open &> /dev/null; then
    xdg-open "https://${DEPLOY_DOMAIN}"
  else
    echo "Please visit: https://${DEPLOY_DOMAIN}"
  fi
fi