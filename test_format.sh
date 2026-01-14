#!/bin/bash

# Test 1: Direct path format (used by httpBatchLink)
echo "Test 1: Direct path format"
curl -s -X POST 'http://localhost:3000/api/trpc/ownerAuth.login' \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' | python3 -m json.tool 2>/dev/null | head -20

echo -e "\n\nTest 2: Check if the endpoint exists"
curl -s -X OPTIONS 'http://localhost:3000/api/trpc/ownerAuth.login' -v 2>&1 | grep -E "HTTP|Allow"
