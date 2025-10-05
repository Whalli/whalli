#!/bin/bash

# Billing API Test Script
# Tests the billing endpoints with curl

set -e

API_URL="${API_URL:-http://localhost:3001}"
TOKEN="${TOKEN:-}"

echo "🧪 Billing API Test Script"
echo "=========================="
echo ""

if [ -z "$TOKEN" ]; then
    echo "⚠️  No authentication token provided."
    echo "   Set TOKEN environment variable or pass as argument."
    echo "   Example: ./test-billing.sh YOUR_AUTH_TOKEN"
    echo ""
    echo "   For testing without auth, we'll test public endpoints only."
    echo ""
fi

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counter
TESTS_RUN=0
TESTS_PASSED=0

# Helper function to run test
run_test() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local auth=$5
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    echo -e "${BLUE}Test $TESTS_RUN: $name${NC}"
    
    local curl_cmd="curl -s -X $method"
    
    if [ -n "$auth" ] && [ -n "$TOKEN" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $TOKEN'"
    fi
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    curl_cmd="$curl_cmd $API_URL$endpoint"
    
    echo "  Request: $method $endpoint"
    
    local response=$(eval $curl_cmd)
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo -e "  ${GREEN}✓ Response received${NC}"
        echo "  Response: $response" | head -c 200
        if [ ${#response} -gt 200 ]; then
            echo "..."
        fi
        echo ""
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "  ${RED}✗ Request failed${NC}"
    fi
    
    echo ""
}

# Test 1: Get available plans (public endpoint)
run_test "Get Available Plans" \
    "GET" \
    "/billing/plans" \
    "" \
    ""

# If token is provided, run authenticated tests
if [ -n "$TOKEN" ]; then
    echo "🔐 Running authenticated tests..."
    echo ""
    
    # Test 2: Get current user's subscription
    run_test "Get Current User's Subscription" \
        "GET" \
        "/billing/subscriptions/me" \
        "" \
        "yes"
    
    # Test 3: Create subscription (might fail if already exists)
    run_test "Create Subscription" \
        "POST" \
        "/billing/subscriptions" \
        '{"plan":"BASIC","trialPeriodDays":14}' \
        "yes"
    
    # Test 4: Create checkout session
    run_test "Create Checkout Session" \
        "POST" \
        "/billing/checkout" \
        '{"plan":"PRO","successUrl":"http://localhost:3000/success","cancelUrl":"http://localhost:3000/pricing"}' \
        "yes"
    
    # Test 5: Create portal session (might fail if no customer)
    run_test "Create Portal Session" \
        "POST" \
        "/billing/portal" \
        '{"returnUrl":"http://localhost:3000/settings"}' \
        "yes"
else
    echo "⏭️  Skipping authenticated tests (no token provided)"
    echo ""
fi

# Summary
echo "=========================="
echo "📊 Test Summary"
echo "=========================="
echo "Tests run: $TESTS_RUN"
echo "Tests passed: $TESTS_PASSED"
echo ""

if [ $TESTS_PASSED -eq $TESTS_RUN ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo -e "${RED}❌ Some tests failed${NC}"
fi

echo ""
echo "💡 Tips:"
echo "   - Make sure the API is running: pnpm --filter=@whalli/api start:dev"
echo "   - Get a token by logging in to your app"
echo "   - Configure Stripe keys in .env for full functionality"
echo "   - Use Stripe test mode for development"
echo ""
