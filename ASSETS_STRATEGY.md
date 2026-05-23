# LeapLab Assets Strategy
## Sprites · Sounds · Backdrops

---

## 📋 Current Situation

### What you have

| Asset | Location | Count | License |
|-------|----------|-------|---------|
| Sprite images (SVG/PNG) | `public/assets/sprites/leap/` | ~500+ files | CC BY-SA 2.0 (Scratch) |
| Sprite metadata | `src/leapembed/client/assets/generatedLeapSprites.ts` | ~200 sprites | Already rebranded ✅ |
| Sound files (WAV) | `public/assets/sounds/` | ~300+ files | CC BY-SA 2.0 (Scratch) |
| Backdrop images | `public/assets/backdrops/` | ~90 files | CC BY-SA 2.0 (Scratch) |
| Drum sounds | `public/assets/sounds/drums/` | 22 files | CC BY-SA 2.0 (Scratch) |

### What's already good
- Sprite IDs are already `leap_*` ✅
- Folder is `sprites/leap/` not `sprites/scratch/` ✅
- Code is fully Creoleap-owned ✅
- No "Scratch" branding visible in the UI ✅

### The real issue
The **actual artwork and audio recordings** are Scratch's CC BY-SA assets.
CC BY-SA means: you can use them commercially IF you give attribution.
The risk is not legal — it's brand recognition ("that's the Scratch cat").

---

## 🎯 4 Options — Ranked by Effort vs. Impact

---

### Option 1: Attribution (Do Today — Zero Effort)

**What:** Add proper CC BY-SA attribution in your app's About/Credits screen.

**Legal status:** Fully compliant. Many EdTech platforms do this.

**How:**
Add to your About screen or footer:
```
Sprites and sounds from the Scratch project (scratch.mit.edu)
Licensed under CC BY-SA 2.0 (creativecommons.org/licenses/by-sa/2.0)
© Massachusetts Institute of Technology
```

**Verdict:** Legally safe. Brand risk: users who know Scratch will recognize the assets.

---

### Option 2: Replace with Kenney.nl CC0 Assets (1-2 weeks — Free)

**What:** Kenney.nl provides 40,000+ game assets under CC0 (public domain).
No attribution required. Fully commercial. Unique look.

**Best packs for LeapLab:**

| Kenney Pack | Replaces | URL |
|-------------|----------|-----|
| Toon Characters 1 | People sprites | kenney.nl/assets/toon-characters-1 |
| Animal Pack Redux | Animal sprites | kenney.nl/assets/animal-pack-redux |
| Space Shooter Redux | Space/rocket sprites | kenney.nl/assets/space-shooter-redux |
| UI Pack | Buttons, UI elements | kenney.nl/assets/ui-pack |
| Backgrounds | Backdrops | kenney.nl/assets/backgrounds |
| Interface Sounds | UI sounds | kenney.nl/assets/interface-sounds |
| Digital Audio | Sound effects | kenney.nl/assets/digital-audio |

**How to replace:**
1. Download packs from kenney.nl
2. Place images in `public/assets/sprites/leap/`
3. Update `generatedLeapSprites.ts` with new filenames and names
4. Update `sounds.json` with new sound names

**Verdict:** Best free option. Distinctive look. Takes 1-2 weeks of asset work.

---

### Option 3: AI-Generated LeapLab Characters (1 week — ~$50)

**What:** Generate custom characters using AI tools with commercial licenses.

**Tools:**
- **Adobe Firefly** — commercial safe, no copyright issues
- **DALL-E 3** (ChatGPT Plus) — commercial license
- **Midjourney** (paid plan) — commercial license

**Suggested LeapLab character set:**

| Character | Description | Prompt |
|-----------|-------------|--------|
| Leap | Main robot mascot | "Friendly blue robot, flat vector, simple shapes, white background, educational app" |
| Spark | Energetic kid | "Cartoon kid with lightning bolt shirt, flat vector, bright colors" |
| Nova | Space explorer | "Cartoon astronaut girl, flat vector, purple suit, friendly face" |
| Byte | Tech wizard | "Cartoon boy with glasses and laptop, flat vector, green colors" |
| Zara | Scientist | "Cartoon girl scientist with lab coat, flat vector, orange colors" |
| Robo | Simple robot | "Simple cute robot, flat vector, 3 costumes: idle, wave, jump" |

**How to replace:**
1. Generate 3-5 costume variations per character
2. Export as SVG or PNG with transparent background
3. Place in `public/assets/sprites/leap/`
4. Update `generatedLeapSprites.ts`

**Verdict:** Unique brand identity. Fast. Moderate cost.

---

### Option 4: Commission Original Artwork (4-8 weeks — $500-3000)

**What:** Hire an illustrator to create a full LeapLab character set.

**Where to find:**
- **Fiverr** — search "educational app character design" (~$50-200/character)
- **Upwork** — search "vector character illustration" (~$100-500/character)
- **99designs** — run a contest (~$500-1500 for full set)

**Deliverables to request:**
- 10-15 characters
- 3-5 costume/pose variations each
- SVG format with transparent background
- Commercial license (work-for-hire)
- Consistent art style

**Verdict:** Best for brand. Most expensive. Longest timeline.

---

## 🔧 What Can Be Done Right Now (No New Assets Needed)

### 1. Rename sprite display names in metadata

The sprite names in `generatedLeapSprites.ts` can be changed to LeapLab-branded names without touching any image files. The images stay the same, but the UI shows your names.

### 2. Rename backdrop files

The hash-named backdrop files (`0015433a...png`) can be given descriptive names and a proper catalog JSON.

### 3. Create a sounds catalog

The hash-named sound files need a proper `sounds.json` catalog with descriptive names.

### 4. Add your own custom sprites

You already have `public/assets/sprites/library/` with your own sprites:
- `sprite_basketball.png`
- `sprite_bear.png`
- `sprite_robot.png`
- etc.

These are already yours. Expand this library.

---

## 📁 Recommended File Structure After Migration

```
public/assets/
├── sprites/
│   ├── leaplab/          ← Your original/commissioned characters
│   │   ├── leap/         ← The Leap robot (already yours)
│   │   ├── spark/        ← New character
│   │   └── nova/         ← New character
│   ├── kenney/           ← Kenney CC0 replacements
│   │   ├── animals/
│   │   ├── people/
│   │   └── objects/
│   └── library/          ← Quick-pick thumbnails (already exists)
├── sounds/
│   ├── effects/          ← Sound effects (renamed from hash)
│   ├── music/            ← Background music
│   └── drums/            ← Drum samples (already named)
└── backdrops/
    ├── leaplab/          ← Your original backdrops
    ├── nature/           ← Categorized
    ├── space/
    ├── city/
    └── fantasy/
```

---

## 🚀 Recommended Action Plan

### Week 1 (Immediate)
- [ ] Add CC BY-SA attribution to About screen (legal compliance)
- [ ] Rename sprite display names in `generatedLeapSprites.ts`
- [ ] Create backdrop catalog JSON with descriptive names
- [ ] Create sounds catalog JSON with descriptive names

### Week 2-3 (Short term)
- [ ] Download Kenney.nl packs (free, CC0)
- [ ] Replace 20-30 most-used sprites with Kenney alternatives
- [ ] Generate 5-6 LeapLab characters with AI tools

### Month 2+ (Long term)
- [ ] Commission full LeapLab character set (10-15 characters)
- [ ] Commission original backdrop illustrations
- [ ] Record/license original sound effects
- [ ] Remove all Scratch-origin assets

---

## 📝 Sounds Catalog — Descriptive Names

The hash-named WAV files need a catalog. Here's the structure for `sounds.json`:

```json
[
  {
    "id": "pop",
    "name": "Pop",
    "md5ext": "83a9787d4cb6f3b7632b4ddfebf74367.wav",
    "category": "Effects",
    "tags": ["pop", "bubble", "click"]
  },
  {
    "id": "meow",
    "name": "Meow",
    "md5ext": "cat.mp3.mp3",
    "category": "Animals",
    "tags": ["cat", "animal", "meow"]
  }
]
```

---

## ⚖️ Legal Summary

| Action | Legal Status | Effort |
|--------|-------------|--------|
| Keep assets + attribution | ✅ Fully legal | Minimal |
| Keep assets + no attribution | ⚠️ CC BY-SA violation | None |
| Replace with Kenney CC0 | ✅ Fully legal, no attribution | Medium |
| AI-generated assets | ✅ Fully legal (with right tool) | Low |
| Commissioned artwork | ✅ Fully legal | High |

**Bottom line:** You are NOT in legal trouble right now. CC BY-SA allows commercial use with attribution. The question is purely about brand differentiation.

---

*Generated: April 29, 2026*
*For: LeapLab / Creoleap Technologies Pvt. Ltd.*
