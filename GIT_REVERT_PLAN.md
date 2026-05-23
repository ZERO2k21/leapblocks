# Git Merge Revert Plan

## Current Situation
- **Current HEAD**: `2104e6f` (Merge branch 'master' of https://github.com/ZERO2k21/leapblocks)
- **Target State**: Return to `a317757` (Merge pull request #45 from ZERO2k21/intermediate-reframe)
- **Changes to Undo**: 2662 files (mostly AVR toolchain libraries and project reorganization)

## What Will Be Reverted

### Files Added (will be removed):
- AVR GCC toolchain (7.3.0-atmel3.6.1-arduino7)
- AVR libraries (libc, libm, libgcc, etc.)
- AVR device specs (hundreds of microcontroller definitions)
- Arduino builtin tools (avrdude, ctags, dfu-discovery, mdns-discovery, serial-discovery, serial-monitor)
- CP210x USB drivers
- Various project reorganization changes

### Total Impact:
- **2662 files changed**
- Massive additions removed
- Project structure returned to pre-merge state

## Revert Strategy

### Option 1: Revert Merge Commit (RECOMMENDED)
```bash
git revert -m 1 2104e6f --no-edit
git push origin master
```

**Pros:**
- Safe - doesn't rewrite history
- Works with already-pushed commits
- Creates clear audit trail
- No force push needed

**Cons:**
- Adds another commit to history
- If you want to re-merge later, you'll need to revert the revert

### Option 2: Hard Reset (NOT RECOMMENDED - already pushed)
```bash
git reset --hard a317757
git push origin master --force
```

**Pros:**
- Clean history

**Cons:**
- Rewrites history (dangerous for shared branches)
- Requires force push
- Can cause issues for other developers

## Recommended Action

**Use Option 1** - Revert the merge commit

This will:
1. Create a new commit that undoes all changes from the merge
2. Remove all 2662 files that were added
3. Keep git history intact
4. Allow normal push (no force needed)

## After Revert

1. Verify the revert worked:
   ```bash
   git log --oneline -5
   git status
   ```

2. Push to remote:
   ```bash
   git push origin master
   ```

3. Verify files are removed:
   ```bash
   ls -la | grep -E "(staging|neura-ml)"
   ```

## Blockly Fix Status

The Blockly block definition fixes in these files are NOT affected by this revert:
- `src/leapembed/server/blockly/runtime.ts` ✅ (already fixed)
- `src/leapembed/client/hooks/useBlocklyInit.ts` ✅ (already fixed)

These files exist in the current branch and will remain after the revert.

## Next Steps After Revert

1. Restart dev server: `npm run dev`
2. Clear browser cache: Ctrl+Shift+R
3. Test Blockly blocks to ensure errors are gone
4. Verify application works correctly

---

**Ready to execute:** `git revert -m 1 2104e6f --no-edit`
