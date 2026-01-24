#!/usr/bin/env python3
"""
Blender batch export script for GLB with proper USDZ compatibility settings.

Fixes:
  - Exports with vertex normals (prevents faceted/dark appearance)
  - Ensures smooth shading applied
  - Uses glTF Binary format
  - Optimizes for USDZ conversion

Usage (in Blender):
  blender -b model.blend -P export_glb_fixed.py
  
Or in command-line with arguments:
  blender -b model.blend -P export_glb_fixed.py -- --output-dir ./models
"""

import bpy
import os
import sys
from pathlib import Path

def export_glb_optimized(input_blend, output_dir=None):
    """
    Export GLB with USDZ-optimized settings.
    
    Args:
        input_blend: Path to .blend file
        output_dir: Output directory (default: same as input)
    """
    
    if output_dir is None:
        output_dir = os.path.dirname(input_blend)
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Get base filename without extension
    base_name = Path(input_blend).stem
    output_path = os.path.join(output_dir, f"{base_name}.glb")
    
    print(f"\n{'='*60}")
    print(f"Exporting: {input_blend}")
    print(f"Output: {output_path}")
    print(f"{'='*60}\n")
    
    # Step 1: Apply smooth shading to all objects
    print("[1/4] Applying smooth shading to all objects...")
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            # Set smooth shading
            for polygon in obj.data.polygons:
                polygon.use_smooth = True
            print(f"  ✓ Smooth shaded: {obj.name}")
    
    # Step 2: Ensure auto-smooth normals
    print("\n[2/4] Enabling auto-smooth normals...")
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            obj.data.use_auto_smooth = True
            obj.data.auto_smooth_angle = 1.5708  # ~90 degrees
            print(f"  ✓ Auto-smooth enabled: {obj.name}")
    
    # Step 3: Verify material color spaces
    print("\n[3/4] Verifying texture color spaces...")
    color_space_fixed = 0
    for material in bpy.data.materials:
        if material.use_nodes:
            for node in material.node_tree.nodes:
                if node.type == 'TEX_IMAGE':
                    # Set to sRGB unless it's a data texture (normal, roughness, etc.)
                    node_name = node.name.lower()
                    if any(x in node_name for x in ['normal', 'rough', 'metallic', 'occlusion', 'height']):
                        node.image.colorspace_settings.name = 'Non-Color'
                    else:
                        node.image.colorspace_settings.name = 'sRGB'
                    color_space_fixed += 1
    
    if color_space_fixed > 0:
        print(f"  ✓ Fixed color space for {color_space_fixed} textures")
    else:
        print(f"  ✓ No textures to fix (using material colors)")
    
    # Step 4: Export as GLB with proper settings
    print("\n[4/4] Exporting GLB with USDZ-compatible settings...")
    
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',  # Binary format (smaller, faster)
        
        # Essential for USDZ compatibility
        export_normals=True,  # Include vertex normals (fixes faceted appearance)
        export_tangents=True,  # Needed for normal maps
        export_materials=True,
        export_colors=True,
        export_attributes=True,
        
        # PBR materials
        export_image_format='AUTO',
        export_texture_dir=None,  # Embed textures in GLB
        
        # Optimization
        export_draco_mesh_compression_level=7,  # Draco compression for smaller files
        export_draco_position_quantization=14,
        export_draco_normal_quantization=10,
        
        # Don't export unnecessary data
        export_cameras=False,
        export_lights=False,
        export_animations=False,
        
        # Export settings
        use_selection=False,  # Export entire scene
        use_visible=True,     # Only visible objects
    )
    
    print(f"  ✓ Exported: {output_path}")
    print(f"  ✓ File size: {os.path.getsize(output_path) / (1024*1024):.1f} MB")
    print(f"\n{'='*60}")
    print("✓ Export complete!")
    print(f"{'='*60}\n")
    
    return output_path

def main():
    """Entry point for Blender script."""
    
    # Parse command-line arguments
    argv = sys.argv
    
    # Find '--' separator between Blender args and script args
    try:
        script_args = argv[argv.index('--')+1:]
    except (ValueError, IndexError):
        script_args = []
    
    output_dir = None
    if '--output-dir' in script_args:
        idx = script_args.index('--output-dir')
        if idx + 1 < len(script_args):
            output_dir = script_args[idx + 1]
    
    # Get current blend file
    blend_file = bpy.data.filepath
    
    if not blend_file:
        print("\n❌ Error: No blend file is currently open")
        print("Usage: blender -b model.blend -P export_glb_fixed.py")
        return
    
    try:
        export_glb_optimized(blend_file, output_dir)
    except Exception as e:
        print(f"\n❌ Export failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
