import os
from PIL import Image

def remove_background(image_path, threshold=40):
    try:
        img = Image.open(image_path).convert("RGBA")
        datas = img.getdata()
        
        newData = []
        for item in datas:
            # item is (R, G, B, A)
            # Check for near-white
            is_white = item[0] > (255 - threshold) and item[1] > (255 - threshold) and item[2] > (255 - threshold)
            # Check for near-black
            is_black = item[0] < threshold and item[1] < threshold and item[2] < threshold
            
            if is_white or is_black:
                # Background pixel -> transparent
                newData.append((0, 0, 0, 0))
            else:
                newData.append(item)
                
        img.putdata(newData)
        
        # Determine new filename
        base = os.path.splitext(image_path)[0]
        new_path = base + ".png"
        
        img.save(new_path, "PNG")
        
        # Remove old jpeg if it was one
        if image_path.lower().endswith(('.jpeg', '.jpg')) and image_path != new_path:
            os.remove(image_path)
            
        print(f"Processed: {os.path.basename(image_path)} -> {os.path.basename(new_path)}")
        return new_path
    except Exception as e:
        print(f"Failed to process {image_path}: {e}")
        return None

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        target = sys.argv[1]
        if os.path.isfile(target):
            remove_background(target)
        elif os.path.isdir(target):
            for filename in os.listdir(target):
                if filename.lower().endswith((".png", ".jpeg", ".jpg")):
                    file_path = os.path.join(target, filename)
                    remove_background(file_path)
    else:
        directory = "public/assets/sprites/library"
        print(f"Scanning directory: {directory}")
        if os.path.exists(directory):
            for filename in os.listdir(directory):
                if filename.lower().endswith((".png", ".jpeg", ".jpg")):
                    file_path = os.path.join(directory, filename)
                    remove_background(file_path)
        else:
            print(f"Directory {directory} not found.")
    print("Done!")
