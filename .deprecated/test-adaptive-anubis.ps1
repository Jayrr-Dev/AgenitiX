#!/usr/bin/env pwsh

<#
.SYNOPSIS
    AgenitiX Adaptive Anubis Testing Suite - PowerShell Version

.DESCRIPTION
    Comprehensive testing suite for the 5-level adaptive risk system in AgenitiX Anubis bot protection.

.PARAMETER Url
    Target server URL to test against

.PARAMETER Local
    Test against localhost:3000

.PARAMETER Dev
    Test against development server

.PARAMETER Staging
    Test against staging server

.PARAMETER Verbose
    Enable verbose output and debugging

.PARAMETER Help
    Show help information

.EXAMPLE
    .\test-adaptive-anubis.ps1 -Local
    Test against local development server

.EXAMPLE
    .\test-adaptive-anubis.ps1 -Url "https://your-site.com"
    Test against custom URL

.EXAMPLE
    .\test-adaptive-anubis.ps1 -Staging -Verbose
    Test staging with verbose output
#>

param(
    [string]$Url = "",
    [switch]$Local,
    [switch]$Dev,
    [switch]$Staging,
    [switch]$Verbose,
    [switch]$Help
)

# COLORS FOR OUTPUT
$Colors = @{
    Reset = "`e[0m"
    Bright = "`e[1m"
    Red = "`e[31m"
    Green = "`e[32m"
    Yellow = "`e[33m"
    Blue = "`e[34m"
    Magenta = "`e[35m"
    Cyan = "`e[36m"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "Reset"
    )
    
    if ($Colors.ContainsKey($Color)) {
        Write-Host "$($Colors[$Color])$Message$($Colors.Reset)"
    } else {
        Write-Host $Message
    }
}

function Show-Help {
    Write-ColorOutput "🚀 AgenitiX Adaptive Anubis Testing Suite" "Bright"
    Write-ColorOutput "==========================================" "Bright"
    Write-Host ""
    Write-ColorOutput "DESCRIPTION:" "Cyan"
    Write-Host "  Comprehensive testing suite for the 5-level adaptive risk system"
    Write-Host "  Tests all risk levels, optimistic verification, and challenge flows"
    Write-Host ""
    Write-ColorOutput "USAGE:" "Cyan"
    Write-Host "  .\test-adaptive-anubis.ps1 [options]"
    Write-Host ""
    Write-ColorOutput "OPTIONS:" "Cyan"
    Write-Host "  -Local      Test against localhost:3000"
    Write-Host "  -Dev        Test against development server"
    Write-Host "  -Staging    Test against staging server"
    Write-Host "  -Url <url>  Test against custom URL"
    Write-Host "  -Verbose    Enable verbose output and debugging"
    Write-Host "  -Help       Show this help message"
    Write-Host ""
    Write-ColorOutput "EXAMPLES:" "Cyan"
    Write-Host "  .\test-adaptive-anubis.ps1 -Local"
    Write-Host "  .\test-adaptive-anubis.ps1 -Url 'https://your-site.com'"
    Write-Host "  .\test-adaptive-anubis.ps1 -Staging -Verbose"
    Write-Host ""
    Write-ColorOutput "RISK LEVELS TESTED:" "Cyan"
    Write-Host "  Level 1 (LOW)       - Trusted users with optimistic verification"
    Write-Host "  Level 2 (MODERATE)  - Standard users with optimistic verification"
    Write-Host "  Level 3 (ELEVATED)  - Suspicious users, immediate challenges (difficulty 4)"
    Write-Host "  Level 4 (HIGH)      - High-risk users, harder challenges (difficulty 6)"
    Write-Host "  Level 5 (DANGEROUS) - Maximum security, hardest challenges (difficulty 8)"
    Write-Host ""
}

function Test-Prerequisites {
    Write-ColorOutput "🔍 Checking prerequisites..." "Cyan"
    
    # Check Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Node.js found: $nodeVersion" "Green"
        } else {
            throw "Node.js not found"
        }
    } catch {
        Write-ColorOutput "❌ Node.js is not installed or not in PATH" "Red"
        Write-ColorOutput "Please install Node.js from https://nodejs.org/" "Yellow"
        return $false
    }
    
    # Check test script
    $scriptPath = Join-Path $PSScriptRoot "test-adaptive-anubis.js"
    if (-not (Test-Path $scriptPath)) {
        Write-ColorOutput "❌ Test script not found: test-adaptive-anubis.js" "Red"
        Write-ColorOutput "Please ensure you're running this from the scripts directory" "Yellow"
        return $false
    }
    
    Write-ColorOutput "✅ All prerequisites met" "Green"
    return $true
}

function Get-TestUrl {
    if ($Help) {
        Show-Help
        exit 0
    }
    
    if ($Url) {
        return $Url
    } elseif ($Local) {
        return "http://localhost:3000"
    } elseif ($Dev) {
        return "https://your-dev-server.com"
    } elseif ($Staging) {
        return "https://your-staging-server.com"
    } else {
        return "http://localhost:3000"  # Default
    }
}

function Start-Tests {
    param([string]$TestUrl)
    
    Write-ColorOutput "🚀 AgenitiX Adaptive Anubis Testing Suite" "Bright"
    Write-ColorOutput "==========================================" "Bright"
    Write-Host ""
    Write-ColorOutput "📍 Target Server: $TestUrl" "Cyan"
    Write-Host ""
    
    # Set environment variables
    $env:TEST_SERVER_URL = $TestUrl
    if ($Verbose) {
        $env:DEBUG = "true"
        Write-ColorOutput "🔍 Debug mode enabled" "Yellow"
    }
    
    # Change to script directory
    Push-Location $PSScriptRoot
    
    try {
        Write-ColorOutput "🧪 Starting adaptive risk tests..." "Cyan"
        Write-Host ""
        
        # Run the Node.js test script
        $result = node "test-adaptive-anubis.js"
        $exitCode = $LASTEXITCODE
        
        Write-Host $result
        
        if ($exitCode -eq 0) {
            Write-Host ""
            Write-ColorOutput "✅ Tests completed successfully!" "Green"
            Write-ColorOutput "🎉 Your adaptive risk system is working correctly!" "Green"
        } else {
            Write-Host ""
            Write-ColorOutput "❌ Tests failed with exit code $exitCode" "Red"
            Write-ColorOutput "⚠️  Please review the output above for details" "Yellow"
        }
        
    } catch {
        Write-ColorOutput "💥 Test execution failed: $($_.Exception.Message)" "Red"
        $exitCode = 1
    } finally {
        Pop-Location
        
        # Clean up environment variables
        Remove-Item Env:TEST_SERVER_URL -ErrorAction SilentlyContinue
        Remove-Item Env:DEBUG -ErrorAction SilentlyContinue
    }
    
    Write-Host ""
    Write-ColorOutput "🔗 Next Steps:" "Bright"
    Write-Host "  1. Review any failed tests above"
    Write-Host "  2. Check server logs for detailed error information"
    Write-Host "  3. Test with real user traffic patterns"
    Write-Host "  4. Monitor the Risk Dashboard during testing"
    
    return $exitCode
}

# MAIN EXECUTION
try {
    if (-not (Test-Prerequisites)) {
        exit 1
    }
    
    $testUrl = Get-TestUrl
    $exitCode = Start-Tests -TestUrl $testUrl
    
    exit $exitCode
    
} catch {
    Write-ColorOutput "💥 Script failed: $($_.Exception.Message)" "Red"
    Write-Host $_.ScriptStackTrace
    exit 1
} 