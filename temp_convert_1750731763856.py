
import bpy
import sys
import os

# Clear existing objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

try:
    # Import GLB
    bpy.ops.import_scene.gltf(filepath="modelo30.glb")
    
    # Export as USD
    usd_file = "modelo30.usd"
    bpy.ops.wm.usd_export(
        filepath=usd_file,
        selected_objects_only=False,
        export_materials=True,
        export_meshes=True,
        export_lights=True,
        export_cameras=False
    )
    
    print(f"USD exported: {usd_file}")
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
