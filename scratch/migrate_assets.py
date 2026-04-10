import os
import re

def migrate_assets(directory):
    count = 0
    # Pattern to match "/assets/ but not //assets/ or http://.../assets/
    # We look for " or ' followed by /assets/
    pattern_double = re.compile(r'\"/assets/')
    pattern_single = re.compile(r"'/assets/")

    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.jsx', '.ts', '.js')):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = pattern_double.sub('"assets/', content)
                new_content = pattern_single.sub("'assets/", new_content)
                
                if new_content != content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated {path}")
                    count += 1
    
    print(f"Total files updated: {count}")

if __name__ == "__main__":
    migrate_assets('src')
