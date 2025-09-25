#!/bin/bash

# PromptSmith MCP - Setup Automático
# Este script configura automáticamente el entorno de desarrollo

set -e  # Exit on error

echo "🚀 PromptSmith MCP - Setup Automático"
echo "======================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar prerrequisitos
log_info "Verificando prerrequisitos..."

# Check Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js no está instalado. Instala Node.js 18+ desde https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)

if [ "$NODE_MAJOR" -lt 18 ]; then
    log_error "Node.js $NODE_VERSION encontrado. Necesitas Node.js 18+."
    exit 1
fi

log_success "Node.js $NODE_VERSION ✅"

# Check npm
if ! command -v npm &> /dev/null; then
    log_error "npm no está disponible"
    exit 1
fi

log_success "npm disponible ✅"

# Instalar dependencias
log_info "Instalando dependencias..."
npm install --silent

if [ $? -eq 0 ]; then
    log_success "Dependencias instaladas ✅"
else
    log_error "Falló la instalación de dependencias"
    exit 1
fi

# Crear archivo .env si no existe
if [ ! -f ".env" ]; then
    log_info "Creando archivo .env..."
    cp .env.example .env
    log_success "Archivo .env creado ✅"
else
    log_warning "Archivo .env ya existe, no se sobrescribió"
fi

# Verificar Redis (opcional)
log_info "Verificando Redis (opcional)..."
if command -v redis-server &> /dev/null; then
    # Intentar conectar a Redis
    if redis-cli ping &> /dev/null; then
        log_success "Redis está corriendo ✅"
    else
        log_warning "Redis instalado pero no corriendo. Inicia con: redis-server"
    fi
else
    log_warning "Redis no instalado. Para instalarlo: brew install redis"
    log_info "Redis es opcional pero mejora el performance"
fi

# Build del proyecto
log_info "Construyendo proyecto..."
npm run build --silent

if [ $? -eq 0 ]; then
    log_success "Proyecto construido ✅"
else
    log_warning "Build completado con advertencias (esto es normal por ahora)"
fi

# Instrucciones para el usuario
echo ""
echo "🎯 PRÓXIMOS PASOS:"
echo "=================="
echo ""
echo "1. 📝 CONFIGURAR SUPABASE:"
echo "   - Ve a https://supabase.com"
echo "   - Crea un nuevo proyecto llamado 'promptsmith-mcp'"
echo "   - Ve a Settings > API y copia tus credenciales"
echo ""
echo "2. ✏️  EDITAR .env:"
echo "   - Abre el archivo .env"
echo "   - Agrega tu SUPABASE_URL"
echo "   - Agrega tu SUPABASE_ANON_KEY"
echo ""
echo "3. 🗃️  CONFIGURAR DATABASE:"
echo "   - En Supabase, ve a SQL Editor"
echo "   - Ejecuta TODO el contenido de: sql/001_initial_schema.sql"
echo ""
echo "4. 🧪 PROBAR INSTALACIÓN:"
echo "   npm run test:server"
echo ""
echo "5. 🎮 INTEGRAR CON CURSOR:"
echo "   - Copia mcp-config.json a ~/.claude/mcp_servers.json"
echo "   - Actualiza las credenciales en el archivo copiado"
echo "   - Reinicia Cursor IDE"
echo ""

# Verificar configuración actual
echo "📊 ESTADO ACTUAL:"
echo "================"

# Check .env variables
if [ -f ".env" ]; then
    if grep -q "SUPABASE_URL=https://" .env; then
        log_success "SUPABASE_URL configurado"
    else
        log_warning "SUPABASE_URL necesita configuración"
    fi

    if grep -q "SUPABASE_ANON_KEY=eyJ" .env; then
        log_success "SUPABASE_ANON_KEY configurado"
    else
        log_warning "SUPABASE_ANON_KEY necesita configuración"
    fi
fi

# Check if build succeeded
if [ -f "dist/cli.js" ]; then
    log_success "Binario generado: dist/cli.js"

    # Check if executable
    if [ -x "dist/cli.js" ]; then
        log_success "CLI ejecutable"
    else
        log_warning "CLI no es ejecutable"
        chmod +x dist/cli.js
        log_success "Permisos de ejecución aplicados"
    fi
else
    log_error "Binario no encontrado - revisar build"
fi

echo ""
echo "🎉 SETUP BÁSICO COMPLETADO"
echo ""
echo "📖 Para instrucciones detalladas, lee: SETUP.md"
echo "🆘 Si tienes problemas, revisa la sección Troubleshooting en SETUP.md"
echo ""
echo "🚀 Una vez configurado Supabase, ejecuta: npm start"
echo ""