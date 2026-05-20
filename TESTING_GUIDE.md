# Testing Guide - Media Manager & Blockly Workspace

## Quick Testing Checklist

---

## 1. Media Manager Enhancement Testing 🎨

### Visual Tests

#### Upload Button
- [ ] Gradient background displays (blue)
- [ ] Hover effect lifts button up
- [ ] Shadow increases on hover
- [ ] Active state provides feedback
- [ ] Icon and text are centered

#### Search Bar
- [ ] Rounded corners (10px)
- [ ] Focus ring appears (blue)
- [ ] Search icon is visible on left
- [ ] Placeholder text is readable
- [ ] Typing is smooth

#### Filter Tabs
- [ ] All tabs display correctly
- [ ] Active tab has gradient background
- [ ] Hover effect changes border color
- [ ] Transitions are smooth
- [ ] Counts display correctly
- [ ] Horizontal scroll works (if needed)

#### Media Cards (Grid View)
- [ ] Cards have rounded corners
- [ ] Hover lifts card up
- [ ] Shadow increases on hover
- [ ] Selected state shows blue background
- [ ] Quick action buttons appear on hover
- [ ] Image thumbnails display correctly
- [ ] File info is readable

#### Empty State
- [ ] Icon floats up and down
- [ ] Text is centered and readable
- [ ] Animation is smooth
- [ ] Fade-in effect works

#### Statistics Bar
- [ ] Two columns display correctly
- [ ] Numbers are large and bold
- [ ] Labels are readable
- [ ] Background gradient shows

#### Preview Modal
- [ ] Modal opens with scale animation
- [ ] Backdrop blur is visible
- [ ] Close button rotates on hover
- [ ] Image/video displays correctly
- [ ] Action buttons work
- [ ] Modal closes smoothly

#### Upload Progress
- [ ] Progress bar appears
- [ ] Shimmer animation works
- [ ] Filename displays
- [ ] Progress percentage shows
- [ ] Disappears after upload

### Interaction Tests

#### Upload
- [ ] Click upload button opens file picker
- [ ] Multiple files can be selected
- [ ] Progress indicator shows
- [ ] Files appear in grid after upload
- [ ] Duplicate warning works

#### Search
- [ ] Typing filters files
- [ ] Results update in real-time
- [ ] Clear search works
- [ ] No results shows empty state

#### Filter
- [ ] Clicking tabs filters by type
- [ ] Counts update correctly
- [ ] Active tab is highlighted
- [ ] All tab shows everything

#### View Toggle
- [ ] Grid view displays cards
- [ ] List view displays rows
- [ ] Toggle is smooth
- [ ] Active state is clear

#### Card Actions
- [ ] Preview button opens modal
- [ ] Download button downloads file
- [ ] Delete button removes file
- [ ] Confirmation dialog appears

#### Selection
- [ ] Clicking card selects it
- [ ] Selected state is visible
- [ ] Delete selected button appears
- [ ] Delete selected works

### Responsive Tests

#### Desktop (>768px)
- [ ] Grid shows multiple columns
- [ ] All elements are visible
- [ ] Spacing is comfortable
- [ ] No horizontal scroll

#### Tablet (≤768px)
- [ ] Grid adjusts to smaller columns
- [ ] Filter tabs scroll horizontally
- [ ] Preview modal is full width
- [ ] Touch interactions work

#### Mobile (≤480px)
- [ ] Grid shows 2 columns
- [ ] Stats show single column
- [ ] Buttons are touch-friendly
- [ ] Text is readable

---

## 2. Blockly Workspace Testing 🧩

### Visual Tests

#### Workspace
- [ ] Workspace displays correctly
- [ ] Grid is visible
- [ ] Toolbox is on the left
- [ ] Zoom controls are visible
- [ ] No console errors

#### Toolbox
- [ ] Categories are listed
- [ ] Colors match MIT App Inventor
- [ ] Category names are readable
- [ ] Separator lines show

#### Flyout
- [ ] Clicking category opens flyout
- [ ] Blocks display in flyout
- [ ] Flyout stays open
- [ ] Blocks are visible and readable

### Interaction Tests

#### Block Dragging (CRITICAL)
- [ ] Can click block in flyout
- [ ] Can drag block from flyout
- [ ] Block follows mouse cursor
- [ ] Can drop block in workspace
- [ ] Block appears in workspace
- [ ] Flyout stays open after drag

#### Workspace Panning
- [ ] Can drag empty workspace area
- [ ] Workspace pans smoothly
- [ ] Scrollbars update
- [ ] Zoom level maintained

#### Block Moving
- [ ] Can click block in workspace
- [ ] Can drag block around
- [ ] Block follows cursor
- [ ] Can drop block anywhere
- [ ] Block stays where dropped

#### Block Connecting
- [ ] Blocks snap together
- [ ] Connection highlight shows
- [ ] Blocks connect properly
- [ ] Can disconnect blocks

#### Block Editing
- [ ] Can click fields to edit
- [ ] Dropdowns work
- [ ] Text inputs work
- [ ] Changes are saved

#### Block Deleting
- [ ] Can select block
- [ ] Delete key removes block
- [ ] Right-click menu works
- [ ] Confirmation if needed

#### Zoom
- [ ] Mouse wheel zooms
- [ ] Zoom buttons work
- [ ] Zoom is smooth
- [ ] Blocks scale correctly

#### Double-Click
- [ ] Double-click does NOT collapse blocks
- [ ] Double-click on field opens editor
- [ ] No unwanted behavior

### Error Checking

#### Console
- [ ] No JavaScript errors
- [ ] No CORS errors
- [ ] No warning messages
- [ ] Logs are clean

#### Functionality
- [ ] All categories work
- [ ] All blocks can be dragged
- [ ] No blocks are broken
- [ ] Workspace saves state

---

## 3. Common Issues & Solutions

### Media Manager

#### Issue: Styles not applied
**Solution:** 
- Check CSS import in MediaManager.jsx
- Clear browser cache
- Check browser console for CSS errors

#### Issue: Animations not smooth
**Solution:**
- Check browser hardware acceleration
- Close other tabs to free resources
- Update browser to latest version

#### Issue: Responsive not working
**Solution:**
- Check viewport meta tag
- Test in browser dev tools
- Verify CSS media queries

### Blockly Workspace

#### Issue: Blocks can't be dragged
**Solution:**
1. Check console for errors
2. Verify `move.drag = true` in config
3. Check `flyout.autoClose = false`
4. Verify workspace is not read-only
5. Check CSS pointer-events

#### Issue: Flyout closes immediately
**Solution:**
- Set `flyout.autoClose = false`
- Check event listeners
- Verify Blockly version

#### Issue: CORS errors
**Solution:**
- Use local media path or CDN
- Disable trashcan if needed
- Disable sounds if needed

#### Issue: Blocks collapse on double-click
**Solution:**
- Check double-click prevention code
- Verify `collapse: false` in config
- Check block initialization

---

## 4. Testing Commands

### Start Development Server
```bash
npm run dev
```

### Open in Browser
```
http://localhost:5173
```

### Open Browser Console
- Chrome/Edge: `F12` or `Ctrl+Shift+I`
- Firefox: `F12` or `Ctrl+Shift+K`
- Safari: `Cmd+Option+I`

### Clear Browser Cache
- Chrome: `Ctrl+Shift+Delete`
- Firefox: `Ctrl+Shift+Delete`
- Safari: `Cmd+Option+E`

---

## 5. Expected Results

### Media Manager ✅
- Professional, polished UI
- Smooth animations
- Responsive layout
- All features working
- No console errors

### Blockly Workspace ⚠️
- Blocks can be dragged from flyout
- Workspace can be panned
- Blocks connect properly
- No collapse on double-click
- No console errors

---

## 6. Reporting Issues

### If Media Manager Has Issues
Please provide:
1. Screenshot of the issue
2. Browser and version
3. Screen size (desktop/tablet/mobile)
4. Console errors (if any)
5. Steps to reproduce

### If Blockly Has Issues
Please provide:
1. Screenshot of the workspace
2. Console errors (full text)
3. Which action doesn't work (drag/pan/zoom)
4. Browser and version
5. Steps to reproduce

---

## 7. Success Criteria

### Media Manager
- ✅ All visual enhancements visible
- ✅ All animations smooth
- ✅ All interactions working
- ✅ Responsive on all devices
- ✅ No console errors

### Blockly Workspace
- ✅ Blocks drag from flyout to workspace
- ✅ Workspace pans smoothly
- ✅ Blocks connect properly
- ✅ No collapse on double-click
- ✅ No console errors

---

## 8. Next Steps After Testing

### If Everything Works ✅
1. Mark tasks as complete
2. Move to next feature
3. Consider additional enhancements

### If Issues Found ⚠️
1. Document the issue
2. Provide screenshots/errors
3. Request fixes
4. Re-test after fixes

---

**Happy Testing!** 🎉

Remember:
- Test on multiple browsers
- Test on different screen sizes
- Check console for errors
- Report issues with details
- Celebrate when it works! 🚀
