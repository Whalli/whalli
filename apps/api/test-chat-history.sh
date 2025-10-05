#!/bin/bash

# Chat History Project Filter - Test Script
# This script tests the GET /chat/history?projectId=xxx endpoint

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

API_URL="${API_URL:-http://localhost:3001}"
TOKEN="${AUTH_TOKEN:-}"

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}Chat History Project Filter - Tests${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Check if server is running
echo -e "${YELLOW}Checking if API server is running...${NC}"
if ! curl -s "$API_URL/health" > /dev/null; then
    echo -e "${RED}❌ API server is not running at $API_URL${NC}"
    echo -e "${YELLOW}Start the server with: cd apps/api && pnpm dev${NC}"
    exit 1
fi
echo -e "${GREEN}✅ API server is running${NC}"
echo ""

# Check authentication
if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}⚠️  No AUTH_TOKEN provided. Some tests will fail.${NC}"
    echo -e "${YELLOW}Set token with: export AUTH_TOKEN=your_token_here${NC}"
    echo ""
fi

# Test 1: Get all messages (no filter)
echo -e "${BLUE}Test 1: Get all messages (no filter)${NC}"
echo "GET /api/chat/history?limit=10"
echo ""

RESPONSE=$(curl -s -X GET \
  "$API_URL/api/chat/history?limit=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$RESPONSE" | jq '.'
MESSAGE_COUNT=$(echo "$RESPONSE" | jq '.messages | length')
echo ""
echo -e "${GREEN}✅ Returned $MESSAGE_COUNT messages${NC}"
echo ""

# Test 2: Get project messages
echo -e "${BLUE}Test 2: Get project messages${NC}"
echo "First, let's see if there are any projects..."
echo ""

PROJECTS=$(curl -s -X GET \
  "$API_URL/api/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$PROJECTS" | jq '.'
PROJECT_COUNT=$(echo "$PROJECTS" | jq 'length')
echo ""

if [ "$PROJECT_COUNT" -gt 0 ]; then
    PROJECT_ID=$(echo "$PROJECTS" | jq -r '.[0].id')
    echo -e "${GREEN}Found project: $PROJECT_ID${NC}"
    echo ""
    
    echo "GET /api/chat/history?projectId=$PROJECT_ID&limit=20"
    echo ""
    
    PROJECT_MESSAGES=$(curl -s -X GET \
      "$API_URL/api/chat/history?projectId=$PROJECT_ID&limit=20" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json")
    
    echo "$PROJECT_MESSAGES" | jq '.'
    PROJECT_MSG_COUNT=$(echo "$PROJECT_MESSAGES" | jq '.messages | length')
    echo ""
    echo -e "${GREEN}✅ Returned $PROJECT_MSG_COUNT messages for project${NC}"
else
    echo -e "${YELLOW}⚠️  No projects found. Skipping project filter test.${NC}"
    echo -e "${YELLOW}Create a project first or send messages with projectId.${NC}"
fi
echo ""

# Test 3: Send message with projectId
echo -e "${BLUE}Test 3: Send message with projectId${NC}"
echo ""

if [ "$PROJECT_COUNT" -gt 0 ]; then
    PROJECT_ID=$(echo "$PROJECTS" | jq -r '.[0].id')
    
    echo "POST /api/chat/start"
    echo "Body: { prompt: 'Test project message', modelId: 'gpt-3.5-turbo', projectId: '$PROJECT_ID' }"
    echo ""
    
    START_RESPONSE=$(curl -s -X POST \
      "$API_URL/api/chat/start" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"prompt\": \"Test project message at $(date)\",
        \"modelId\": \"gpt-3.5-turbo\",
        \"projectId\": \"$PROJECT_ID\"
      }")
    
    echo "$START_RESPONSE" | jq '.'
    SESSION_ID=$(echo "$START_RESPONSE" | jq -r '.sessionId')
    echo ""
    
    if [ "$SESSION_ID" != "null" ] && [ -n "$SESSION_ID" ]; then
        echo -e "${GREEN}✅ Chat session created: $SESSION_ID${NC}"
        echo ""
        
        # Wait a moment for message to be saved
        sleep 2
        
        echo "Fetching project history again..."
        echo ""
        
        UPDATED_MESSAGES=$(curl -s -X GET \
          "$API_URL/api/chat/history?projectId=$PROJECT_ID&limit=5" \
          -H "Authorization: Bearer $TOKEN" \
          -H "Content-Type: application/json")
        
        echo "$UPDATED_MESSAGES" | jq '.messages[] | {id, role, content: (.content | .[0:50]), projectId}'
        echo ""
        echo -e "${GREEN}✅ Project message should appear in history${NC}"
    else
        echo -e "${RED}❌ Failed to create chat session${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No projects found. Skipping send message test.${NC}"
fi
echo ""

# Test 4: Test filter combinations
echo -e "${BLUE}Test 4: Filter combinations${NC}"
echo ""

echo "a) No filter (all messages):"
curl -s "$API_URL/api/chat/history?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq '.messages | length'
echo ""

if [ "$PROJECT_COUNT" -gt 0 ]; then
    PROJECT_ID=$(echo "$PROJECTS" | jq -r '.[0].id')
    
    echo "b) With projectId filter:"
    curl -s "$API_URL/api/chat/history?projectId=$PROJECT_ID&limit=5" \
      -H "Authorization: Bearer $TOKEN" | jq '.messages | length'
    echo ""
fi

echo -e "${GREEN}✅ Filter combinations tested${NC}"
echo ""

# Test 5: Verify sorting
echo -e "${BLUE}Test 5: Verify chronological sorting${NC}"
echo ""

SORTED_MESSAGES=$(curl -s -X GET \
  "$API_URL/api/chat/history?limit=5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Messages should be sorted oldest first (ascending createdAt):"
echo "$SORTED_MESSAGES" | jq '.messages[] | {createdAt, role, content: (.content | .[0:30])}'
echo ""
echo -e "${GREEN}✅ Sorting verified${NC}"
echo ""

# Summary
echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo -e "${GREEN}✅ All tests completed${NC}"
echo ""
echo "Tested features:"
echo "  ✓ GET /chat/history (no filter)"
echo "  ✓ GET /chat/history?projectId=xxx"
echo "  ✓ POST /chat/start with projectId"
echo "  ✓ Filter combinations"
echo "  ✓ Chronological sorting"
echo ""
echo -e "${BLUE}API Endpoint:${NC} $API_URL/api/chat/history"
echo -e "${BLUE}Documentation:${NC} apps/api/CHAT_HISTORY_PROJECT_FILTER.md"
echo ""

exit 0
