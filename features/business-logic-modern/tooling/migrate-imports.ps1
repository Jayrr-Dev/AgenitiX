<#
.SYNOPSIS
    Import Migration Script for Modern Business Logic System
    
.DESCRIPTION
    Automatically converts relative imports to clean aliases in the modern business logic system.
    Replaces messy relative paths like '../../../infrastructure/components/modern/components/Button'
    with clean aliases like '@components/Button'.
    
.PARAMETER Path
    The root path to search for files (defaults to current directory)
    
.PARAMETER Preview
    Shows what would be changed without making actual changes
    
.PARAMETER Verbose
    Shows detailed information about the migration process
    
.EXAMPLE
    .\migrate-imports.ps1
    Run migration on current directory
    
.EXAMPLE
    .\migrate-imports.ps1 -Preview
    Preview changes without making them
    
.EXAMPLE
    .\migrate-imports.ps1 -Verbose
    Run migration with detailed output
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [string]$Path = ".",
    
    [Parameter(Mandatory=$false)]
    [switch]$Preview,
    
    [Parameter(Mandatory=$false)]
    [switch]$ShowExamples
)

# ============================================================================
# MIGRATION RULES CONFIGURATION
# ============================================================================

$MigrationRules = @(
    # COMPONENT IMPORTS
    @{
        Pattern = 'from [''"](\.\./)*infrastructure/components/modern/components/([^''"]+)[''"]'
        Replacement = "from '@components/`$2'"
        Description = "Component imports"
    },
    
    # REGISTRY IMPORTS  
    @{
        Pattern = 'from [''"](\.\./)*infrastructure/registries/modern/([^''"]+)[''"]'
        Replacement = "from '@registries/`$2'"
        Description = "Registry imports"
    },
    
    # STORE IMPORTS
    @{
        Pattern = 'from [''"](\.\./)*infrastructure/theming/modern/stores/([^''"]+)[''"]'
        Replacement = "from '@stores/`$2'"
        Description = "Store imports"
    },
    
    # THEMING IMPORTS
    @{
        Pattern = 'from [''"](\.\./)*infrastructure/theming/modern/([^''"]+)[''"]'
        Replacement = "from '@theming/`$2'"
        Description = "Theming imports"
    },
    
    # FLOW ENGINE IMPORTS
    @{
        Pattern = 'from [''"](\.\./)*infrastructure/flow-engine/([^''"]+)[''"]'
        Replacement = "from '@flow-engine/`$2'"
        Description = "Flow engine imports"
    },
    
    # DOMAIN IMPORTS - Content Creation
    @{
        Pattern = 'from [''"](\.\./)*domains/content-creation/([^''"]+)[''"]'
        Replacement = "from '@content/`$2'"
        Description = "Content creation domain imports"
    },
    
    # DOMAIN IMPORTS - Automation Triggers
    @{
        Pattern = 'from [''"](\.\./)*domains/automation-triggers/([^''"]+)[''"]'
        Replacement = "from '@automation/`$2'"
        Description = "Automation triggers domain imports"
    },
    
    # DOMAIN IMPORTS - Data Visualization
    @{
        Pattern = 'from [''"](\.\./)*domains/data-visualization/([^''"]+)[''"]'
        Replacement = "from '@visualization/`$2'"
        Description = "Data visualization domain imports"
    },
    
    # DOMAIN IMPORTS - Testing & Debugging
    @{
        Pattern = 'from [''"](\.\./)*domains/testing-debugging/([^''"]+)[''"]'
        Replacement = "from '@testing/`$2'"
        Description = "Testing & debugging domain imports"
    },
    
    # GENERAL DOMAIN IMPORTS
    @{
        Pattern = 'from [''"](\.\./)*domains/([^''"]+)[''"]'
        Replacement = "from '@domains/`$2'"
        Description = "General domain imports"
    },
    
    # GENERAL INFRASTRUCTURE IMPORTS
    @{
        Pattern = 'from [''"](\.\./)*infrastructure/([^''"]+)[''"]'
        Replacement = "from '@infrastructure/`$2'"
        Description = "General infrastructure imports"
    }
)

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Write-ColoredText {
    param(
        [string]$Text,
        [string]$Color = "White"
    )
    Write-Host $Text -ForegroundColor $Color
}

function Write-Banner {
    param([string]$Title)
    
    Write-Host ""
    Write-ColoredText "=" * 60 -Color "Cyan"
    Write-ColoredText "  $Title" -Color "Yellow"
    Write-ColoredText "=" * 60 -Color "Cyan"
    Write-Host ""
}

function Show-Examples {
    Write-Banner "MIGRATION EXAMPLES"
    
    Write-ColoredText "BEFORE (Messy relative paths):" -Color "Red"
    Write-Host "   import Sidebar from '../../../infrastructure/components/modern/components/Sidebar';"
    Write-Host "   import { useFlowStore } from '../../theming/modern/stores/flowStore';"
    Write-Host "   import CreateText from '../../../domains/content-creation/nodes/CreateText';"
    Write-Host ""
    
    Write-ColoredText "AFTER (Clean aliases):" -Color "Green"
    Write-Host "   import Sidebar from '@components/Sidebar';"
    Write-Host "   import { useFlowStore } from '@stores/flowStore';"
    Write-Host "   import CreateText from '@content/nodes/CreateText';"
    Write-Host ""
}

function Get-TargetFiles {
    param([string]$SearchPath)
    
    $FilePatterns = @("*.ts", "*.tsx", "*.js", "*.jsx")
    $ExcludePatterns = @("node_modules", "dist", "build", ".next", "*.d.ts")
    
    $Files = @()
    
    foreach ($Pattern in $FilePatterns) {
        $FoundFiles = Get-ChildItem -Path $SearchPath -Filter $Pattern -Recurse | 
                     Where-Object { 
                         $Exclude = $false
                         foreach ($ExcludePattern in $ExcludePatterns) {
                             if ($_.FullName -like "*$ExcludePattern*") {
                                 $Exclude = $true
                                 break
                             }
                         }
                         -not $Exclude
                     }
        $Files += $FoundFiles
    }
    
    return $Files | Sort-Object FullName
}

function Test-FileNeedsMigration {
    param(
        [string]$FilePath,
        [array]$Rules
    )
    
    $Content = Get-Content -Path $FilePath -Raw -ErrorAction SilentlyContinue
    if (-not $Content) { return $false }
    
    foreach ($Rule in $Rules) {
        if ($Content -match $Rule.Pattern) {
            return $true
        }
    }
    
    return $false
}

function Update-FileImports {
    param(
        [string]$FilePath,
        [array]$Rules,
        [switch]$Preview
    )
    
    try {
        $Content = Get-Content -Path $FilePath -Raw
        $OriginalContent = $Content
        $ChangesFound = @()
        
        foreach ($Rule in $Rules) {
            if ($Content -match $Rule.Pattern) {
                $OldContent = $Content
                $Content = $Content -replace $Rule.Pattern, $Rule.Replacement
                
                if ($Content -ne $OldContent) {
                    $ChangesFound += $Rule.Description
                }
            }
        }
        
        if ($Content -ne $OriginalContent) {
            if ($Preview) {
                Write-ColoredText "WOULD UPDATE: $FilePath" -Color "Yellow"
                foreach ($Change in $ChangesFound) {
                    Write-Host "    - $Change" -ForegroundColor "Gray"
                }
            } else {
                Set-Content -Path $FilePath -Value $Content -NoNewline
                Write-ColoredText "UPDATED: $FilePath" -Color "Green"
                if ($VerbosePreference -eq "Continue") {
                    foreach ($Change in $ChangesFound) {
                        Write-Host "    - $Change" -ForegroundColor "Gray"
                    }
                }
            }
            return $true
        }
        
        return $false
    }
    catch {
        Write-ColoredText "ERROR processing $FilePath`: $_" -Color "Red"
        return $false
    }
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

function Invoke-ImportMigration {
    param(
        [string]$SearchPath,
        [switch]$Preview
    )
    
    Write-Banner "IMPORT MIGRATION - MODERN BUSINESS LOGIC SYSTEM"
    
    if ($Preview) {
        Write-ColoredText "PREVIEW MODE - No files will be modified" -Color "Yellow"
        Write-Host ""
    }
    
    # Find target files
    Write-ColoredText "Searching for files..." -Color "Cyan"
    $Files = Get-TargetFiles -SearchPath $SearchPath
    
    if ($Files.Count -eq 0) {
        Write-ColoredText "No TypeScript/JavaScript files found in: $SearchPath" -Color "Yellow"
        return
    }
    
    Write-Host "Found $($Files.Count) files to process" -ForegroundColor "Gray"
    Write-Host ""
    
    # Filter files that need migration
    Write-ColoredText "Checking which files need migration..." -Color "Cyan"
    $FilesToMigrate = @()
    
    foreach ($File in $Files) {
        if (Test-FileNeedsMigration -FilePath $File.FullName -Rules $MigrationRules) {
            $FilesToMigrate += $File
        }
    }
    
    if ($FilesToMigrate.Count -eq 0) {
        Write-ColoredText "Great! No files need migration - you're already using clean imports!" -Color "Green"
        return
    }
    
    Write-Host "Found $($FilesToMigrate.Count) files that need migration" -ForegroundColor "Gray"
    Write-Host ""
    
    # Process files
    Write-ColoredText "Processing files..." -Color "Cyan"
    $UpdatedCount = 0
    
    foreach ($File in $FilesToMigrate) {
        $RelativePath = (Resolve-Path -Path $File.FullName -Relative) -replace "^\.\\", ""
        $WasUpdated = Update-FileImports -FilePath $File.FullName -Rules $MigrationRules -Preview:$Preview
        
        if ($WasUpdated) {
            $UpdatedCount++
        }
    }
    
    # Summary
    Write-Banner "MIGRATION SUMMARY"
    
    Write-Host "Results:" -ForegroundColor "Cyan"
    Write-Host "   Total files scanned: $($Files.Count)"
    Write-Host "   Files needing migration: $($FilesToMigrate.Count)"
    
    if ($Preview) {
        Write-Host "   Files that would be updated: $UpdatedCount" -ForegroundColor "Yellow"
        Write-Host ""
        Write-ColoredText "Run without -Preview to apply these changes" -Color "Cyan"
    } else {
        Write-Host "   Files successfully updated: $UpdatedCount" -ForegroundColor "Green"
        
        if ($UpdatedCount -gt 0) {
            Write-Host ""
            Write-ColoredText "Migration completed successfully!" -Color "Green"
            Write-ColoredText "Your imports are now using clean aliases" -Color "Cyan"
            Write-ColoredText "Run 'npm run type-check' or 'tsc --noEmit' to verify" -Color "Yellow"
        }
    }
    
    Write-Host ""
}

# ============================================================================
# SCRIPT EXECUTION
# ============================================================================

if ($ShowExamples) {
    Show-Examples
    exit 0
}

# Convert relative path to absolute
$SearchPath = Resolve-Path -Path $Path -ErrorAction SilentlyContinue
if (-not $SearchPath) {
    Write-ColoredText "Path not found: $Path" -Color "Red"
    exit 1
}

# Run the migration
Invoke-ImportMigration -SearchPath $SearchPath -Preview:$Preview 