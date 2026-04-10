import os
import re

TARGET_DIR = "src/modules/leapforge/elements/leap-elements"

def rename_content(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Replacements
    content = content.replace("wokwi", "leap")
    content = content.replace("Wokwi", "Leap")
    content = content.replace("WOKWI", "LEAP")

    with open(file_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)

def rename_files(directory):
    for root, dirs, files in os.walk(directory, topdown=False):
        for name in files:
            # Rename content first
            file_path = os.path.join(root, name)
            if file_path.endswith((".ts", ".js", ".json", ".md", ".html", ".css", ".svg")):
                try:
                    rename_content(file_path)
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")

            # Rename file if necessary
            if "wokwi" in name.lower():
                new_name = name.replace("wokwi", "leap").replace("Wokwi", "Leap")
                new_path = os.path.join(root, new_name)
                os.rename(file_path, new_path)
                print(f"Renamed file: {name} -> {new_name}")

        for name in dirs:
            if "wokwi" in name.lower():
                new_name = name.replace("wokwi", "leap").replace("Wokwi", "Leap")
                old_path = os.path.join(root, name)
                new_path = os.path.join(root, new_name)
                os.rename(old_path, new_path)
                print(f"Renamed dir: {name} -> {new_name}")

if __name__ == "__main__":
    rename_files(TARGET_DIR)
    print("Renaming complete.")
