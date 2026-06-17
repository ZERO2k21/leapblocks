from PIL import Image
import struct
import io
import sys
import os

def create_windows_ico(input_path, output_path):
    """Create a Windows-compatible multi-size ICO file."""
    img = Image.open(input_path)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    sizes = [16, 32, 48, 64, 128, 256]
    
    # Prepare images for each size
    images = []
    for size in sizes:
        resized = img.resize((size, size), Image.LANCZOS)
        images.append(resized)
    
    # ICO file structure:
    # ICONDIR (6 bytes)
    # ICONDIRENTRY for each image (16 bytes each)
    # Image data for each image
    
    icondir = struct.pack('<HHH', 0, 1, len(images))  # Reserved, Type (1=icon), Count
    
    entries = b''
    data_blocks = b''
    offset = 6 + 16 * len(images)
    
    for i, im in enumerate(images):
        size = sizes[i]
        
        # For 256x256, use PNG compression (standard for Vista+)
        # For smaller sizes, use BMP format for better compatibility
        if size == 256:
            buf = io.BytesIO()
            im.save(buf, format='PNG')
            img_data = buf.getvalue()
            # In ICO, width and height are stored as 0 for 256
            w, h = 0, 0
        else:
            # Create BMP data without the BMP file header (14 bytes)
            # ICO uses DIB header directly
            buf = io.BytesIO()
            im.save(buf, format='BMP')
            bmp_data = buf.getvalue()
            # Skip BMP file header (14 bytes)
            img_data = bmp_data[14:]
            w = size if size < 256 else 0
            h = size if size < 256 else 0
        
        # Color planes (1), Bits per pixel (32 for RGBA)
        planes = 1
        bpp = 32
        
        entries += struct.pack('<BBBBHHII', 
            w,           # Width
            h,           # Height
            0,           # Color palette size (0 = no palette)
            0,           # Reserved
            planes,      # Color planes
            bpp,         # Bits per pixel
            len(img_data),  # Size of image data
            offset       # Offset to image data
        )
        
        data_blocks += img_data
        offset += len(img_data)
    
    with open(output_path, 'wb') as f:
        f.write(icondir + entries + data_blocks)
    
    print(f"Created Windows-compatible ICO: {output_path}")
    print(f"Sizes included: {sizes}")
    print(f"Total file size: {os.path.getsize(output_path)} bytes")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python scripts/create-ico.py <path-to-image>")
        sys.exit(1)
    
    input_path = sys.argv[1]
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.join(script_dir, '..')
    output_path = os.path.join(project_root, 'public', 'assets', 'leapblocks.ico')
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    create_windows_ico(input_path, output_path)
    print("Done! Ready to rebuild with: npm run dist:win")
