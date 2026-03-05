import os
from PIL import Image

def remove_white_background(image_path, threshold=240):
    try:
        img = Image.open(image_path).convert("RGBA")
        datas = img.getdata()
        
        newData = []
        for item in datas:
            # item is (R, G, B, A)
            if item[0] > threshold and item[1] > threshold and item[2] > threshold:
                # White pixel -> transparent
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)
                
        img.putdata(newData)
        img.save(image_path, "PNG")
        print(f"Processed: {os.path.basename(image_path)}")
    except Exception as e:
        print(f"Failed to process {image_path}: {e}")

if __name__ == "__main__":
    directory = "public/assets/sprites/library"
    print(f"Scanning directory: {directory}")
    for filename in os.listdir(directory):
        if filename.endswith(".png"):
            file_path = os.path.join(directory, filename)
            remove_white_background(file_path)
    print("Done!")
