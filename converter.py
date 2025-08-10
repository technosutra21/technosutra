import os
import sys
import io
import shutil
import subprocess
import zipfile
from pathlib import Path

# --- deps ---
try:
    from pxr import Usd, UsdGeom, Gf  # core USD
    try:
        from pxr import UsdUtils  # optional (packaging helpers)
    except Exception:
        UsdUtils = None
    from pxr import UsdShade, Sdf
except ImportError as e:
    print(f"Erro: Biblioteca necessária não encontrada: {e}")
    print("Instale as dependências com (tente na ordem):")
    print("pip install openusd trimesh")
    print("pip install usd-core trimesh")
    sys.exit(1)

try:
    import trimesh
except ImportError as e:
    print(f"Erro: Biblioteca necessária não encontrada: {e}")
    print("Instale as dependências com:")
    print("pip install trimesh")
    sys.exit(1)

# pillow is optional (needed to serialize embedded gltf textures to files)
try:
    from PIL import Image
    _PIL_OK = True
except Exception:
    _PIL_OK = False


def _sanitize_name(name: str, fallback: str) -> str:
    if not name:
        return fallback
    s = "".join(c if (c.isalnum() or c == "_") else "_" for c in name)
    if not s or s[0].isdigit():
        s = f"mesh_{s}" if s else fallback
    return s


def _set_basic_mesh_attrs(mesh: "trimesh.Trimesh", stage: "Usd.Stage", prim_path: str) -> "UsdGeom.Mesh":
    mesh_prim = UsdGeom.Mesh.Define(stage, prim_path)

    # points
    points = [Gf.Vec3f(float(v[0]), float(v[1]), float(v[2])) for v in mesh.vertices]
    mesh_prim.CreatePointsAttr().Set(points)

    # faces
    face_vertex_counts = []
    face_vertex_indices = []
    for f in mesh.faces:
        face_vertex_counts.append(int(len(f)))
        for idx in f:
            face_vertex_indices.append(int(idx))
    mesh_prim.CreateFaceVertexCountsAttr().Set(face_vertex_counts)
    mesh_prim.CreateFaceVertexIndicesAttr().Set(face_vertex_indices)

    # normals (per-vertex) if available or computable
    try:
        vn = mesh.vertex_normals
        if vn is not None and len(vn) == len(mesh.vertices):
            normals = [Gf.Vec3f(float(n[0]), float(n[1]), float(n[2])) for n in vn]
            mesh_prim.CreateNormalsAttr().Set(normals)
            mesh_prim.SetNormalsInterpolation(UsdGeom.Tokens.vertex)
    except Exception:
        pass

    # extent (aabb)
    try:
        bb_min, bb_max = mesh.bounds
        extent = [
            Gf.Vec3f(float(bb_min[0]), float(bb_min[1]), float(bb_min[2])),
            Gf.Vec3f(float(bb_max[0]), float(bb_max[1]), float(bb_max[2])),
        ]
        mesh_prim.CreateExtentAttr().Set(extent)
    except Exception:
        pass

    # ensure no subdivision
    try:
        mesh_prim.CreateSubdivisionSchemeAttr().Set(UsdGeom.Tokens.none)
    except Exception:
        pass

    # improve viewport + quick look robustness
    try:
        mesh_prim.CreateDoubleSidedAttr().Set(True)
    except Exception:
        pass

    return mesh_prim


def _author_uvs(mesh: "trimesh.Trimesh", mesh_prim: "UsdGeom.Mesh") -> bool:
    # write primvars:st from trimesh visuals if available
    try:
        vis = getattr(mesh, "visual", None)
        if vis is None:
            return False
        uv = getattr(vis, "uv", None)
        if uv is None:
            return False
        uv = uv.tolist()
        if len(uv) == 0:
            return False

        # glTF uses top-left origin, USD expects bottom-left: flip V
        uv_flipped = [(float(u[0]), float(1.0 - u[1])) for u in uv]

        # if uv are per-vertex
        if len(uv_flipped) == len(mesh.vertices):
            st = mesh_prim.CreatePrimvar(
                "st", Sdf.ValueTypeNames.TexCoord2fArray, UsdGeom.Tokens.vertex
            )
            st.Set([Gf.Vec2f(u, v) for (u, v) in uv_flipped])
            return True

        # sometimes uvs can be face-varying (N * 3)
        total_corners = int(sum([len(f) for f in mesh.faces]))
        if len(uv_flipped) == total_corners:
            st = mesh_prim.CreatePrimvar(
                "st", Sdf.ValueTypeNames.TexCoord2fArray, UsdGeom.Tokens.faceVarying
            )
            st.Set([Gf.Vec2f(u, v) for (u, v) in uv_flipped])
            return True

    except Exception:
        pass

    return False


def _author_display_color_and_opacity(mesh: "trimesh.Trimesh", mesh_prim: "UsdGeom.Mesh") -> None:
    # prefer vertex colors; fallback to face colors; final fallback: neutral gray
    vis = getattr(mesh, "visual", None)
    if vis is None:
        # constant neutral
        primvar = mesh_prim.CreateDisplayColorPrimvar(UsdGeom.Tokens.constant)
        primvar.Set([Gf.Vec3f(0.8, 0.8, 0.8)])
        return

    # vertex colors (Nx3 or Nx4, uint8)
    vc = getattr(vis, "vertex_colors", None)
    if vc is not None and len(vc) == len(mesh.vertices):
        try:
            import numpy as np  # local import to avoid hard dep if not needed
            vc = np.asarray(vc)
            if vc.shape[1] >= 3:
                rgb = (vc[:, :3] / 255.0).astype(float)
                primvar = mesh_prim.CreateDisplayColorPrimvar(UsdGeom.Tokens.vertex)
                primvar.Set([Gf.Vec3f(float(r), float(g), float(b)) for r, g, b in rgb])

                if vc.shape[1] == 4:
                    alpha = (vc[:, 3] / 255.0).astype(float)
                    op = mesh_prim.CreateDisplayOpacityPrimvar(UsdGeom.Tokens.vertex)
                    op.Set([float(a) for a in alpha])
                return
        except Exception:
            pass

    # face colors (Mx3 or Mx4)
    fc = getattr(vis, "face_colors", None)
    if fc is not None and len(fc) == len(mesh.faces):
        try:
            import numpy as np
            fc = np.asarray(fc)
            if fc.shape[1] >= 3:
                rgb = (fc[:, :3] / 255.0).astype(float)
                primvar = mesh_prim.CreateDisplayColorPrimvar(UsdGeom.Tokens.uniform)
                primvar.Set([Gf.Vec3f(float(r), float(g), float(b)) for r, g, b in rgb])

                if fc.shape[1] == 4:
                    alpha = (fc[:, 3] / 255.0).astype(float)
                    op = mesh_prim.CreateDisplayOpacityPrimvar(UsdGeom.Tokens.uniform)
                    op.Set([float(a) for a in alpha])
                return
        except Exception:
            pass

    # single material color fallback (trimesh SimpleMaterial / PBRMaterial)
    mat = getattr(vis, "material", None)
    if mat is not None:
        # try common names
        for key in ("diffuse", "baseColor", "color"):
            col = getattr(mat, key, None)
            if col is None:
                continue
            try:
                # accept 3 or 4 channels in [0, 255] or [0, 1]
                if max(col) > 1.0:
                    rgb = [min(1.0, float(c) / 255.0) for c in col[:3]]
                else:
                    rgb = [float(c) for c in col[:3]]
                primvar = mesh_prim.CreateDisplayColorPrimvar(UsdGeom.Tokens.constant)
                primvar.Set([Gf.Vec3f(*rgb)])
                return
            except Exception:
                pass

    # last fallback constant neutral gray
    primvar = mesh_prim.CreateDisplayColorPrimvar(UsdGeom.Tokens.constant)
    primvar.Set([Gf.Vec3f(0.8, 0.8, 0.8)])


def _save_texture_if_any(mesh: "trimesh.Trimesh", textures_dir: Path, name_hint: str) -> str:
    """
    Try to extract a texture image from trimesh and save to disk.
    Returns a relative path like 'textures/<file>.png' on success, else ''.
    """
    vis = getattr(mesh, "visual", None)
    if vis is None:
        return ""
    mat = getattr(vis, "material", None)
    if mat is None:
        return ""

    # known sources where trimesh keeps the glTF baseColor texture:
    # - mat.image (PIL.Image or np.ndarray)
    # - occasionally mat.baseColorTexture / image / to_image variants
    candidates = []
    for attr in ("image",):
        if hasattr(mat, attr):
            candidates.append(getattr(mat, attr))

    img = None
    for c in candidates:
        if c is None:
            continue
        try:
            # PIL Image
            if _PIL_OK and isinstance(c, Image.Image):
                img = c
                break
        except Exception:
            pass
        try:
            # numpy array (H, W, C)
            import numpy as np
            if isinstance(c, np.ndarray):
                if not _PIL_OK:
                    continue
                img = Image.fromarray(c)
                break
        except Exception:
            pass

    if img is None:
        return ""

    textures_dir.mkdir(parents=True, exist_ok=True)
    rel_tex = f"textures/{name_hint}.png"
    out_path = textures_dir / f"{name_hint}.png"
    try:
        img.save(str(out_path))
        return rel_tex
    except Exception:
        return ""


def _bind_preview_surface_with_texture(
    stage: "Usd.Stage",
    mesh_prim: "UsdGeom.Mesh",
    materials_scope: str,
    tex_rel_path: str,
    use_srgb: bool = True,
) -> None:
    # create /Root/Materials scope if not present
    UsdGeom.Xform.Define(stage, materials_scope)
    mat_name = f"Mat_{mesh_prim.GetPath().name}"
    mat_path = f"{materials_scope}/{mat_name}"
    tex_name = f"DiffuseTex_{mesh_prim.GetPath().name}"
    st_reader_name = f"stReader_{mesh_prim.GetPath().name}"
    ps_name = f"PreviewSurface_{mesh_prim.GetPath().name}"

    material = UsdShade.Material.Define(stage, mat_path)

    # texture node
    tex = UsdShade.Shader.Define(stage, f"{mat_path}/{tex_name}")
    tex.CreateIdAttr("UsdUVTexture")
    tex.CreateInput("file", Sdf.ValueTypeNames.Asset).Set(Sdf.AssetPath(tex_rel_path))
    if use_srgb:
        # ensure proper color space for baseColor textures
        tex.CreateInput("sourceColorSpace", Sdf.ValueTypeNames.Token).Set("sRGB")

    # primvar reader for 'st'
    st_reader = UsdShade.Shader.Define(stage, f"{mat_path}/{st_reader_name}")
    st_reader.CreateIdAttr("UsdPrimvarReader_float2")
    st_reader.CreateInput("varname", Sdf.ValueTypeNames.Token).Set("st")

    # connect st to texture
    tex.CreateInput("st", Sdf.ValueTypeNames.Float2).ConnectToSource(st_reader, "result")

    # preview surface
    ps = UsdShade.Shader.Define(stage, f"{mat_path}/{ps_name}")
    ps.CreateIdAttr("UsdPreviewSurface")
    ps.CreateInput("diffuseColor", Sdf.ValueTypeNames.Color3f).ConnectToSource(tex, "rgb")

    # wire surface
    material.CreateSurfaceOutput().ConnectToSource(ps, "surface")

    # bind to mesh
    UsdShade.MaterialBindingAPI(mesh_prim.GetPrim()).Bind(material)


def _write_trimesh_to_usd_mesh(
    mesh: "trimesh.Trimesh",
    stage: "Usd.Stage",
    prim_path: str,
    textures_dir: Path,
    additional_files: list,
    materials_scope: str = "/Root/Materials",
) -> bool:
    if not hasattr(mesh, "vertices") or not hasattr(mesh, "faces"):
        return False
    if mesh.vertices is None or len(mesh.vertices) == 0:
        return False
    if mesh.faces is None or len(mesh.faces) == 0:
        return False

    mesh_prim = _set_basic_mesh_attrs(mesh, stage, prim_path)

    # colors first (fallbacks for no textures)
    _author_display_color_and_opacity(mesh, mesh_prim)

    # uvs if present
    has_uv = _author_uvs(mesh, mesh_prim)

    # baseColor texture
    tex_rel = _save_texture_if_any(mesh, textures_dir, name_hint=mesh_prim.GetPath().name)
    if tex_rel:
        # if we saved a texture, remember to package it
        additional_files.append(str((textures_dir / Path(tex_rel).name).resolve()))
        if has_uv:
            _bind_preview_surface_with_texture(stage, mesh_prim, materials_scope, tex_rel)

    return True


def _package_to_usdz(usda_path: str, usdz_path: str, extra_files: list) -> bool:
    # 1) UsdUtils if present
    try:
        if "UsdUtils" in globals() and UsdUtils is not None:
            # ARKit packer auto-resolves dependencies
            if hasattr(UsdUtils, "CreateNewARKitUsdzPackage"):
                ok = UsdUtils.CreateNewARKitUsdzPackage(usda_path, usdz_path)
                if ok:
                    return True
            # otherwise, provide explicit list
            if hasattr(UsdUtils, "CreateNewUsdzPackage"):
                files = [usda_path] + (extra_files or [])
                ok = UsdUtils.CreateNewUsdzPackage(files, usdz_path)
                if ok:
                    return True
    except Exception as e:
        print(f"Aviso: falha ao empacotar com UsdUtils: {e}")

    # 2) try usdzip if on PATH
    try:
        if shutil.which("usdzip"):
            files = [usda_path] + (extra_files or [])
            result = subprocess.run(["usdzip", usdz_path] + files, capture_output=True, text=True)
            if result.returncode == 0:
                return True
            else:
                print(f"Aviso: usdzip retornou erro: {result.stderr.strip()}")
    except Exception as e:
        print(f"Aviso: falha ao chamar usdzip: {e}")

    # 3) pure-python fallback: zip with no compression (ZIP_STORED)
    try:
        base_dir = os.path.dirname(os.path.abspath(usda_path))
        with zipfile.ZipFile(usdz_path, mode="w", compression=zipfile.ZIP_STORED, allowZip64=False) as zf:
            # write usda at root (basename only)
            zf.write(usda_path, arcname=os.path.basename(usda_path))
            # write extra files with arcname relative to base_dir
            for f in extra_files or []:
                f_abs = os.path.abspath(f)
                arc = os.path.relpath(f_abs, base_dir)
                zf.write(f_abs, arcname=arc)
        return True
    except Exception as e:
        print(f"Aviso: falha no empacotamento ZIP_STORED: {e}")
        return False


def convert_glb_to_usdz(glb_path, usdz_path):
    """
    Converte um arquivo GLB para USDZ (com UVs, materiais e texturas para Quick Look quando possível)

    Args:
        glb_path (str): Caminho para o arquivo GLB de entrada
        usdz_path (str): Caminho para o arquivo USDZ de saída

    Returns:
        bool: True se a conversão foi bem-sucedida, False caso contrário
    """
    try:
        glb_path = str(glb_path)
        usdz_path = str(usdz_path)

        # load input (prefer a Scene to preserve multiple meshes; we'll try to apply transforms)
        scene = trimesh.load(glb_path, force="scene")

        # working dir to assemble usda + assets before zipping
        usdz_out = Path(usdz_path)
        work_dir = usdz_out.parent / f"_{usdz_out.stem}_usdzbuild"
        textures_dir = work_dir / "textures"
        work_dir.mkdir(parents=True, exist_ok=True)

        usda_path = work_dir / f"{usdz_out.stem}.usda"
        stage = Usd.Stage.CreateNew(str(usda_path))

        # Y-up is glTF's convention
        UsdGeom.SetStageUpAxis(stage, UsdGeom.Tokens.y)

        # root xform + default prim
        root = UsdGeom.Xform.Define(stage, "/Root")
        stage.SetDefaultPrim(root.GetPrim())

        wrote_any = False
        extra_assets = []

        if isinstance(scene, trimesh.Scene):
            # iterate geometries; try to apply node transforms if available
            for i, (name, geom) in enumerate(scene.geometry.items()):
                mesh = geom
                try:
                    if hasattr(scene, "graph") and hasattr(scene.graph, "get_transform"):
                        M = scene.graph.get_transform(name)
                        if M is not None:
                            mesh = geom.copy()
                            mesh.apply_transform(M)
                except Exception:
                    mesh = geom

                prim_name = _sanitize_name(name, f"mesh_{i}")
                prim_path = f"/Root/{prim_name}"
                if _write_trimesh_to_usd_mesh(mesh, stage, prim_path, textures_dir, extra_assets):
                    wrote_any = True
        else:
            # got a single mesh
            mesh = scene
            if hasattr(scene, "to_mesh"):
                try:
                    mesh = scene.to_mesh()
                except Exception:
                    pass
            if _write_trimesh_to_usd_mesh(mesh, stage, "/Root/mesh", textures_dir, extra_assets):
                wrote_any = True

        if not wrote_any:
            print("Erro: nenhuma malha válida encontrada no GLB.")
            # cleanup work dir
            try:
                shutil.rmtree(work_dir, ignore_errors=True)
            except Exception:
                pass
            return False

        # save .usda
        stage.Save()

        # package to .usdz (include textures if any)
        ok = _package_to_usdz(str(usda_path), usdz_path, extra_assets)
        # cleanup temp files
        try:
            shutil.rmtree(work_dir, ignore_errors=True)
        except Exception:
            pass

        if ok:
            return True

        print("Erro ao criar USDZ (tente instalar 'openusd' para melhor compatibilidade).")
        return False

    except Exception as e:
        print(f"Erro ao converter {glb_path}: {str(e)}")
        return False


def main():
    """
    Converte todos os arquivos GLB em 'glb-usd/glb_files' para USDZ em 'glb-usd/usdz_files'.
    """
    base = Path(__file__).resolve().parent
    glb_dir = base / "glb_files"
    usdz_dir = base / "usdz_files"

    if not glb_dir.exists():
        print(f"Erro: Diretório '{glb_dir}' não encontrado!")
        print("Crie o diretório 'glb_files' e coloque os arquivos GLB nele.")
        return

    usdz_dir.mkdir(parents=True, exist_ok=True)

    glb_files = list(glb_dir.glob("*.glb")) + list(glb_dir.glob("*.GLB"))

    if not glb_files:
        print(f"Nenhum arquivo GLB encontrado em '{glb_dir}'")
        return

    print(f"Encontrados {len(glb_files)} arquivos GLB para converter...")

    successful_conversions = 0
    failed_conversions = 0

    for glb_file in glb_files:
        print(f"Convertendo: {glb_file.name}")
        usdz_filename = glb_file.stem + ".usdz"
        usdz_path = usdz_dir / usdz_filename

        if convert_glb_to_usdz(str(glb_file), str(usdz_path)):
            print(f"✓ Convertido com sucesso: {usdz_filename}")
            successful_conversions += 1
        else:
            print(f"✗ Falha na conversão: {glb_file.name}")
            failed_conversions += 1

    print(f"\n--- Resumo da Conversão ---")
    print(f"Conversões bem-sucedidas: {successful_conversions}")
    print(f"Conversões falharam: {failed_conversions}")
    print(f"Total de arquivos: {len(glb_files)}")

    if successful_conversions > 0:
        print(f"\nArquivos USDZ salvos em: {usdz_dir}")


if __name__ == "__main__":
    main()