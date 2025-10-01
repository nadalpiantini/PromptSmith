import { test, expect } from '@playwright/test';

test.describe('PromptSmith Web UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the main page', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/PromptSmith/);
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('PromptSmith');
    
    // Check input textarea is present
    await expect(page.locator('#input-text')).toBeVisible();
    
    // Check process button is present
    await expect(page.locator('#process-btn')).toBeVisible();
  });

  test('should process a simple prompt', async ({ page }) => {
    const testPrompt = 'create a login form';
    
    // Fill in the prompt
    await page.fill('#input-text', testPrompt);
    
    // Select domain
    await page.selectOption('#domain-select', 'general');
    
    // Click process button
    await page.click('#process-btn');
    
    // Wait for results to appear
    await expect(page.locator('#results-content')).toBeVisible({ timeout: 10000 });
    
    // Check that results content is not empty and not showing error message
    const resultsContent = await page.locator('#results-content').textContent();
    expect(resultsContent).toBeTruthy();
    expect(resultsContent).not.toContain('No optimized result available');
    expect(resultsContent).not.toContain('Error');
  });

  test('should process SQL domain prompt correctly', async ({ page }) => {
    const testPrompt = 'show me users from database';
    
    // Fill in the prompt
    await page.fill('#input-text', testPrompt);
    
    // Select SQL domain
    await page.selectOption('#domain-select', 'sql');
    
    // Click process button
    await page.click('#process-btn');
    
    // Wait for results
    await expect(page.locator('#results-content')).toBeVisible({ timeout: 10000 });
    
    // Check that we get a SQL-optimized result
    const resultsContent = await page.locator('#results-content').textContent();
    expect(resultsContent).toBeTruthy();
    expect(resultsContent).not.toContain('No optimized result available');
    
    // Should mention SQL-related terms
    expect(resultsContent?.toLowerCase()).toMatch(/(sql|query|database|select)/);
  });

  test('should display quality scores', async ({ page }) => {
    const testPrompt = 'test prompt for scoring';
    
    // Fill and process
    await page.fill('#input-text', testPrompt);
    await page.click('#process-btn');
    
    // Wait for metrics section to appear
    await expect(page.locator('.metrics-section')).toBeVisible({ timeout: 10000 });
    
    // Check that all score elements are present
    await expect(page.locator('#overall-score')).toBeVisible();
    await expect(page.locator('#clarity-score')).toBeVisible();
    await expect(page.locator('#specificity-score')).toBeVisible();
    await expect(page.locator('#structure-score')).toBeVisible();
    await expect(page.locator('#completeness-score')).toBeVisible();
    
    // Check that scores are numeric (0-100)
    const overallScore = await page.locator('#overall-score').textContent();
    expect(overallScore).toMatch(/\d+%/);
  });

  test('should save prompts', async ({ page }) => {
    const testPrompt = 'test prompt for saving';
    
    // Process a prompt first
    await page.fill('#input-text', testPrompt);
    await page.click('#process-btn');
    
    // Wait for results
    await expect(page.locator('#results-content')).toBeVisible({ timeout: 10000 });
    
    // Click save button
    await page.click('#save-prompt');
    
    // Fill save modal
    await expect(page.locator('#save-modal')).toBeVisible();
    await page.fill('#prompt-title', 'Test Saved Prompt');
    await page.fill('#prompt-description', 'This is a test prompt');
    await page.fill('#prompt-tags', 'test, e2e');
    
    // Submit save form
    await page.click('#save-modal button[type="submit"]');
    
    // Should show success toast
    await expect(page.locator('.toast.success')).toBeVisible({ timeout: 5000 });
  });

  test('should copy results to clipboard', async ({ page }) => {
    const testPrompt = 'test prompt for copying';
    
    // Process a prompt
    await page.fill('#input-text', testPrompt);
    await page.click('#process-btn');
    
    // Wait for results
    await expect(page.locator('#results-content')).toBeVisible({ timeout: 10000 });
    
    // Grant clipboard permissions (Chromium)
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    
    // Click copy button
    await page.click('#copy-result');
    
    // Should show success toast
    await expect(page.locator('.toast.success')).toBeVisible({ timeout: 5000 });
  });

  test('should evaluate prompt quality', async ({ page }) => {
    const testPrompt = 'test prompt for evaluation';
    
    // Process a prompt first
    await page.fill('#input-text', testPrompt);
    await page.click('#process-btn');
    
    // Wait for results
    await expect(page.locator('#results-content')).toBeVisible({ timeout: 10000 });
    
    // Click evaluate button
    await page.click('#evaluate-btn');
    
    // Should show evaluation results (enhanced metrics or analysis)
    // The evaluation might update the metrics section or show additional info
    await page.waitForTimeout(2000); // Allow time for evaluation
    
    // Metrics should still be visible and potentially updated
    await expect(page.locator('.metrics-section')).toBeVisible();
  });

  test('should handle empty input gracefully', async ({ page }) => {
    // Try to process without any input
    await page.click('#process-btn');
    
    // Should show error or disable button
    const buttonDisabled = await page.locator('#process-btn').isDisabled();
    expect(buttonDisabled).toBe(true);
  });

  test('should update character count', async ({ page }) => {
    const testPrompt = 'test';
    
    // Fill input and check character count
    await page.fill('#input-text', testPrompt);
    
    const charCount = await page.locator('#char-count').textContent();
    expect(charCount).toContain(testPrompt.length.toString());
  });

  test('should toggle theme', async ({ page }) => {
    // Click theme toggle
    await page.click('#theme-toggle');
    
    // Should change theme class on body or html
    const bodyClass = await page.locator('body').getAttribute('class');
    expect(bodyClass).toMatch(/(dark|light)-theme/);
  });

  test('should load example prompts', async ({ page }) => {
    // Click on example buttons if they exist
    const exampleButtons = await page.locator('.example-btn').all();
    
    if (exampleButtons.length > 0) {
      await exampleButtons[0].click();
      
      // Should fill the input with example text
      const inputValue = await page.locator('#input-text').inputValue();
      expect(inputValue.length).toBeGreaterThan(0);
    }
  });

  test('should show stats modal', async ({ page }) => {
    // Click stats button
    await page.click('#stats-btn');
    
    // Should show stats modal
    await expect(page.locator('#stats-modal')).toBeVisible();
    
    // Should load stats content
    await expect(page.locator('#stats-content')).not.toContainText('Loading...');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept API calls and make them fail
    await page.route('/api/**', route => route.abort('failed'));
    
    // Try to process a prompt
    await page.fill('#input-text', 'test prompt');
    await page.click('#process-btn');
    
    // Should show error state or error toast
    await expect(page.locator('.toast.error')).toBeVisible({ timeout: 10000 });
  });
});