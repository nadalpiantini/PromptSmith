/**
 * PimpPrompt Web Interface
 * Main JavaScript application for the PromptSmith web UI
 */

class PimpPromptApp {
  constructor() {
    // DOM elements
    this.elements = {};
    this.bindElements();
    
    // Application state
    this.state = {
      currentPrompt: null,
      recentPrompts: [],
      savedTemplates: [],
      isProcessing: false,
      theme: localStorage.getItem('theme') || 'light'
    };
    
    // API configuration
    this.api = {
      baseUrl: window.location.origin,
      endpoints: {
        process: '/api/process',
        evaluate: '/api/evaluate',
        save: '/api/save',
        search: '/api/search',
        stats: '/api/stats',
        compare: '/api/compare'
      }
    };
    
    this.init();
  }
  
  bindElements() {
    // Input elements
    this.elements.inputText = document.getElementById('input-text');
    this.elements.domainSelect = document.getElementById('domain-select');
    this.elements.charCount = document.getElementById('char-count');
    this.elements.processBtn = document.getElementById('process-btn');
    this.elements.clearInput = document.getElementById('clear-input');
    
    // Results elements
    this.elements.resultsContent = document.getElementById('results-content');
    this.elements.copyResult = document.getElementById('copy-result');
    this.elements.savePrompt = document.getElementById('save-prompt');
    this.elements.evaluateBtn = document.getElementById('evaluate-btn');
    
    // Metrics elements
    this.elements.metricsSection = document.querySelector('.metrics-section');
    this.elements.clarityScore = document.getElementById('clarity-score');
    this.elements.specificityScore = document.getElementById('specificity-score');
    this.elements.structureScore = document.getElementById('structure-score');
    this.elements.completenessScore = document.getElementById('completeness-score');
    this.elements.overallScore = document.getElementById('overall-score');
    this.elements.clarityFill = document.getElementById('clarity-fill');
    this.elements.specificityFill = document.getElementById('specificity-fill');
    this.elements.structureFill = document.getElementById('structure-fill');
    this.elements.completenessFill = document.getElementById('completeness-fill');
    
    // Sidebar elements
    this.elements.recentPrompts = document.getElementById('recent-prompts');
    this.elements.savedTemplates = document.getElementById('saved-templates');
    
    // Control elements
    this.elements.themeToggle = document.getElementById('theme-toggle');
    this.elements.statsBtn = document.getElementById('stats-btn');
    
    // Modal elements
    this.elements.statsModal = document.getElementById('stats-modal');
    this.elements.saveModal = document.getElementById('save-modal');
    this.elements.saveForm = document.getElementById('save-form');
    
    // Toast container
    this.elements.toastContainer = document.getElementById('toast-container');
  }
  
  init() {
    this.setupEventListeners();
    this.applyTheme();
    this.loadRecentPrompts();
    this.loadSavedTemplates();
    this.updateUI();
  }
  
  setupEventListeners() {
    // Input handling
    this.elements.inputText.addEventListener('input', (e) => {
      this.updateCharCount();
      this.updateProcessButton();
    });
    
    this.elements.processBtn.addEventListener('click', () => {
      this.processPrompt();
    });
    
    this.elements.clearInput.addEventListener('click', () => {
      this.clearInput();
    });
    
    // Results handling
    this.elements.copyResult.addEventListener('click', () => {
      this.copyToClipboard();
    });
    
    this.elements.savePrompt.addEventListener('click', () => {
      this.showSaveModal();
    });
    
    this.elements.evaluateBtn.addEventListener('click', () => {
      this.evaluatePrompt();
    });
    
    // Theme toggle
    this.elements.themeToggle.addEventListener('click', () => {
      this.toggleTheme();
    });
    
    // Stats button
    this.elements.statsBtn.addEventListener('click', () => {
      this.showStatsModal();
    });
    
    // Modal handling
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = e.target.getAttribute('data-modal');
        this.hideModal(modalId);
      });
    });
    
    // Example buttons
    document.querySelectorAll('.example-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const example = e.target.getAttribute('data-example');
        this.loadExample(example);
      });
    });
    
    // Save form
    this.elements.saveForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveCurrentPrompt();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });
    
    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideModal(modal.id);
        }
      });
    });
  }
  
  updateCharCount() {
    const count = this.elements.inputText.value.length;
    this.elements.charCount.textContent = count.toLocaleString();
  }
  
  updateProcessButton() {
    const hasText = this.elements.inputText.value.trim().length > 0;
    this.elements.processBtn.disabled = !hasText || this.state.isProcessing;
  }
  
  clearInput() {
    this.elements.inputText.value = '';
    this.updateCharCount();
    this.updateProcessButton();
    this.hideMetrics();
    this.showEmptyResults();
  }
  
  loadExample(example) {
    this.elements.inputText.value = example;
    this.updateCharCount();
    this.updateProcessButton();
    this.elements.inputText.focus();
  }
  
  async processPrompt() {
    const input = this.elements.inputText.value.trim();
    if (!input) return;
    
    this.state.isProcessing = true;
    this.updateProcessButton();
    this.showProcessingSpinner();
    
    try {
      const response = await this.apiCall('POST', this.api.endpoints.process, {
        text: input,
        domain: this.elements.domainSelect.value || undefined,
        options: {
          includeMetrics: true,
          enableRefinement: true
        }
      });
      
      if (response.success) {
        this.displayResults(response.data);
        this.addToRecentPrompts(input, response.data);
        this.showToast('success', 'Prompt processed successfully!');
      } else {
        throw new Error(response.error || 'Failed to process prompt');
      }
    } catch (error) {
      console.error('Error processing prompt:', error);
      this.showToast('error', 'Failed to process prompt', error.message);
      this.showEmptyResults();
    } finally {
      this.state.isProcessing = false;
      this.updateProcessButton();
      this.hideProcessingSpinner();
    }
  }
  
  async evaluatePrompt() {
    if (!this.state.currentPrompt) return;
    
    try {
      const response = await this.apiCall('POST', this.api.endpoints.evaluate, {
        text: this.state.currentPrompt.optimized || this.state.currentPrompt.original
      });
      
      if (response.success) {
        this.displayMetrics(response.data);
        this.showToast('success', 'Prompt evaluated successfully!');
      } else {
        throw new Error(response.error || 'Failed to evaluate prompt');
      }
    } catch (error) {
      console.error('Error evaluating prompt:', error);
      this.showToast('error', 'Failed to evaluate prompt', error.message);
    }
  }
  
  displayResults(data) {
    this.state.currentPrompt = data;
    
    const optimizedText = data.optimized || data.result || 'No optimized result available';
    
    this.elements.resultsContent.innerHTML = `
      <div class="results-text">${this.escapeHtml(optimizedText)}</div>
      ${data.analysis ? `
        <div class="analysis-section" style="margin-top: 1rem;">
          <h4>Analysis</h4>
          <div class="analysis-content">
            ${data.analysis.domain ? `<p><strong>Domain:</strong> ${data.analysis.domain}</p>` : ''}
            ${data.analysis.intent ? `<p><strong>Intent:</strong> ${data.analysis.intent}</p>` : ''}
            ${data.analysis.suggestions ? `<p><strong>Suggestions:</strong> ${data.analysis.suggestions.join(', ')}</p>` : ''}
          </div>
        </div>
      ` : ''}
    `;
    
    // Enable result controls
    this.elements.copyResult.disabled = false;
    this.elements.savePrompt.disabled = false;
    this.elements.evaluateBtn.disabled = false;
    
    // Show metrics if available
    if (data.metrics) {
      this.displayMetrics(data.metrics);
    }
  }
  
  displayMetrics(metrics) {
    this.elements.metricsSection.classList.remove('hidden');
    
    const scores = metrics.scores || metrics;
    
    // Update individual scores
    this.updateMetric('clarity', scores.clarity || 0);
    this.updateMetric('specificity', scores.specificity || 0);
    this.updateMetric('structure', scores.structure || 0);
    this.updateMetric('completeness', scores.completeness || 0);
    
    // Update overall score
    const overall = scores.overall || 
      ((scores.clarity + scores.specificity + scores.structure + scores.completeness) / 4);
    this.elements.overallScore.textContent = (overall * 100).toFixed(1) + '%';
  }
  
  updateMetric(name, score) {
    const scoreElement = this.elements[`${name}Score`];
    const fillElement = this.elements[`${name}Fill`];
    
    if (scoreElement && fillElement) {
      scoreElement.textContent = (score * 100).toFixed(1) + '%';
      fillElement.style.width = (score * 100) + '%';
    }
  }
  
  hideMetrics() {
    this.elements.metricsSection.classList.add('hidden');
  }
  
  showEmptyResults() {
    this.elements.resultsContent.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🚀</div>
        <p>Process your first prompt to see optimized results here</p>
      </div>
    `;
    
    // Disable result controls
    this.elements.copyResult.disabled = true;
    this.elements.savePrompt.disabled = true;
    this.elements.evaluateBtn.disabled = true;
  }
  
  showProcessingSpinner() {
    this.elements.processBtn.querySelector('.btn-text').style.display = 'none';
    this.elements.processBtn.querySelector('.btn-spinner').classList.remove('hidden');
  }
  
  hideProcessingSpinner() {
    this.elements.processBtn.querySelector('.btn-text').style.display = 'inline';
    this.elements.processBtn.querySelector('.btn-spinner').classList.add('hidden');
  }
  
  async copyToClipboard() {
    if (!this.state.currentPrompt) return;
    
    const text = this.state.currentPrompt.optimized || this.state.currentPrompt.result;
    
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('success', 'Copied to clipboard!');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showToast('success', 'Copied to clipboard!');
    }
  }
  
  showSaveModal() {
    if (!this.state.currentPrompt) return;
    
    // Pre-fill form with current prompt data
    document.getElementById('prompt-title').value = '';
    document.getElementById('prompt-description').value = '';
    document.getElementById('prompt-tags').value = '';
    
    this.showModal('save-modal');
  }
  
  async saveCurrentPrompt() {
    if (!this.state.currentPrompt) return;
    
    const title = document.getElementById('prompt-title').value.trim();
    const description = document.getElementById('prompt-description').value.trim();
    const tags = document.getElementById('prompt-tags').value.trim();
    
    if (!title) {
      this.showToast('error', 'Please enter a title for the prompt');
      return;
    }
    
    try {
      const response = await this.apiCall('POST', this.api.endpoints.save, {
        original: this.elements.inputText.value,
        optimized: this.state.currentPrompt.optimized || this.state.currentPrompt.result,
        metadata: {
          title,
          description,
          tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          domain: this.elements.domainSelect.value || 'general'
        }
      });
      
      if (response.success) {
        this.hideModal('save-modal');
        this.showToast('success', 'Prompt saved successfully!');
        this.loadSavedTemplates(); // Refresh saved templates
      } else {
        throw new Error(response.error || 'Failed to save prompt');
      }
    } catch (error) {
      console.error('Error saving prompt:', error);
      this.showToast('error', 'Failed to save prompt', error.message);
    }
  }
  
  async showStatsModal() {
    this.showModal('stats-modal');
    
    // Load stats
    document.getElementById('stats-content').innerHTML = 'Loading...';
    
    try {
      const response = await this.apiCall('GET', this.api.endpoints.stats);
      
      if (response.success) {
        this.displayStats(response.data);
      } else {
        throw new Error(response.error || 'Failed to load stats');
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      document.getElementById('stats-content').innerHTML = `
        <div class="error-state">
          <p>Failed to load statistics</p>
          <p class="error-details">${error.message}</p>
        </div>
      `;
    }
  }
  
  displayStats(stats) {
    const content = `
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">Total Prompts Processed</div>
          <div class="stat-value">${stats.totalProcessed || 0}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Saved Prompts</div>
          <div class="stat-value">${stats.totalSaved || 0}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Average Quality Score</div>
          <div class="stat-value">${((stats.averageQuality || 0) * 100).toFixed(1)}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Cache Hit Rate</div>
          <div class="stat-value">${((stats.cacheHitRate || 0) * 100).toFixed(1)}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">System Uptime</div>
          <div class="stat-value">${this.formatUptime(stats.uptime || 0)}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Most Common Domain</div>
          <div class="stat-value">${stats.topDomain || 'General'}</div>
        </div>
      </div>
    `;
    
    document.getElementById('stats-content').innerHTML = content;
  }
  
  formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
  
  addToRecentPrompts(original, result) {
    const prompt = {
      id: Date.now(),
      original,
      optimized: result.optimized || result.result,
      timestamp: new Date().toISOString(),
      domain: result.analysis?.domain || 'general'
    };
    
    this.state.recentPrompts.unshift(prompt);
    this.state.recentPrompts = this.state.recentPrompts.slice(0, 10); // Keep only last 10
    
    this.saveRecentPrompts();
    this.updateRecentPromptsUI();
  }
  
  loadRecentPrompts() {
    const saved = localStorage.getItem('recentPrompts');
    if (saved) {
      this.state.recentPrompts = JSON.parse(saved);
    }
    this.updateRecentPromptsUI();
  }
  
  saveRecentPrompts() {
    localStorage.setItem('recentPrompts', JSON.stringify(this.state.recentPrompts));
  }
  
  updateRecentPromptsUI() {
    if (this.state.recentPrompts.length === 0) {
      this.elements.recentPrompts.innerHTML = `
        <div class="empty-state-small">
          <p>No recent prompts</p>
        </div>
      `;
      return;
    }
    
    const html = this.state.recentPrompts.map(prompt => `
      <div class="recent-prompt" data-prompt-id="${prompt.id}">
        <div class="prompt-preview">${this.truncateText(prompt.original, 60)}</div>
        <div class="prompt-meta">
          <span>${prompt.domain}</span>
          <span>${this.formatRelativeTime(prompt.timestamp)}</span>
        </div>
      </div>
    `).join('');
    
    this.elements.recentPrompts.innerHTML = html;
    
    // Add click handlers
    this.elements.recentPrompts.querySelectorAll('.recent-prompt').forEach(el => {
      el.addEventListener('click', (e) => {
        const promptId = parseInt(e.currentTarget.getAttribute('data-prompt-id'));
        this.loadRecentPrompt(promptId);
      });
    });
  }
  
  loadRecentPrompt(promptId) {
    const prompt = this.state.recentPrompts.find(p => p.id === promptId);
    if (prompt) {
      this.elements.inputText.value = prompt.original;
      this.updateCharCount();
      this.updateProcessButton();
      
      // Display previous result
      this.state.currentPrompt = prompt;
      this.displayResults(prompt);
    }
  }
  
  async loadSavedTemplates() {
    try {
      const response = await this.apiCall('GET', this.api.endpoints.search, {
        limit: 10,
        orderBy: 'created_at',
        orderDirection: 'desc'
      });
      
      if (response.success && Array.isArray(response.data) && response.data.length > 0) {
        this.state.savedTemplates = response.data;
        this.updateSavedTemplatesUI();
      } else {
        this.state.savedTemplates = [];
        this.updateSavedTemplatesUI();
      }
    } catch (error) {
      console.error('Error loading saved templates:', error);
      this.updateSavedTemplatesUI();
    }
  }
  
  updateSavedTemplatesUI() {
    if (this.state.savedTemplates.length === 0) {
      this.elements.savedTemplates.innerHTML = `
        <div class="empty-state-small">
          <p>No saved templates</p>
        </div>
      `;
      return;
    }
    
    const html = this.state.savedTemplates.map(template => `
      <div class="saved-template" data-template-id="${template.id || 'unknown'}">
        <div class="prompt-preview">${template.metadata?.title || this.truncateText(template.original || template.text, 60)}</div>
        <div class="prompt-meta">
          <span>${template.metadata?.domain || template.domain || 'general'}</span>
          <span>${this.formatRelativeTime(template.created_at || template.timestamp || new Date().toISOString())}</span>
        </div>
      </div>
    `).join('');
    
    this.elements.savedTemplates.innerHTML = html;
    
    // Add click handlers
    this.elements.savedTemplates.querySelectorAll('.saved-template').forEach(el => {
      el.addEventListener('click', (e) => {
        const templateId = e.currentTarget.getAttribute('data-template-id');
        this.loadSavedTemplate(templateId);
      });
    });
  }
  
  loadSavedTemplate(templateId) {
    const template = this.state.savedTemplates.find(t => t.id === templateId);
    if (template) {
      this.elements.inputText.value = template.original;
      this.updateCharCount();
      this.updateProcessButton();
      
      // Set domain if specified
      if (template.metadata?.domain) {
        this.elements.domainSelect.value = template.metadata.domain;
      }
    }
  }
  
  toggleTheme() {
    this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
    this.applyTheme();
    localStorage.setItem('theme', this.state.theme);
  }
  
  applyTheme() {
    document.body.className = `theme-${this.state.theme}`;
  }
  
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
      setTimeout(() => modal.classList.add('show'), 10);
    }
  }
  
  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.add('hidden');
      }, 300);
    }
  }
  
  showToast(type, title, message = '') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      warning: '⚠️'
    }[type] || 'ℹ️';
    
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
    `;
    
    this.elements.toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 5000);
  }
  
  handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + Enter to process
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (!this.elements.processBtn.disabled) {
        this.processPrompt();
      }
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.show').forEach(modal => {
        this.hideModal(modal.id);
      });
    }
    
    // Ctrl/Cmd + K to focus input
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      this.elements.inputText.focus();
    }
  }
  
  async apiCall(method, endpoint, data = null) {
    const url = this.api.baseUrl + endpoint;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    } else if (data && method === 'GET') {
      const params = new URLSearchParams(data);
      const separator = url.includes('?') ? '&' : '?';
      return fetch(`${url}${separator}${params}`, options).then(r => r.json());
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Utility functions
  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  truncateText(text, maxLength) {
    if (!text || typeof text !== 'string') return 'Untitled';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
  
  formatRelativeTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }
  
  updateUI() {
    this.updateCharCount();
    this.updateProcessButton();
    this.showEmptyResults();
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.pimpPromptApp = new PimpPromptApp();
});

// Add CSS for stats grid
const additionalStyles = `
<style>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.stat-item {
  text-align: center;
  padding: var(--spacing-md);
  background: var(--background-color);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-sm);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
}

.error-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--text-secondary);
}

.error-details {
  font-size: 0.9rem;
  color: var(--error-color);
  margin-top: var(--spacing-sm);
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', additionalStyles);