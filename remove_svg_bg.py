import xml.etree.ElementTree as ET

svg_path = r"c:\Users\ruthr\OneDrive\Desktop\leapblocks\public\assets\topbar_logo.svg"
tree = ET.parse(svg_path)
root = tree.getroot()

ns = {'svg': 'http://www.w3.org/2000/svg'}
ET.register_namespace('', ns['svg'])

removed_count = 0

# Method 1: Find and remove any element with a white-ish fill
def is_white(fill_str):
    if not fill_str: return False
    val = fill_str.lower().strip()
    return val in ['white', '#fff', '#ffffff']

# Let's recursively search and remove
def remove_white_bg(parent):
    global removed_count
    to_remove = []
    for child in parent:
        # Check fill
        if 'fill' in child.attrib and is_white(child.attrib['fill']):
            to_remove.append(child)
        # Check style for fill:white
        elif 'style' in child.attrib and 'fill:white' in child.attrib['style'].replace(' ', ''):
            to_remove.append(child)
        elif 'style' in child.attrib and 'fill:#fff' in child.attrib['style'].replace(' ', ''):
            to_remove.append(child)
        elif child.tag.endswith('rect'):
            # If it's a huge rect (background), e.g. width 100% or matches viewBox
            w = child.attrib.get('width', '')
            h = child.attrib.get('height', '')
            if w == '100%' or w == '723' or w == '720' or w == '720.738281': # from earlier inspection
                to_remove.append(child)

        # Recursion
        remove_white_bg(child)

    for item in to_remove:
        try:
            parent.remove(item)
            removed_count += 1
            print(f"Removed item: {item.tag} {item.attrib}")
        except:
            pass

remove_white_bg(root)

# Save changes back
if removed_count > 0:
    tree.write(svg_path, encoding='utf-8', xml_declaration=True)
    print(f"Success: Removed {removed_count} background elements.")
else:
    print("No white background elements found. Let's try another approach...")

    # Method 2: the very first path/rect inside the main group or defs often is the bg
    # If there's a big filter or clip path, that's different.
