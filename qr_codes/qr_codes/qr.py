import os
import glob
from PIL import Image, ImageDraw
import math

def get_image_files(folder_path="."):
    """Get all QR code files and base image"""
    qr_files = glob.glob(os.path.join(folder_path, "qr*.png"))
    base_file = os.path.join(folder_path, "base.png")
    
    # Sort QR files numerically
    def extract_number(filename):
        try:
            # Extract number from filename like "inverted_qr (1).png"
            if '(' in filename and ')' in filename:
                return int(filename.split('(')[1].split(')')[0])
            else:
                return 0
        except:
            return 0
    
    qr_files.sort(key=extract_number)
    
    return qr_files, base_file

def overlay_qr_on_base(base_image, qr_image, scale_factor=6, offset_y=80, debug=False):
    """
    Overlay QR code on base image with scaling and positioning
    
    Args:
        base_image: Base image (PIL Image)
        qr_image: QR code image (PIL Image)
        scale_factor: How much to scale the QR code (default: 6x larger)
        offset_y: How many pixels below center to place QR (default: 80px down)
        debug: Print debug information
    """
    
    # Convert images to RGB to avoid transparency issues
    if base_image.mode != 'RGB':
        if base_image.mode == 'RGBA':
            white_bg = Image.new('RGB', base_image.size, 'white')
            white_bg.paste(base_image, mask=base_image.split()[-1] if base_image.mode == 'RGBA' else None)
            base_image = white_bg
        else:
            base_image = base_image.convert('RGB')
    
    if qr_image.mode != 'RGB':
        if qr_image.mode == 'RGBA':
            white_bg = Image.new('RGB', qr_image.size, 'white')
            white_bg.paste(qr_image, mask=qr_image.split()[-1] if qr_image.mode == 'RGBA' else None)
            qr_image = white_bg
        else:
            qr_image = qr_image.convert('RGB')
    
    # Scale the QR code to make it bigger
    original_qr_width, original_qr_height = qr_image.size
    new_qr_width = int(original_qr_width * scale_factor)
    new_qr_height = int(original_qr_height * scale_factor)
    
    # Resize QR code with high quality
    scaled_qr = qr_image.resize((new_qr_width, new_qr_height), Image.Resampling.NEAREST)
    
    # Create a copy of base image
    result = base_image.copy()
    
    # Get dimensions
    base_width, base_height = base_image.size
    qr_width, qr_height = scaled_qr.size
    
    # Calculate center position
    center_x = base_width // 2
    center_y = base_height // 2
    
    # Calculate top-left position for QR code (slightly below center)
    paste_x = center_x - (qr_width // 2)
    paste_y = center_y - (qr_height // 2) + offset_y  # Move down by offset_y pixels
    
    if debug:
        print(f"Base size: {base_width}x{base_height}")
        print(f"Original QR size: {original_qr_width}x{original_qr_height}")
        print(f"Scaled QR size: {qr_width}x{qr_height} (scale: {scale_factor}x)")
        print(f"Center: ({center_x}, {center_y})")
        print(f"Paste position: ({paste_x}, {paste_y}) - offset_y: {offset_y}")
    
    # Make sure we don't paste outside bounds
    paste_x = max(0, min(paste_x, base_width - qr_width))
    paste_y = max(0, min(paste_y, base_height - qr_height))
    
    # Paste scaled QR code directly
    result.paste(scaled_qr, (paste_x, paste_y))
    
    return result

def resize_image_to_fit(image, max_width, max_height, maintain_aspect=True):
    """Resize image to fit within bounds while maintaining aspect ratio"""
    if not maintain_aspect:
        return image.resize((max_width, max_height), Image.Resampling.LANCZOS)
    
    # Calculate aspect ratios
    img_width, img_height = image.size
    img_aspect = img_width / img_height
    target_aspect = max_width / max_height
    
    if img_aspect > target_aspect:
        # Image is wider, fit to width
        new_width = max_width
        new_height = int(max_width / img_aspect)
    else:
        # Image is taller, fit to height
        new_height = max_height
        new_width = int(max_height * img_aspect)
    
    return image.resize((new_width, new_height), Image.Resampling.LANCZOS)

def create_a4_pages(combined_images, images_per_page=6):
    """Create A4-sized pages with multiple QR+base combinations in 3x2 grid"""
    # A4 size at 300 DPI
    a4_width = 2480  # 8.27 inches * 300 DPI
    a4_height = 3508  # 11.69 inches * 300 DPI
    
    pages = []
    total_images = len(combined_images)
    total_pages = math.ceil(total_images / images_per_page)
    
    print(f"📄 Criando {total_pages} páginas para {total_images} imagens...")
    
    for page_num in range(total_pages):
        # Create white A4 page
        page = Image.new('RGB', (a4_width, a4_height), 'white')
        
        # Grid layout: 2 colunas x 3 linhas
        cols = 2
        rows = 3
        
        # Calculate space for each image with margins
        margin_x = 120  # Margem lateral
        margin_y = 150  # Margem superior/inferior
        spacing_x = 80  # Espaçamento horizontal entre imagens
        spacing_y = 100  # Espaçamento vertical entre imagens
        
        # Tamanho de cada célula
        cell_width = (a4_width - 2 * margin_x - (cols - 1) * spacing_x) // cols
        cell_height = (a4_height - 2 * margin_y - (rows - 1) * spacing_y) // rows
        
        # Process images for this page
        start_idx = page_num * images_per_page
        end_idx = min(start_idx + images_per_page, total_images)
        
        print(f"  Página {page_num + 1}: imagens {start_idx + 1} a {end_idx}")
        print(f"    Layout: {cols} colunas x {rows} linhas")
        print(f"    Tamanho da célula: {cell_width}x{cell_height}")
        
        for i in range(start_idx, end_idx):
            image = combined_images[i]
            
            # Calculate grid position
            grid_pos = i - start_idx
            col = grid_pos % cols
            row = grid_pos // cols
            
            # Resize image to fit in cell
            resized_image = resize_image_to_fit(image, cell_width, cell_height)
            
            # Calculate position on page (center in cell)
            cell_x = margin_x + col * (cell_width + spacing_x)
            cell_y = margin_y + row * (cell_height + spacing_y)
            
            center_x = cell_x + (cell_width - resized_image.width) // 2
            center_y = cell_y + (cell_height - resized_image.height) // 2
            
            # Paste image on page
            page.paste(resized_image, (center_x, center_y))
            
            # Optional: Add grid lines for debugging (comment out for final version)
            # draw = ImageDraw.Draw(page)
            # draw.rectangle([cell_x, cell_y, cell_x + cell_width, cell_y + cell_height], 
            #               outline='lightgray', width=1)
        
        pages.append(page)
    
    return pages

def main():
    print("🔍 Analisando arquivos de imagem...")
    
    # Get all image files
    qr_files, base_file = get_image_files()
    
    if not os.path.exists(base_file):
        print(f"❌ Arquivo base.png não encontrado!")
        return
    
    if not qr_files:
        print("❌ Nenhum arquivo inverted_qr encontrado!")
        return
    
    print(f"✅ Encontrados {len(qr_files)} códigos QR e 1 imagem base")
    
    # Load base image
    try:
        base_image = Image.open(base_file)
        print(f"📐 Imagem base: {base_image.size[0]}x{base_image.size[1]} ({base_image.mode})")
    except Exception as e:
        print(f"❌ Erro ao carregar base.png: {e}")
        return
    
    # QR scaling and positioning settings
    qr_scale = 10  # Make QR 6x bigger
    qr_offset_down = 80  # Move QR 80 pixels below center
    
    print(f"⚙️  Configurações: QR {qr_scale}x maior, {qr_offset_down}px abaixo do centro")
    print(f"📋 Layout A4: 2 colunas x 3 linhas (6 imagens por página)")
    
    # Process each QR code
    combined_images = []
    
    print("\n🔄 Processando códigos QR...")
    for i, qr_file in enumerate(qr_files, 1):
        try:
            # Load QR image
            qr_image = Image.open(qr_file)
            if i == 1:
                print(f"   QR original: {qr_image.size[0]}x{qr_image.size[1]} ({qr_image.mode})")
            
            # Overlay QR on base with custom scaling and offset
            combined = overlay_qr_on_base(
                base_image, 
                qr_image, 
                scale_factor=qr_scale, 
                offset_y=qr_offset_down, 
                debug=(i==1)
            )
            combined_images.append(combined)
            
            if i <= 5 or i % 10 == 0:  # Show progress
                print(f"✅ Processado {i}/{len(qr_files)}: {os.path.basename(qr_file)}")
            
        except Exception as e:
            print(f"❌ Erro ao processar {qr_file}: {e}")
    
    if not combined_images:
        print("❌ Nenhuma imagem foi processada com sucesso!")
        return
    
    # Save a test image to verify scaling and positioning
    if combined_images:
        test_folder = "test_output"
        os.makedirs(test_folder, exist_ok=True)
        test_file = os.path.join(test_folder, "test_qr_6x.png")
        combined_images[0].save(test_file)
        print(f"🧪 Imagem de teste salva: {test_file}")
    
    print(f"\n📄 Criando páginas A4 para {len(combined_images)} imagens...")
    
    # Create A4 pages with 3 rows x 2 columns
    pages = create_a4_pages(combined_images, images_per_page=6)
    
    # Save pages
    output_folder = "output_pages"
    os.makedirs(output_folder, exist_ok=True)
    
    print(f"\n💾 Salvando {len(pages)} páginas A4...")
    for i, page in enumerate(pages, 1):
        output_file = os.path.join(output_folder, f"page_{i:02d}.png")
        page.save(output_file, "PNG", dpi=(300, 300))
        print(f"✅ Página {i} salva: {output_file} (2 cols x 3 rows)")
    
    # Also save individual combined images
    individual_folder = "individual_combined"
    os.makedirs(individual_folder, exist_ok=True)
    
    print(f"\n💾 Salvando {len(combined_images)} imagens individuais...")
    for i, img in enumerate(combined_images, 1):
        output_file = os.path.join(individual_folder, f"combined_{i:02d}.png")
        img.save(output_file, "PNG")
    
    print(f"\n🎉 Processamento concluído!")
    print(f"📊 Resumo:")
    print(f"   • {len(combined_images)} códigos QR processados")
    print(f"   • QR codes {qr_scale}x maiores e {qr_offset_down}px abaixo do centro")
    print(f"   • {len(pages)} páginas A4 criadas")
    print(f"   • Layout: 2 colunas x 3 linhas (6 imagens por página)")
    print(f"   • Para 56 QR codes = {math.ceil(56/6)} páginas A4")
    print(f"   • Resolução: 300 DPI")
    print(f"   • Teste: {test_folder}/test_qr_6x.png")
    print(f"   • Páginas: {output_folder}/")
    print(f"   • Individuais: {individual_folder}/")

if __name__ == "__main__":
    main()