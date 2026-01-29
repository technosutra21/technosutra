#!/usr/bin/env python3
"""Generate models.json from GLB files in the models directory."""
import json
import os
from pathlib import Path

def generate_models_json():
    """Generate models.json from available GLB files."""
    models_dir = Path("models")
    
    if not models_dir.exists():
        print(f"ERROR: Directory {models_dir} does not exist")
        return False
    
    # Find all GLB files
    glb_files = sorted(models_dir.glob("*.glb"))
    
    if not glb_files:
        print(f"ERROR: No GLB files found in {models_dir}")
        return False
    
    models = []
    for glb_file in glb_files:
        try:
            # Extract model number from filename (e.g., modelo1.glb -> 1)
            filename = glb_file.name
            if filename.startswith("modelo") and filename.endswith(".glb"):
                model_num = filename.replace("modelo", "").replace(".glb", "")
                try:
                    model_id = int(model_num)
                except ValueError:
                    continue
                
                size_bytes = glb_file.stat().st_size
                size_mb = size_bytes / (1024 * 1024)
                
                models.append({
                    "id": model_id,
                    "filename": filename,
                    "path": f"./models/{filename}",
                    "size_mb": round(size_mb, 2),
                    "available": True
                })
        except Exception as e:
            print(f"WARNING: Could not process {glb_file}: {e}")
    
    # Sort by model ID
    models.sort(key=lambda x: x["id"])
    
    output_data = {
        "models": models,
        "count": len(models),
        "generated": True
    }
    
    output_file = models_dir / "models.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Generated {output_file} with {len(models)} models")
    print(f"  Available model IDs: {sorted([m['id'] for m in models])}")
    return True

if __name__ == "__main__":
    import sys
    success = generate_models_json()
    sys.exit(0 if success else 1)
