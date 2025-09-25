#!/usr/bin/env node

// PromptSmith MCP - Wrapper Commands
// Opción 2: API simplificada para acceso directo a funciones MCP

const { spawn } = require('child_process');

class PromptSmithWrapper {
  constructor() {
    this.server = null;
    this.requestId = 1;
    this.pendingRequests = new Map();
    this.isReady = false;
  }

  async ensureServerReady() {
    if (this.isReady && this.server) {
      return;
    }

    return new Promise((resolve, reject) => {
      console.log('🚀 Starting PromptSmith MCP Server...');

      this.server = spawn('node', ['dist/cli.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });

      const timeout = setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 10000);

      this.server.stderr.on('data', (data) => {
        const text = data.toString();
        if (text.includes('PromptSmith MCP Server is ready!')) {
          this.isReady = true;
          clearTimeout(timeout);
          console.log('✅ PromptSmith server ready!');
          resolve();
        } else if (text.includes('❌') || text.includes('Error:')) {
          clearTimeout(timeout);
          reject(new Error(`Server error: ${text}`));
        }
      });

      this.server.stdout.on('data', (data) => {
        const text = data.toString().trim();
        if (text) {
          try {
            const response = JSON.parse(text);
            this.handleResponse(response);
          } catch (error) {
            // Ignore non-JSON output
          }
        }
      });

      this.server.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Server spawn error: ${error.message}`));
      });
    });
  }

  handleResponse(response) {
    const request = this.pendingRequests.get(response.id);
    if (request) {
      this.pendingRequests.delete(response.id);

      if (response.error) {
        request.reject(new Error(response.error.message));
      } else {
        request.resolve(response.result);
      }
    }
  }

  async sendRequest(method, params = {}) {
    await this.ensureServerReady();

    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      const request = {
        jsonrpc: "2.0",
        id: id,
        method: method,
        params: params
      };

      this.pendingRequests.set(id, { resolve, reject });

      // Set timeout for request
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);

      this.server.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  // =============================================================================
  // PUBLIC API METHODS
  // =============================================================================

  /**
   * Transform and optimize a raw prompt
   * @param {string} rawPrompt - The raw prompt to optimize
   * @param {string} domain - Domain: sql, branding, cine, saas, devops, general
   * @param {string} tone - Tone: professional, casual, creative, technical
   * @param {object} options - Additional options
   * @returns {Promise<object>} - {refined, original, metadata, score}
   */
  async processPrompt(rawPrompt, domain = 'general', tone = 'professional', options = {}) {
    const result = await this.sendRequest('tools/call', {
      name: 'process_prompt',
      arguments: {
        raw: rawPrompt,
        domain: domain,
        tone: tone,
        ...options
      }
    });
    return result;
  }

  /**
   * Evaluate the quality of a prompt
   * @param {string} prompt - The prompt to evaluate
   * @param {string} domain - Domain context for evaluation
   * @returns {Promise<object>} - {score: {overall, clarity, specificity, structure, completeness}, suggestions}
   */
  async evaluatePrompt(prompt, domain = 'general') {
    const result = await this.sendRequest('tools/call', {
      name: 'evaluate_prompt',
      arguments: {
        prompt: prompt,
        domain: domain
      }
    });
    return result;
  }

  /**
   * Save a refined prompt to the database
   * @param {string} refined - The refined prompt
   * @param {string} original - The original prompt
   * @param {object} metadata - {name, domain, description, tags}
   * @param {object} score - Quality score object
   * @returns {Promise<object>} - Saved prompt object with ID
   */
  async savePrompt(refined, original, metadata, score) {
    const result = await this.sendRequest('tools/call', {
      name: 'save_prompt',
      arguments: {
        refined: refined,
        original: original,
        metadata: metadata,
        score: score
      }
    });
    return result;
  }

  /**
   * Search for saved prompts
   * @param {string} query - Search query
   * @param {string} domain - Filter by domain
   * @param {number} limit - Maximum results
   * @param {object} filters - Additional filters
   * @returns {Promise<object>} - {results: [...], total}
   */
  async searchPrompts(query = '', domain = null, limit = 10, filters = {}) {
    const result = await this.sendRequest('tools/call', {
      name: 'search_prompts',
      arguments: {
        query: query,
        domain: domain,
        limit: limit,
        ...filters
      }
    });
    return result;
  }

  /**
   * Get a specific prompt by ID
   * @param {string} id - Prompt ID
   * @returns {Promise<object>} - Prompt object or null
   */
  async getPrompt(id) {
    const result = await this.sendRequest('tools/call', {
      name: 'get_prompt',
      arguments: {
        id: id
      }
    });
    return result;
  }

  /**
   * Compare two prompts
   * @param {string} prompt1 - First prompt
   * @param {string} prompt2 - Second prompt
   * @param {string} domain - Domain for comparison
   * @returns {Promise<object>} - Comparison analysis
   */
  async comparePrompts(prompt1, prompt2, domain = 'general') {
    const result = await this.sendRequest('tools/call', {
      name: 'compare_prompts',
      arguments: {
        prompt1: prompt1,
        prompt2: prompt2,
        domain: domain
      }
    });
    return result;
  }

  /**
   * Get available templates for a domain
   * @param {string} domain - Domain to get templates for
   * @returns {Promise<array>} - Array of template objects
   */
  async getTemplates(domain = 'general') {
    const result = await this.sendRequest('tools/call', {
      name: 'get_templates',
      arguments: {
        domain: domain
      }
    });
    return result;
  }

  /**
   * Get usage statistics
   * @returns {Promise<object>} - Statistics object
   */
  async getStats() {
    const result = await this.sendRequest('tools/call', {
      name: 'get_stats',
      arguments: {}
    });
    return result;
  }

  /**
   * List all available tools
   * @returns {Promise<array>} - Array of tool definitions
   */
  async listTools() {
    const result = await this.sendRequest('tools/list');
    return result.tools;
  }

  // =============================================================================
  // CONVENIENCE METHODS
  // =============================================================================

  /**
   * Quick SQL prompt optimization
   * @param {string} sqlPrompt - SQL-related prompt
   * @returns {Promise<string>} - Optimized SQL prompt
   */
  async optimizeSQL(sqlPrompt) {
    const result = await this.processPrompt(sqlPrompt, 'sql', 'professional');
    return result.refined;
  }

  /**
   * Quick branding prompt optimization
   * @param {string} brandPrompt - Brand-related prompt
   * @returns {Promise<string>} - Optimized branding prompt
   */
  async optimizeBranding(brandPrompt) {
    const result = await this.processPrompt(brandPrompt, 'branding', 'creative');
    return result.refined;
  }

  /**
   * Quick SaaS prompt optimization
   * @param {string} saasPrompt - SaaS-related prompt
   * @returns {Promise<string>} - Optimized SaaS prompt
   */
  async optimizeSaaS(saasPrompt) {
    const result = await this.processPrompt(saasPrompt, 'saas', 'professional');
    return result.refined;
  }

  /**
   * Process and save workflow - complete pipeline
   * @param {string} rawPrompt - Raw prompt to process
   * @param {string} domain - Domain context
   * @param {object} metadata - Save metadata
   * @returns {Promise<object>} - Complete workflow result
   */
  async processAndSave(rawPrompt, domain = 'general', metadata = {}) {
    console.log('🔄 Processing prompt...');
    const processed = await this.processPrompt(rawPrompt, domain);

    console.log('📊 Evaluating quality...');
    const evaluation = await this.evaluatePrompt(processed.refined, domain);

    console.log('💾 Saving to database...');
    const saved = await this.savePrompt(
      processed.refined,
      rawPrompt,
      {
        name: metadata.name || 'Auto-generated',
        domain: domain,
        description: metadata.description || 'Generated via wrapper API',
        ...metadata
      },
      evaluation.score
    );

    return {
      original: rawPrompt,
      processed: processed,
      evaluation: evaluation,
      saved: saved
    };
  }

  /**
   * Close the server connection
   */
  async close() {
    if (this.server) {
      this.server.kill();
      this.server = null;
      this.isReady = false;
      console.log('📡 PromptSmith server closed');
    }
  }
}

// Export for use as module
module.exports = PromptSmithWrapper;

// CLI usage if run directly
if (require.main === module) {
  const wrapper = new PromptSmithWrapper();

  async function demonstrateAPI() {
    try {
      console.log('🎯 PromptSmith Wrapper API Demo');
      console.log('===============================\n');

      // Example 1: Simple prompt processing
      console.log('1️⃣ Processing SQL prompt...');
      const sqlResult = await wrapper.optimizeSQL('make me a query for users');
      console.log('   Result:', sqlResult);

      // Example 2: Full workflow
      console.log('\n2️⃣ Full workflow (process + evaluate + save)...');
      const workflowResult = await wrapper.processAndSave(
        'create authentication system',
        'saas',
        { name: 'Auth System Prompt', description: 'Demo workflow' }
      );
      console.log('   Saved prompt ID:', workflowResult.saved.id);

      // Example 3: Search
      console.log('\n3️⃣ Searching prompts...');
      const searchResult = await wrapper.searchPrompts('auth', 'saas', 5);
      console.log(`   Found ${searchResult.results.length} results`);

      // Example 4: Get stats
      console.log('\n4️⃣ Getting statistics...');
      const stats = await wrapper.getStats();
      console.log('   Stats:', stats);

    } catch (error) {
      console.error('❌ Demo error:', error.message);
    } finally {
      await wrapper.close();
      process.exit(0);
    }
  }

  demonstrateAPI();
}