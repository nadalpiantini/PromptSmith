#!/usr/bin/env node

// PromptSmith MCP - Evaluate Prompt Test
// Tests prompt quality evaluation

const { spawn } = require('child_process');

const testPrompt = process.argv[2] || 'SELECT * FROM users WHERE active = true';
const testDomain = process.argv[3] || 'sql';

console.log('📊 PromptSmith MCP - Evaluate Prompt Test');
console.log('=========================================');
console.log(`📝 Test Prompt: "${testPrompt}"`);
console.log(`🎨 Domain: ${testDomain}\n`);

async function testEvaluatePrompt() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting PromptSmith server...');

    const server = spawn('node', ['dist/cli.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: require('path').resolve(__dirname, '..')
    });

    const timeout = setTimeout(() => {
      server.kill();
      reject(new Error('Test timeout'));
    }, 15000);

    server.stderr.on('data', (data) => {
      const text = data.toString();
      if (text.includes('PromptSmith MCP Server is ready!')) {
        console.log('✅ Server ready, sending evaluation request...');

        // Send evaluate_prompt request
        const request = {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: "evaluate_prompt",
            arguments: {
              prompt: testPrompt,
              domain: testDomain
            }
          }
        };

        server.stdin.write(JSON.stringify(request) + '\n');
      }
    });

    server.stdout.on('data', (data) => {
      const text = data.toString().trim();
      if (text) {
        try {
          const response = JSON.parse(text);

          if (response.error) {
            clearTimeout(timeout);
            server.kill();
            reject(new Error(`Evaluation error: ${response.error.message}`));
            return;
          }

          if (response.result && response.result.score) {
            clearTimeout(timeout);
            server.kill();

            console.log('\n🎉 Prompt evaluation SUCCESS!');
            console.log('==============================');
            console.log('📝 Evaluated Prompt:');
            console.log(`   "${testPrompt}"`);

            console.log('\n📈 Quality Assessment:');
            const score = response.result.score;

            // Create visual quality report
            const metrics = [
              { name: 'Overall', value: score.overall, desc: 'General prompt quality' },
              { name: 'Clarity', value: score.clarity, desc: 'How clear and understandable' },
              { name: 'Specificity', value: score.specificity, desc: 'Level of detail and precision' },
              { name: 'Structure', value: score.structure, desc: 'Organization and format' },
              { name: 'Completeness', value: score.completeness, desc: 'Coverage of requirements' }
            ];

            metrics.forEach(metric => {
              const percentage = Math.round(metric.value * 100);
              const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
              const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : 'D';

              console.log(`   ${metric.name.padEnd(12)}: ${bar} ${percentage}% (${grade})`);
              console.log(`   ${' '.repeat(15)}${metric.desc}`);
            });

            if (response.result.suggestions && response.result.suggestions.length > 0) {
              console.log('\n💡 Improvement Suggestions:');
              response.result.suggestions.forEach((suggestion, i) => {
                console.log(`   ${i + 1}. ${suggestion}`);
              });
            }

            // Provide quality verdict
            const overall = score.overall * 100;
            let verdict;
            if (overall >= 85) {
              verdict = '🌟 Excellent - Ready to use!';
            } else if (overall >= 70) {
              verdict = '✅ Good - Minor improvements possible';
            } else if (overall >= 50) {
              verdict = '⚠️ Fair - Significant improvements needed';
            } else {
              verdict = '❌ Poor - Major revision required';
            }

            console.log(`\n🎯 Quality Verdict: ${verdict}`);
            console.log('\n✅ Evaluate prompt test PASSED!');
            resolve();
          }
        } catch (error) {
          // Ignore non-JSON output
        }
      }
    });

    server.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Server error: ${error.message}`));
    });
  });
}

// Run the test
testEvaluatePrompt()
  .then(() => {
    console.log('\n🎊 Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    console.error('\n💡 Usage: node test-evaluate.cjs "your prompt" "domain"');
    console.error('   Domains: sql, branding, cine, saas, devops, general');
    process.exit(1);
  });