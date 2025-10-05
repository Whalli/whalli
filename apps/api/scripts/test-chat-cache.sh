#!/bin/bash

# Chat Cache System - Manual Testing Guide
# Run these commands to verify the cache system is working correctly

echo "=================================="
echo "Chat Cache System - Testing Guide"
echo "=================================="
echo ""

# Check if Redis is running
echo "1. Checking Redis connection..."
redis-cli ping > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Redis is running"
else
    echo "   ❌ Redis is NOT running. Please start Redis first:"
    echo "      docker run -d -p 6379:6379 redis:7-alpine"
    exit 1
fi
echo ""

# Check existing cache entries
echo "2. Checking existing cache entries..."
CACHE_COUNT=$(redis-cli KEYS "chat:cache:*" | wc -l)
echo "   Current cache entries: $CACHE_COUNT"
echo ""

# Clear cache for clean test
echo "3. Clearing existing cache for clean test..."
redis-cli --scan --pattern "chat:cache:*" | xargs -L 1 redis-cli DEL > /dev/null 2>&1
echo "   ✅ Cache cleared"
echo ""

# Test cache operations
echo "4. Testing cache key generation..."
echo "   Example key for 'gpt-4:What is AI?':"
echo "   chat:cache:$(echo -n 'gpt-4:What is AI?' | sha256sum | cut -d' ' -f1)"
echo ""

echo "5. Simulating cache operations..."
echo ""

# Set a test cache entry
TEST_KEY="chat:cache:test123"
TEST_VALUE="This is a test cached response"
echo "   Setting test cache entry..."
redis-cli SETEX "$TEST_KEY" 3600 "$TEST_VALUE" > /dev/null
echo "   ✅ Cache entry created with 1h TTL"
echo ""

# Get the cache entry
echo "   Retrieving test cache entry..."
RETRIEVED=$(redis-cli GET "$TEST_KEY")
if [ "$RETRIEVED" == "$TEST_VALUE" ]; then
    echo "   ✅ Cache retrieval successful"
else
    echo "   ❌ Cache retrieval failed"
fi
echo ""

# Check TTL
echo "   Checking TTL..."
TTL=$(redis-cli TTL "$TEST_KEY")
echo "   Remaining TTL: ${TTL}s (should be ~3600)"
echo ""

# Delete test entry
echo "   Cleaning up test entry..."
redis-cli DEL "$TEST_KEY" > /dev/null
echo "   ✅ Test entry deleted"
echo ""

echo "6. Real-world test scenario..."
echo ""
echo "   To test with actual API:"
echo "   1. Start the API: cd apps/api && pnpm dev"
echo "   2. Send a chat request:"
echo ""
echo "      curl -X POST http://localhost:3001/api/chat/stream \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "        -d '{\"modelId\":\"gpt-4-turbo\",\"prompt\":\"What is AI?\"}'"
echo ""
echo "   3. Send the SAME request again"
echo "   4. Check logs for 'Cache HIT' message"
echo "   5. Verify response is much faster (100ms vs 2500ms)"
echo ""

echo "7. Monitoring cache..."
echo ""
echo "   List all cache keys:"
echo "   $ redis-cli KEYS 'chat:cache:*'"
echo ""
echo "   Count cache entries:"
echo "   $ redis-cli KEYS 'chat:cache:*' | wc -l"
echo ""
echo "   View specific cache entry:"
echo "   $ redis-cli GET chat:cache:YOUR_KEY_HERE"
echo ""
echo "   Check memory usage:"
echo "   $ redis-cli INFO memory | grep used_memory_human"
echo ""
echo "   Monitor operations in real-time:"
echo "   $ redis-cli MONITOR"
echo ""

echo "8. Cache statistics..."
TOTAL_KEYS=$(redis-cli DBSIZE)
CACHE_KEYS=$(redis-cli KEYS "chat:cache:*" | wc -l)
MEMORY_USED=$(redis-cli INFO memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
echo "   Total Redis keys: $TOTAL_KEYS"
echo "   Chat cache keys: $CACHE_KEYS"
echo "   Memory used: $MEMORY_USED"
echo ""

echo "=================================="
echo "✅ All tests completed!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Start the API and make some chat requests"
echo "2. Watch API logs for 'Cache HIT' messages"
echo "3. Monitor Redis with: redis-cli MONITOR"
echo "4. Check cache stats: redis-cli KEYS 'chat:cache:*'"
echo ""
echo "For detailed documentation, see:"
echo "  - apps/api/CHAT_CACHE_SYSTEM.md"
echo "  - apps/api/CHAT_CACHE_SUMMARY.md"
echo "  - apps/api/CHAT_CACHE_DIAGRAMS.md"
