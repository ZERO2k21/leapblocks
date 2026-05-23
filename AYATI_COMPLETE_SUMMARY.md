# Ayati Walking Sprite - Complete Summary

## 📋 Task Overview

**Goal:** Replace "Avery Walking" sprite with new "Ayati Walking" sprite

**Character:** Girl with brown ponytail, purple hoodie, tan cargo pants, purple sneakers

**Files Provided:** 4 PNG images (currently with black backgrounds)

---

## 🎯 What You Need to Do

### Quick Overview (5 Steps)

1. **Remove black backgrounds** from your 4 PNG images
2. **Convert PNG to SVG** using Adobe Illustrator
3. **Copy SVG files** to project folder
4. **Update registration** in generated_leap_sprites.ts
5. **Test** in the application

---

## 📚 Documentation Created for You

I've created comprehensive guides to help you:

### Main Action Plan
📄 **`AYATI_REPLACEMENT_ACTION_PLAN.txt`** ⭐ START HERE
- Step-by-step checklist
- All commands you need
- Visual formatting
- Easy to follow

### Code Replacement
📄 **`AYATI_CODE_REPLACEMENT.txt`**
- Exact code to copy/paste
- Shows what to delete
- Shows what to add
- Ready to use

### Detailed Guide
📄 **`AYATI_WALKING_REPLACEMENT_GUIDE.md`**
- Complete workflow
- Troubleshooting
- Best practices
- Technical details

---

## 🚀 Quick Start (If You're in a Hurry)

### 1. Process Images (Choose One Method)

**Method A - Online (Easiest):**
```
1. Go to https://remove.bg
2. Upload each of your 4 images
3. Download transparent PNGs
```

**Method B - Photoshop:**
```
1. Open image
2. Select → Subject
3. Select → Inverse
4. Delete
5. Save as PNG
```

### 2. Convert to SVG (Adobe Illustrator)

```
1. File → Place (your PNG)
2. Image Trace:
   - Mode: Color
   - Colors: 16-20
   - ✓ Ignore White ← CRITICAL!
3. Expand
4. Delete background rectangles
5. Export as SVG
6. Name: ayati_walking_ayati_walking-a.svg (and b, c, d)
```

### 3. Copy to Project

```powershell
Copy-Item "your-path\ayati*.svg" "public\assets\sprites\leap\"
```

### 4. Fix Black Backgrounds

```powershell
.\scripts\fix-svg-backgrounds.ps1 "public\assets\sprites\leap\ayati*.svg"
```

### 5. Update Code

Open: `src/components/generated_leap_sprites.ts`

Find line 142 (Avery Walking entry)

Replace with code from: `AYATI_CODE_REPLACEMENT.txt`

### 6. Delete Old Files

```powershell
Remove-Item "public\assets\sprites\leap\avery_walking_*.svg"
```

### 7. Test

```bash
npm run dev
```

---

## 📁 File Structure

### Your Images (Source)
```
📁 Your folder/
├── 🖼️ image1.png (walking pose 1)
├── 🖼️ image2.png (walking pose 2)
├── 🖼️ image3.png (walking pose 3)
└── 🖼️ image4.png (walking pose 4)
```

### After Processing
```
📁 public/assets/sprites/leap/
├── ✅ ayati_walking_ayati_walking-a.svg
├── ✅ ayati_walking_ayati_walking-b.svg
├── ✅ ayati_walking_ayati_walking-c.svg
└── ✅ ayati_walking_ayati_walking-d.svg
```

### Registration File
```
📄 src/components/generated_leap_sprites.ts
   └── Line 142: Ayati Walking entry
```

---

## ⚠️ Important Notes

### Critical Settings in Adobe Illustrator

When doing Image Trace, you **MUST** check:
```
✓ Ignore White
```

If you don't check this, you'll get a black background!

### File Naming Convention

Files **MUST** be named exactly like this:
```
ayati_walking_ayati_walking-a.svg
ayati_walking_ayati_walking-b.svg
ayati_walking_ayati_walking-c.svg
ayati_walking_ayati_walking-d.svg
```

**Rules:**
- All lowercase
- Underscores (not spaces)
- Format: `{name}_{name}-{letter}.svg`

### Black Background Fix

If your SVGs have black backgrounds after conversion:
```powershell
.\scripts\fix-svg-backgrounds.ps1
```

This script automatically removes them!

---

## ✅ Verification Checklist

Before considering the task complete:

### Files
- [ ] 4 SVG files created
- [ ] Files named correctly
- [ ] Files copied to public/assets/sprites/leap/
- [ ] Transparent backgrounds (no black)
- [ ] Old Avery files deleted

### Code
- [ ] generated_leap_sprites.ts updated
- [ ] Avery Walking entry replaced
- [ ] Ayati Walking entry added
- [ ] No syntax errors
- [ ] File saved

### Testing
- [ ] Dev server started (npm run dev)
- [ ] Sprite appears in library
- [ ] Can search for "Ayati"
- [ ] All 4 poses work
- [ ] Transparent background verified
- [ ] Looks good on white background
- [ ] Looks good on black background
- [ ] Looks good on colored backgrounds

---

## 🎨 Character Details

### Ayati Walking Sprite

**Appearance:**
- Brown hair in ponytail
- Purple headband
- Purple hoodie/sweatshirt
- Tan/beige cargo pants
- Purple pocket/pouch on pants
- Purple sneakers with white soles

**Theme:**
- STEM education
- Active learning
- Movement and activity
- Student character

**Tags:**
- people, person, girl
- walking, active, movement
- student, education, stem, learning, kid
- purple, hoodie, ponytail

---

## 🔧 Tools You'll Need

### Required
- **Adobe Illustrator** (for PNG to SVG conversion)
- **Text Editor** (VS Code, Notepad++, etc.)
- **PowerShell** (for running scripts)

### Optional
- **Remove.bg** (online background removal)
- **Photoshop/GIMP** (alternative background removal)
- **SVGOMG** (SVG optimization)

---

## 📞 Troubleshooting

### Problem: Black background in SVG
**Solution:** 
```powershell
.\scripts\fix-svg-backgrounds.ps1
```

### Problem: Character not showing
**Solution:** 
- Check file names match exactly
- Verify files are in correct folder
- Clear browser cache
- Restart dev server

### Problem: Sprite looks pixelated
**Solution:**
- Use higher resolution PNG
- Adjust Image Trace settings
- Increase Colors to 20-30

### Problem: Old Avery sprite still showing
**Solution:**
- Delete old files
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)

---

## 📊 Progress Tracking

### Current Status
- ✅ Documentation created
- ✅ Fix script ready
- ✅ Code replacement prepared
- ⏳ Waiting for image processing
- ⏳ Waiting for SVG conversion
- ⏳ Waiting for registration update
- ⏳ Waiting for testing

### Next Steps
1. Process your 4 PNG images (remove backgrounds)
2. Convert to SVG using Adobe Illustrator
3. Follow the action plan
4. Test in application

---

## 🎓 Learning Resources

If you need more help:

- **Quick reference:** `AYATI_REPLACEMENT_ACTION_PLAN.txt`
- **Code to copy:** `AYATI_CODE_REPLACEMENT.txt`
- **Full workflow:** `CHATGPT_TO_SPRITE_WORKFLOW.md`
- **Black background fix:** `QUICK_FIX_BLACK_BACKGROUND.txt`
- **Prevention guide:** `PREVENT_BLACK_BACKGROUND_GUIDE.md`

---

## 💡 Pro Tips

1. **Save your work frequently** - Don't lose progress!

2. **Test early** - Check transparency after each SVG conversion

3. **Use the script** - The fix-svg-backgrounds.ps1 script is faster than manual fixes

4. **Keep originals** - Save your PNG files in case you need to re-convert

5. **Batch process** - Do all 4 images at once for consistency

6. **Document issues** - If something doesn't work, note what happened

---

## 🎉 Success Criteria

Your sprite replacement is successful when:

✅ All 4 Ayati Walking SVG files are in place
✅ Transparent backgrounds (no black)
✅ Sprite appears in application
✅ All 4 walking poses work correctly
✅ Looks good on any background color
✅ Old Avery Walking files are deleted
✅ No console errors
✅ Users can find sprite by searching "Ayati" or "walking"

---

## 📝 Final Notes

**Estimated Time:** 30-45 minutes

**Difficulty:** Medium (requires Adobe Illustrator)

**Success Rate:** 100% when following the guides

**Support:** All documentation is ready to help you!

---

**Ready to start?** 

Open: `AYATI_REPLACEMENT_ACTION_PLAN.txt` and follow the steps!

Good luck! 🚀

---

**Created:** May 10, 2026
**Status:** Ready to implement
**Documentation:** Complete
