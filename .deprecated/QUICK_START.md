# 🚀 Quick Start Guide: Testing Anubis Protection

This guide will walk you through testing your Anubis bot protection step-by-step.

## 📋 Prerequisites

- ✅ Windows computer with PowerShell (or Linux/macOS with Bash)
- ✅ Your website deployed to production (Vercel/etc.)
- ✅ Basic command line knowledge

## 🎯 Step 1: Open Terminal/PowerShell

### Windows Users:
1. Press `Windows + R`
2. Type `powershell` and press Enter
3. Navigate to your project folder:
   ```powershell
   cd "C:\Users\YourName\Documents\Projects\agenitix"
   ```

### Mac/Linux Users:
1. Press `Cmd + Space` (Mac) or `Ctrl + Alt + T` (Linux)
2. Navigate to your project folder:
   ```bash
   cd /path/to/your/agenitix/project
   ```

## 🎯 Step 2: Verify Files Exist

Check that the test scripts are in place:

### Windows:
```powershell
ls scripts/
```

### Mac/Linux:
```bash
ls scripts/
```

You should see:
```
test-anubis.ps1
test-anubis.sh
README.md
QUICK_START.md
```

## 🎯 Step 3: Run Your First Test

### Windows (PowerShell):
```powershell
.\scripts\test-anubis.ps1
```

### Mac/Linux (Bash):
```bash
# Make executable (first time only)
chmod +x scripts/test-anubis.sh

# Run the test
./scripts/test-anubis.sh
```

## 🎯 Step 4: Understand the Results

The script will test 6 scenarios and show results like this:

### ✅ **GOOD Results (What You Want to See):**
```
🤖 Scraping Bot (Should be BLOCKED)
✅ PASS Bot correctly blocked with challenge

✅ Google Bot (Should be ALLOWED)
✅ PASS Legitimate request allowed
```

### ❌ **BAD Results (Problems to Fix):**
```
🤖 Scraping Bot (Should be BLOCKED)
❌ FAIL Bot accessed website (should be blocked)

✅ Google Bot (Should be ALLOWED)
❌ FAIL Legitimate request blocked (false positive)
```

## 🎯 Step 5: Interpret Your Results

### Scenario A: All Bots Getting Website Content ❌
**What this means:** Anubis protection is OFF
**What to do:** 
1. Check environment variables in Vercel
2. Set `ANUBIS_ENABLED=true`
3. Add JWT secret
4. Redeploy

### Scenario B: All Tests Passing ✅
**What this means:** Anubis is working perfectly!
**What to do:** Nothing - you're protected!

### Scenario C: Mixed Results ⚠️
**What this means:** Partial protection or configuration issues
**What to do:** Check specific failed tests and adjust config

## 🎯 Step 6: Test Different Scenarios

### Test with Verbose Output:
```powershell
# Windows
.\scripts\test-anubis.ps1 -Verbose

# Mac/Linux
./scripts/test-anubis.sh --verbose
```

### Test Local Development:
```powershell
# Windows (when running localhost:3000)
.\scripts\test-anubis.ps1 -Local

# Mac/Linux
./scripts/test-anubis.sh --local
```

### Test Custom URL:
```bash
# Mac/Linux only
./scripts/test-anubis.sh --url https://staging.example.com
```

## 🎯 Step 7: Fix Common Issues

### Issue: "Script cannot be loaded" (Windows)
**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: "Permission denied" (Mac/Linux)
**Solution:**
```bash
chmod +x scripts/test-anubis.sh
```

### Issue: All tests show "❌ FAIL Bot accessed website"
**Solution:**
1. Go to Vercel Dashboard
2. Project Settings → Environment Variables
3. Add:
   ```
   ANUBIS_ENABLED=true
   ANUBIS_DIFFICULTY=4
   ANUBIS_JWT_SECRET=your-secret-here
   ```
4. Redeploy your app
5. Run test again

## 🎯 Step 8: Verify Protection is Working

After fixing any issues, run the test again:

```powershell
# Windows
.\scripts\test-anubis.ps1

# Mac/Linux  
./scripts/test-anubis.sh
```

**Perfect result should show:**
```
📊 TEST SUMMARY
✅ Passed: 6
❌ Failed: 0
⚠️ Unknown: 0

🎉 ALL TESTS PASSED! Anubis protection is working correctly.
```

## 🎯 Step 9: Set Up Regular Testing

### Option A: Manual Testing
Run the script whenever you deploy:
```powershell
.\scripts\test-anubis.ps1
```

### Option B: Automated Testing (Advanced)
Add to your CI/CD pipeline or set up scheduled runs.

## 🆘 Need Help?

### Common Commands Reference:
```powershell
# Windows - Basic test
.\scripts\test-anubis.ps1

# Windows - Detailed output
.\scripts\test-anubis.ps1 -Verbose

# Windows - Test local development
.\scripts\test-anubis.ps1 -Local
```

```bash
# Mac/Linux - Basic test
./scripts/test-anubis.sh

# Mac/Linux - Detailed output
./scripts/test-anubis.sh --verbose

# Mac/Linux - Test local development
./scripts/test-anubis.sh --local
```

### What Each Test Checks:
1. **🤖 Scraping Bot** - Should be blocked with challenge page
2. **🐍 Python Requests** - Should be blocked with challenge page
3. **🕷️ Generic Crawler** - Should be blocked with challenge page
4. **✅ Google Bot** - Should access website normally
5. **✅ Bing Bot** - Should access website normally
6. **🌐 Regular Browser** - Should access website normally

### Expected Timeline:
- **First run:** 30-60 seconds (6 tests with rate limiting)
- **Subsequent runs:** Same timing
- **Fixing issues:** 5-10 minutes (environment variables + redeploy)

## 🎉 Success!

Once you see "🎉 ALL TESTS PASSED!", your Anubis protection is working correctly and your website is protected from bots while allowing legitimate traffic! 🐺 