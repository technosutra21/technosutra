#!/usr/bin/env python3
"""Generate models.json from USDZ files."""
import json
import os
import sys
from pathlib import Path

try:
    models_dir = "docs/test-ios/models"
    models = []
    
    if not os.path.exists(models_dir):
        print(f"ERROR: Directory {models_dir} does not exist")
        sys.exit(1)
    
    for usdz_file in sorted(os.listdir(models_dir)):
        if usdz_file.endswith('.usdz'):
            filepath = os.path.join(models_dir, usdz_file)
            try:
                size_mb = os.path.getsize(filepath) / (1024 * 1024)
                models.append({
                    "name": Path(usdz_file).stem,
                    "file": usdz_file,
                    "size_mb": round(size_mb, 2),
                    "path": f"./models/{usdz_file}"
                })
            except OSError as e:
                print(f"WARNING: Could not read {filepath}: {e}")
    
    if not models:
        print(f"ERROR: No USDZ files found in {models_dir}")
        sys.exit(1)
    
    output = "docs/test-ios/models.json"
    with open(output, 'w') as f:
        json.dump({"models": models, "count": len(models), "generated": True}, f, indent=2)
    
    print(f"✓ Generated {output} with {len(models)} models")
    sys.exit(0)
    
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
