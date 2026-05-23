# Ayati Walking Sprite - Replacement Guide

## Task Overview
Replace "Avery Walking" sprite with new "Ayati Walking" sprite.

---

## Character Description: Ayati

**Appearance:**
- Brown hair in ponytail with purple headband
- Purple hoodie/sweatshirt
- Tan/beige cargo pants with purple pocket/pouch
- Purple sneakers with white soles
- Friendly, active pose (walking)

**Theme:** STEM education, active learning, movement

---

## Step-by-Step Process

### STEP 1: Prepare Your Images

You have 4 PNG images that need to be processed:

**Current Status:** PNG with black backgrounds (need to be fixed)

**What to do:**

#### Option A: Remove Background Online
1. Go to https://remove.bg
2. Upload each of the 4 images
3. Download the transparent PNG versions
4. Save as:
   - `ayati-walking-1.png`
   - `ayati-walking-2.png`
   - `ayati-walking-3.png`
   - `ayati-walking-4.png`

#### Option B: Use Photoshop/GIMP
1. Open each image
2. Select → Subject (or use Magic Wand on black background)
3. Select → Inverse
4. Delete background
5. Save as PNG with transparency

---

### STEP 2: Convert PNG to SVG

#### Using Adobe Illustrator:

1. **Import PNG**
   - File → Place
   - Select your transparent PNG
   - Click on canvas

2. **Image Trace Settings** (CRITICAL!)
   ```
   Mode: Color
   Palette: Full Tone
   Colors: 16-20
   
   ✓ Ignore White  ← MUST CHECK!
   
   Paths: 50%
   Corners: 75%
   Noise: 1px
   ```

3. **Expand and Clean**
   - Click "Expand"
   - Object → Ungroup
   - Delete any background rectangles
   - Object → Group

4. **Export as SVG**
   - File → Export → Export As
   - Format: SVG
   - Settings:
     - Styling: Presentation Attributes
     - ✓ Minify
     - ✗ Responsive

5. **Save as:**
   - `ayati_walking_ayati_walking-a.svg`
   - `ayati_walking_ayati_walking-b.svg`
   - `ayati_walking_ayati_walking-c.svg`
   - `ayati_walking_ayati_walking-d.svg`

---

### STEP 3: Fix Black Backgrounds (If Present)

After conversion, if SVGs have black backgrounds:

```powershell
# Copy SVG files to project folder
Copy-Item "path/to/ayati*.svg" "public/assets/sprites/leap/"

# Run the fix script
.\scripts\fix-svg-backgrounds.ps1 "public/assets/sprites/leap/ayati*.svg"
```

---

### STEP 4: Find and Update Avery Walking Registration

Let me search for the current Avery Walking entry:

```typescript
// In src/components/generated_leap_sprites.ts
// Find this entry:
{
  "id": "leap_avery_walking",
  "name": "Avery Walking",
  "emoji": "🤖",
  "image": "assets/sprites/leap/avery_walking_avery_walking-a.svg",
  "costumes": [
    "assets/sprites/leap/avery_walking_avery_walking-a.svg",
    "assets/sprites/leap/avery_walking_avery_walking-b.svg",
    "assets/sprites/leap/avery_walking_avery_walking-c.svg",
    "assets/sprites/leap/avery_walking_avery_walking-d.svg"
  ],
  "tags": [
    "people",
    "walking"
  ],
  "category": "leap"
}
```

**Replace with:**

```typescript
{
  "id": "leap_ayati_walking",
  "name": "Ayati Walking",
  "emoji": "👧",
  "image": "assets/sprites/leap/ayati_walking_ayati_walking-a.svg",
  "costumes": [
    "assets/sprites/leap/ayati_walking_ayati_walking-a.svg",
    "assets/sprites/leap/ayati_walking_ayati_walking-b.svg",
    "assets/sprites/leap/ayati_walking_ayati_walking-c.svg",
    "assets/sprites/leap/ayati_walking_ayati_walking-d.svg"
  ],
  "tags": [
    "people",
    "person",
    "girl",
    "walking",
    "active",
    "movement",
    "student",
    "education",
    "stem",
    "learning",
    "kid"
  ],
  "category": "leap"
}
```

---

### STEP 5: Delete Old Avery Walking Files

```powershell
# Delete old Avery Walking sprite files
Remove-Item "public/assets/sprites/leap/avery_walking_avery_walking-*.svg"
```

---

### STEP 6: Verify File Names

Make sure your new files are named correctly:

```
✓ ayati_walking_ayati_walking-a.svg
✓ ayati_walking_ayati_walking-b.svg
✓ ayati_walking_ayati_walking-c.svg
✓ ayati_walking_ayati_walking-d.svg
```

**Naming Rules:**
- All lowercase
- Underscores for spaces
- Format: `{name}_{name}-{letter}.svg`

---

### STEP 7: Test

```bash
npm run dev
```

**In the application:**
1. Open sprite library
2. Search for "Ayati" or "walking"
3. Select Ayati Walking sprite
4. Verify:
   - ✅ Transparent background
   - ✅ Character visible clearly
   - ✅ All 4 walking poses work
   - ✅ Looks good on different backgrounds

---

## Quick Commands Summary

```powershell
# 1. Copy new SVG files to project
Copy-Item "source/ayati*.svg" "public/assets/sprites/leap/"

# 2. Fix black backgrounds
.\scripts\fix-svg-backgrounds.ps1 "public/assets/sprites/leap/ayati*.svg"

# 3. Delete old Avery Walking files
Remove-Item "public/assets/sprites/leap/avery_walking_*.svg"

# 4. Start dev server
npm run dev
```

---

## Checklist

- [ ] Downloaded/saved 4 Ayati images
- [ ] Removed black backgrounds from PNGs
- [ ] Converted to SVG using Adobe Illustrator
- [ ] Checked "Ignore White" in Image Trace
- [ ] Named files correctly (ayati_walking_ayati_walking-a/b/c/d.svg)
- [ ] Copied to public/assets/sprites/leap/
- [ ] Ran fix-svg-backgrounds.ps1 script
- [ ] Verified transparent backgrounds
- [ ] Updated generated_leap_sprites.ts
- [ ] Deleted old Avery Walking files
- [ ] Tested in application
- [ ] All 4 poses work correctly

---

## Character Comparison

### Old: Avery Walking
- Generic character
- Basic walking animation

### New: Ayati Walking
- Girl with brown ponytail
- Purple hoodie and headband
- Tan cargo pants with purple pocket
- Purple sneakers
- More detailed and colorful
- STEM education theme

---

## Troubleshooting

### Problem: Black background in SVG
**Solution:** Run `.\scripts\fix-svg-backgrounds.ps1`

### Problem: Character not showing in app
**Solution:** Check file names match exactly in generated_leap_sprites.ts

### Problem: Sprite looks pixelated
**Solution:** Use higher resolution PNG or adjust Image Trace settings

### Problem: Old Avery sprite still showing
**Solution:** 
1. Clear browser cache (Ctrl+Shift+Delete)
2. Restart dev server
3. Verify old files are deleted

---

## File Locations

**Sprite Files:**
```
public/assets/sprites/leap/
├── ayati_walking_ayati_walking-a.svg
├── ayati_walking_ayati_walking-b.svg
├── ayati_walking_ayati_walking-c.svg
└── ayati_walking_ayati_walking-d.svg
```

**Registration:**
```
src/components/generated_leap_sprites.ts
```

**Fix Script:**
```
scripts/fix-svg-backgrounds.ps1
```

---

## Next Steps After Completion

1. **Test thoroughly** - Try all 4 walking poses
2. **Check on different backgrounds** - White, black, colored
3. **Verify in actual projects** - Make sure it works in user projects
4. **Document** - Add to sprite library documentation
5. **Commit changes** - Git commit with clear message

---

**Status:** Ready to implement
**Estimated Time:** 30-45 minutes
**Difficulty:** Medium (requires Adobe Illustrator or similar tool)

---

## Need Help?

- **Black background issue:** See `QUICK_FIX_BLACK_BACKGROUND.txt`
- **Complete workflow:** See `CHATGPT_TO_SPRITE_WORKFLOW.md`
- **SVG conversion:** See `PREVENT_BLACK_BACKGROUND_GUIDE.md`
