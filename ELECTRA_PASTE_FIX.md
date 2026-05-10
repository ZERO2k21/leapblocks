# Electra Module - Copy/Paste Fix

## Issue

In the Electra module's Sketch tab, when users tried to paste code using Ctrl+V, the system was pasting circuit components onto the canvas instead of pasting code into the code editor.

## Root Cause

The global keyboard event listener in `ForgeStudio.tsx` was intercepting **all** Ctrl+C, Ctrl+X, and Ctrl+V events, including those intended for the Monaco code editor. This prevented the code editor from receiving paste events.

**Problem Code** (lines 372-386):
```typescript
// Ctrl+X: Cut
else if (e.ctrlKey && e.key === 'x') {
  e.preventDefault();  // ❌ Always prevents default, even in editor
  handleCut();
}
// Ctrl+C: Copy
else if (e.ctrlKey && e.key === 'c') {
  e.preventDefault();  // ❌ Always prevents default, even in editor
  handleCopy();
}
// Ctrl+V: Paste
else if (e.ctrlKey && e.key === 'v') {
  e.preventDefault();  // ❌ Always prevents default, even in editor
  handlePaste();
}
```

## Solution

Added a check to detect if the user is currently focused on the code editor or an input field. If they are, the keyboard shortcut is **not intercepted**, allowing the editor to handle copy/paste normally.

**Fixed Code**:
```typescript
// Ctrl+X: Cut
else if (e.ctrlKey && e.key === 'x') {
  // Don't intercept if user is in code editor or input field
  const activeElement = document.activeElement;
  const isInEditor = activeElement?.classList.contains('monaco-editor') || 
                    activeElement?.closest('.monaco-editor') ||
                    activeElement?.tagName === 'INPUT' ||
                    activeElement?.tagName === 'TEXTAREA';
  if (!isInEditor) {
    e.preventDefault();
    handleCut();
  }
}
// Ctrl+C: Copy
else if (e.ctrlKey && e.key === 'c') {
  // Don't intercept if user is in code editor or input field
  const activeElement = document.activeElement;
  const isInEditor = activeElement?.classList.contains('monaco-editor') || 
                    activeElement?.closest('.monaco-editor') ||
                    activeElement?.tagName === 'INPUT' ||
                    activeElement?.tagName === 'TEXTAREA';
  if (!isInEditor) {
    e.preventDefault();
    handleCopy();
  }
}
// Ctrl+V: Paste
else if (e.ctrlKey && e.key === 'v') {
  // Don't intercept if user is in code editor or input field
  const activeElement = document.activeElement;
  const isInEditor = activeElement?.classList.contains('monaco-editor') || 
                    activeElement?.closest('.monaco-editor') ||
                    activeElement?.tagName === 'INPUT' ||
                    activeElement?.tagName === 'TEXTAREA';
  if (!isInEditor) {
    e.preventDefault();
    handlePaste();
  }
}
```

## How It Works

The fix checks if the currently focused element (`document.activeElement`) is:

1. **Monaco Editor**: Has class `monaco-editor` or is inside a `.monaco-editor` container
2. **Input Field**: Is an `<input>` element
3. **Text Area**: Is a `<textarea>` element

If any of these conditions are true, the keyboard shortcut is **not intercepted**, allowing the editor/input to handle it normally.

If none of these conditions are true (user is focused on the canvas), the shortcut is intercepted for circuit component copy/paste.

## Testing

### ✅ Test Case 1: Paste Code in Editor
1. Open Electra module
2. Switch to "Sketch" tab
3. Click in the code editor
4. Copy some code (Ctrl+C)
5. Paste the code (Ctrl+V)
6. **Expected**: Code is pasted into the editor ✅

### ✅ Test Case 2: Paste Component on Canvas
1. Open Electra module
2. Stay on "Circuit" tab
3. Select a component on the canvas
4. Copy the component (Ctrl+C)
5. Paste the component (Ctrl+V)
6. **Expected**: Component is pasted onto the canvas ✅

### ✅ Test Case 3: Paste in Input Fields
1. Open Electra module
2. Click on the project name input field
3. Copy some text (Ctrl+C)
4. Paste the text (Ctrl+V)
5. **Expected**: Text is pasted into the input field ✅

## Files Modified

- `src/Electra/Client/Src/ForgeStudio.tsx` (lines 372-407)

## Status

✅ **Fixed** - Copy/paste now works correctly in both the code editor and the circuit canvas.

---

**Date**: May 8, 2026  
**Issue**: Copy/paste conflict between code editor and canvas  
**Resolution**: Added focus detection to prevent keyboard event interception when user is in editor
