#!/bin/bash
# CISO Security Assessment API - Example Commands

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:8000"

echo -e "${GREEN}=== CISO Security Assessment API Examples ===${NC}\n"

# 1. Health Check
echo -e "${YELLOW}1. Health Check${NC}"
echo "curl -X GET $API_URL/health"
curl -X GET $API_URL/health
echo -e "\n"

# 2. Simple Assessment (non-streaming)
echo -e "${YELLOW}2. Simple Assessment (non-streaming)${NC}"
echo 'curl -X POST "$API_URL/assess" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d "{\"product\": \"Slack\"}"'
curl -X POST "$API_URL/assess" \
  -H "Content-Type: application/json" \
  -d '{"product": "Slack"}'
echo -e "\n"

# 3. Assessment with Version
echo -e "${YELLOW}3. Assessment with Version${NC}"
echo 'curl -X POST "$API_URL/assess" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d "{\"product\": \"Zoom\", \"version\": \"5.14.5\"}"'
curl -X POST "$API_URL/assess" \
  -H "Content-Type: application/json" \
  -d '{"product": "Zoom", "version": "5.14.5"}'
echo -e "\n"

# 4. Assessment with URL
echo -e "${YELLOW}4. Assessment with URL${NC}"
echo 'curl -X POST "$API_URL/assess" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d "{\"url\": \"https://slack.com\"}"'
curl -X POST "$API_URL/assess" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://slack.com"}'
echo -e "\n"

# 5. Streaming Assessment
echo -e "${YELLOW}5. Streaming Assessment (Server-Sent Events)${NC}"
echo 'curl -N -X POST "$API_URL/assess/stream" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d "{\"product\": \"Slack\"}"'
echo -e "${GREEN}Note: Add -N flag for streaming, output will show real-time progress${NC}"
# Uncomment to run (will stream for 30-60 seconds):
# curl -N -X POST "$API_URL/assess/stream" \
#   -H "Content-Type: application/json" \
#   -d '{"product": "Slack"}'
echo -e "\n"

# 6. Disable Cache
echo -e "${YELLOW}6. Assessment with Cache Disabled${NC}"
echo 'curl -X POST "$API_URL/assess" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d "{\"product\": \"GitHub\", \"no_cache\": true}"'
curl -X POST "$API_URL/assess" \
  -H "Content-Type: application/json" \
  -d '{"product": "GitHub", "no_cache": true}'
echo -e "\n"

# 7. Multiple Inputs
echo -e "${YELLOW}7. Assessment with Multiple Inputs (Better Accuracy)${NC}"
echo 'curl -X POST "$API_URL/assess" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d "{\"product\": \"Slack\", \"vendor\": \"Salesforce\", \"url\": \"https://slack.com\"}"'
curl -X POST "$API_URL/assess" \
  -H "Content-Type: application/json" \
  -d '{"product": "Slack", "vendor": "Salesforce", "url": "https://slack.com"}'
echo -e "\n"

# 8. Save Response to File
echo -e "${YELLOW}8. Save Assessment to File${NC}"
echo 'curl -X POST "$API_URL/assess" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d "{\"product\": \"Dropbox\"}" \'
echo '  -o assessment_dropbox.json'
curl -X POST "$API_URL/assess" \
  -H "Content-Type: application/json" \
  -d '{"product": "Dropbox"}' \
  -o assessment_dropbox.json
echo -e "\n${GREEN}Saved to: assessment_dropbox.json${NC}\n"

echo -e "${GREEN}=== Examples Complete ===${NC}"
echo -e "\nFor more examples, see API_USAGE.md"
echo -e "For interactive docs, visit: ${API_URL}/docs"

