# 🎨 Aayala Sprite Replacement Guide

## Replacing Abby with Aayala

You have 4 PNG images of Aayala that need to be converted to SVG and replace the Abby sprite.

---

## Current Status

**Aayala Character:**
- Brown hair with side ponytail
- Green v-neck shirt with yellow trim
- Blue jeans with rolled cuffs
- Green sneakers with white laces
- Friendly, approachable appearance

**4 Poses:**
1. Standing (neutral pose)
2. Excited (fists raised, celebrating)
3. Thinking (hand on chin)
4. Walking (casual stride)

---

## Process Overview

```
Your PNG Images → Remove Background → Convert to SVG → Optimize → Replace Abby
```

---

## Step-by-Step Instructions

### Option 1: Quick Method (Using Online Tools)

#### Step 1: Remove Black Background

**Tool:** Remove.bg or Photopea

**Method A: Remove.bg**
```
1. Go to https://www.remove.bg/
2. Upload each of your 4 Aayala PNG images
3. Download transparent PNG versions
4. You'll get: aayala-1.png, aayala-2.png, aayala-3.png, aayala-4.png
```

**Method B: Photopea (Free Photoshop Alternative)**
```
1. Go to https://www.photopea.com/
2. Open your PNG image
3. Select → Color Range
4. Click on black background
5. Delete
6. File → Export As → PNG
7. Repeat for all 4 images
```

#### Step 2: Convert PNG to SVG

**Tool:** Vectorizer.ai (Best Quality)

```
1. Go to https://vectorizer.ai/
2. Upload transparent PNG (from Step 1)
3. Wait for automatic vectorization
4. Download SVG
5. Repeat for all 4 images
```

**Alternative:** SVGator (Free Tier)
```
1. Go to https://www.svgator.com/convert-image-to-svg
2. Upload transparent PNG
3. Convert
4. Download SVG
```

#### Step 3: Optimize SVG Files

```
1. Go to https://jakearchibald.github.io/svgomg/
2. Upload each SVG
3. Use default settings
4. Download optimized SVG
5. Repeat for all 4 files
```

#### Step 4: Rename Files

Rename your 4 optimized SVG files to:
```
aayala_aayala-a.svg  (standing pose)
aayala_aayala-b.svg  (excited pose)
aayala_aayala-c.svg  (thinking pose)
aayala_aayala-d.svg  (walking pose)
```

**Naming Convention:** `{spritename}_{spritename}-{letter}.svg`

---

### Option 2: Manual Method (If You Have the Images Saved)

If you've already saved the images from ChatGPT, follow these PowerShell commands:

#### Step 1: Check Your Downloaded Images

```powershell
# Navigate to your downloads folder
cd ~/Downloads

# List Aayala images
ls *aayala* -or- ls ChatGPT*
```

#### Step 2: Process Images

I'll create a helper script for you. But first, you need to:

1. **Remove black backgrounds** using Remove.bg or Photopea
2. **Convert to SVG** using Vectorizer.ai
3. **Optimize** using SVGOMG
4. **Rename** to correct format

---

## Replacement Process

Once you have the 4 SVG files ready:

### Step 1: Backup Old Abby Sprite

```powershell
# Create backup
mkdir public/assets/sprites/leap_backup -ErrorAction SilentlyContinue
cp public/assets/sprites/leap/abby_abby-*.svg public/assets/sprites/leap_backup/
```

### Step 2: Delete Old Abby Files

```powershell
# Delete old Abby sprites
rm public/assets/sprites/leap/abby_abby-*.svg
```

### Step 3: Copy New Aayala Files

```powershell
# Copy new Aayala sprites
# (Replace 'path/to/your/files' with actual path)
cp path/to/your/files/aayala_aayala-*.svg public/assets/sprites/leap/
```

### Step 4: Update Sprite Registration

Edit: `src/components/generated_leap_sprites.ts`

**Find the Abby entry (around line 10-30):**
```typescript
{
  "id": "leap_abby",
  "name": "Abby",
  "emoji": "🤖",
  "image": "assets/sprites/leap/abby_abby-a.svg",
  "costumes": [
    "assets/sprites/leap/abby_abby-a.svg",
    "assets/sprites/leap/abby_abby-b.svg",
    "assets/sprites/leap/abby_abby-c.svg",
    "assets/sprites/leap/abby_abby-d.svg"
  ],
  "tags": [
    "people",
    "person",
    "drawing"
  ],
  "category": "leap"
}
```

**Replace with Aayala entry:**
```typescript
{
  "id": "leap_aayala",
  "name": "Aayala",
  "emoji": "👧",
  "image": "assets/sprites/leap/aayala_aayala-a.svg",
  "costumes": [
    "assets/sprites/leap/aayala_aayala-a.svg",
    "assets/sprites/leap/aayala_aayala-b.svg",
    "assets/sprites/leap/aayala_aayala-c.svg",
    "assets/sprites/leap/aayala_aayala-d.svg"
  ],
  "tags": [
    "people",
    "person",
    "girl",
    "student",
    "education",
    "stem",
    "learning"
  ],
  "category": "leap"
}
```

### Step 5: Restart Dev Server

```bash
npm run dev
```

### Step 6: Test

1. Open sprite library
2. Search for "Aayala"
3. Select sprite
4. Test all 4 costumes
5. Verify costume switching works

---

## Quick Commands Summary

```powershell
# 1. Backup
mkdir public/assets/sprites/leap_backup -ErrorAction SilentlyContinue
cp public/assets/sprites/leap/abby_abby-*.svg public/assets/sprites/leap_backup/

# 2. Delete old
rm public/assets/sprites/leap/abby_abby-*.svg

# 3. Copy new (update path)
cp ~/Downloads/aayala_aayala-*.svg public/assets/sprites/leap/

# 4. Verify
ls public/assets/sprites/leap/aayala_aayala-*.svg

# 5. Test
npm run dev
```

---

## Troubleshooting

### Issue: Black background still visible
**Solution:** Use Remove.bg or Photopea to remove background before converting to SVG

### Issue: SVG looks pixelated
**Solution:** Ensure you're using vector conversion (Vectorizer.ai), not just wrapping PNG in SVG

### Issue: File size too large
**Solution:** Run through SVGOMG optimizer

### Issue: Sprite doesn't appear
**Solution:** 
- Check file names match exactly
- Verify files are in public/assets/sprites/leap/
- Check registration in generated_leap_sprites.ts
- Restart dev server

---

## Checklist

- [ ] Downloaded 4 Aayala PNG images
- [ ] Removed black backgrounds
- [ ] Converted to SVG format
- [ ] Optimized SVG files
- [ ] Renamed to correct format
- [ ] Backed up old Abby sprite
- [ ] Deleted old Abby files
- [ ] Copied new Aayala files
- [ ] Updated registration
- [ ] Restarted dev server
- [ ] Tested in sprite library
- [ ] All 4 costumes work

---

## Need Help?

If you need assistance with any step, I can:
1. Help you process the images
2. Create the SVG files
3. Update the registration
4. Test the sprite

Just let me know which step you need help with!
