#!/usr/bin/env node
/**
 * PromptSmith MCP – Patch & Run (STDIO)
 * Uso:
 *   node scripts/patch-and-run-promptsmith.js
 *
 * Qué hace:
 * 1) Parchea dist/ para:
 *    - Evitar `process.exit(1)` si faltan SUPABASE_* (entra en modo offline)
 *    - Redirigir TODOS los `console.log` de `dist/services/*` a `console.error` cuando corremos vía STDIO
 * 2) Lanza el MCP server en STDIO de forma limpia para Cursor/Claude
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const ENTRY = path.join(DIST, 'mcp-server.js');
const SERVICES_DIR = path.join(DIST, 'services');

function ensureFile(p) {
  if (!fs.existsSync(p)) {
    console.error(`[Patch] No se encontró: ${p}`);
    process.exit(1);
  }
}

function backupOnce(filePath) {
  const bak = filePath + '.bak';
  if (!fs.existsSync(bak)) {
    fs.copyFileSync(filePath, bak);
  }
}

function patchMcpServer(filePath) {
  ensureFile(filePath);
  backupOnce(filePath);
  let src = fs.readFileSync(filePath, 'utf8');

  // 1) Neutraliza cualquier `process.exit(1)` para evitar muerte por env faltante
  //    (dejamos un warning en su lugar)
  const beforeExit = src;
  src = src.replace(/process\.exit\s*\(\s*1\s*\)\s*;?/g, `/* patched: avoid hard exit */`);

  // 2) Si el archivo contenía verificaciones duras de env, añadimos una capa de tolerancia OFFLINE
  //    Inyectamos un bloque al inicio que setea modo offline si faltan SUPABASE_*.
  if (!/PROMPTSMITH_OFFLINE_CHECK_INJECTED/.test(src)) {
    const inject = `
/* PROMPTSMITH_OFFLINE_CHECK_INJECTED */
(function () {
  const need = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const missing = need.filter(k => !process.env[k] || String(process.env[k]).trim() === '');
  if (missing.length) {
    process.env.PROMPTSMITH_OFFLINE = 'true';
    // IMPORTANTE: loguear por stderr para no romper STDIO
    console.error('[PromptSmith][offline] Faltan env:', missing.join(', '), '→ corriendo en modo OFFLINE.');
    // Opcional: setear dummies seguros por si alguna lib valida existencia pero no las usa en OFFLINE
    process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'offline://no-supabase';
    process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'offline-anon-key';
  }
})();
`;
    // Inserta tras "use strict" o al inicio
    if (/["']use strict["'];?/.test(src)) {
      src = src.replace(/(["']use strict["'];?)/, `$1\n${inject}`);
    } else {
      src = `${inject}\n${src}`;
    }
  }

  // 3) Guarda cambios si hubo modificaciones
  if (src !== beforeExit) {
    fs.writeFileSync(filePath, src, 'utf8');
    console.error('[Patch] mcp-server.js parcheado (exit() neutralizado + OFFLINE tolerante)');
  } else {
    // Aun si no cambió por regex, nos aseguramos de inyectar el OFFLINE check
    fs.writeFileSync(filePath, src, 'utf8');
    console.error('[Patch] mcp-server.js verificado (OFFLINE check presente)');
  }
}

function patchServicesLogs(dir) {
  if (!fs.existsSync(dir)) {
    console.error('[Patch] No hay carpeta dist/services; saltando redirección de logs.');
    return;
  }
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
  for (const f of files) {
    const p = path.join(dir, f);
    backupOnce(p);
    let code = fs.readFileSync(p, 'utf8');
    const original = code;

    // Reemplaza console.log(...) por console.error(...) SOLO cuando corremos vía STDIO
    // Simple pero efectivo: envolvemos console.log con guard
    // Si ya se parcheó antes, evitamos duplicar
    if (!/PROMPTSMITH_STDIO_LOG_PATCH/.test(code)) {
      code = code.replace(/console\.log\s*\(/g, `/* PROMPTSMITH_STDIO_LOG_PATCH */ (process.env.MCP_TRANSPORT==='stdio'?console.error:console.log)(`);
    }

    if (code !== original) {
      fs.writeFileSync(p, code, 'utf8');
      console.error(`[Patch] Redirigido console.log→stderr en services: ${f}`);
    }
  }
}

function runMcp() {
  // Declaramos explícitamente transporte STDIO para el patch de logs
  const env = { ...process.env, MCP_TRANSPORT: 'stdio' };

  console.error('[Run] Lanzando PromptSmith MCP en STDIO…');
  const child = spawn(process.execPath, [ENTRY], {
    stdio: ['inherit', 'inherit', 'inherit'],
    env,
  });

  child.on('exit', (code) => {
    console.error(`[Run] MCP finalizó con código ${code}`);
    process.exit(code ?? 0);
  });
  child.on('error', (err) => {
    console.error('[Run] Error al arrancar MCP:', err);
    process.exit(1);
  });
}

// ---- main
(function main() {
  ensureFile(ENTRY);
  patchMcpServer(ENTRY);
  patchServicesLogs(SERVICES_DIR);
  runMcp();
})();