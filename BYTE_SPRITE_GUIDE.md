# Byte Sprite Setup Guide

## ✅ Sprite Registration Complete

The "Byte" character sprite has been successfully registered in the sprite library system!

**Location:** `src/components/generated_leap_sprites.ts`

## 📁 Required File Names

You need to save your 4 Byte character images with these exact names in the folder:
`public/assets/sprites/leap/`

### File Naming Convention:
1. **byte_byte-a.png** - Walking pose (left foot forward)
2. **byte_byte-b.png** - Standing pose (front view)
3. **byte_byte-c.png** - Presenting/explaining pose (hand gesture)
4. **byte_byte-d.png** - Excited/jumping pose (celebrating)

## 🎨 Character Description

**Byte** is a tech-savvy young boy character featuring:
- Brown messy hair
- Round glasses with green eyes
- Green circuit board pattern t-shirt (with yellow circuit lines)
- Khaki/olive cargo pants
- Green and white sneakers
- Holding a tablet/device showing cyan circuit patterns

Perfect for coding, STEM, and technology-themed projects!

## 🎨 Sprite Details

- **Sprite Name:** Byte
- **ID:** leap_byte
- **Emoji:** 👦
- **Category:** leap
- **Tags:** people, person, boy, kid, tech, technology, coding, programmer, computer, tablet, circuit, glasses, geek, nerd, stem
- **Number of Costumes:** 4
- **Format:** PNG with transparent background

## ⚠️ IMPORTANT: Transparent Background Required

Your PNG images **MUST have transparent backgrounds** (alpha channel). The background should be completely removed so only the character is visible.

### How to Create Transparent PNGs:

#### Option 1: Using Online Tools
- **Remove.bg** - https://www.remove.bg/ (automatic background removal)
- **PhotoScissors** - https://photoscissors.com/ (manual editing)
- **Pixlr** - https://pixlr.com/editor/ (free online editor)

#### Option 2: Using Photoshop
1. Open your image
2. Use Magic Wand or Quick Selection tool
3. Select the background
4. Press Delete
5. Save As → PNG (ensure "Transparency" is checked)

#### Option 3: Using GIMP (Free)
1. Open your image
2. Layer → Transparency → Add Alpha Channel
3. Use "Select by Color" tool on background
4. Press Delete
5. Export As → PNG

#### Option 4: Using PowerPoint (Quick Method)
1. Insert image into PowerPoint
2. Select image → Picture Format → Remove Background
3. Right-click → Save as Picture → PNG

## 📝 Next Steps

1. **Remove backgrounds** from your 4 Byte character images
2. **Rename them** using the exact names listed above
3. **Copy them** to `public/assets/sprites/leap/` folder
4. **Restart the dev server** if it's running
5. **Test the sprite** by:
   - Opening the sprite library in your application
   - Searching for "Byte" or "tech" or "coding"
   - Adding it to a project
   - Verifying all 4 costumes display correctly with transparent backgrounds

## 🔍 Verification

After copying the files, you can verify they're in the correct location by running:

```bash
ls public/assets/sprites/leap/byte*
```

You should see all 4 files listed.

### Check for Transparency

To verify your PNGs have transparent backgrounds:
1. Open each PNG in an image viewer
2. The background should show a checkerboard pattern (transparency indicator)
3. Or place the image on a colored background - only the character should be visible

## ✨ Features

The Byte sprite will:
- Appear in the sprite library under the "leap" category
- Be searchable by tags: tech, coding, programmer, STEM, computer, etc.
- Have 4 animated costumes for smooth animation
- Display with transparent background (no white box around character)
- Work seamlessly with your Blockly-based visual programming environment

## 🎭 Costume Animation

The 4 costumes are designed for different actions:

- **Costume A (byte-a):** Walking pose - left foot forward, holding tablet
- **Costume B (byte-b):** Standing pose - neutral stance, front view
- **Costume C (byte-c):** Presenting pose - hand gesture, explaining/teaching
- **Costume D (byte-d):** Excited pose - jumping with fist raised, celebrating success

### Animation Ideas:

**Walking Animation:**
```
Forever
  Switch to costume "byte-a"
  Wait 0.2 seconds
  Switch to costume "byte-b"
  Wait 0.2 seconds
```

**Teaching/Presenting:**
```
Switch to costume "byte-c"
Say "Let me show you how to code!" for 2 seconds
```

**Celebrating Success:**
```
Switch to costume "byte-d"
Say "We did it!" for 2 seconds
Play sound "cheer"
```

## 🎯 Perfect For

- Coding tutorials and lessons
- STEM education projects
- Technology-themed games
- Programming challenges
- Computer science demonstrations
- Tech club mascot
- Educational apps

## 📐 Technical Specifications

- **Format:** PNG (Portable Network Graphics)
- **Color Mode:** RGBA (with alpha channel for transparency)
- **Recommended Size:** 480x480 pixels or similar
- **Background:** Transparent (alpha = 0)
- **File Size:** Keep under 500KB per image for optimal performance

## 🐛 Troubleshooting

### Sprite has white/colored background
- **Problem:** PNG doesn't have transparency
- **Solution:** Use background removal tools listed above

### Sprite edges look jagged
- **Problem:** Poor quality background removal
- **Solution:** Use "Refine Edge" or "Feather" tools to smooth edges

### Sprite doesn't appear in library
- Verify files are in `public/assets/sprites/leap/`
- Check file names match exactly (case-sensitive)
- Restart the dev server
- Clear browser cache

### Images don't load
- Verify PNG format (not JPG or other formats)
- Check file permissions
- Ensure files aren't corrupted
- Try opening images in an image viewer first

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify file names and locations
3. Ensure PNG files have transparent backgrounds
4. Ensure dev server is running
5. Review this guide for detailed instructions

---

**Status:** ✅ Registration Complete - Ready for transparent PNG files  
**Character:** Byte - Tech-savvy boy with tablet and circuit board shirt  
**Next Step:** Remove backgrounds and copy 4 PNG images to assets folder
