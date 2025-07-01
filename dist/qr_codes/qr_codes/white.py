import os
from PIL import Image
import numpy as np

def process_png_files(input_folder='.', output_folder='processed'):
    """
    Process all PNG files in the input folder:
    1. Invert colors 100%
    2. Convert black pixels to transparent (alpha)
    3. Keep only non-black content visible
    """
    
    # Create output folder if it doesn't exist
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    # Find all PNG files in the input folder
    png_files = [f for f in os.listdir(input_folder) if f.lower().endswith('.png')]
    
    if not png_files:
        print("No PNG files found in the current directory.")
        return
    
    print(f"Found {len(png_files)} PNG file(s) to process:")
    
    for filename in png_files:
        try:
            # Load the image
            input_path = os.path.join(input_folder, filename)
            img = Image.open(input_path)
            
            # Convert to RGBA if not already
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            # Convert to numpy array for easier manipulation
            img_array = np.array(img)
            
            # Invert colors (but not alpha channel)
            img_array[:, :, 0] = 255 - img_array[:, :, 0]  # Red
            img_array[:, :, 1] = 255 - img_array[:, :, 1]  # Green
            img_array[:, :, 2] = 255 - img_array[:, :, 2]  # Blue
            
            # Create transparency mask for black pixels
            # After inversion, original white becomes black (0,0,0)
            black_mask = (img_array[:, :, 0] == 0) & (img_array[:, :, 1] == 0) & (img_array[:, :, 2] == 0)
            
            # Set alpha to 0 (transparent) for black pixels
            img_array[black_mask, 3] = 0
            
            # Convert back to PIL Image
            processed_img = Image.fromarray(img_array, 'RGBA')
            
            # Save the processed image
            output_path = os.path.join(output_folder, f"inverted_{filename}")
            processed_img.save(output_path)
            
            print(f"✓ Processed: {filename} -> {output_path}")
            
        except Exception as e:
            print(f"✗ Error processing {filename}: {str(e)}")
    
    print(f"\nProcessing complete! Check the '{output_folder}' folder for results.")

if __name__ == "__main__":
    # You can modify these paths as needed
    input_directory = "."  # Current directory
    output_directory = "processed"
    
    print("PNG Color Inverter & Black-to-Transparent Converter")
    print("=" * 50)
    
    process_png_files(input_directory, output_directory)