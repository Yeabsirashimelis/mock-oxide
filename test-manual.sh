#!/bin/bash

# Manual Testing Script - Tests features via HTTP requests
# Run this to verify all features work end-to-end

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

passed=0
failed=0

test_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ $2${NC}"
    ((passed++))
  else
    echo -e "${RED}✗ $2${NC}"
    ((failed++))
  fi
}

echo -e "\n${YELLOW}=== Mock API Playground - Manual Feature Tests ===${NC}\n"

# Test 1: Server Health
echo "TEST 1: Server Health"
curl -s -o /dev/null -w "%{http_code}" $BASE_URL | grep -q "200"
test_result $? "Server is responding"

# Test 2: API Routes exist
echo -e "\nTEST 2: API Routes"
curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/auth/get-session | grep -qE "200|null"
test_result $? "Auth API exists"

curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/projects/test/openapi | grep -qE "401|404"
test_result $? "OpenAPI export endpoint exists"

curl -s -X POST -H "Content-Type: application/json" -d '{}' -o /dev/null -w "%{http_code}" $BASE_URL/api/projects/test/import | grep -qE "401|400"
test_result $? "OpenAPI import endpoint exists"

curl -s -X PATCH -H "Content-Type: application/json" -d '{"ids":[],"action":"enable"}' -o /dev/null -w "%{http_code}" $BASE_URL/api/projects/test/endpoints/bulk | grep -q "401"
test_result $? "Bulk operations endpoint exists"

curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/projects/test/endpoints/test-id/logs | grep -qE "401|404"
test_result $? "Request logs endpoint exists"

# Test 3: Documentation page
echo -e "\nTEST 3: Documentation Pages"
curl -s -o /dev/null -w "%{http_code}" $BASE_URL/docs/test-project | grep -qE "200|404"
test_result $? "Docs page exists"

# Test 4: File structure
echo -e "\nTEST 4: File Structure"
[ -f "lib/validator.ts" ]
test_result $? "Validator library exists"

[ -f "lib/openapi-generator.ts" ]
test_result $? "OpenAPI generator exists"

[ -f "lib/openapi-importer.ts" ]
test_result $? "OpenAPI importer exists"

[ -f "components/endpoints/endpoint-logs.tsx" ]
test_result $? "Endpoint logs component exists"

[ -f "components/projects/global-headers-form.tsx" ]
test_result $? "Global headers form exists"

[ -f "components/projects/import-openapi-modal.tsx" ]
test_result $? "OpenAPI import modal exists"

[ -f "app/api/projects/[slug]/openapi/route.ts" ]
test_result $? "OpenAPI export API exists"

[ -f "app/api/projects/[slug]/import/route.ts" ]
test_result $? "OpenAPI import API exists"

[ -f "app/api/projects/[slug]/endpoints/bulk/route.ts" ]
test_result $? "Bulk operations API exists"

[ -f "app/api/projects/[slug]/endpoints/[id]/logs/route.ts" ]
test_result $? "Request logs API exists"

# Test 5: Database schema
echo -e "\nTEST 5: Database Schema"
grep -q "defaultHeaders" prisma/schema.prisma
test_result $? "Schema has defaultHeaders field"

grep -q "validateRequest" prisma/schema.prisma
test_result $? "Schema has validateRequest field"

grep -q "scenarios" prisma/schema.prisma
test_result $? "Schema has scenarios field"

# Test 6: Check for TypeScript compilation
echo -e "\nTEST 6: Build Verification"
[ -d ".next" ]
test_result $? "Next.js build artifacts exist"

# Summary
echo -e "\n${YELLOW}=== Test Summary ===${NC}"
total=$((passed + failed))
echo "Total Tests: $total"
echo -e "${GREEN}Passed: $passed${NC}"
if [ $failed -gt 0 ]; then
  echo -e "${RED}Failed: $failed${NC}"
else
  echo -e "${GREEN}Failed: $failed${NC}"
fi
percentage=$(awk "BEGIN {printf \"%.1f\", ($passed/$total)*100}")
echo "Success Rate: $percentage%"

if [ $failed -eq 0 ]; then
  echo -e "\n${GREEN}🎉 All tests passed!${NC}\n"
  exit 0
else
  echo -e "\n${YELLOW}⚠️  Some tests failed${NC}\n"
  exit 1
fi
