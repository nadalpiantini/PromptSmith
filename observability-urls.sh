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
