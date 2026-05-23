# 🎨 How the Sprite System Works in LeapBlocks

## Overview

The LeapBlocks sprite system uses a **3-step process** to make sprites available in your application:

```
1. Add PNG/SVG files → 2. Register in generated_leap_sprites.ts → 3. Display in SpriteLibrary
```

---

## 📁 Step 1: Add Asset Files

### Where to Put Files
```
public/assets/sprites/leap/
```

### File Naming Convention
```
{sprite_name}_{sprite_name}-{letter}.{extension}

Examples:
  byte_byte-a.png
  byte_byte-b.png
  superhero_lion_superhero_lion-a.png
  cat_cat_a.svg
```

### Supported Formats
- **PNG** - For images with transparency (recommended for characters)
- **SVG** - For vector graphics (scalable, smaller file size)

### Why This Location?
The `public/` folder is served directly by Vite (your build tool). Files in `public/` are accessible at runtime without bundling.

**Example:**
```
File: public/assets/sprites/leap/byte_byte-a.png
URL:  /assets/sprites/leap/byte_byte-a.png
```

---

## 📝 Step 2: Register Sprite in System

### File to Edit
```
src/components/generated_leap_sprites.ts
```

### Registration Format
```typescript
export const leapSprites: any[] = [
  // ... other sprites ...
  {
    "id": "leap_byte",                    // Unique identifier
    "name": "Byte",                       // Display name
    "emoji": "👦",                        // Fallback emoji
    "image": "assets/sprites/leap/byte_byte-a.png",  // First costume (thumbnail)
    "costumes": [                         // All costume files
      "assets/sprites/leap/byte_byte-a.png",
      "assets/sprites/leap/byte_byte-b.png",
      "assets/sprites/leap/byte_byte-c.png",
      "assets/sprites/leap/byte_byte-d.png"
    ],
    "tags": [                             // Search keywords
      "people",
      "tech",
      "coding",
      "programmer"
    ],
    "category": "leap"                    // Category identifier
  }
];
```

### Field Explanations

| Field | Purpose | Example |
|-------|---------|---------|
| `id` | Unique identifier for the sprite | `"leap_byte"` |
| `name` | Display name shown in UI | `"Byte"` |
| `emoji` | Fallback if image fails to load | `"👦"` |
| `image` | Path to first costume (thumbnail) | `"assets/sprites/leap/byte_byte-a.png"` |
| `costumes` | Array of all costume file paths | `["byte_byte-a.png", "byte_byte-b.png", ...]` |
| `tags` | Keywords for search/filtering | `["tech", "coding", "programmer"]` |
| `category` | Category grouping | `"leap"` |

### Important Notes

1. **Path Format:** Use relative paths WITHOUT leading slash
   ```typescript
   ✅ "assets/sprites/leap/byte_byte-a.png"
   ❌ "/assets/sprites/leap/byte_byte-a.png"
   ```

2. **Alphabetical Order:** Keep sprites in alphabetical order by `id` for maintainability

3. **Tags:** Use lowercase tags for better search matching

---

## 🎭 Step 3: How Sprites Are Loaded & Displayed

### The Flow

```
generated_leap_sprites.ts
         ↓
    (imported by)
         ↓
  SpriteLibrary.tsx
         ↓
    (processes)
         ↓
  Maps to categories
  Fixes paths (adds leading /)
  Filters by search/category
         ↓
    (displays)
         ↓
  User sees sprites in UI
```

### Code Flow Explanation

#### 1. Import Statement
```typescript
// src/components/SpriteLibrary.tsx
import { leapSprites } from './generated_leap_sprites';
```

#### 2. Path Fixing
```typescript
const mappedleapSprites = leapSprites.map((sprite: any) => {
    // Fix image paths: add leading '/' for proper public directory resolution
    const fixedImage = sprite.image ? `/${sprite.image}` : undefined;
    const fixedCostumes = sprite.costumes ? sprite.costumes.map((c: string) => `/${c}`) : undefined;

    return {
        ...sprite,
        image: fixedImage,
        costumes: fixedCostumes
    };
});
```

**Why?** Vite serves files from `public/` at the root URL. Adding `/` makes the path absolute.

```
Registered:  "assets/sprites/leap/byte_byte-a.png"
Fixed:       "/assets/sprites/leap/byte_byte-a.png"
Browser URL: http://localhost:5174/assets/sprites/leap/byte_byte-a.png
```

#### 3. Category Mapping
```typescript
const tags = sprite.tags.map((t: string) => t.toLowerCase());

let category = 'Objects';  // Default

if (tags.includes('animals')) category = 'Animals';
else if (tags.includes('people') || tags.includes('person')) category = 'People';
else if (tags.includes('fantasy')) category = 'Fantasy';
// ... more categories
```

**How it works:** The system looks at your `tags` array and automatically assigns the sprite to a category.

**Example:**
```typescript
tags: ["people", "tech", "coding"]
         ↓
category: "People"  (because "people" tag found)
```

#### 4. Display in UI
```typescript
// Filtered sprites based on search and category
const filteredSprites = FULL_CATALOG.filter(sprite => {
    const matchesCategory = activeCategory === 'All' || sprite.category === activeCategory;
    const matchesSearch = sprite.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sprite.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
});
```

---

## 🔍 Search & Filter System

### How Search Works

When you type in the search box:

```typescript
Search: "tech"
         ↓
Checks sprite.name: "Byte" → no match
Checks sprite.tags: ["people", "tech", "coding"] → MATCH!
         ↓
Sprite appears in results
```

### How Categories Work

Categories are auto-assigned based on tags:

| Tags | Category |
|------|----------|
| `animals` | Animals |
| `people`, `person` | People |
| `fantasy` | Fantasy |
| `dance`, `dancing` | Dance |
| `music`, `instruments` | Music |
| `sports`, `fitness` | Sports |
| `food`, `drink` | Food |
| `fashion`, `clothing` | Fashion |
| `letters` | Letters |
| `transportation`, `vehicles` | Transport |
| (none of above) | Objects |

---

## 🎨 How Costumes Work

### Costume Switching

When a sprite has multiple costumes, users can switch between them in their code:

```blockly
Switch to costume "byte-a"
Wait 0.2 seconds
Switch to costume "byte-b"
Wait 0.2 seconds
```

### How It's Stored

```typescript
"costumes": [
  "assets/sprites/leap/byte_byte-a.png",  // Costume 1
  "assets/sprites/leap/byte_byte-b.png",  // Costume 2
  "assets/sprites/leap/byte_byte-c.png",  // Costume 3
  "assets/sprites/leap/byte_byte-d.png"   // Costume 4
]
```

### How It's Used

The Blockly runtime loads all costume images and allows switching between them:

```javascript
// Simplified example
sprite.costumes = [
  { name: "byte-a", url: "/assets/sprites/leap/byte_byte-a.png" },
  { name: "byte-b", url: "/assets/sprites/leap/byte_byte-b.png" },
  // ...
];

sprite.switchCostume("byte-b");  // Changes displayed image
```

---

## 🖼️ Image Loading Process

### 1. User Opens Sprite Library
```
SpriteLibrary component renders
         ↓
Loads sprite data from generated_leap_sprites.ts
         ↓
Maps and fixes paths
```

### 2. Thumbnails Display
```
For each sprite:
  <img src={sprite.image} />
         ↓
Browser requests: /assets/sprites/leap/byte_byte-a.png
         ↓
Vite serves from: public/assets/sprites/leap/byte_byte-a.png
         ↓
Image displays in UI
```

### 3. User Selects Sprite
```
User clicks sprite
         ↓
onSelectSprite(sprite) called
         ↓
Sprite data passed to project
         ↓
All costumes loaded for use
```

---

## 📦 Complete Example: Adding a New Sprite

### Step-by-Step

#### 1. Prepare Your Images
```
Files:
  dragon_dragon-a.png  (flying pose)
  dragon_dragon-b.png  (breathing fire)
  dragon_dragon-c.png  (landing pose)
```

#### 2. Copy to Assets Folder
```bash
Copy files to:
  public/assets/sprites/leap/
```

#### 3. Register in System
```typescript
// src/components/generated_leap_sprites.ts

export const leapSprites: any[] = [
  // ... existing sprites ...
  {
    "id": "leap_dragon",
    "name": "Dragon",
    "emoji": "🐉",
    "image": "assets/sprites/leap/dragon_dragon-a.png",
    "costumes": [
      "assets/sprites/leap/dragon_dragon-a.png",
      "assets/sprites/leap/dragon_dragon-b.png",
      "assets/sprites/leap/dragon_dragon-c.png"
    ],
    "tags": [
      "fantasy",
      "animals",
      "dragon",
      "fire",
      "flying"
    ],
    "category": "leap"
  },
  // ... more sprites ...
];
```

#### 4. Restart Dev Server
```bash
npm run dev
```

#### 5. Test
1. Open sprite library
2. Search for "dragon" or filter by "Fantasy" category
3. Select sprite
4. Test costume switching

---

## 🔧 Technical Details

### Why Two Path Formats?

**In Registration (no leading slash):**
```typescript
"image": "assets/sprites/leap/byte_byte-a.png"
```

**In Runtime (with leading slash):**
```typescript
fixedImage = "/assets/sprites/leap/byte_byte-a.png"
```

**Reason:** The registration format is cleaner and the runtime adds `/` to make it an absolute URL that Vite can serve from the `public/` directory.

### Vite Public Directory

Vite treats `public/` specially:
- Files are served at root URL
- No bundling or processing
- Direct access at runtime
- Perfect for large assets like images

```
File:        public/assets/sprites/leap/byte_byte-a.png
Served at:   http://localhost:5174/assets/sprites/leap/byte_byte-a.png
```

### TypeScript Type Safety

```typescript
export interface SpriteEntry {
    id: string;
    name: string;
    emoji: string;
    image?: string;
    costumes?: string[];
    category: string;
    tags?: string[];
}
```

This ensures all sprites have the required fields.

---

## 🎯 Best Practices

### 1. File Naming
```
✅ byte_byte-a.png
✅ superhero_lion_superhero_lion-a.png
❌ Byte-A.png
❌ byte a.png
❌ byte.png
```

### 2. File Organization
```
public/assets/sprites/leap/
  ├── byte_byte-a.png
  ├── byte_byte-b.png
  ├── byte_byte-c.png
  ├── byte_byte-d.png
  ├── superhero_lion_superhero_lion-a.png
  ├── superhero_lion_superhero_lion-b.png
  └── ...
```

### 3. Tags
```
✅ ["people", "tech", "coding", "programmer"]
❌ ["People", "Tech", "CODING"]  (use lowercase)
```

### 4. Image Optimization
- Keep PNG files under 500KB
- Use transparent backgrounds for characters
- Optimize images before adding (use TinyPNG, etc.)

### 5. Costume Naming
```
sprite_sprite-a.png  (first costume)
sprite_sprite-b.png  (second costume)
sprite_sprite-c.png  (third costume)
```

---

## 🐛 Troubleshooting

### Sprite Doesn't Appear

**Check:**
1. ✅ Files in `public/assets/sprites/leap/`
2. ✅ Registered in `generated_leap_sprites.ts`
3. ✅ Path format correct (no leading `/` in registration)
4. ✅ Dev server restarted
5. ✅ Browser cache cleared

### Image Doesn't Load

**Check:**
1. ✅ File name matches exactly (case-sensitive)
2. ✅ File format is PNG or SVG
3. ✅ File isn't corrupted
4. ✅ Path in registration matches actual file location

### Search Doesn't Find Sprite

**Check:**
1. ✅ Tags include search keywords
2. ✅ Tags are lowercase
3. ✅ Sprite name matches search term

---

## 📊 Summary Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    SPRITE SYSTEM FLOW                        │
└─────────────────────────────────────────────────────────────┘

1. ADD FILES
   public/assets/sprites/leap/
   └── byte_byte-a.png ✓

2. REGISTER
   src/components/generated_leap_sprites.ts
   └── { id: "leap_byte", ... } ✓

3. IMPORT
   src/components/SpriteLibrary.tsx
   └── import { leapSprites } from './generated_leap_sprites' ✓

4. PROCESS
   - Fix paths (add leading /)
   - Map to categories
   - Filter by search/category ✓

5. DISPLAY
   - Show thumbnails
   - Enable search
   - Allow selection ✓

6. USE
   - Load all costumes
   - Enable costume switching
   - Animate in project ✓
```

---

## 🎉 Quick Reference

| Task | File | Action |
|------|------|--------|
| Add images | `public/assets/sprites/leap/` | Copy PNG/SVG files |
| Register sprite | `src/components/generated_leap_sprites.ts` | Add sprite object |
| View sprites | Browser | Open sprite library |
| Search sprites | UI | Type in search box |
| Filter sprites | UI | Click category |
| Use sprite | Blockly | Drag blocks |

---

**That's it!** The sprite system is designed to be simple: add files, register them, and they automatically appear in the UI with search, categories, and costume support! 🚀
