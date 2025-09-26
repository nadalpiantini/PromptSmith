# PromptSmith - Guía de Uso Completa

## 🚀 Inicio Rápido

### CLI Directo (Recomendado)

```bash
# Instalación ya completada ✅
# pimpprompt está disponible globalmente

# Uso básico - mejora cualquier prompt
pimpprompt "create a simple login form"

# Ver ayuda completa
pimpprompt --help
```

## 📚 CLI - Funcionalidad Completa

### 🎯 Procesamiento de Prompts

**Sintaxis básica:**
```bash
pimpprompt "tu prompt aquí"
```

**Ejemplos por dominio:**
```bash
# SQL - Detectado automáticamente
pimpprompt "get all users from database"

# Web/Frontend  
pimpprompt "create responsive landing page"

# Mobile
pimpprompt "build expense tracking app"

# DevOps
pimpprompt "deploy to kubernetes cluster"

# AI/ML
pimpprompt "train sentiment analysis model"

# Branding
pimpprompt "write marketing campaign copy"
```

### 🔍 Gestión de Templates

**Buscar templates existentes:**
```bash
# Buscar por palabra clave
pimpprompt --search "login"
pimpprompt --search "database"
pimpprompt --search "api"

# Listar todos los templates
pimpprompt --list

# Filtrar por dominio
pimpprompt --list sql
pimpprompt --list mobile
pimpprompt --list devops
```

**Salida de ejemplo:**
```
🔍 Buscando templates: login

   ✅ Encontrados 3 templates:

   1. backend_create_simple_login_0925
      Dominio: backend
      Calidad: 100%
      Descripción: Template para formularios de login

   2. frontend_login_component_0924  
      Dominio: web
      Calidad: 95%
      Descripción: Componente React de login
```

### 🧠 Detección Automática de Dominios

PromptSmith detecta automáticamente 16 dominios especializados:

| Dominio | Palabras Clave | Ejemplo |
|---------|---------------|---------|
| **sql** | SELECT, INSERT, DATABASE, QUERY | "get user data from database" |
| **web** | HTML, CSS, WEBSITE, REACT, VUE | "create landing page" |  
| **mobile** | APP, IOS, ANDROID, FLUTTER | "build mobile app" |
| **backend** | API, SERVER, MICROSERVICE, REST | "create REST API" |
| **frontend** | COMPONENT, UI, INTERFACE | "design user interface" |
| **ai** | ML, MODEL, NEURAL, DEEP LEARNING | "train ML model" |
| **gaming** | GAME, UNITY, GAMEPLAY | "create RPG game" |
| **crypto** | BLOCKCHAIN, BITCOIN, SMART CONTRACT | "deploy smart contract" |
| **devops** | DOCKER, KUBERNETES, CI/CD, DEPLOY | "setup CI/CD pipeline" |
| **saas** | SOFTWARE, PLATFORM, SERVICE | "build SaaS platform" |
| **branding** | MARKETING, COPY, CAMPAIGN | "write brand message" |
| **cine** | MOVIE, SCREENPLAY, FILM | "write movie script" |
| **education** | COURSE, LEARN, TEACH | "create online course" |
| **healthcare** | MEDICAL, PATIENT, HEALTH | "design health app" |
| **finance** | BANKING, PAYMENT, FINTECH | "build payment system" |
| **legal** | CONTRACT, POLICY, COMPLIANCE | "draft legal contract" |

### ⚡ Escalera de Proceso Inteligente

Cada prompt pasa por una **escalera automática** de 5 pasos:

```
🧠 Paso 1: Detección automática de contexto
   ✅ Dominio detectado: backend
   💾 Template generado: backend_create_api_0925

🚀 Paso 2: Iniciando mejora inteligente
🔍 Buscando templates similares existentes
   ✅ Encontrados 2 templates similares para referencia

🎯 Paso 3: Optimización iterativa automática
   🔄 Iteración 1/3 - Calidad: 75.5%
   🔄 Iteración 2/3 - Calidad: 88.2%  
   🔄 Iteración 3/3 - Calidad: 95.1%
   ✅ Meta de calidad alcanzada

💾 Paso 4: Guardando como template global
   ✅ Template guardado exitosamente
   📋 ID: prompt_1758850949607_abc123
   🏷️ Nombre: backend_create_api_0925

📊 Paso 5: Evaluación final y estadísticas
   📈 Total templates: 47
   🎯 Calidad promedio: 89%

🎉 ¡ESCALERA COMPLETADA EXITOSAMENTE!
===================================

📊 Calidad Final: 95.1%
🎯 Dominio Detectado: backend
💾 Template: backend_create_api_0925
⏱️ Tiempo: 423ms
🚀 Boost: Natural

📝 PROMPT MEJORADO FINAL:
========================
Build a backend service that creates a comprehensive REST API endpoint with proper authentication, input validation, error handling, database integration, and comprehensive documentation. Include rate limiting, security headers, logging, and unit tests following RESTful principles and industry best practices.

💡 Tu prompt ha sido perfeccionado y guardado como template global
   Puede ser reutilizado automáticamente en futuros proyectos
```

## 🔧 MCP Server - Integración Profesional

### 📋 Configuración en Cursor IDE

1. **Abrir configuración MCP:**
   ```
   Cursor → Settings → MCP Servers
   ```

2. **Añadir PromptSmith:**
   ```json
   {
     "mcpServers": {
       "promptsmith": {
         "command": "node",
         "args": ["dist/mcp-server.js"],
         "cwd": "/Users/tu-usuario/Dev/PrompSmith/PromptSmith",
         "env": {
           "SUPABASE_URL": "https://nqzhxukuvmdlpewqytpv.supabase.co",
           "SUPABASE_ANON_KEY": "tu-key-aqui"
         }
       }
     }
   }
   ```

3. **Reiniciar Cursor** para cargar el servidor

### 🛠️ Herramientas MCP Disponibles

Una vez configurado, tendrás acceso a 8 herramientas profesionales:

#### 1. `process_prompt` - Optimización de Prompts
```javascript
// En Cursor, se llamará automáticamente
await mcp.process_prompt({
  raw: "create user authentication",
  domain: "backend", 
  tone: "technical"
});
```

#### 2. `evaluate_prompt` - Análisis de Calidad  
```javascript
await mcp.evaluate_prompt({
  prompt: "Tu prompt a evaluar",
  domain: "sql"
});
// Retorna: scores de claridad, especificidad, estructura, completitud
```

#### 3. `compare_prompts` - A/B Testing
```javascript
await mcp.compare_prompts({
  variants: [
    "Version A del prompt",
    "Version B del prompt" 
  ],
  testInput: "caso de prueba"
});
```

#### 4. `save_prompt` - Persistencia
```javascript  
await mcp.save_prompt({
  prompt: "Prompt optimizado",
  metadata: {
    name: "API Authentication",
    domain: "backend",
    tags: ["api", "auth", "security"]
  }
});
```

#### 5. `search_prompts` - Búsqueda Avanzada
```javascript
await mcp.search_prompts({
  query: "authentication",
  domain: "backend",
  minScore: 0.8,
  limit: 10
});
```

#### 6. `get_prompt` - Recuperación
```javascript
await mcp.get_prompt({
  id: "prompt_1758850949607_abc123"
});
```

#### 7. `get_stats` - Métricas del Sistema
```javascript
await mcp.get_stats();
// Retorna: total prompts, calidad promedio, dominios más usados
```

#### 8. `validate_prompt` - Validación
```javascript
await mcp.validate_prompt({
  prompt: "Prompt a validar",
  domain: "sql"
});
// Retorna: errores, warnings, sugerencias
```

## 🎯 Casos de Uso Prácticos

### 👨‍💻 Desarrollador Individual

**Workflow típico de desarrollo:**
```bash
# 1. Brainstorming inicial
pimpprompt "build user dashboard"

# 2. Refinar funcionalidades específicas  
pimpprompt "add real-time notifications to dashboard"

# 3. Buscar patterns existentes
pimpprompt --search "notification" 

# 4. Componentes específicos
pimpprompt "create responsive navigation menu"
```

**Para aprendizaje:**
```bash
# Ver cómo mejora cada tipo de prompt
pimpprompt "optimize database queries"     # → SQL patterns
pimpprompt "design mobile interface"       # → Mobile UX patterns  
pimpprompt "implement security headers"    # → DevOps patterns
```

### 🏢 Equipo Empresarial

**Con MCP en Cursor:**
1. **Standardización**: Toda el equipo usa las mismas herramientas
2. **Templates compartidos**: Búsqueda centralizada de prompts
3. **Quality gates**: Validación automática antes de implementar
4. **Analytics**: Métricas de uso y efectividad del equipo

**Workflow empresarial:**
```javascript
// 1. Desarrollador procesa prompt
const result = await mcp.process_prompt({
  raw: userStory,
  domain: "backend",
  tone: "technical"  
});

// 2. Code review incorpora validación
const validation = await mcp.validate_prompt({
  prompt: result.refined,
  domain: "backend"
});

// 3. Se guarda como template del equipo
await mcp.save_prompt({
  prompt: result.refined,
  metadata: { 
    name: `Team-${Date.now()}`,
    tags: ["approved", "team-standard"]
  }
});
```

### 🎓 Educación y Mentoría

**Para enseñar AI/ML:**
```bash
# Mostrar la diferencia entre prompts básicos vs optimizados
pimpprompt "create ML model"
# → Ver cómo se expande a: pipeline, datos, métricas, deployment

# Comparar dominios
pimpprompt "analyze sentiment"      # → AI domain
pimpprompt "store sentiment data"   # → SQL domain
```

**Para code reviews:**
```bash  
# Usar como estándar de documentación
pimpprompt "document this function behavior" 
# → Genera template estándar para docs
```

## 🔍 Debugging y Troubleshooting

### ❌ Problemas Comunes

**1. "Command not found: pimpprompt"**
```bash
# Verificar instalación
which pimpprompt
# Si no existe, reinstalar:
./uninstall-pimpprompt.sh
ln -sf "$(pwd)/pimpprompt" /Users/$(whoami)/.nvm/versions/node/v22.18.0/bin/pimpprompt
```

**2. "MCP server timeout"**
```bash
# Verificar que el build está actualizado
npm run build

# Test directo del MCP server
node dist/mcp-server.js
```

**3. "Supabase connection error"**  
```bash
# Verificar variables de entorno
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Test de conexión
node test-supabase.cjs
```

### 🔧 Modo Debug

**Habilitar debug detallado:**
```bash
# Para CLI
DEBUG=true pimpprompt "test prompt"

# Para MCP  
DEBUG_MCP=true node test-mcp-wrapper.cjs
```

**Ver logs internos:**
```bash
# Seguir logs del servidor MCP
tail -f ~/.promptsmith/logs/mcp-server.log
```

## 📊 Métricas y Analytics

### 📈 Estadísticas Disponibles

**Via CLI:**
```bash
pimpprompt --list  # Muestra stats al final
```

**Via MCP:**
```javascript
const stats = await mcp.get_stats();
console.log(`
📊 Estadísticas del Sistema:
- Total prompts: ${stats.totalPrompts}
- Calidad promedio: ${Math.round(stats.averageScore * 100)}%
- Dominios activos: ${stats.domainsUsed.join(', ')}
- Top performing: ${stats.topPerformingDomain}
`);
```

### 🎯 KPIs de Calidad

| Métrica | Rango | Descripción |
|---------|-------|-------------|
| **Clarity** | 0-1 | Claridad del lenguaje |
| **Specificity** | 0-1 | Detalles técnicos |
| **Structure** | 0-1 | Organización lógica |
| **Completeness** | 0-1 | Cobertura de requisitos |
| **Overall** | 0-1 | Puntuación combinada |

**Objetivos recomendados:**
- 🥉 **Básico**: Overall > 0.7 (70%)
- 🥈 **Bueno**: Overall > 0.85 (85%)  
- 🥇 **Excelente**: Overall > 0.95 (95%)

## 🚀 Tips y Best Practices

### ✅ Mejores Prácticas

**1. Usa palabras clave del dominio:**
```bash
# ❌ Genérico
pimpprompt "make it faster"

# ✅ Específico  
pimpprompt "optimize SQL query performance with indexes"
```

**2. Sé específico con el contexto:**
```bash
# ❌ Vago
pimpprompt "build app"

# ✅ Detallado
pimpprompt "build React Native app for expense tracking with offline sync"
```

**3. Aprovecha los templates existentes:**
```bash
# Buscar primero
pimpprompt --search "authentication"
# Luego personalizar basado en lo encontrado
pimpprompt "add OAuth2 authentication to existing user system"
```

### 🎯 Optimización de Prompts

**Estructura recomendada:**
```
[ACCIÓN] [OBJETO] [CONTEXTO] [REQUISITOS]

Ejemplos:
- CREATE backend API WITH authentication AND rate limiting
- OPTIMIZE database QUERIES FOR user dashboard WITH caching  
- DESIGN mobile INTERFACE FOR ecommerce WITH accessibility
```

**Palabras que mejoran la detección:**
- **Acciones**: create, build, develop, implement, design, optimize
- **Objetos**: API, database, interface, component, system, service
- **Contextos**: mobile, web, backend, frontend, cloud, local
- **Calidad**: secure, scalable, responsive, accessible, performant

## 🎊 ¡Felicidades!

Ahora tienes acceso al **sistema híbrido más avanzado de optimización de prompts**:

- 🎯 **CLI visual** para aprendizaje rápido
- 🚀 **MCP server profesional** para integración enterprise  
- 🧠 **16 dominios especializados** con detección automática
- 💾 **Templates globales** reutilizables
- 📊 **Analytics completos** y métricas de calidad
- 🔍 **Búsqueda avanzada** de prompts existentes

**¡Explora, experimenta y perfecciona tus prompts!** 🚀