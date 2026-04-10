import os
import re

TARGET_DIR = "src/modules/leapforge"

def rename_content(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Replacements
    new_content = content.replace("wokwi", "leap")
    new_content = new_content.replace("Wokwi", "Leap")
    new_content = new_content.replace("WOKWI", "LEAP")

    if new_content != content:
        with open(file_path, "w", encoding="utf-8", newline="\n") as f:
            f.write(new_content)

def rename_files(directory):
    for root, dirs, files in os.walk(directory, topdown=False):
        for name in files:
            file_path = os.path.join(root, name)
            if file_path.endswith((".ts", ".tsx", ".js", ".json", ".md", ".html", ".css", ".svg")):
                try:
                    rename_content(file_path)
                except Exception as e:
                    pass

            if "wokwi" in name.lower():
                new_name = name.replace("wokwi", "leap").replace("Wokwi", "Leap")
                new_path = os.path.join(root, new_name)
                os.rename(file_path, new_path)

        for name in dirs:
            if "wokwi" in name.lower():
                new_name = name.replace("wokwi", "leap").replace("Wokwi", "Leap")
                old_path = os.path.join(root, name)
                new_path = os.path.join(root, new_name)
                os.rename(old_path, new_path)

if __name__ == "__main__":
    rename_files(TARGET_DIR)
