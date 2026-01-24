#!/bin/bash
set -e

echo "🧪 Testing workflow steps locally..."

# Setup
mkdir -p /tmp/test-workflow
cd /tmp/test-workflow

# Simulate conversion  
mkdir -p models/usdz
for i in {1..5}; do
  dd if=/dev/urandom of="models/usdz/test-$i.usdz" bs=1M count=1 2>/dev/null
done

echo "✓ Created mock USDZ files"

# Test: Verify USDZ conversion output
echo ""
echo "--- Testing: Verify USDZ conversion output ---"
usdz_count=$(find models/usdz -name "*.usdz" 2>/dev/null | wc -l)
[ $usdz_count -eq 0 ] && { echo "❌ No USDZ files created"; exit 1; }

echo "✓ Created: $usdz_count USDZ files"
ls -lh models/usdz/*.usdz | awk '{printf "  %-40s %8s\n", $9, $5}'

# Test: Create docs directory structure
echo ""
echo "--- Testing: Create docs directory structure ---"
mkdir -p docs/test-ios/models

if [ ! -d "models/usdz" ]; then
  echo "❌ models/usdz directory doesn't exist"
  exit 1
fi

usdz_count=$(find models/usdz -name "*.usdz" 2>/dev/null | wc -l)
if [ "$usdz_count" -eq 0 ]; then
  echo "❌ No USDZ files found in models/usdz"
  exit 1
fi

echo "Copying $usdz_count USDZ files..."
cp models/usdz/*.usdz docs/test-ios/models/ || { echo "❌ Failed to copy USDZ files"; exit 1; }

touch docs/.nojekyll
touch docs/test-ios/.nojekyll
echo "✓ Docs structure created"

# Test: Generate model inventory JSON
echo ""
echo "--- Testing: Generate model inventory JSON ---"
[ ! -d "docs/test-ios/models" ] && { echo "❌ models directory not found"; exit 1; }

python3 << 'PYSCRIPT'
import json
import os
from pathlib import Path

models_dir = "docs/test-ios/models"
models = []

if os.path.exists(models_dir):
    for usdz_file in sorted(os.listdir(models_dir)):
        if usdz_file.endswith('.usdz'):
            size_mb = os.path.getsize(os.path.join(models_dir, usdz_file)) / (1024 * 1024)
            models.append({
                "name": Path(usdz_file).stem,
                "file": usdz_file,
                "size_mb": round(size_mb, 2),
                "path": f"./models/{usdz_file}"
            })

output = "docs/test-ios/models.json"
with open(output, 'w') as f:
    json.dump({"models": models, "count": len(models), "generated": True}, f, indent=2)

print(f"✓ Generated {output} with {len(models)} models")
PYSCRIPT

# Test: Create test-ios HTML viewer
echo ""
echo "--- Testing: Create test-ios HTML viewer ---"
cat > docs/test-ios/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Test</title>
</head>
<body>
    <h1>USDZ Models</h1>
    <p id="info">Models loaded</p>
    <script>
        fetch('./models.json')
            .then(r => r.json())
            .then(data => {
                document.getElementById('info').textContent = `Loaded ${data.count} models`;
            })
            .catch(e => console.error('Error:', e));
    </script>
</body>
</html>
HTMLEOF
echo "✓ Created index.html"

# Test: Create README
echo ""
echo "--- Testing: Create README ---"
cat > docs/test-ios/README.md << 'MDEOF'
# Test Results
Successfully created test documentation.
MDEOF
echo "✓ Created README.md"

# Verify final structure
echo ""
echo "=== Final Structure ==="
find docs -type f 2>/dev/null
echo ""
echo "=== Files in docs/test-ios/models ==="
ls -lh docs/test-ios/models/

echo ""
echo "✅ All workflow steps passed locally!"
