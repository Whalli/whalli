#!/bin/bash

# File Upload Testing Script
# Usage: ./test-upload.sh <session-token>

set -e

TOKEN=${1:-""}
API_URL="http://localhost:3001"

if [ -z "$TOKEN" ]; then
  echo "Error: Session token required"
  echo "Usage: ./test-upload.sh <session-token>"
  exit 1
fi

echo "🚀 Testing File Upload API"
echo "=========================="
echo ""

# Create test files
echo "📝 Creating test files..."
echo "This is a test PDF" > test.pdf
echo "PNG test content" > test.png
dd if=/dev/zero of=large.pdf bs=1M count=15 2>/dev/null

echo "✅ Test files created"
echo ""

# Test 1: Upload valid PDF
echo "Test 1: Upload valid PDF file"
echo "------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL/api/files/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf")

echo "$RESPONSE" | jq '.'
URL=$(echo "$RESPONSE" | jq -r '.url')

if [ "$URL" != "null" ]; then
  echo "✅ PDF upload successful: $URL"
else
  echo "❌ PDF upload failed"
fi
echo ""

# Test 2: Upload valid image
echo "Test 2: Upload valid PNG file"
echo "------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL/api/files/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.png")

echo "$RESPONSE" | jq '.'
URL=$(echo "$RESPONSE" | jq -r '.url')

if [ "$URL" != "null" ]; then
  echo "✅ PNG upload successful: $URL"
else
  echo "❌ PNG upload failed"
fi
echo ""

# Test 3: Upload oversized file (should fail)
echo "Test 3: Upload oversized file (should fail)"
echo "-------------------------------------------"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/api/files/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@large.pdf")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

echo "$BODY" | jq '.'

if [ "$HTTP_CODE" = "400" ]; then
  echo "✅ Correctly rejected oversized file (HTTP 400)"
else
  echo "❌ Should have rejected oversized file"
fi
echo ""

# Test 4: Upload without authentication (should fail)
echo "Test 4: Upload without authentication (should fail)"
echo "--------------------------------------------------"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/api/files/upload" \
  -F "file=@test.pdf")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

echo "$BODY" | jq '.'

if [ "$HTTP_CODE" = "401" ]; then
  echo "✅ Correctly rejected unauthenticated request (HTTP 401)"
else
  echo "❌ Should have rejected unauthenticated request"
fi
echo ""

# Cleanup
echo "🧹 Cleaning up test files..."
rm -f test.pdf test.png large.pdf

echo ""
echo "✅ All tests completed!"
echo ""
echo "Next steps:"
echo "1. Check MinIO Console: http://localhost:9001"
echo "2. Browse bucket: whalli-uploads"
echo "3. Verify uploaded files are accessible"
