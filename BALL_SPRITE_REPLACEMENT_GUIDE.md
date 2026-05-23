# Ball Sprite Replacement Guide

## Current Situation
You have 5 new colored ball images that need to replace the existing ball sprites:
- 🩷 Pink Ball
- 💜 Purple Ball  
- ❤️ Red Ball
- 💙 Blue Ball
- 🧡 Orange/Yellow Ball

## Current Ball Sprite Files
Location: `public/assets/sprites/leap/`
- `ball_ball-a.svg` (570 bytes)
- `ball_ball-b.svg` (570 bytes)
- `ball_ball-c.svg` (570 bytes)
- `ball_ball-d.svg` (570 bytes)
- `ball_ball-e.svg` (570 bytes)

---

## Step-by-Step Replacement Process

### Option 1: If You Have PNG Files

1. **Save your 5 ball PNG images** to a temporary folder

2. **Remove backgrounds** (if needed):
   - Use remove.bg or Photoshop
   - Ensure transparent backgrounds

3. **Convert PNG to SVG**:
   - Use Adobe Illustrator:
     - File → Open → Select PNG
     - Object → Image Trace → Make
     - Object → Expand
     - File → Export → Export As → SVG
     - **IMPORTANT**: Check "Ignore White" to prevent black backgrounds
   
   OR use online converter:
   - vectorizer.ai
   - convertio.co/png-svg

4. **Rename the SVG files**:
   ```
   Pink ball    → ball_ball-a.svg
   Purple ball  → ball_ball-b.svg
   Red ball     → ball_ball-c.svg
   Blue ball    → ball_ball-d.svg
   Orange ball  → ball_ball-e.svg
   ```

5. **Fix black backgrounds** (if they appear):
   ```powershell
   ./scripts/fix-svg-backgrounds.ps1
   ```

6. **Copy to project**:
   ```powershell
   Copy-Item "path/to/your/ball_ball-*.svg" "public/assets/sprites/leap/" -Force
   ```

---

### Option 2: If You Already Have SVG Files

1. **Rename your SVG files** to match the naming convention:
   ```
   ball_ball-a.svg  (Pink)
   ball_ball-b.svg  (Purple)
   ball_ball-c.svg  (Red)
   ball_ball-d.svg  (Blue)
   ball_ball-e.svg  (Orange)
   ```

2. **Check for black backgrounds**:
   - Open each SVG in a text editor
   - Look for large `<rect>` or `<path>` elements with `fill="#000000"`
   - Remove them manually OR use the fix script

3. **Run the background fix script**:
   ```powershell
   # Create a custom script for ball sprites
   ./scripts/fix-ball-backgrounds.ps1
   ```

4. **Copy to project**:
   ```powershell
   Copy-Item "path/to/your/ball_ball-*.svg" "public/assets/sprites/leap/" -Force
   ```

---

## Automated Fix Script

I can create a script that will:
1. Check all 5 ball SVG files
2. Remove black/white backgrounds
3. Preserve the ball colors and designs
4. Verify the files are ready

Would you like me to create this script?

---

## After Replacement

### Test the Sprites

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Check in application**:
   - Open sprite library
   - Find "Ball" sprite
   - Verify all 5 colors appear correctly
   - Check for transparent backgrounds

### Verify Registration

The ball sprite is already registered in `src/components/generated_leap_sprites.ts`:
```typescript
{
  "id": "leap_ball",
  "name": "Ball",
  "emoji": "⚽",
  "image": "assets/sprites/leap/ball_ball-a.svg",
  "costumes": [
    "assets/sprites/leap/ball_ball-a.svg",
    "assets/sprites/leap/ball_ball-b.svg",
    "assets/sprites/leap/ball_ball-c.svg",
    "assets/sprites/leap/ball_ball-d.svg",
    "assets/sprites/leap/ball_ball-e.svg"
  ]
}
```

No changes needed to registration - just replace the SVG files!

---

## Common Issues

### Black Background Appears
**Solution**: Run the background fix script
```powershell
./scripts/fix-ball-backgrounds.ps1
```

### Ball Colors Look Wrong
**Solution**: Check the SVG color values in the file
- Open SVG in text editor
- Look for `fill="#XXXXXX"` attributes
- Verify colors match your design

### File Size Too Large
**Solution**: Optimize the SVG
- Use SVGOMG.com
- Remove unnecessary elements
- Simplify paths

---

## Next Steps

**Tell me**:
1. Where are your 5 ball images currently saved?
2. Are they PNG or SVG format?
3. Do they have transparent backgrounds?

Then I can create a custom script to handle the replacement automatically!
