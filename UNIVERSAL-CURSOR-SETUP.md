# Universal Cursor Setup for PromptSmith

## 🎯 Make PromptSmith Available in ALL Cursor Projects

This guide shows you how to configure PromptSmith MCP to work in **every** Cursor project window, not just the PromptSmith directory.

## ✅ What You Get

After this setup:
- ✅ `pimpprompt` command works in **any terminal/directory**
- ✅ MCP tools available in **every Cursor project window**
- ✅ Templates shared across **all projects**
- ✅ Same persistent Supabase database everywhere

## 🚀 Setup Steps

### Step 1: Global CLI Installation

If you haven't already, make `pimpprompt` available globally:

```bash
# Navigate to PromptSmith directory
cd /Users/nadalpiantini/Dev/PrompSmith/PromptSmith

# Install globally (creates system-wide 'pimpprompt' command)
npm link

# Test from any directory
cd ~/Desktop
pimpprompt --help  # Should work from anywhere
```

### Step 2: Universal MCP Configuration

#### Option A: Use User Settings (Recommended)

1. **Open Cursor**
2. **Press `Cmd+Shift+P`** (or `Ctrl+Shift+P` on Windows)
3. **Type**: `Preferences: Open User Settings (JSON)`
4. **Add this configuration**:

```json
{
  "mcpServers": {
    "promptsmith": {
      "command": "promptsmith-mcp"
    }
  }
}
```

#### Option B: Use Cursor's MCP Settings File

```bash
# Create the MCP settings directory if it doesn't exist
mkdir -p ~/.cursor

# Copy the simple configuration
cp /Users/nadalpiantini/Dev/PrompSmith/PromptSmith/cursor-mcp-simple.json ~/.cursor/mcp-settings.json
```

### Step 3: Restart Cursor Completely

1. **Quit Cursor entirely** (`Cmd+Q` on Mac, `Alt+F4` on Windows)
2. **Reopen Cursor**
3. **Open ANY project** (not necessarily PromptSmith)

### Step 4: Test Universal Access

#### Test CLI from Any Directory

```bash
# Test from your home directory
cd ~
pimpprompt "create rest api"

# Test from any other project
cd /path/to/any/other/project  
pimpprompt "responsive navbar"
```

#### Test MCP in Any Cursor Project

1. **Open any project in Cursor** (React app, Python project, etc.)
2. **Start a chat session**
3. **Try this**:

```
Use the process_prompt tool to optimize: "add user authentication"
```

You should see PromptSmith respond with optimized prompts and quality scores.

## 🎯 Usage Patterns

### Cross-Project Template Sharing

```bash
# In Project A: Create and save a template
pimpprompt "oauth login flow" --domain backend
# Template saved: "oauth-login-flow-001"

# In Project B: Use the same template
pimpprompt --search "oauth"
# Shows the template created in Project A
```

### Consistent Domain Detection

```bash
# PromptSmith detects context from any project type
cd my-react-app/
pimpprompt "navbar component"    # Auto-detects: FRONTEND

cd my-python-api/
pimpprompt "user endpoints"      # Auto-detects: BACKEND

cd my-mobile-app/
pimpprompt "login screen"        # Auto-detects: MOBILE
```

### MCP Integration Examples

In **any** Cursor project window:

```typescript
// Frontend project - auto-optimizes for React/Vue/Angular
process_prompt({ raw: "responsive sidebar", domain: "frontend" })

// Backend project - auto-optimizes for APIs/databases  
process_prompt({ raw: "user service", domain: "backend" })

// Data science project - auto-optimizes for ML/analysis
process_prompt({ raw: "classification model", domain: "ai" })
```

## 🧪 Verification Script

Run this to verify everything is working:

```bash
# Test CLI universality
echo "Testing CLI from different directories..."
cd ~ && pimpprompt --help
cd /tmp && pimpprompt --help
echo "✅ CLI works globally"

# Test template persistence
echo "Testing template system..."
pimpprompt --list-templates | head -5
echo "✅ Templates are accessible"

# Test database connection
echo "Testing database connection..."
pimpprompt "test prompt" --domain general > /dev/null 2>&1
echo "✅ Database connection working"
```

## 🎊 You're Ready!

After this setup:

### ✅ Global CLI Access
- `pimpprompt` command works **anywhere** on your system
- Templates saved from any project are **universally accessible**
- Domain detection works based on current directory context

### ✅ Universal MCP Integration
- **Every Cursor project** has PromptSmith MCP tools available
- **Consistent experience** across all projects
- **Shared template database** across all windows

### ✅ Cross-Project Benefits
- Save a template in one project, use it in another
- Consistent prompt optimization across your entire workflow
- Single source of truth for all your optimized prompts

## 🔧 Troubleshooting

### "Command not found: pimpprompt"
```bash
# Re-link the global command
cd /Users/nadalpiantini/Dev/PrompSmith/PromptSmith
npm link
```

### "MCP tools not available in new project"
```bash
# Check MCP configuration is in user settings, not workspace settings
# Make sure you restarted Cursor completely after configuration
```

### "Templates not showing up"
```bash
# Check database connection
pimpprompt --search "test" --verbose
```

## 🚀 Advanced: Project-Specific Configurations

If you want different configurations per project, you can create workspace-specific settings:

```json
// In your project's .vscode/settings.json or .cursor/settings.json
{
  "mcpServers": {
    "promptsmith": {
      "command": "node",
      "args": ["dist/mcp-server.js"], 
      "cwd": "/Users/nadalpiantini/Dev/PrompSmith/PromptSmith",
      "env": {
        // Project-specific environment variables
        "PROJECT_CONTEXT": "frontend-app",
        "DEFAULT_DOMAIN": "frontend"
      }
    }
  }
}
```

---

**🎯 Result**: PromptSmith superpowers available everywhere you code!

Now you can use `pimpprompt "any idea"` from any terminal, and access MCP tools in every Cursor project window. All templates are shared across your entire development workflow.