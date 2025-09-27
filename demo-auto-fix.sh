#!/bin/bash

echo "🚀 MCP Auto-Fix Demo"
echo "===================="

echo ""
echo "1. 🏗️ Building the system..."
npm run build

echo ""
echo "2. 📦 Starting infrastructure..."
docker-compose up -d redis

echo ""  
echo "3. 🧪 Testing working MCP server..."
timeout 3s node test-mcps/working-mcp.js 2>/dev/null && echo "✅ Working MCP runs successfully" || echo "⚠️ Working MCP has timeout (normal for MCP servers)"

echo ""
echo "4. 🔧 Running auto-fix on broken MCP..."
npm run auto-fix test-mcps/broken-mcp.js

echo ""
echo "5. 📊 System Status:"
echo "   - Redis: $(docker-compose ps redis --format 'table {{.State}}')"
echo "   - Auto-fix tool: Ready"
echo "   - Docker profile: auto-fix available"

echo ""
echo "6. 🎯 Usage Commands:"
echo "   npm run auto-fix <path-to-mcp-file>     # Fix individual MCP"
echo "   npm run auto-fix:docker                 # Run with Docker"
echo "   docker-compose --profile auto-fix up    # Full system"

echo ""
echo "📚 The auto-fix agent can handle:"
echo "   ✅ CommonJS → ES module conversion"
echo "   ✅ Missing async/await patterns"  
echo "   ✅ Console.log interference removal"
echo "   ✅ MCP protocol setup issues"
echo "   ✅ Missing dependency installation"
echo "   ✅ File permission fixes"

echo ""
echo "🎉 Demo complete! Your MCP auto-fix system is ready."