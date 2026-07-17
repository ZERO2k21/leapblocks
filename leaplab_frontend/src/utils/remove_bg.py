#!/usr/bin/env python3
"""
Background removal script for LeapBlocks Electron app.
Usage: python remove_bg.py <image_path>

Reads the image, removes background using flood-fill from edges,
and overwrites the file as a PNG with transparent background.
"""
import sys
import os
from collections import deque

try:
    from PIL import Image
except ImportError:
    print("Pillow not installed. Run: pip install Pillow", file=sys.stderr)
    sys.exit(1)


def flood_fill_remove_bg(img: Image.Image, tolerance: int = 40) -> Image.Image:
    """Remove background by flood-filling from image edges."""
    img = img.convert("RGBA")
    pixels = img.load()
    w, h = img.size

    visited = set()
    queue = deque()

    def color_match(p1, p2):
        dr = p1[0] - p2[0]
        dg = p1[1] - p2[1]
        db = p1[2] - p2[2]
        return (dr * dr + dg * dg + db * db) < tolerance * tolerance

    def enqueue(x, y):
        if 0 <= x < w and 0 <= y < h and (x, y) not in visited:
            p = pixels[x, y]
            if p[3] > 0:
                visited.add((x, y))
                queue.append((x, y))

    # Seed from corners and edge midpoints
    seeds = [
        (0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1),
        (w // 2, 0), (w // 2, h - 1),
        (0, h // 2), (w - 1, h // 2),
    ]

    for sx, sy in seeds:
        if (sx, sy) in visited:
            continue
        ref = pixels[sx, sy]
        if ref[3] == 0:
            continue

        queue.clear()
        enqueue(sx, sy)

        while queue:
            x, y = queue.popleft()
            p = pixels[x, y]
            if not color_match(p, ref):
                continue
            # Set alpha to 0
            pixels[x, y] = (p[0], p[1], p[2], 0)
            enqueue(x + 1, y)
            enqueue(x - 1, y)
            enqueue(x, y + 1)
            enqueue(x, y - 1)

    return img


def main():
    if len(sys.argv) < 2:
        print("Usage: python remove_bg.py <image_path>", file=sys.stderr)
        sys.exit(1)

    image_path = sys.argv[1]
    if not os.path.isfile(image_path):
        print(f"File not found: {image_path}", file=sys.stderr)
        sys.exit(1)

    try:
        img = Image.open(image_path)
        result = flood_fill_remove_bg(img)
        # Overwrite as PNG
        result.save(image_path, "PNG")
        print(f"Background removed: {image_path}")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
