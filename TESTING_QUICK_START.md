# ML Environment - Testing Quick Start Guide

## 🚀 Quick Start

### Prerequisites
```bash
# Ensure you're in the project root
cd /path/to/leapblocks

# Install dependencies (if not already done)
npm install

# Verify lucide-react is installed
npm list lucide-react
# Should show: lucide-react@0.562.0
```

### Required Assets
Verify these files exist:
- ✅ `assets/leaplab_logo_transparent.png`
- ✅ `assets/Copy of CREOLEAP LOGO LEAP INTO THE AI FUTURE Final.svg`

## 🧪 Testing Steps

### 1. Start the Application
```bash
# Development mode
npm run dev

# Or web-only mode
npm run dev:web
```

### 2. Navigate to ML Environment
1. Open browser to `http://localhost:5173` (or appropriate port)
2. Click on **"Neura ML"** or **"ML Studio"** from the main menu
3. You should see the new topbar design

### 3. Visual Verification Checklist

#### Dashboard View
- [ ] Dark blue gradient background on topbar
- [ ] Home button (house icon) displays on left
- [ ] LeapLab logo displays with "LEAPLAB NEURA ML" text
- [ ] Yellow "LEAPLAB" text, white "NEURA ML" text
- [ ] No project input visible (dashboard view)
- [ ] Utility icons on right (Feedback, Achievements, Settings, Help)
- [ ] Sign In button with "LB" avatar
- [ ] Creoleap logo on far right

#### Create Project Flow
1. Click **"Create New Project"**
2. Verify:
   - [ ] Same topbar design
   - [ ] Project type cards display
   - [ ] Can select a project type
   - [ ] Can enter project name
   - [ ] Create button works

#### Classifier View
1. Create a project (e.g., "Image Classifier")
2. Verify topbar:
   - [ ] Home button works (returns to dashboard)
   - [ ] LeapLab logo and branding display
   - [ ] Tutorials button displays
   - [ ] Project name input shows with emoji (🖼️, 🔍, etc.)
   - [ ] Can edit project name
   - [ ] Green save button (circle) displays
   - [ ] Save button hover effect works
   - [ ] Utility icons display
   - [ ] Sign In button displays
   - [ ] Creoleap logo displays

3. Verify sub-header (purple bar below topbar):
   - [ ] Purple gradient background
   - [ ] Project info card shows (emoji + name + type)
   - [ ] Status badge displays ("Untrained" in amber)
   - [ ] Export Model button displays
   - [ ] Settings button displays

### 4. Interaction Testing

#### Home Button
```
Action: Click home button
Expected: Returns to dashboard/projects page
```

#### Project Name Input
```
Action: Click in project name field
Expected: Can type and edit name
Action: Type new name
Expected: Input updates in real-time
```

#### Save Button
```
Action: Click green save button
Expected: Console.log shows "Save project: [name]"
Note: Full save functionality to be implemented
```

#### Tutorials Button
```
Action: Click Tutorials button
Expected: Hover effect works
Note: Functionality to be implemented
```

#### Utility Icons
```
Action: Hover over each icon (Feedback, Achievements, Settings, Help)
Expected: Icon color changes from dim to bright
Action: Click each icon
Expected: Clickable (functionality to be implemented)
```

#### Sign In Button
```
Action: Hover over Sign In button
Expected: Background lightens
Action: Click Sign In
Expected: Clickable (functionality to be implemented)
```

### 5. Classifier-Specific Testing

#### Object Detection
1. Open Object Detection project
2. Click **"Load Detection Model"**
3. Verify:
   - [ ] Model loads (~10 MB download)
   - [ ] "Start Camera & Detect" button appears
4. Click **"Start Camera & Detect"**
5. Verify:
   - [ ] Camera permission requested
   - [ ] Camera feed displays
   - [ ] Objects detected with bounding boxes
   - [ ] Detection results show below

#### Image Classifier
1. Open Image Classifier project
2. Verify three-panel layout:
   - [ ] Classes panel (left)
   - [ ] Training panel (middle)
   - [ ] Testing panel (right)
3. Test sample collection:
   - [ ] Click webcam button
   - [ ] Camera modal opens
   - [ ] Can capture samples
   - [ ] Samples display as thumbnails

### 6. Browser Compatibility

#### Chrome/Edge
```bash
# Open in Chrome
chrome http://localhost:5173
```
- [ ] All features work
- [ ] No console errors
- [ ] Camera access works

#### Firefox
```bash
# Open in Firefox
firefox http://localhost:5173
```
- [ ] All features work
- [ ] No console errors
- [ ] Camera access works

#### Safari (Mac only)
```bash
# Open in Safari
open -a Safari http://localhost:5173
```
- [ ] All features work
- [ ] No console errors
- [ ] Camera access works

### 7. Console Error Check

Open browser DevTools (F12) and check Console tab:
```
Expected: No errors
Common issues to look for:
- ❌ "Cannot find module 'lucide-react'" → Run npm install
- ❌ "Failed to load image" → Check assets folder
- ❌ "Uncaught TypeError" → Check component props
```

### 8. Performance Check

#### Load Time
```
Dashboard load: < 2 seconds
Classifier load: < 1 second
Model load: ~5-10 seconds (network dependent)
```

#### Camera Performance
```
Frame rate: ~30 fps
Detection latency: < 100ms
No memory leaks during extended use
```

## 🐛 Common Issues & Solutions

### Issue: Icons not displaying
**Solution:**
```bash
# Verify lucide-react is installed
npm list lucide-react

# If not installed
npm install lucide-react@0.562.0
```

### Issue: Logos not displaying
**Solution:**
```bash
# Check assets folder
ls -la assets/leaplab_logo_transparent.png
ls -la "assets/Copy of CREOLEAP LOGO LEAP INTO THE AI FUTURE Final.svg"

# If missing, ensure assets are in correct location
```

### Issue: Topbar looks broken
**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Check browser console for errors

### Issue: Camera not working
**Solution:**
1. Check browser permissions
2. Ensure HTTPS or localhost (required for camera access)
3. Try different browser
4. Check if camera is in use by another app

### Issue: Save button does nothing
**Expected:** This is normal - save functionality is placeholder
```javascript
// Current implementation
console.log('Save project:', projectName);
```

## 📊 Test Results Template

```markdown
## Test Results

**Date:** _______________
**Tester:** _______________
**Browser:** _______________
**OS:** _______________

### Visual Tests
- [ ] Dashboard topbar: PASS / FAIL
- [ ] Classifier topbar: PASS / FAIL
- [ ] Sub-header: PASS / FAIL
- [ ] All icons display: PASS / FAIL
- [ ] All logos display: PASS / FAIL

### Functional Tests
- [ ] Home button: PASS / FAIL
- [ ] Project name input: PASS / FAIL
- [ ] Save button: PASS / FAIL
- [ ] Navigation: PASS / FAIL

### Classifier Tests
- [ ] Object Detection: PASS / FAIL
- [ ] Image Classifier: PASS / FAIL
- [ ] Camera access: PASS / FAIL

### Performance
- [ ] Load times acceptable: YES / NO
- [ ] No console errors: YES / NO
- [ ] Smooth animations: YES / NO

### Issues Found
1. 
2. 
3. 

### Screenshots
(Attach screenshots of any issues)
```

## 🎯 Success Criteria

### Must Pass
- ✅ Topbar displays correctly on all pages
- ✅ All icons and logos render
- ✅ Navigation works (home button, back button)
- ✅ No console errors
- ✅ Project name input works

### Should Pass
- ✅ Hover effects work smoothly
- ✅ Camera access works (where applicable)
- ✅ All classifiers load without errors
- ✅ Responsive on different screen sizes

### Nice to Have
- ✅ Fast load times
- ✅ Smooth animations
- ✅ Works on all browsers

## 📞 Support

### If Tests Fail
1. Check this guide's "Common Issues" section
2. Review console errors
3. Check `ML_ENVIRONMENT_UPGRADE_SUMMARY.md` for details
4. Review component files for recent changes

### Documentation References
- **Overall Summary:** `ML_ENVIRONMENT_UPGRADE_SUMMARY.md`
- **Visual Reference:** `ML_TOPBAR_VISUAL_REFERENCE.md`
- **Detailed Checklist:** `neura-ml/FUNCTIONALITY_TEST_CHECKLIST.md`
- **Component Details:** `neura-ml/UI_UPGRADE_COMPLETE.md`

---

**Happy Testing! 🎉**

**Last Updated:** 2026-04-18
