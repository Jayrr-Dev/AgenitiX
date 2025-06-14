# PowerShell Usage Guide for Modern System

## 🚀 Quick Start

### 1. Navigate to the Modern System
```powershell
# From project root
cd features/business-logic-modern
```

### 2. Run the Import Migration
```powershell
# See what would change (safe preview)
.\tooling\migrate-imports.ps1 -WhatIf

# Apply the changes
.\tooling\migrate-imports.ps1

# Get detailed output
.\tooling\migrate-imports.ps1 -Verbose
```

---

## 💡 PowerShell Commands Explained

### Preview Mode (`-WhatIf`)
```powershell
.\tooling\migrate-imports.ps1 -WhatIf
```
- **Safe**: No files are modified
- **Shows**: What would be changed
- **Use when**: You want to see the impact first

### Normal Mode
```powershell
.\tooling\migrate-imports.ps1
```
- **Action**: Updates files with clean aliases
- **Output**: Shows which files were updated
- **Use when**: You're ready to apply changes

### Verbose Mode (`-Verbose`)
```powershell
.\tooling\migrate-imports.ps1 -Verbose
```
- **Extra info**: Shows detailed change types
- **Helpful for**: Understanding what's happening
- **Use when**: Debugging or learning

### Show Examples (`-ShowExamples`)
```powershell
.\tooling\migrate-imports.ps1 -ShowExamples
```
- **Educational**: Shows before/after examples
- **No files changed**: Just displays examples
- **Use when**: Learning how the migration works

---

## 🎯 Real Usage Examples

### Example 1: First Time User (Recommended Flow)
```powershell
# Step 1: See examples to understand what happens
.\tooling\migrate-imports.ps1 -ShowExamples

# Step 2: Preview changes safely
.\tooling\migrate-imports.ps1 -WhatIf

# Step 3: Apply if you like what you see
.\tooling\migrate-imports.ps1
```

### Example 2: Quick Migration
```powershell
# If you trust the process, run directly
.\tooling\migrate-imports.ps1
```

### Example 3: Detailed Analysis
```powershell
# Get maximum information about the process
.\tooling\migrate-imports.ps1 -Verbose -WhatIf
```

---

## 📊 Understanding the Output

### Preview Mode Output:
```
🔍 WOULD UPDATE: .\infrastructure\flow-engine\FlowEditor.tsx
    - Component imports
    - Store imports
    - Registry imports
```

### Normal Mode Output:
```
✅ UPDATED: .\infrastructure\flow-engine\FlowEditor.tsx
✅ UPDATED: .\infrastructure\registries\EnhancedNodeRegistry.tsx
```

### Summary Output:
```
📊 Results:
   Total files scanned: 25
   Files needing migration: 3
   Files successfully updated: 3
```

---

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### Issue: "Execution Policy Error"
```
.\migrate-imports.ps1 : File cannot be loaded because running scripts is disabled
```

**Solution 1 (Temporary):**
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\tooling\migrate-imports.ps1
```

**Solution 2 (Current User):**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Issue: "Path not found"
```
❌ Path not found: .
```

**Solution:**
```powershell
# Make sure you're in the right directory
cd features/business-logic-modern
pwd  # Should show: .../features/business-logic-modern
```

#### Issue: No files found
```
⚠️ No TypeScript/JavaScript files found
```

**Solution:**
```powershell
# Check if you're in the right location
ls  # Should see: domains/, infrastructure/, documentation/, etc.
cd features/business-logic-modern  # Navigate to correct location
```

---

## 🚀 Advanced Usage

### Run on Specific Subdirectory
```powershell
# Only process infrastructure files
.\tooling\migrate-imports.ps1 -Path ".\infrastructure"

# Only process domain files  
.\tooling\migrate-imports.ps1 -Path ".\domains"
```

### Combine with Git for Safety
```powershell
# Create a checkpoint before migration
git add -A
git commit -m "Before import migration"

# Run migration
.\tooling\migrate-imports.ps1

# Review changes
git diff HEAD~1

# If you don't like it, revert
git reset --hard HEAD~1
```

### Batch Processing with Multiple Directories
```powershell
# Process multiple areas
$directories = @(".\infrastructure", ".\domains")
foreach ($dir in $directories) {
    Write-Host "Processing: $dir"
    .\tooling\migrate-imports.ps1 -Path $dir
}
```

---

## 🎨 PowerShell vs Other Methods

### PowerShell Advantages:
- ✅ **Native to Windows** - No Node.js required
- ✅ **Rich output** - Colored text and detailed feedback
- ✅ **Safe preview** - WhatIf parameter
- ✅ **Built-in help** - Get-Help works
- ✅ **Integration** - Works with Windows tools

### When to Use Node.js Version:
- 🔧 Cross-platform development (Mac/Linux)
- 🔧 CI/CD pipelines
- 🔧 When Node.js is already installed

---

## 📝 Script Parameters Reference

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `-Path` | String | Directory to process | `-Path ".\infrastructure"` |
| `-WhatIf` | Switch | Preview mode only | `-WhatIf` |
| `-Verbose` | Switch | Detailed output | `-Verbose` |
| `-ShowExamples` | Switch | Display examples | `-ShowExamples` |

---

## 🔍 Verification After Migration

### Check TypeScript Compilation
```powershell
# If you have TypeScript installed
tsc --noEmit

# Or if using npm scripts
npm run type-check
```

### Check with VS Code
1. Open VS Code in the directory
2. Look for import suggestions when typing `@`
3. Ctrl+Click on imports to test "Go to Definition"
4. Check for any red squiggly lines

---

**💡 Pro Tip**: Always run with `-WhatIf` first to see what will change. The PowerShell script is designed to be safe and informative! 