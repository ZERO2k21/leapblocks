from PIL import Image
import sys
import os
import shutil

def convert_to_ico(input_path, output_path, sizes=[256, 128, 64, 48, 32, 16]):
    """Convert an image to a multi-size ICO file."""
    if not os.path.exists(input_path):
        print(f"Error: Input file not found: {input_path}")
        sys.exit(1)
    
    img = Image.open(input_path)
    
    # Convert to RGBA if necessary
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Create versions for each size
    icons = []
    for size in sizes:
        resized = img.resize((size, size), Image.LANCZOS)
        icons.append(resized)
    
    # Save as ICO with all sizes
    icons[0].save(
        output_path,
        format='ICO',
        sizes=[(i.width, i.height) for i in icons],
        append_images=icons[1:]
    )
    
    print(f"Icon created: {output_path}")
    print(f"Included sizes: {sizes}")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python scripts/convert-icon.py <path-to-image>")
        print("Example: python scripts/convert-icon.py C:/Users/chris/Downloads/new-icon.png")
        sys.exit(1)
    
    input_path = sys.argv[1]
    
    # Determine project root (this script is in scripts/)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.join(script_dir, '..')
    output_path = os.path.join(project_root, 'public', 'assets', 'leapblocks.ico')
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    convert_to_ico(input_path, output_path)
    
    # Also clean up any stale build copies
    build_paths = [
        os.path.join(project_root, 'build', 'assets', 'leapblocks.ico'),
        os.path.join(project_root, 'dist', 'renderer', 'assets', 'leapblocks.ico'),
        os.path.join(project_root, 'out', 'win-unpacked', 'resources', 'public', 'assets', 'leapblocks.ico'),
    ]
    
    for bp in build_paths:
        if os.path.exists(bp):
            os.remove(bp)
            print(f"Cleaned stale build copy: {bp}")
    
    print("\nDone! You can now rebuild with: npm run dist:win")
