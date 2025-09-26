# PromptSmith - Arquitectura Híbrida

## 🏗️ Visión General

PromptSmith implementa una **arquitectura híbrida** que combina:

- **CLI Directo** (`pimpprompt`) - Para uso rápido y aprendizaje visual
- **MCP Server** (`promptsmith-mcp`) - Para integración profesional con IDEs

## 📋 Componentes del Sistema

### 1. 🎯 CLI Directo - `pimpprompt`

**Archivos clave:**
- `pimpprompt` - Script bash principal
- `process-prompt.cjs` - Procesador Node.js  
- `direct-processor.cjs` - Procesamiento local

**Flujo de ejecución:**
```bash
pimpprompt "prompt" 
    ↓
Detección automática de dominio
    ↓
process-prompt.cjs (DirectProcessor)
    ↓
Mejora iterativa → 100% calidad
    ↓
Guardado como template global
    ↓
Visualización completa del resultado
```

**Características:**
- ✅ **Visualización inmediata** del prompt mejorado
- ✅ **Detección automática** de 16 dominios
- ✅ **Escalera inteligente** de optimización
- ✅ **Templates globales** reutilizables
- ✅ **Búsqueda y listado** (`--search`, `--list`)
- ✅ **Zero setup** - funciona inmediatamente

### 2. 🚀 MCP Server - `promptsmith-mcp`

**Archivos clave:**
- `src/server/index.ts` - Servidor MCP completo
- `src/mcp-server.ts` - Punto de entrada limpio
- `promptsmith-wrapper.cjs` - Cliente MCP

**Herramientas MCP disponibles:**
1. `process_prompt` - Optimización de prompts
2. `evaluate_prompt` - Análisis de calidad
3. `compare_prompts` - A/B testing
4. `save_prompt` - Persistencia en BD
5. `search_prompts` - Búsqueda avanzada
6. `get_prompt` - Recuperación por ID
7. `get_stats` - Métricas del sistema
8. `validate_prompt` - Validación de calidad

**Protocolo JSON-RPC:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "process_prompt",
    "arguments": {
      "raw": "create a login form",
      "domain": "backend",
      "tone": "professional"
    }
  }
}
```

### 3. 🔄 Sistema Híbrido Inteligente

**SimplePromptSmith** actúa como **router inteligente**:

```javascript
// Prioridad: MCP Server → Fallback Directo
if (this.useMCP) {
  // Funcionalidad completa vía MCP
  return await this.wrapper.processPrompt(raw, domain, tone);
} else {
  // Fallback a procesamiento directo  
  return await directProcessor.processPrompt(raw, domain, tone);
}
```

**Ventajas del enfoque híbrido:**
- 🏆 **Profesionalidad**: "Construí un MCP server completo"
- 🔧 **Flexibilidad**: Funciona con/sin servidor MCP
- ⚡ **Rendimiento**: Fallback inmediato si MCP falla
- 📚 **Aprendizaje**: CLI visual + protocolo estándar

## 🗄️ Persistencia de Datos

### Supabase Integration

**Base de datos:** `sujeto10.supabase.co`
**Prefijo:** `promptsmith_*`

**Tablas principales:**
```sql
promptsmith_prompts        -- Prompts procesados
promptsmith_prompt_evaluations -- Evaluaciones detalladas  
promptsmith_custom_rules   -- Reglas personalizadas
promptsmith_templates      -- Templates reutilizables
promptsmith_analytics      -- Métricas de uso
promptsmith_user_feedback  -- Feedback de usuarios
```

**Modos de operación:**
- **Producción**: Conecta a Supabase real
- **Desarrollo**: Usa mocks locales
- **Híbrido**: Fallback automático según disponibilidad

## 🎛️ Modos de Uso

### Modo CLI (Recomendado para aprendizaje)

```bash
# Uso básico
pimpprompt "create API endpoint"

# Búsqueda de templates
pimpprompt --search "login"
pimpprompt --list sql

# Ayuda completa
pimpprompt --help
```

**Ideal para:**
- 📚 Aprender cómo funciona el procesamiento
- ⚡ Desarrollo rápido e iteración
- 🔍 Explorar templates existentes
- 🧪 Experimentar con diferentes dominios

### Modo MCP (Para integración profesional)

**Configuración en Cursor IDE:**
```json
{
  "mcpServers": {
    "promptsmith": {
      "command": "node",
      "args": ["dist/mcp-server.js"],
      "cwd": "/path/to/PromptSmith",
      "env": {
        "SUPABASE_URL": "...",
        "SUPABASE_ANON_KEY": "..."
      }
    }
  }
}
```

**Ideal para:**
- 🏢 Equipos y uso empresarial
- 🔗 Integración con workflows existentes  
- 📊 Analytics y métricas avanzadas
- 🔄 Automatización y batch processing

## 📊 Comparación de Enfoques

| Característica | CLI Directo | MCP Server |
|---|---|---|
| **Setup** | Zero setup | Configuración MCP |
| **Visualización** | ✅ Inmediata | 📊 Via protocolo |
| **Aprendizaje** | ✅ Transparente | 🔧 Técnico |
| **Integración IDE** | ⚠️ Manual | ✅ Nativa |
| **Profesionalidad** | 🎯 Funcional | 🏆 Enterprise |
| **Debugging** | ✅ Fácil | 🔧 Complejo |
| **Escalabilidad** | ⚠️ Limitada | ✅ Alta |
| **Protocolos** | Custom | ✅ Estándar |

## 🚀 Casos de Uso Recomendados

### 👨‍💻 Desarrollador Individual
```bash
# Workflow típico
pimpprompt "build authentication system"
pimpprompt --search "auth" 
pimpprompt "improve database schema"
```

### 🏢 Equipo Enterprise  
```javascript
// Via MCP en IDE
const result = await mcp.call('process_prompt', {
  raw: userInput,
  domain: 'backend', 
  tone: 'technical'
});
```

### 🎓 Aprendizaje y Enseñanza
```bash
# Ver el procesamiento paso a paso
pimpprompt "create machine learning model"
# → Observar: detección → mejora → score → template
```

## 🔧 Variables de Entorno

```bash
# Core
SUPABASE_URL=https://nqzhxukuvmdlpewqytpv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
NODE_ENV=production

# Opcionales
REDIS_URL=redis://localhost:6379  # Cache (opcional)
USE_MCP=true                      # Habilitar MCP híbrido
DEBUG_MCP=true                    # Debug MCP communication
TELEMETRY_ENABLED=false          # Deshabilitar telemetría
```

## 🎯 Roadmap

### 📋 Implementado
- ✅ CLI directo funcional
- ✅ MCP server completo (8 herramientas)
- ✅ Arquitectura híbrida
- ✅ Supabase integration  
- ✅ Sistema de templates
- ✅ Detección automática de dominios

### 🔮 Próximos pasos
- 🎯 Testing en Cursor IDE
- 📚 Documentación Cursor integration
- 🔧 Performance optimizations
- 📊 Advanced analytics dashboard
- 🌐 Web interface opcional

---

## 💡 Filosofía del Diseño

**"Lo mejor de ambos mundos"**

Esta arquitectura híbrida permite:
- **Aprender** con el CLI visual
- **Escalar** con MCP profesional  
- **Flexibilidad** según el contexto
- **Credibilidad** técnica completa

**Resultado:** Un sistema que funciona para todos los casos de uso, desde aprendizaje individual hasta integración empresarial.