# Cursor IDE - PromptSmith MCP Integration

## 🎯 Configuración Paso a Paso

### 1. 📋 Preparar el Sistema

**Verificar que PromptSmith esté compilado:**
```bash
cd /Users/nadalpiantini/Dev/PrompSmith/PromptSmith
npm run build
```

**Testear el MCP server:**
```bash
# Test de funcionamiento
node test-mcp-wrapper.cjs

# Debería mostrar:
# ✅ PromptSmith MCP server ready!
# ✅ MCP Wrapper test completed successfully!
```

### 2. ⚙️ Configurar Cursor

**Opción A: Configuración Manual**

1. Abrir Cursor IDE
2. Presionar `Cmd/Ctrl + Shift + P`
3. Escribir "Preferences: Open User Settings (JSON)"
4. Añadir la configuración MCP:

```json
{
  "mcpServers": {
    "promptsmith": {
      "command": "node",
      "args": ["dist/mcp-server.js"],
      "cwd": "/Users/nadalpiantini/Dev/PrompSmith/PromptSmith",
      "env": {
        "SUPABASE_URL": "https://nqzhxukuvmdlpewqytpv.supabase.co",
        "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xemh4dWt1dm1kbHBld3F5dHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY3ODYwNzMsImV4cCI6MjA0MjM2MjA3M30.xLSRRy7FNMHJd9F39R85dU7qOzHLQxnMO0zQfqRZ1Ho",
        "NODE_ENV": "production",
        "TELEMETRY_ENABLED": "false"
      }
    }
  }
}
```

**Opción B: Usar Archivo Pre-configurado**

```bash
# Copiar configuración lista
cp cursor-mcp-config.json ~/.cursor/mcp-settings.json
```

### 3. 🔄 Reiniciar Cursor

Cerrar completamente Cursor y volver a abrirlo para cargar el servidor MCP.

### 4. ✅ Verificar Conexión

**En Cursor:**
1. Abrir Command Palette (`Cmd/Ctrl + Shift + P`)
2. Buscar "MCP" - deberías ver herramientas de PromptSmith
3. Intentar usar alguna herramienta MCP

**Herramientas disponibles en Cursor:**
- 🎯 `process_prompt` - Optimizar prompts
- 📊 `evaluate_prompt` - Analizar calidad
- 🔍 `search_prompts` - Buscar templates
- 💾 `save_prompt` - Guardar prompts
- ⚖️ `compare_prompts` - A/B testing
- 📋 `get_prompt` - Obtener por ID
- 📈 `get_stats` - Métricas del sistema
- ✅ `validate_prompt` - Validar calidad

## 🧪 Testing de Funcionalidad

### Test 1: Procesar Prompt Simple

**En chat de Cursor, escribir:**
```
Usa la herramienta process_prompt para optimizar este prompt:
"create a login form"
```

**Respuesta esperada:**
```json
{
  "original": "create a login form",
  "refined": "Please generate a simple login form...",
  "score": {
    "overall": 0.6475,
    "clarity": 1.0,
    "specificity": 0.2,
    "structure": 0.79,
    "completeness": 0.6
  },
  "metadata": {
    "domain": "general",
    "processingTime": 376
  }
}
```

### Test 2: Buscar Templates

**En Cursor:**
```
Usa search_prompts para buscar templates relacionados con "authentication"
```

### Test 3: Estadísticas del Sistema  

**En Cursor:**
```
Usa get_stats para ver las métricas del sistema PromptSmith
```

## 🎯 Casos de Uso en Cursor

### 📝 Mejora de Documentación

**Workflow:**
1. Seleccionar código mal documentado
2. Usar `process_prompt` con contexto:
   ```
   Optimiza esta descripción: "función que hace cosas con usuarios"
   Dominio: backend
   ```
3. Resultado optimizado se integra automáticamente

### 🔍 Búsqueda de Patterns

**Workflow:**  
1. Antes de escribir código nuevo, usar `search_prompts`:
   ```
   Buscar templates similares a: "user authentication with JWT"
   ```
2. Revisar patterns existentes
3. Usar `get_prompt` para obtener detalles completos
4. Adaptar el pattern al caso actual

### 📊 Code Review Asistido

**Workflow:**
1. Durante code review, usar `evaluate_prompt` para analizar:
   ```
   Evaluar la claridad de esta función: "processUserData()"
   ```
2. Usar `validate_prompt` para detectar problemas:
   ```
   Validar esta documentación: "Función importante del sistema"
   ```
3. Usar `compare_prompts` para A/B test de versiones:
   ```
   Comparar: "Version A" vs "Version B" de la documentación
   ```

### 💾 Template Management

**Workflow:**
1. Crear prompt optimizado con `process_prompt`
2. Guardarlo como template con `save_prompt`:
   ```json
   {
     "prompt": "Resultado optimizado",
     "metadata": {
       "name": "Authentication Pattern v2", 
       "domain": "backend",
       "tags": ["auth", "security", "jwt"]
     }
   }
   ```
3. Futuras búsquedas con `search_prompts` encontrarán este template

## 🐛 Troubleshooting

### ❌ "MCP Server Not Found"

**Solución:**
```bash
# 1. Verificar que el path es correcto
ls -la /Users/nadalpiantini/Dev/PrompSmith/PromptSmith/dist/mcp-server.js

# 2. Si no existe, compilar
cd /Users/nadalpiantini/Dev/PrompSmith/PromptSmith
npm run build

# 3. Testear independientemente  
node test-mcp-wrapper.cjs
```

### ❌ "Connection Timeout"

**Solución:**
```bash
# 1. Verificar variables de entorno
echo $SUPABASE_URL

# 2. Test de conexión directa
node test-supabase.cjs

# 3. Si Redis da error (normal):
# Ignorar errores de Redis - el sistema funciona sin caché
```

### ❌ "Tools Not Appearing"

**Soluciones:**
1. **Reiniciar Cursor completamente**
2. **Verificar configuración JSON válida**
3. **Revisar logs de Cursor:**
   - `Help → Show Logs`
   - Buscar errores de MCP

### ❌ "JSON Parse Error"

**Causas comunes:**
- Coma extra en JSON de configuración
- Quotes mal cerradas
- Path incorrecto al directorio

**Solución:**
```bash
# Validar JSON
cat ~/.cursor/mcp-settings.json | python3 -m json.tool
```

## 🔧 Debug Mode

**Para debug avanzado, añadir a la configuración:**
```json
{
  "mcpServers": {
    "promptsmith": {
      "command": "node",
      "args": ["dist/mcp-server.js"],
      "cwd": "/Users/nadalpiantini/Dev/PrompSmith/PromptSmith",
      "env": {
        "DEBUG_MCP": "true",
        "NODE_ENV": "development",
        // ... resto de variables
      }
    }
  }
}
```

## 📈 Monitoring y Métricas

### Logs del Sistema

**Ubicación de logs:**
```bash
# Logs de MCP server
tail -f ~/.promptsmith/logs/mcp-server.log

# Logs de Cursor (macOS)
tail -f ~/Library/Application\ Support/Cursor/logs/main.log
```

### Métricas de Uso

**Disponibles via `get_stats`:**
- Total prompts procesados
- Calidad promedio conseguida
- Dominios más utilizados  
- Tiempo promedio de procesamiento
- Templates más populares

## 🎊 ¡Listo para Producción!

Una vez configurado correctamente, tendrás:

✅ **8 herramientas MCP** integradas en Cursor  
✅ **Optimización automática** de prompts  
✅ **Búsqueda inteligente** de templates  
✅ **Analytics en tiempo real**  
✅ **Persistencia en Supabase**  
✅ **Fallback automático** si hay problemas

**¡Tu equipo de desarrollo ahora tiene superpoderes de prompting!** 🚀

---

## 📞 Soporte

**Si encuentras problemas:**

1. **Revisar logs:** `tail -f ~/.promptsmith/logs/mcp-server.log`  
2. **Testear independiente:** `node test-mcp-wrapper.cjs`
3. **Verificar configuración:** JSON válido en Cursor settings
4. **Reiniciar Cursor** completamente
5. **Verificar variables** de entorno de Supabase

**¡El sistema está diseñado para ser robusto y fallar gracefully!** 💪