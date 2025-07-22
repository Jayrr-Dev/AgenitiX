# ANUBIS PROTECTION TEST SCRIPT
# Tests bot protection on production and local environments

param(
    [string]$Url = "https://agenitix.vercel.app/",
    [switch]$Local,
    [switch]$Verbose
)

# CONFIGURATION
if ($Local) {
    $Url = "http://localhost:3000/"
}

Write-Host "🐺 ANUBIS PROTECTION TEST SUITE" -ForegroundColor Cyan
Write-Host "Testing URL: $Url" -ForegroundColor Yellow
Write-Host "=" * 50

# TEST SCENARIOS
$testCases = @(
    @{
        Name = "🤖 Scraping Bot (Should be BLOCKED)"
        UserAgent = "ScrapingBot/1.0"
        ExpectedResult = "Challenge"
        Color = "Red"
    },
    @{
        Name = "🐍 Python Requests (Should be BLOCKED)"
        UserAgent = "Python-requests/2.28.1"
        ExpectedResult = "Challenge"
        Color = "Red"
    },
    @{
        Name = "🕷️ Generic Crawler (Should be BLOCKED)"
        UserAgent = "WebCrawler/1.0"
        ExpectedResult = "Challenge"
        Color = "Red"
    },
    @{
        Name = "✅ Google Bot (Should be ALLOWED)"
        UserAgent = "Googlebot/2.1 (+http://www.google.com/bot.html)"
        ExpectedResult = "Website"
        Color = "Green"
    },
    @{
        Name = "✅ Bing Bot (Should be ALLOWED)"
        UserAgent = "Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)"
        ExpectedResult = "Website"
        Color = "Green"
    },
    @{
        Name = "🌐 Regular Browser (Should be ALLOWED)"
        UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        ExpectedResult = "Website"
        Color = "Blue"
    }
)

# HELPER FUNCTIONS
function Test-AnubisResponse {
    param($Response, $TestCase)
    
    $content = $Response.Content
    $isChallenge = $content -match "challenge|proof.*work|anubis|sha256" -or 
                   $content -match "Verifying.*request" -or
                   $Response.StatusCode -eq 429
    
    $isWebsite = $content -match "AgenitiX|TALENT ACQUISITION|testing is" -and 
                 $content -notmatch "challenge|proof.*work"
    
    if ($TestCase.ExpectedResult -eq "Challenge") {
        if ($isChallenge) {
            return @{ Status = "✅ PASS"; Message = "Bot correctly blocked with challenge" }
        } elseif ($isWebsite) {
            return @{ Status = "❌ FAIL"; Message = "Bot accessed website (should be blocked)" }
        } else {
            return @{ Status = "⚠️ UNKNOWN"; Message = "Unexpected response" }
        }
    } else {
        if ($isWebsite) {
            return @{ Status = "✅ PASS"; Message = "Legitimate request allowed" }
        } elseif ($isChallenge) {
            return @{ Status = "❌ FAIL"; Message = "Legitimate request blocked (false positive)" }
        } else {
            return @{ Status = "⚠️ UNKNOWN"; Message = "Unexpected response" }
        }
    }
}

# RUN TESTS
$results = @()
foreach ($test in $testCases) {
    Write-Host "`n$($test.Name)" -ForegroundColor $test.Color
    Write-Host "User-Agent: $($test.UserAgent)" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UserAgent $test.UserAgent -TimeoutSec 30
        $result = Test-AnubisResponse -Response $response -TestCase $test
        
        Write-Host "$($result.Status) $($result.Message)" -ForegroundColor $(
            if ($result.Status.StartsWith("✅")) { "Green" }
            elseif ($result.Status.StartsWith("❌")) { "Red" }
            else { "Yellow" }
        )
        
        if ($Verbose) {
            Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Gray
            Write-Host "Content Length: $($response.Content.Length) chars" -ForegroundColor Gray
        }
        
        $results += @{
            Test = $test.Name
            Status = $result.Status
            Message = $result.Message
            UserAgent = $test.UserAgent
        }
        
    } catch {
        Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $results += @{
            Test = $test.Name
            Status = "❌ ERROR"
            Message = $_.Exception.Message
            UserAgent = $test.UserAgent
        }
    }
    
    Start-Sleep -Milliseconds 500  # Rate limiting
}

# SUMMARY
Write-Host "`n" + "=" * 50
Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan

$passed = ($results | Where-Object { $_.Status.StartsWith("✅") }).Count
$failed = ($results | Where-Object { $_.Status.StartsWith("❌") }).Count
$unknown = ($results | Where-Object { $_.Status.StartsWith("⚠️") }).Count

Write-Host "✅ Passed: $passed" -ForegroundColor Green
Write-Host "❌ Failed: $failed" -ForegroundColor Red
Write-Host "⚠️ Unknown: $unknown" -ForegroundColor Yellow

if ($failed -eq 0 -and $unknown -eq 0) {
    Write-Host "`n🎉 ALL TESTS PASSED! Anubis protection is working correctly." -ForegroundColor Green
} elseif ($failed -gt 0) {
    Write-Host "`n⚠️ Some tests failed. Check Anubis configuration." -ForegroundColor Yellow
} else {
    Write-Host "`n❓ Unclear results. Manual verification recommended." -ForegroundColor Yellow
}

# DETAILED RESULTS
if ($Verbose) {
    Write-Host "`n📋 DETAILED RESULTS:" -ForegroundColor Cyan
    $results | ForEach-Object {
        Write-Host "  $($_.Test): $($_.Status)" -ForegroundColor Gray
    }
}

Write-Host "`n🔗 Quick Commands:" -ForegroundColor Cyan
Write-Host "  Test Production: .\scripts\test-anubis.ps1" -ForegroundColor Gray
Write-Host "  Test Local: .\scripts\test-anubis.ps1 -Local" -ForegroundColor Gray
Write-Host "  Verbose Output: .\scripts\test-anubis.ps1 -Verbose" -ForegroundColor Gray 