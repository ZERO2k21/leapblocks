# Plan: Redesign Neura Dashboard to Match HTML Prototype

## Goal
Update the Neura dashboard (`WelcomeHero.tsx` + `ProjectHeader.tsx` + `NeuraApp.tsx`) to match the provided full-screen HTML design.

## Comparison: HTML Design vs Current Implementation

### Topbar (ProjectHeader.tsx)
| Aspect | HTML Design | Current | Action |
|---|---|---|---|
| Height | 56px fixed | 56px/64px responsive | Keep responsive |
| Left: Home icon | `ti ti-home` in square | `Home` lucide in rounded-xl | Already similar |
| Left: Brand | Text "LEAPLAB" + "POWERED BY CREOLEAP" | Logo image + "LEAPLAB" / "NEURA ML" | Keep current (richer) |
| Left: Divider | 1px white/14 | 1px white/10 | Keep |
| Left: Product badge | "LEAPLAB" pink badge + "NEURA ML" | Logo text with yellow LEAPLAB | Keep current |
| Left: Tutorials | `ti ti-book-2` icon | `BookOpen` lucide | Keep current |
| Middle: Search | `ti ti-search` + placeholder | `Search` lucide + placeholder | Already identical |
| Right: Icons | Message, Trophy, Moon, Settings, Help | MessageSquareWarning, Trophy, Sun/Moon, Settings, HelpCircle | Already identical |
| Right: Sign In | Button with `ti ti-login` | `LeapLabAuthButton` | Keep current |
| Right: CREOLEAP logo | Text "CREOLEAP" + "LEAP INTO THE AI FUTURE" | SVG image logo | Keep current |

**Verdict: ProjectHeader.tsx already matches closely. No changes needed.**

### Hero Section (WelcomeHero.tsx)
| Aspect | HTML Design | Current | Action |
|---|---|---|---|
| Container | Full-width, no border, no rounded corners | Rounded-2xl with border + shimmer | **CHANGE** |
| Background | Dot grid + radial gradients (pink/purple) | Gradient orbs + shimmer | **CHANGE** |
| Left: Brain badge | `ti ti-brain` icon, 44x44px, rounded-xl, purple bg | `Brain` lucide, 48x48px/56x56px, rounded-xl, gradient bg | Already similar |
| Left: Heading | "Welcome Back, Explorer! 👋" with gradient text | Same text, same gradient | Already identical |
| Left: Subtitle | "Build, train and deploy AI models without coding. No code. Just creativity." | Same text | Already identical |
| Left: Quote | Peter Drucker quote with left border | Same quote, same border | Already identical |
| Left: Buttons | "New Project" (primary), "Import Dataset" (outline), "Tutorials" (outline) | Same buttons with lucide icons | Already identical |
| Right: Chips | Image/Text/Audio with colored icon circles, white bg, border | Same with glass-morphism | **CHANGE** to match HTML simpler style |
| Right: Podium | 3 solid gradient rings (base/mid/top), stacked | 3 translucent gradient rings | **CHANGE** to solid gradients |
| Right: Brain | Inline SVG with glow + neural network lines | PNG image with blur glow | **CHANGE** to SVG |
| Right: Sparkle | `ti ti-sparkles` at bottom-right | `Sparkles` lucide at bottom-right | Already similar |
| Right: Particles | Not in HTML | 3 floating dots | **KEEP** (adds life) |

## Changes Required

### 1. WelcomeHero.tsx — Full redesign of container and right section

**File:** `src/components/neura/dashboard/WelcomeHero.tsx`

#### A. Container (line 20-24)
```tsx
// FROM: rounded border container with shimmer
<div className={`relative overflow-hidden rounded-2xl border neura-shimmer h-full ${...}`}>

// TO: full-width transparent container (no border, no rounded)
<div className={`relative overflow-hidden h-full ${isDark ? 'bg-[#0f0c29]' : 'bg-transparent'}`}>
```

#### B. Background pattern (lines 26-34)
```tsx
// FROM: subtle dot pattern + ambient glow orbs
<div className="absolute inset-0 opacity-[0.03]" style={{...}} />
<div className="absolute -top-20 -right-20 w-72 h-72 bg-gradient-to-br..." />
...

// TO: dot grid + radial gradients matching HTML
<div className="absolute inset-0 pointer-events-none" style={{
    backgroundImage: 'radial-gradient(rgba(123,63,228,0.18) 1.4px, transparent 1.4px)',
    backgroundSize: '16px 16px',
    maskImage: 'linear-gradient(225deg, black, transparent 70%)',
    WebkitMaskImage: 'linear-gradient(225deg, black, transparent 70%)',
}} />
<div className="absolute inset-0 pointer-events-none" style={{
    background: isDark
        ? 'radial-gradient(50% 70% at 100% 0%, rgba(236,72,153,0.10), transparent 60%), radial-gradient(60% 80% at 20% 100%, rgba(123,63,228,0.10), transparent 60%)'
        : 'radial-gradient(50% 70% at 100% 0%, rgba(236,72,153,0.06), transparent 60%), radial-gradient(60% 80% at 20% 100%, rgba(123,63,228,0.06), transparent 60%)'
}} />
```

#### C. Glass cards → simpler chip cards (lines 97-127)
```tsx
// FROM: neura-glass-premium with shadow
<div className="absolute top-4 left-4 neura-glass-premium rounded-xl px-4 py-3 flex items-center gap-3 animate-float">
    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
        <Image size={18} className="text-white" strokeWidth={2} />
    </div>
    ...

// TO: white bg with border, matching HTML chip style
<div className="absolute top-4 left-4 bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 animate-float shadow-[0_12px_26px_-12px_rgba(60,40,120,0.25)]">
    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
        <Image size={16} className="text-white" strokeWidth={2} />
    </div>
    ...
```
Apply same pattern to Text and Audio chips.

#### D. Podium rings → solid gradient rings (lines 130-139)
```tsx
// FROM: translucent rings with borders
<div className="w-64 h-10 rounded-full bg-gradient-to-t from-[#7C3AED]/[0.10] via-[#7C3AED]/[0.06] to-transparent border border-[#7C3AED]/[0.08]" />

// TO: solid gradient rings matching HTML
<div className="w-[220px] h-[50px] rounded-full bg-gradient-to-b from-[#5B21B6] to-[#3E1780] shadow-[0_0_30px_rgba(123,63,228,0.55)]" />
<div className="w-[190px] h-[44px] -mt-[14px] rounded-full bg-gradient-to-b from-[#7C3AED] to-[#5B21B6]" />
<div className="w-[150px] h-[38px] -mt-[12px] rounded-full bg-gradient-to-b from-[#B693F0] to-[#7C3AED] shadow-[0_0_30px_rgba(123,63,228,0.55)]" />
```

#### E. Brain PNG → inline SVG (lines 142-145)
Replace the `<img src="/Brain.png" ...>` with the inline SVG from the HTML design:
```tsx
<svg viewBox="0 0 200 200" width="180" height="180">
    <defs>
        <radialGradient id="brainGlow" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stop-color="#C9A8FF"/>
            <stop offset="55%" stop-color="#8B4CE8"/>
            <stop offset="100%" stop-color="#5B21B6"/>
        </radialGradient>
    </defs>
    <path d="M100 20c-24 0-42 14-46 32-14 2-24 16-22 30-10 8-12 24-2 34-4 16 8 30 24 30 4 10 16 16 28 14 8 8 22 8 30 0 12 2 24-4 28-14 16 0 28-14 24-30 10-10 8-26-2-34 2-14-8-28-22-30-4-18-22-32-40-32z"
        fill="url(#brainGlow)" opacity="0.92"/>
    <g stroke="rgba(255,255,255,0.55)" stroke-width="1" fill="none" opacity="0.8">
        <path d="M60 70 L100 60 L140 72 M70 100 L100 60 M100 60 L130 100 M60 130 L100 100 L140 128 M100 100 L100 150"/>
        <path d="M75 45 L100 60 L125 45 M55 95 L60 70 M145 95 L140 72"/>
    </g>
    <g fill="#fff">
        <circle cx="100" cy="60" r="4"/>
        <circle cx="60" cy="70" r="3.4"/>
        <circle cx="140" cy="72" r="3.4"/>
        <circle cx="70" cy="100" r="3.4"/>
        <circle cx="130" cy="100" r="3.4"/>
        <circle cx="60" cy="130" r="3.4"/>
        <circle cx="140" cy="128" r="3.4"/>
        <circle cx="100" cy="100" r="4"/>
        <circle cx="100" cy="150" r="4.4"/>
        <circle cx="75" cy="45" r="2.8"/>
        <circle cx="125" cy="45" r="2.8"/>
    </g>
</svg>
```

### 2. NeuraApp.tsx — Remove padding on dashboard view

**File:** `src/NeuraApp.tsx` (line 302)

```tsx
// FROM: padded container
<div className="flex-1 w-full px-4 sm:px-6 lg:px-10 xl:px-16 pt-3 sm:pt-4 pb-3 sm:pb-4 min-h-0">

// TO: full-width container (hero fills edge to edge)
<div className="flex-1 w-full min-h-0">
```

### 3. No changes to ProjectHeader.tsx
The topbar already matches the HTML design closely.

### 4. No changes to neura-theme.css
All needed CSS classes already exist (`.animate-float`, `.animate-wave`, `.animate-pulse-slow`, `.animate-glow-ring`).

## Summary of Files Changed

| File | Change |
|---|---|
| `WelcomeHero.tsx` | Full redesign: container, background, chips, podium, brain SVG |
| `NeuraApp.tsx` | Remove dashboard padding (1 line) |

## Verification

1. `npx tsc --noEmit` — type check
2. Visual comparison with HTML design at full screen
3. Dark mode toggle works
4. Responsive at mobile/tablet/desktop
5. All animations still work (float, wave, pulse, glow-ring)
