# 🎈 Balloon Sprite Replacement - Complete Instructions

## ✅ What's Already Done

1. **Sprite registration updated** in `src/components/generated_leap_sprites.ts`
   - Now supports 5 balloon costumes (a, b, c, d, e)
   - Emoji changed to 🎈

2. **Background fix script created**: `scripts/fix-balloon-backgrounds.ps1`

---

## 📋 Your 5 New Balloon Images

Based on the images you showed:
1. 🎈 **Pink balloon** (bright pink)
2. 💜 **Purple balloon** (lavender/light purple)
3. 💚 **Green balloon** (lime green)
4. 🩷 **Light pink balloon** (coral/salmon pink)
5. 🩵 **Cyan balloon** (light blue/turquoise)

---

## 🔧 Step-by-Step Process

### Step 1: Save Your PNG Images

Save your 5 balloon PNG images to a temporary folder, for example:
```
C:\Users\ruthr\Desktop\temp_balloons\
```

Name them clearly:
- `pink_balloon.png`
- `purple_balloon.png`
- `green_balloon.png`
- `coral_balloon.png`
- `cyan_balloon.png`

---

### Step 2: Convert PNG to SVG

**Option A: Using Adobe Illustrator** (Recommended)
1. Open each PNG in Illustrator
2. Select the image
3. Go to: **Object → Image Trace → Make**
4. Go to: **Object → Expand**
5. Go to: **File → Export → Export As → SVG**
6. **IMPORTANT**: In export settings, check **"Ignore White"** to prevent black backgrounds
7. Save as SVG

**Option B: Using Online Converter**
1. Go to https://vectorizer.ai or https://convertio.co/png-svg/
2. Upload each PNG
3. Download the SVG
4. Note: May need manual background removal

---

### Step 3: Rename SVG Files

Rename your 5 SVG files to match the naming convention:

```
Pink balloon    → balloon1_balloon1-a.svg
Purple balloon  → balloon1_balloon1-b.svg
Green balloon   → balloon1_balloon1-c.svg
Coral balloon   → balloon1_balloon1-d.svg
Cyan balloon    → balloon1_balloon1-e.svg
```

---

### Step 4: Copy to Project

Copy all 5 SVG files to the project:

**PowerShell command**:
```powershell
Copy-Item "C:\Users\ruthr\Desktop\temp_balloons\balloon1_balloon1-*.svg" "C:\Users\ruthr\OneDrive\Desktop\leapblocks\public\assets\sprites\leap\" -Force
```

**Or manually**:
- Copy the 5 files to: `public/assets/sprites/leap/`

---

### Step 5: Fix Black Backgrounds

Run the background fix script:

```powershell
cd C:\Users\ruthr\OneDrive\Desktop\leapblocks
./scripts/fix-balloon-backgrounds.ps1
```

This will:
- ✅ Remove large black/white background rectangles
- ✅ Preserve all balloon colors and designs
- ✅ Make backgrounds transparent

---

### Step 6: Test in Application

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Open sprite library** in your application

3. **Find "Balloon1" sprite** 🎈

4. **Verify all 5 colors**:
   - ✅ Pink balloon appears
   - ✅ Purple balloon appears
   - ✅ Green balloon appears
   - ✅ Coral balloon appears
   - ✅ Cyan balloon appears
   - ✅ All have transparent backgrounds

---

## 🚀 Quick Method (If You Already Have SVG Files)

If your balloon images are already in SVG format:

1. **Rename them**:
   ```
   balloon1_balloon1-a.svg (Pink)
   balloon1_balloon1-b.svg (Purple)
   balloon1_balloon1-c.svg (Green)
   balloon1_balloon1-d.svg (Coral)
   balloon1_balloon1-e.svg (Cyan)
   ```

2. **Copy to project**:
   ```powershell
   Copy-Item "path\to\your\balloon1_balloon1-*.svg" "public\assets\sprites\leap\" -Force
   ```

3. **Fix backgrounds**:
   ```powershell
   ./scripts/fix-balloon-backgrounds.ps1
   ```

4. **Test**:
   ```bash
   npm run dev
   ```

---

## 📊 Current Status

| Task | Status |
|------|--------|
| Sprite registration updated | ✅ Done |
| Background fix script created | ✅ Done |
| 5 balloon SVG files added | ⏳ Waiting |
| Backgrounds fixed | ⏳ Pending |
| Tested in application | ⏳ Pending |

---

## ⚠️ Common Issues

### Issue: Black background still appears
**Solution**: 
1. Open the SVG in a text editor
2. Look for `<rect>` or `<path>` with `fill="#000000"`
3. Delete those elements
4. Or re-run: `./scripts/fix-balloon-backgrounds.ps1`

### Issue: Balloon colors look wrong
**Solution**:
- Check the original PNG has correct colors
- Re-convert with better settings
- Verify SVG color values in text editor

### Issue: File size too large
**Solution**:
- Use https://jakearchibald.github.io/svgomg/ to optimize
- Remove unnecessary elements
- Simplify paths

---

## 📝 Next Steps

**Tell me**:
1. Where did you save the 5 balloon PNG images?
2. Do you need help converting them to SVG?
3. Are they already in SVG format?

I can create a custom automated script to handle everything if you provide the file locations!

---

## 🎯 Expected Result

After completion, you'll have:
- 5 colorful balloon sprites
- Transparent backgrounds
- All working in your application
- Smooth costume switching between colors

**Balloon colors**: Pink → Purple → Green → Coral → Cyan 🎈
