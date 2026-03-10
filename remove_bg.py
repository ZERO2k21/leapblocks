import os
import sys
from PIL import Image

try:
    from rembg import remove
except ImportError:
    print("Error: The 'rembg' library is required. Please run: pip install rembg pillow")
    sys.exit(1)

def remove_background(image_path):
    try:
        # Open the image using PIL
        img = Image.open(image_path)
        
        # Remove the background using rembg
        output_img = remove(img)
        
        # Determine new filename (force .png)
        base = os.path.splitext(image_path)[0]
        new_path = base + ".png"
        
        # Save exact object extraction as PNG with transparency
        output_img.save(new_path, "PNG")
        
        # Remove old image if it was not already a PNG and had different extension
        if image_path.lower().endswith(('.jpeg', '.jpg')) and image_path != new_path:
            os.remove(image_path)
            
        print(f"Processed: {os.path.basename(image_path)} -> {os.path.basename(new_path)}")
        return new_path
    except Exception as e:
        print(f"Failed to process {image_path}: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target = sys.argv[1]
        if os.path.isfile(target):
            remove_background(target)
        elif os.path.isdir(target):
            for filename in os.listdir(target):
                if filename.lower().endswith((".png", ".jpeg", ".jpg", ".webp")):
                    file_path = os.path.join(target, filename)
                    remove_background(file_path)
    else:
        print("Usage: python remove_bg.py <path_to_image_or_directory>")
        sys.exit(1)
