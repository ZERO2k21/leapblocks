import xml.etree.ElementTree as ET
import os

svg_path = r"c:\Users\ruthr\OneDrive\Desktop\leapblocks\public\assets\topbar_logo.svg"
tree = ET.parse(svg_path)
root = tree.getroot()

# The namespace
ns = {'svg': 'http://www.w3.org/2000/svg'}
ET.register_namespace('', ns['svg'])

print("Parsing SVG...")
removed_count = 0

# Usually inside <defs><clipPath> the background paths are not the ones we want to remove,
# but rather direct child <rect> or <path> elements in the main <g> or <svg> that define the background.

# Check direct children for path or rect
for child in list(root):
    if child.tag.endswith('path') or child.tag.endswith('rect'):
        # Check if it looks like a large background rect or path.
        # Background paths often look like M xx 0 L yy 0 L yy zz etc covering the whole bounding box.
        # Or have fill properties matching a solid background.
        # For safety, let's look for `<path d="M 0 0 L 720.something ...">`
        # But wait, looking at the first clipPath: M 2.25 0 L 720 0 L 720 158
        attrib_str = str(child.attrib)
        # We can just print the initial huge paths to see what they are
        print(child.tag, attrib_str[:80])

# Since I haven't seen the whole file, let's just forcefully remove the largest path if it's white or if it covers the whole screen? No, the background might be white. Let's find fill="white" or fill="#ffffff"
res = []
for elem in root.iter():
    if 'fill' in elem.attrib and 'white' in str(elem.attrib['fill']).lower():
        res.append(elem)
    if 'fill' in elem.attrib and '#fff' in str(elem.attrib['fill']).lower():
        res.append(elem)

print("Found elements with white fill:", len(res))

# Wait, the prompt specifically said "remove background by python". Maybe using a known UI module or rembg is what they meant if it wasn't an SVG?
# Let's inspect the file extension and type.
print("File size:", os.path.getsize(svg_path))
