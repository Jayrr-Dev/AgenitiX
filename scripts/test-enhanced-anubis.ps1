# ENHANCED ANUBIS PROTECTION TEST SCRIPT WITH THREAT INTELLIGENCE
# Tests bot protection including IPsum threat intelligence integration

param(
    [string]$Url = "https://agenitix.vercel.app/",
    [switch]$Local,
    [switch]$Verbose,
    [switch]$TestThreatIntel
)

# CONFIGURATION
if ($Local) {
    $Url = "http://localhost:3000/"
}

Write-Host "🐺 ENHANCED ANUBIS PROTECTION TEST SUITE" -ForegroundColor Cyan
Write-Host "Testing URL: $Url" -ForegroundColor Yellow
Write-Host "=" * 60

# ENHANCED TEST SCENARIOS INCLUDING THREAT INTELLIGENCE
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
        Name = "🕷️ Headless Chrome (Should be BLOCKED)"
        UserAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/91.0.4472.124 Safari/537.36"
        ExpectedResult = "Challenge"
        Color = "Red"
    },
    @{
        Name = "🧅 Tor Browser (Should be BLOCKED)"
        UserAgent = "Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0"
        Headers = @{ "X-Forwarded-For" = "185.220.100.240" }  # Known Tor exit node
        ExpectedResult = "Challenge"
        Color = "Red"
    },
    @{
        Name = "🏢 VPS/Hosting IP (Should be ELEVATED)"
        UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        Headers = @{ "X-Forwarded-For" = "198.199.71.30" }  # DigitalOcean IP from IPsum
        ExpectedResult = "Challenge"
        Color = "Yellow"
    },
    @{
        Name = "🚨 Known Malicious IP (Should be BLOCKED)"
        UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        Headers = @{ "X-Forwarded-For" = "185.93.89.118" }  # High-risk IP from IPsum (9 blacklist hits)
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
        UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ExpectedResult = "Website"
        Color = "Blue"
    }
)

# THREAT INTELLIGENCE TEST CASES
$threatIntelTests = @(
    @{
        IP = "185.93.89.118"
        Description = "High-risk IP (9 blacklist hits)"
        ExpectedMalicious = $true
    },
    @{
        IP = "193.32.162.157"
        Description = "High-risk IP (9 blacklist hits)"
        ExpectedMalicious = $true
    },
    @{
        IP = "198.199.71.30"
        Description = "Moderate-risk IP (7 blacklist hits)"
        ExpectedMalicious = $true
    },
    @{
        IP = "8.8.8.8"
        Description = "Google DNS (should be clean)"
        ExpectedMalicious = $false
    },
    @{
        IP = "1.1.1.1"
        Description = "Cloudflare DNS (should be clean)"
        ExpectedMalicious = $false
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

function Test-ThreatIntelligence {
    param($IP, $Description, $ExpectedMalicious)
    
    try {
        $response = Invoke-RestMethod -Uri "$Url/api/anubis/threat-intel?action=check&ip=$IP" -Method GET -TimeoutSec 10
        
        $actualMalicious = $response.isMalicious
        $riskScore = $response.riskScore
        $confidence = $response.confidence
        $sources = $response.sources -join ", "
        $hits = $response.blacklistHits
        
        if ($actualMalicious -eq $ExpectedMalicious) {
            $status = "✅ PASS"
            $color = "Green"
        } else {
            $status = "❌ FAIL"
            $color = "Red"
        }
        
        Write-Host "  $status" -ForegroundColor $color -NoNewline
        Write-Host " | Risk: $riskScore | Confidence: $confidence | Hits: $hits | Sources: $sources"
        
        return $actualMalicious -eq $ExpectedMalicious
        
    } catch {
        Write-Host "  ❌ ERROR" -ForegroundColor Red -NoNewline
        Write-Host " | Failed to check IP: $($_.Exception.Message)"
        return $false
    }
}

# TEST THREAT INTELLIGENCE FIRST
if ($TestThreatIntel) {
    Write-Host "`n🔍 THREAT INTELLIGENCE TESTS" -ForegroundColor Cyan
    Write-Host "-" * 50
    
    $threatIntelPassed = 0
    $threatIntelTotal = $threatIntelTests.Count
    
    foreach ($test in $threatIntelTests) {
        Write-Host "$($test.IP) - $($test.Description)" -ForegroundColor Yellow
        
        if (Test-ThreatIntelligence -IP $test.IP -Description $test.Description -ExpectedMalicious $test.ExpectedMalicious) {
            $threatIntelPassed++
        }
    }
    
    Write-Host "`n📊 THREAT INTELLIGENCE RESULTS:" -ForegroundColor Cyan
    Write-Host "Passed: $threatIntelPassed/$threatIntelTotal" -ForegroundColor $(if ($threatIntelPassed -eq $threatIntelTotal) { "Green" } else { "Yellow" })
    
    # GET CACHE STATS
    try {
        $stats = Invoke-RestMethod -Uri "$Url/api/anubis/threat-intel?action=stats" -Method GET -TimeoutSec 10
        Write-Host "Cache Size: $($stats.cache.size) IPs" -ForegroundColor Blue
        Write-Host "Last Update: $($stats.cache.lastUpdate)" -ForegroundColor Blue
        Write-Host "Is Stale: $($stats.cache.isStale)" -ForegroundColor $(if ($stats.cache.isStale) { "Yellow" } else { "Green" })
    } catch {
        Write-Host "⚠️ Could not retrieve cache stats" -ForegroundColor Yellow
    }
}

# RUN MAIN PROTECTION TESTS
Write-Host "`n🛡️ BOT PROTECTION TESTS" -ForegroundColor Cyan
Write-Host "-" * 50

$results = @()
$passed = 0
$failed = 0
$unknown = 0

foreach ($testCase in $testCases) {
    Write-Host "`n$($testCase.Name)" -ForegroundColor $testCase.Color
    
    try {
        # PREPARE HEADERS
        $headers = @{
            "User-Agent" = $testCase.UserAgent
        }
        
        # ADD CUSTOM HEADERS IF SPECIFIED
        if ($testCase.Headers) {
            foreach ($key in $testCase.Headers.Keys) {
                $headers[$key] = $testCase.Headers[$key]
            }
        }
        
        # MAKE REQUEST
        $response = Invoke-WebRequest -Uri $Url -Headers $headers -TimeoutSec 10 -MaximumRedirection 0 -ErrorAction SilentlyContinue
        
        # ANALYZE RESPONSE
        $result = Test-AnubisResponse -Response $response -TestCase $testCase
        
        # DISPLAY RESULT
        $statusColor = switch ($result.Status.Split(' ')[0]) {
            "✅" { "Green" }
            "❌" { "Red" }
            "⚠️" { "Yellow" }
            default { "White" }
        }
        
        Write-Host "  $($result.Status)" -ForegroundColor $statusColor -NoNewline
        Write-Host " | $($result.Message)"
        
        # SHOW ADDITIONAL INFO IF VERBOSE
        if ($Verbose) {
            Write-Host "    Status Code: $($response.StatusCode)" -ForegroundColor Gray
            Write-Host "    Content Length: $($response.Content.Length)" -ForegroundColor Gray
            
            # SHOW ANUBIS HEADERS IF PRESENT
            $anubisHeaders = $response.Headers.Keys | Where-Object { $_ -like "*Anubis*" -or $_ -like "*RateLimit*" }
            foreach ($header in $anubisHeaders) {
                Write-Host "    $header`: $($response.Headers[$header])" -ForegroundColor Cyan
            }
        }
        
        # COUNT RESULTS
        switch ($result.Status.Split(' ')[0]) {
            "✅" { $passed++ }
            "❌" { $failed++ }
            "⚠️" { $unknown++ }
        }
        
        $results += @{
            TestCase = $testCase.Name
            Status = $result.Status
            Message = $result.Message
            StatusCode = $response.StatusCode
        }
        
    } catch {
        Write-Host "  ❌ ERROR" -ForegroundColor Red -NoNewline
        Write-Host " | Request failed: $($_.Exception.Message)"
        $failed++
        
        $results += @{
            TestCase = $testCase.Name
            Status = "❌ ERROR"
            Message = "Request failed: $($_.Exception.Message)"
            StatusCode = "N/A"
        }
    }
}

# SUMMARY
Write-Host "`n" + "=" * 60 -ForegroundColor Cyan
Write-Host "📊 FINAL RESULTS" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

$total = $testCases.Count
$passRate = [math]::Round(($passed / $total) * 100, 1)

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host "Unknown: $unknown" -ForegroundColor Yellow
Write-Host "Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -ge 80) { "Green" } elseif ($passRate -ge 60) { "Yellow" } else { "Red" })

if ($passRate -ge 80) {
    Write-Host "`n🎉 EXCELLENT! Your bot protection is working well!" -ForegroundColor Green
} elseif ($passRate -ge 60) {
    Write-Host "`n⚠️ GOOD, but there's room for improvement." -ForegroundColor Yellow
} else {
    Write-Host "`n🚨 NEEDS ATTENTION! Several tests failed." -ForegroundColor Red
}

Write-Host "`n🔗 Useful endpoints:" -ForegroundColor Cyan
Write-Host "  Threat Intel Status: $Url/api/anubis/threat-intel" -ForegroundColor Blue
Write-Host "  Check Specific IP: $Url/api/anubis/threat-intel?action=check&ip=<IP>" -ForegroundColor Blue
Write-Host "  Cache Stats: $Url/api/anubis/threat-intel?action=stats" -ForegroundColor Blue 