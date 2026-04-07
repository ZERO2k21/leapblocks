filepath = r"c:\Users\ruthr\OneDrive\Desktop\leapblocks\src\python\PythonApp.jsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

patches = []

# --- Fix 1: Wrong backdrop paths ---
fixes = [
    ("'/assets/sprites/Space.png'",    "'/assets/backdrops/Space.png'"),
    ("'/assets/sprites/Beach.png'",    "'/assets/backdrops/Beach.png'"),
    ("'/assets/sprites/Castle.png'",   "'/assets/backdrops/Castle.png'"),
    ("'/assets/sprites/Artic.png'",    "'/assets/backdrops/Artic.png'"),
    ("'/assets/sprites/city.svg'",     "'/assets/backdrops/city.svg'"),
    ("'/assets/sprites/park.svg'",     "'/assets/backdrops/park.svg'"),
    ("'/assets/sprites/maze.svg'",     "'/assets/backdrops/maze.svg'"),
    ("'/assets/sprites/underwater.svg'", "'/assets/backdrops/underwater.svg'"),
    ("'/assets/sprites/space_bg.svg'", "'/assets/backdrops/space_bg.svg'"),
]
for old, new in fixes:
    if old in content:
        content = content.replace(old, new)
        patches.append(f"Backdrop path: {old} -> {new}")

if patches:
    print(f"Fix 1: {len(patches)} backdrop paths fixed")
else:
    print("Fix 1: No backdrop paths found to fix")

# --- Fix 2: Centre sprites on stage ---
# The sprites use left:x, top:y from top-left corner
# We need to offset by 50% of stage dimensions
# Replace the sprite rendering with calc-based centering
old_sprite_div = '                            {/* Sprites */}\n                            <div style={{ width: "100%", height: "100%", position: "relative" }}>\n                                {sprites.map(sp => sp.visible && (\n                                    <Teddy key={sp.id} id={sp.id} type={sp.type} active={sp.id === selectedSpriteId}\n                                        x={sp.x} y={sp.y} angle={sp.angle} size={sp.size}\n                                        visible={sp.visible} currentCostume={sp.currentCostume}\n                                        costumes={sp.costumes} speech={sp.speech} />\n                                ))}\n                            </div>'

new_sprite_div = '''                            {/* Sprites - x/y are relative to stage center */}
                            <div style={{ width: "100%", height: "100%", position: "relative" }} ref={stageRef}>
                                {sprites.map(sp => sp.visible && (
                                    <Teddy key={sp.id} id={sp.id} type={sp.type} active={sp.id === selectedSpriteId}
                                        x={(stageSize.w / 2) + (sp.x * (stageSize.w / 480)) - 40}
                                        y={(stageSize.h / 2) - (sp.y * (stageSize.h / 360)) - 40}
                                        angle={sp.angle} size={sp.size}
                                        visible={sp.visible} currentCostume={sp.currentCostume}
                                        costumes={sp.costumes} speech={sp.speech}
                                        onClick={() => setSelectedSpriteId(sp.id)} />
                                ))}
                            </div>'''

if old_sprite_div in content:
    content = content.replace(old_sprite_div, new_sprite_div, 1)
    print("Fix 2: Sprite centering applied")
else:
    print("Fix 2: Sprite div NOT FOUND — checking fallback")
    idx = content.find('Sprites')
    print(repr(content[idx:idx+300]))

# --- Fix 3: [object Event] error stringification ---
old_err = "addLog(`✗ ${e?.toString?.() || e}`, \"error\");"
new_err = """addLog("✗ " + (typeof e === 'string' ? e : e?.message || e?.toString?.() || JSON.stringify(e) || "Unknown error"), "error");"""

if old_err in content:
    content = content.replace(old_err, new_err)
    print("Fix 3: Error stringification fixed")
else:
    # try looking for the pattern differently
    idx = content.find("toString?.()")
    if idx > 0:
        print("Fix 3: Found toString alternative - showing context:")
        print(repr(content[idx-50:idx+100]))
    else:
        print("Fix 3: Not found")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("All fixes saved")
