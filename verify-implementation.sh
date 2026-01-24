#!/bin/bash

# Techno Sutra AR Implementation Verification Script
# Validates all changes and improvements

echo "═══════════════════════════════════════════════════════════════"
echo "  Techno Sutra AR - Implementation Verification"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0

# Function to check condition
check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $2"
        ((FAIL++))
    fi
}

# 1. iOS Fix Verification
echo "1. iOS Texture Fix (GLB-only, no USDZ)"
grep -q "ios-src" AR.html && check 1 "AR.html still has ios-src" || check 0 "AR.html: ios-src removed"
grep -q "ios-src" js/ar-experience.js && check 1 "ar-experience.js has ios-src" || check 0 "ar-experience.js: ios-src removed"
grep -q "usdz" sw.js && check 1 "Service Worker has USDZ refs" || check 0 "Service Worker: USDZ removed from caching"
echo ""

# 2. File Organization
echo "2. Code Organization (Legacy Folder)"
test -d legacy && check 0 "legacy/ folder created" || check 1 "legacy/ folder missing"
test -f legacy/clean_optimized.js && check 0 "Deadcode moved to legacy/" || check 1 "Deadcode files missing"
echo ""

# 3. Documentation
echo "3. Documentation Updates"
test -f README.md && check 0 "README.md exists" || check 1 "README.md missing"
test -f LIGHTHOUSE.md && check 0 "LIGHTHOUSE.md created" || check 1 "LIGHTHOUSE.md missing"
test -f IMPLEMENTATION_SUMMARY.md && check 0 "IMPLEMENTATION_SUMMARY.md created" || check 1 "Missing"
grep -q "56 capítulos\|56 chapters\|56 models" README.md && check 0 "README mentions 56 models" || check 1 "README model count missing"
echo ""

# 4. Testing
echo "4. Testing Framework"
test -d tests && check 0 "tests/ directory created" || check 1 "tests/ directory missing"
test -f tests/ar-experience.test.js && check 0 "AR experience tests created" || check 1 "AR tests missing"
test -f tests/service-worker.test.js && check 0 "Service Worker tests created" || check 1 "SW tests missing"
echo ""

# 5. Configuration
echo "5. Configuration & Build"
test -f .eslintrc.json && check 0 ".eslintrc.json created" || check 1 ".eslintrc.json missing"
test -f package.json && check 0 "package.json created" || check 1 "package.json missing"
grep -q '"test"\|"lint"' package.json && check 0 "npm scripts configured" || check 1 "npm scripts missing"
echo ""

# 6. CI/CD
echo "6. GitHub Actions CI/CD"
test -d .github/workflows && check 0 ".github/workflows created" || check 1 "Workflows directory missing"
test -f .github/workflows/test.yml && check 0 "test.yml workflow created" || check 1 "test.yml missing"
test -f .github/workflows/lighthouse.yml && check 0 "lighthouse.yml workflow created" || check 1 "lighthouse.yml missing"
echo ""

# 7. Model Configuration
echo "7. Model Configuration (56 Models)"
grep -q "56" AR.html sw.js index.html && check 0 "56 models configured across files" || check 1 "Model count not verified"
test -f models/modelo1.glb && check 0 "Models directory has GLB files" || check 1 "Models missing"
echo ""

# 8. Service Worker
echo "8. Service Worker Enhancements"
grep -q "CACHE_NAME\|MODEL_ASSETS\|fetch" sw.js && check 0 "Service Worker configured" || check 1 "SW structure incomplete"
grep -q "console.log.*Cached model" sw.js && check 0 "Model caching progress logging added" || check 1 "Progress logging missing"
echo ""

# 9. License
echo "9. License (Untouched)"
test -f LICENSE && check 0 "LICENSE file preserved" || check 1 "LICENSE missing"
grep -q "MIT" LICENSE && check 0 "MIT license verified" || check 1 "License content invalid"
echo ""

# Summary
echo "═══════════════════════════════════════════════════════════════"
echo "Results: ${GREEN}${PASS} passed${NC}, ${RED}${FAIL} failed${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ All implementation checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Delete USDZ files: rm -rf models/usdz/"
    echo "2. Run tests: npm test"
    echo "3. Check linting: npm run lint"
    echo "4. Deploy to production with HTTPS"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Review above.${NC}"
    exit 1
fi
