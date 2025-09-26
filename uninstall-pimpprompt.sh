#!/bin/bash
# Script de desinstalación segura para pimpprompt
# Uso: ./uninstall-pimpprompt.sh

echo "🗑️  Desinstalación segura de pimpprompt"
echo "======================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}1. Verificando instalación actual...${NC}"

# Verificar si está instalado globalmente
if command -v pimpprompt >/dev/null 2>&1; then
    GLOBAL_PATH=$(which pimpprompt)
    echo -e "${YELLOW}   ✓ Encontrado globalmente en: $GLOBAL_PATH${NC}"
else
    echo -e "${YELLOW}   ⚠️  No encontrado globalmente${NC}"
fi

# Verificar si está instalado via npm
if npm list -g promptsmith-mcp >/dev/null 2>&1; then
    echo -e "${YELLOW}   ✓ Encontrado en npm global${NC}"
    NPM_INSTALLED=true
else
    echo -e "${YELLOW}   ⚠️  No encontrado en npm global${NC}"
    NPM_INSTALLED=false
fi

echo -e "${BLUE}2. Removiendo instalación global...${NC}"

if [ "$NPM_INSTALLED" = true ]; then
    echo -e "${YELLOW}   Ejecutando: npm uninstall -g promptsmith-mcp${NC}"
    if npm uninstall -g promptsmith-mcp; then
        echo -e "${GREEN}   ✅ Desinstalado de npm exitosamente${NC}"
    else
        echo -e "${RED}   ❌ Error al desinstalar de npm${NC}"
    fi
else
    echo -e "${YELLOW}   ⏭️  No hay instalación npm que remover${NC}"
fi

echo -e "${BLUE}3. Limpiando archivos residuales...${NC}"

# Lista de posibles ubicaciones donde podría haber quedado instalado
POSSIBLE_LOCATIONS=(
    "/usr/local/bin/pimpprompt"
    "/usr/local/bin/promptsmith-mcp"
    "$HOME/.nvm/versions/node/*/bin/pimpprompt"
    "$HOME/.nvm/versions/node/*/bin/promptsmith-mcp"
    "/opt/homebrew/bin/pimpprompt"
    "/opt/homebrew/bin/promptsmith-mcp"
)

for location in "${POSSIBLE_LOCATIONS[@]}"; do
    if [ -f "$location" ] || [ -L "$location" ]; then
        echo -e "${YELLOW}   Removiendo: $location${NC}"
        rm -f "$location" 2>/dev/null || {
            echo -e "${RED}   ⚠️  No se pudo remover $location (puede requerir sudo)${NC}"
        }
    fi
done

# Expandir globs para archivos de nvm
for nvmpath in $HOME/.nvm/versions/node/*/bin/pimpprompt $HOME/.nvm/versions/node/*/bin/promptsmith-mcp; do
    if [ -f "$nvmpath" ] || [ -L "$nvmpath" ]; then
        echo -e "${YELLOW}   Removiendo: $nvmpath${NC}"
        rm -f "$nvmpath" 2>/dev/null || {
            echo -e "${RED}   ⚠️  No se pudo remover $nvmpath${NC}"
        }
    fi
done

echo -e "${BLUE}4. Verificación final...${NC}"

if command -v pimpprompt >/dev/null 2>&1; then
    echo -e "${RED}   ❌ ATENCIÓN: pimpprompt todavía está disponible en: $(which pimpprompt)${NC}"
    echo -e "${YELLOW}   💡 Puede que necesites reiniciar tu terminal o correr 'hash -r'${NC}"
    echo -e "${YELLOW}   💡 O puede requerir sudo para remover archivos del sistema${NC}"
else
    echo -e "${GREEN}   ✅ pimpprompt removido exitosamente${NC}"
fi

if npm list -g promptsmith-mcp >/dev/null 2>&1; then
    echo -e "${RED}   ❌ ATENCIÓN: promptsmith-mcp todavía listado en npm global${NC}"
else
    echo -e "${GREEN}   ✅ promptsmith-mcp removido de npm global${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Desinstalación completada${NC}"
echo -e "${BLUE}💡 Reinicia tu terminal o ejecuta 'hash -r' para limpiar el cache de comandos${NC}"
echo ""
echo -e "${YELLOW}📝 Si encuentras algún problema, revisa manualmente:${NC}"
echo -e "${YELLOW}   • npm list -g${NC}"
echo -e "${YELLOW}   • which pimpprompt${NC}"
echo -e "${YELLOW}   • /usr/local/bin/ ${NC}"
echo -e "${YELLOW}   • ~/.nvm/versions/node/*/bin/${NC}"