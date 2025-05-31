# 🐺 Anubis Testing Scripts

This folder contains automated testing scripts to verify that Anubis bot protection is working correctly on your website.

## 📁 Files

- **`test-anubis.ps1`** - PowerShell script for Windows
- **`test-anubis.sh`** - Bash script for Linux/macOS  
- **`README.md`** - This documentation

## 🚀 Quick Start

### Windows (PowerShell)
```powershell
# Test production site
.\scripts\test-anubis.ps1

# Test local development
.\scripts\test-anubis.ps1 -Local

# Verbose output with details
.\scripts\test-anubis.ps1 -Verbose
```

### Linux/macOS (Bash)
```bash
# Make script executable (first time only)
chmod +x scripts/test-anubis.sh

# Test production site
./scripts/test-anubis.sh

# Test local development
./scripts/test-anubis.sh --local

# Verbose output with details
./scripts/test-anubis.sh --verbose

# Test custom URL
./scripts/test-anubis.sh --url https://example.com
```

## 🧪 What the Tests Do

The scripts test 6 different scenarios:

### 🚫 Should be BLOCKED (Challenge Page)
1. **🤖 Scraping Bot** - `ScrapingBot/1.0`
2. **🐍 Python Requests** - `Python-requests/2.28.1`  
3. **🕷️ Generic Crawler** - `WebCrawler/1.0`

### ✅ Should be ALLOWED (Website Content)
4. **✅ Google Bot** - `Googlebot/2.1`
5. **✅ Bing Bot** - `Bingbot/2.0`
6. **🌐 Regular Browser** - Standard browser User-Agent

## 📊 Understanding Results

### ✅ PASS Results
- **Bot correctly blocked with challenge** - Malicious bots get challenge page ✓
- **Legitimate request allowed** - Good bots/browsers get website content ✓

### ❌ FAIL Results  
- **Bot accessed website (should be blocked)** - Anubis not working, bots bypass protection ❌
- **Legitimate request blocked (false positive)** - Good traffic incorrectly blocked ❌

### ⚠️ UNKNOWN Results
- **Unexpected response** - Neither challenge nor website content detected

## 🔧 Troubleshooting

### All Tests Failing (Bots Getting Website)
**Problem:** Anubis protection is not active
**Solutions:**
1. Check environment variables in Vercel/production
2. Verify `ANUBIS_ENABLED=true`
3. Ensure JWT secret is set
4. Redeploy application

### Good Bots Being Blocked
**Problem:** Legitimate crawlers getting challenge page
**Solutions:**
1. Check `allowedUserAgents` in Anubis config
2. Verify Googlebot/Bingbot are in allowed list
3. Check for typos in User-Agent patterns

### Local Tests Not Working
**Problem:** Development bypass might be active
**Solutions:**
1. Set `ANUBIS_BYPASS_DEVELOPMENT=false` in `.env.local`
2. Restart development server
3. Use `--local` flag for localhost testing

## 📝 Example Output

```
🐺 ANUBIS PROTECTION TEST SUITE
Testing URL: https://agenitix.vercel.app/
==================================================

🤖 Scraping Bot (Should be BLOCKED)
User-Agent: ScrapingBot/1.0
✅ PASS Bot correctly blocked with challenge

✅ Google Bot (Should be ALLOWED)  
User-Agent: Googlebot/2.1 (+http://www.google.com/bot.html)
✅ PASS Legitimate request allowed

==================================================
📊 TEST SUMMARY
✅ Passed: 6
❌ Failed: 0
⚠️ Unknown: 0

🎉 ALL TESTS PASSED! Anubis protection is working correctly.
```

## 🔄 Automation

You can integrate these scripts into your CI/CD pipeline:

### GitHub Actions Example
```yaml
- name: Test Anubis Protection
  run: |
    chmod +x scripts/test-anubis.sh
    ./scripts/test-anubis.sh --url ${{ secrets.PRODUCTION_URL }}
```

### Scheduled Testing
```bash
# Add to crontab for daily testing
0 9 * * * /path/to/your/project/scripts/test-anubis.sh
```

## 🛠️ Customization

### Adding New Test Cases
Edit the arrays in the script files:

```powershell
# PowerShell
$testCases += @{
    Name = "🔍 Custom Bot (Should be BLOCKED)"
    UserAgent = "CustomBot/1.0"
    ExpectedResult = "Challenge"
    Color = "Red"
}
```

```bash
# Bash
test_names+=("🔍 Custom Bot (Should be BLOCKED)")
user_agents+=("CustomBot/1.0")
expected_results+=("Challenge")
colors+=("$RED")
```

### Testing Different URLs
```bash
# Test staging environment
./scripts/test-anubis.sh --url https://staging.agenitix.vercel.app

# Test specific pages
./scripts/test-anubis.sh --url https://agenitix.vercel.app/about
```

## 📚 Related Documentation

- [Anubis Setup Guide](../docs/ANUBIS_SETUP.md)
- [Anubis Quick Reference](../docs/ANUBIS.md)
- [Environment Configuration](../.env.example) 