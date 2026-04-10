import sys

def clean_sprite_panel(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    skip = False
    for i, line in enumerate(lines):
        if 'Floating action button' in line:
            skip = True
            continue
        if skip:
            # Look for the closing div of the floating action container
            # The floatingAction containers are followed by '</div>' then either </div> or {/* Stage Area */}
            if '</div>' in line and (i+1 < len(lines) and (
                '</div>' in lines[i+1] or 
                'Stage Area' in lines[i+1] or 
                'return (' in lines[i+1]
            )):
                skip = False
                continue
            continue
        new_lines.append(line)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

if __name__ == "__main__":
    clean_sprite_panel('src/stage/SpritePanel.tsx')
