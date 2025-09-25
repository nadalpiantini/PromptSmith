# 🚀 PromptSmith MCP - Guía de Setup Completa

## 📋 Prerrequisitos
- Node.js 18+ instalado
- Una cuenta en [Supabase](https://supabase.com) (gratis)
- Redis (opcional, para caching)

## 🎯 Setup Rápido (5 minutos)

### 1. Clonar y configurar el proyecto
```bash
cd "/Users/nadalpiantini/Dev/PrompSmith MCP"

# Instalar dependencias
npm install

# Crear archivo de configuración
cp .env.example .env
```

### 2. Configurar Supabase Database

#### A. Crear proyecto en Supabase:
1. Ve a https://supabase.com
2. Click "New Project"
3. Nombre: `promptsmith-mcp`
4. Región: `East US` (más rápido para tu ubicación)
5. **Guarda la contraseña de base de datos que elijas**

#### B. Obtener credenciales:
1. En tu proyecto Supabase, ve a `Settings` > `API`
2. Copia estos valores:

```bash
# URL del proyecto (algo como https://abcdef.supabase.co)
SUPABASE_URL=

# Anon key (clave pública, segura para cliente)
SUPABASE_ANON_KEY=
```

#### C. Configurar schema de base de datos:
1. En Supabase, ve a `SQL Editor`
2. Click "New query"
3. Copia y pega **TODO** el contenido del archivo `sql/001_initial_schema.sql`
4. Click "Run" (esto creará todas las tablas necesarias)

### 3. Configurar tu archivo .env

```bash
# Editar .env con tus credenciales reales
nano .env

# Contenido mínimo necesario:
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key-super-largo
NODE_ENV=development
TELEMETRY_ENABLED=true
```

### 4. Configurar Redis (OPCIONAL)
```bash
# MacOS con Homebrew
brew install redis

# Iniciar Redis
brew services start redis

# O manualmente:
redis-server

# Agregar a .env
REDIS_URL=redis://localhost:6379
```

## 🧪 Verificar instalación

### Test 1: Build del proyecto
```bash
npm run build
# Debería compilar con advertencias menores, no errores críticos
```

### Test 2: Probar servidor MCP
```bash
# Iniciar servidor en modo dev
npm run dev

# En otra terminal, probar conexión MCP
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/cli.js
```

**Respuesta esperada:** JSON con lista de 8 herramientas disponibles.

### Test 3: Verificar conexión a database
```bash
# Usar la herramienta de estadísticas
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_stats","arguments":{}}}' | node dist/cli.js
```

## 🎮 Integración con Cursor IDE

### Paso 1: Configurar MCP en Cursor
```bash
# Crear directorio de configuración si no existe
mkdir -p ~/.claude

# Copiar configuración MCP
cp mcp-config.json ~/.claude/mcp_servers.json
```

### Paso 2: Editar configuración con tus credenciales
```bash
nano ~/.claude/mcp_servers.json

# Actualizar con tus valores reales:
{
  "mcpServers": {
    "promptsmith": {
      "command": "npx",
      "args": ["promptsmith-mcp"],
      "env": {
        "SUPABASE_URL": "https://TU-PROYECTO.supabase.co",
        "SUPABASE_ANON_KEY": "TU-CLAVE-AQUI"
      }
    }
  }
}
```

### Paso 3: Reiniciar Cursor IDE
1. Cierra Cursor completamente
2. Abre Cursor
3. Ve a configuración y busca "MCP"
4. Deberías ver "promptsmith" listado

## 🎯 Probar funcionalidad completa

### En Cursor IDE, prueba estos comandos:

#### 1. Optimizar un prompt
```
Usa la herramienta process_prompt con este prompt:
"make a sql query to get users"

Domain: sql
Tone: professional
```

#### 2. Evaluar calidad de prompt
```
Usa evaluate_prompt con:
"Create a React component that shows user data in a table with sorting"

Domain: saas
```

#### 3. Buscar prompts existentes
```
Usa search_prompts con:
Query: "database"
Domain: sql
Limit: 5
```

## 🔧 Troubleshooting

### Error: "Supabase configuration missing"
- Verifica que `.env` tenga `SUPABASE_URL` y `SUPABASE_ANON_KEY`
- Asegúrate que no hay espacios extras en las variables

### Error: "Failed to connect to database"
- Verifica que ejecutaste el SQL schema en Supabase
- Checa que el proyecto de Supabase esté activo
- Confirma que la URL es correcta (termina en .supabase.co)

### Error: "Module not found"
- Ejecuta `npm install` otra vez
- Verifica que tienes Node.js 18+: `node --version`

### Error: "Redis connection failed"
- Redis es opcional, puedes deshabilitarlo:
- Comenta la línea `REDIS_URL` en `.env`

### Cursor no ve el servidor MCP
- Verifica ubicación de config: `ls ~/.claude/mcp_servers.json`
- Reinicia Cursor completamente
- Checa que el formato JSON es válido

## 🎉 ¡Listo!

Si todos los tests pasan, tienes un servidor MCP completamente funcional que puede:

✅ Transformar prompts simples en instrucciones estructuradas
✅ Optimizar para diferentes dominios (SQL, Branding, Cinema, SaaS, DevOps)
✅ Evaluar calidad de prompts con scoring multi-dimensional
✅ Guardar y buscar prompts en base de datos
✅ Generar templates reutilizables
✅ Proporcionar análisis y recomendaciones

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en la terminal
2. Verifica que Supabase esté configurado correctamente
3. Confirma que todas las dependencias están instaladas

¡Tu PromptSmith MCP está listo para transformar tu vibecoding en prompts profesionales! 🚀