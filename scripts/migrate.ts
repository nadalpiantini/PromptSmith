#!/usr/bin/env tsx

import 'dotenv/config';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SupabaseAdapter } from '../src/adapters/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SQL_DIR = join(__dirname, '../sql');

interface Migration {
  id: string;
  filename: string;
  sql: string;
  timestamp: number;
}

class MigrationRunner {
  private adapter: SupabaseAdapter;

  constructor() {
    this.adapter = new SupabaseAdapter();
  }

  async run(): Promise<void> {
    console.log('🚀 Starting database migration...');

    try {
      // Connect to database
      await this.adapter.connect();
      console.log('✅ Connected to database');

      // Check if migration tracking table exists
      const hasMigrationTable = await this.checkMigrationTable();
      if (!hasMigrationTable) {
        await this.createMigrationTable();
        console.log('✅ Created migration tracking table');
      }

      // Get all migration files
      const migrations = this.loadMigrations();
      console.log(`📋 Found ${migrations.length} migration file(s)`);

      // Get applied migrations
      const appliedMigrations = await this.getAppliedMigrations();
      console.log(`📊 ${appliedMigrations.size} migration(s) already applied`);

      // Apply pending migrations
      let appliedCount = 0;
      for (const migration of migrations) {
        if (!appliedMigrations.has(migration.id)) {
          console.log(`⚡ Applying migration: ${migration.filename}`);
          await this.applyMigration(migration);
          await this.recordMigration(migration);
          appliedCount++;
        }
      }

      if (appliedCount === 0) {
        console.log('✨ No new migrations to apply');
      } else {
        console.log(`✅ Successfully applied ${appliedCount} migration(s)`);
      }

      // Verify database health
      const isHealthy = await this.verifyDatabaseHealth();
      if (isHealthy) {
        console.log('💚 Database health check passed');
      } else {
        console.warn('⚠️ Database health check failed');
      }

    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    } finally {
      await this.adapter.disconnect();
    }
  }

  private loadMigrations(): Migration[] {
    if (!existsSync(SQL_DIR)) {
      console.warn(`⚠️ SQL directory not found: ${SQL_DIR}`);
      return [];
    }

    const files = readdirSync(SQL_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ensure chronological order

    const migrations: Migration[] = [];

    for (const filename of files) {
      const filepath = join(SQL_DIR, filename);
      const sql = readFileSync(filepath, 'utf-8');

      // Extract migration ID from filename (e.g., "001_initial_schema.sql" -> "001")
      const idMatch = filename.match(/^(\d+)_/);
      if (!idMatch) {
        console.warn(`⚠️ Skipping file with invalid format: ${filename}`);
        continue;
      }

      const migration: Migration = {
        id: idMatch[1],
        filename,
        sql,
        timestamp: Date.now()
      };

      migrations.push(migration);
    }

    return migrations;
  }

  private async checkMigrationTable(): Promise<boolean> {
    try {
      // Try to query the migrations table
      const result = await this.runQuery(`
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'schema_migrations'
        LIMIT 1
      `);
      return result && result.length > 0;
    } catch {
      return false;
    }
  }

  private async createMigrationTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW(),
        checksum TEXT,
        UNIQUE(id)
      );

      COMMENT ON TABLE schema_migrations IS 'Tracks applied database migrations';
    `;

    await this.runQuery(sql);
  }

  private async getAppliedMigrations(): Promise<Set<string>> {
    try {
      const result = await this.runQuery(`
        SELECT id FROM schema_migrations ORDER BY applied_at
      `);

      return new Set((result || []).map((row: any) => row.id));
    } catch (error) {
      console.error('Error getting applied migrations:', error);
      return new Set();
    }
  }

  private async applyMigration(migration: Migration): Promise<void> {
    try {
      // Split migration into individual statements
      const statements = this.splitSqlStatements(migration.sql);

      // Execute each statement
      for (const statement of statements) {
        if (statement.trim()) {
          await this.runQuery(statement);
        }
      }

    } catch (error) {
      console.error(`Failed to apply migration ${migration.filename}:`, error);
      throw error;
    }
  }

  private async recordMigration(migration: Migration): Promise<void> {
    const checksum = this.calculateChecksum(migration.sql);

    await this.runQuery(`
      INSERT INTO schema_migrations (id, filename, applied_at, checksum)
      VALUES ($1, $2, NOW(), $3)
    `, [migration.id, migration.filename, checksum]);
  }

  private splitSqlStatements(sql: string): string[] {
    // Simple SQL statement splitter
    // This is basic and may need improvement for complex cases
    return sql
      .split(/;\s*$/gm)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));
  }

  private calculateChecksum(content: string): string {
    // Simple checksum - in production you might want a more robust solution
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private async runQuery(sql: string, params: any[] = []): Promise<any> {
    // Note: This is a simplified implementation
    // In a real scenario, you'd want to use proper query execution
    try {
      // For now, we'll use the adapter's runMigration method
      await this.adapter.runMigration(sql);
      return [];
    } catch (error) {
      throw new Error(`Query execution failed: ${error}`);
    }
  }

  private async verifyDatabaseHealth(): Promise<boolean> {
    try {
      // Verify key tables exist and are accessible
      const tables = [
        'prompts',
        'prompt_evaluations',
        'custom_rules',
        'prompt_templates',
        'usage_analytics'
      ];

      for (const table of tables) {
        await this.runQuery(`SELECT 1 FROM ${table} LIMIT 1`);
      }

      return true;
    } catch {
      return false;
    }
  }
}

// Command line interface
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
PromptSmith Database Migration Tool

Usage: npm run migrate [options]

Options:
  --help, -h     Show this help message
  --check        Check migration status without applying
  --force        Force apply all migrations (dangerous)

Examples:
  npm run migrate           # Apply pending migrations
  npm run migrate --check   # Check status only
`);
    return;
  }

  if (args.includes('--check')) {
    // Just check status
    const runner = new MigrationRunner();
    try {
      await runner['adapter'].connect();
      const applied = await runner['getAppliedMigrations']();
      const available = runner['loadMigrations']();

      console.log(`Database Status:`);
      console.log(`- Available migrations: ${available.length}`);
      console.log(`- Applied migrations: ${applied.size}`);
      console.log(`- Pending migrations: ${available.length - applied.size}`);

      if (applied.size < available.length) {
        console.log(`\nPending migrations:`);
        available.forEach(migration => {
          if (!applied.has(migration.id)) {
            console.log(`  - ${migration.filename}`);
          }
        });
      }
    } catch (error) {
      console.error('Status check failed:', error);
      process.exit(1);
    } finally {
      await runner['adapter'].disconnect();
    }
    return;
  }

  // Run migrations
  const runner = new MigrationRunner();
  await runner.run();
}

// Handle errors and cleanup
process.on('SIGINT', () => {
  console.log('\n⚡ Migration interrupted');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error);
  process.exit(1);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}