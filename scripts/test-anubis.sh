#!/bin/bash

# ANUBIS PROTECTION TEST SCRIPT (Bash Version)
# Tests bot protection on production and local environments

# CONFIGURATION
URL="https://agenitix.vercel.app/"
VERBOSE=false
LOCAL=false

# PARSE ARGUMENTS
while [[ $# -gt 0 ]]; do
    case $1 in
        --local)
            LOCAL=true
            URL="http://localhost:3000/"
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --url)
            URL="$2"
            shift 2
            ;;
        *)
            echo "Unknown option $1"
            exit 1
            ;;
    esac
done

# COLORS
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}🐺 ANUBIS PROTECTION TEST SUITE${NC}"
echo -e "${YELLOW}Testing URL: $URL${NC}"
echo "=================================================="

# TEST CASES
declare -a test_names=(
    "🤖 Scraping Bot (Should be BLOCKED)"
    "🐍 Python Requests (Should be BLOCKED)" 
    "🕷️ Generic Crawler (Should be BLOCKED)"
    "✅ Google Bot (Should be ALLOWED)"
    "✅ Bing Bot (Should be ALLOWED)"
    "🌐 Regular Browser (Should be ALLOWED)"
)

declare -a user_agents=(
    "ScrapingBot/1.0"
    "Python-requests/2.28.1"
    "WebCrawler/1.0"
    "Googlebot/2.1 (+http://www.google.com/bot.html)"
    "Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)"
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
)

declare -a expected_results=(
    "Challenge"
    "Challenge"
    "Challenge"
    "Website"
    "Website"
    "Website"
)

declare -a colors=(
    "$RED"
    "$RED"
    "$RED"
    "$GREEN"
    "$GREEN"
    "$BLUE"
)

# COUNTERS
passed=0
failed=0
unknown=0

# HELPER FUNCTION
test_anubis_response() {
    local content="$1"
    local expected="$2"
    local status_code="$3"
    
    # Check if it's a challenge page
    if echo "$content" | grep -qi "challenge\|proof.*work\|anubis\|sha256\|verifying.*request" || [ "$status_code" = "429" ]; then
        is_challenge=true
    else
        is_challenge=false
    fi
    
    # Check if it's the website
    if echo "$content" | grep -qi "AgenitiX\|TALENT ACQUISITION\|testing is" && ! echo "$content" | grep -qi "challenge\|proof.*work"; then
        is_website=true
    else
        is_website=false
    fi
    
    if [ "$expected" = "Challenge" ]; then
        if [ "$is_challenge" = true ]; then
            echo "✅ PASS|Bot correctly blocked with challenge"
        elif [ "$is_website" = true ]; then
            echo "❌ FAIL|Bot accessed website (should be blocked)"
        else
            echo "⚠️ UNKNOWN|Unexpected response"
        fi
    else
        if [ "$is_website" = true ]; then
            echo "✅ PASS|Legitimate request allowed"
        elif [ "$is_challenge" = true ]; then
            echo "❌ FAIL|Legitimate request blocked (false positive)"
        else
            echo "⚠️ UNKNOWN|Unexpected response"
        fi
    fi
}

# RUN TESTS
for i in "${!test_names[@]}"; do
    echo ""
    echo -e "${colors[$i]}${test_names[$i]}${NC}"
    echo -e "${GRAY}User-Agent: ${user_agents[$i]}${NC}"
    
    # Make request
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" -H "User-Agent: ${user_agents[$i]}" "$URL" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        # Extract status code and content
        status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
        content=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
        
        # Test the response
        result=$(test_anubis_response "$content" "${expected_results[$i]}" "$status_code")
        status=$(echo "$result" | cut -d'|' -f1)
        message=$(echo "$result" | cut -d'|' -f2)
        
        # Display result with appropriate color
        if [[ "$status" == "✅"* ]]; then
            echo -e "${GREEN}$status $message${NC}"
            ((passed++))
        elif [[ "$status" == "❌"* ]]; then
            echo -e "${RED}$status $message${NC}"
            ((failed++))
        else
            echo -e "${YELLOW}$status $message${NC}"
            ((unknown++))
        fi
        
        if [ "$VERBOSE" = true ]; then
            echo -e "${GRAY}Status Code: $status_code${NC}"
            echo -e "${GRAY}Content Length: ${#content} chars${NC}"
        fi
        
    else
        echo -e "${RED}❌ ERROR: Failed to connect${NC}"
        ((failed++))
    fi
    
    sleep 0.5  # Rate limiting
done

# SUMMARY
echo ""
echo "=================================================="
echo -e "${CYAN}📊 TEST SUMMARY${NC}"

echo -e "${GREEN}✅ Passed: $passed${NC}"
echo -e "${RED}❌ Failed: $failed${NC}"
echo -e "${YELLOW}⚠️ Unknown: $unknown${NC}"

if [ $failed -eq 0 ] && [ $unknown -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! Anubis protection is working correctly.${NC}"
elif [ $failed -gt 0 ]; then
    echo -e "\n${YELLOW}⚠️ Some tests failed. Check Anubis configuration.${NC}"
else
    echo -e "\n${YELLOW}❓ Unclear results. Manual verification recommended.${NC}"
fi

echo -e "\n${CYAN}🔗 Quick Commands:${NC}"
echo -e "${GRAY}  Test Production: ./scripts/test-anubis.sh${NC}"
echo -e "${GRAY}  Test Local: ./scripts/test-anubis.sh --local${NC}"
echo -e "${GRAY}  Verbose Output: ./scripts/test-anubis.sh --verbose${NC}"
echo -e "${GRAY}  Custom URL: ./scripts/test-anubis.sh --url https://example.com${NC}" 