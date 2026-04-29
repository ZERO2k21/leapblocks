# 🧪 LeapNeura Runtime Testing Checklist

## Purpose
Verify that the restructured LeapNeura module works correctly at runtime after all files have been moved and renamed.

---

## ✅ Pre-Testing Verification

- [x] TypeScript compilation passes (`npx tsc --noEmit`)
- [x] No import errors in leapNeura files
- [x] All files renamed to camelCase
- [x] Old directories cleaned up
- [x] Module entry point created

---

## 🧪 Runtime Tests

### 1. Application Launch
- [ ] Start the application (`npm run dev` or equivalent)
- [ ] Navigate to landing page
- [ ] Click on "Neura" or "AI/ML" option
- [ ] Verify Neura app loads without errors
- [ ] Check browser console for errors

**Expected Result**: Neura app loads successfully with dashboard view

---

### 2. Dashboard View
- [ ] Dashboard displays correctly
- [ ] "My Projects" header visible
- [ ] "Create New Project" button works
- [ ] Empty state illustration shows (if no projects)
- [ ] No console errors

**Expected Result**: Clean dashboard UI with no errors

---

### 3. Create Project Modal
- [ ] Click "Create New Project"
- [ ] Modal opens with project type cards
- [ ] All 7 classifier types display:
  - [ ] Image Classifier
  - [ ] Object Detection
  - [ ] Pose Classifier
  - [ ] Hand Pose Classifier
  - [ ] Audio Classifier
  - [ ] Numbers Classifier
  - [ ] Text Classifier
- [ ] Each card shows icon, title, description
- [ ] Close button works

**Expected Result**: All project types display correctly

---

### 4. Image Classifier
- [ ] Select "Image Classifier"
- [ ] Classifier interface loads
- [ ] Project header displays
- [ ] Class sections visible (class1, class2)
- [ ] "Add Class" button works
- [ ] Webcam capture button visible
- [ ] Training panel displays
- [ ] No console errors

**Expected Result**: Full image classifier UI loads

#### 4.1 Webcam Capture
- [ ] Click webcam capture button
- [ ] Browser requests camera permission
- [ ] Webcam feed displays
- [ ] Capture button works
- [ ] Captured images appear in class samples
- [ ] Can capture multiple samples

**Expected Result**: Webcam capture works smoothly

#### 4.2 Class Management
- [ ] Can add new classes
- [ ] Can rename classes
- [ ] Can delete classes
- [ ] Class colors display correctly
- [ ] Sample count updates

**Expected Result**: All class operations work

#### 4.3 Model Training
- [ ] Add 5+ samples to each class
- [ ] "Train Model" button becomes enabled
- [ ] Click "Train Model"
- [ ] Training progress shows
- [ ] Training completes successfully
- [ ] Accuracy percentage displays

**Expected Result**: Model trains without errors

#### 4.4 Model Testing
- [ ] After training, testing panel appears
- [ ] Can test with webcam
- [ ] Predictions display
- [ ] Confidence scores show
- [ ] Results update in real-time

**Expected Result**: Testing works correctly

---

### 5. Object Detection
- [ ] Return to dashboard
- [ ] Create "Object Detection" project
- [ ] Interface loads correctly
- [ ] Specific object detection UI displays
- [ ] No console errors

**Expected Result**: Object detection loads

---

### 6. Pose Classifier
- [ ] Create "Pose Classifier" project
- [ ] Interface loads correctly
- [ ] Pose-specific UI displays
- [ ] Webcam works for pose detection
- [ ] No console errors

**Expected Result**: Pose classifier loads

---

### 7. Hand Pose Classifier
- [ ] Create "Hand Pose Classifier" project
- [ ] Interface loads correctly
- [ ] Hand pose UI displays
- [ ] Webcam works for hand detection
- [ ] No console errors

**Expected Result**: Hand pose classifier loads

---

### 8. Audio Classifier
- [ ] Create "Audio Classifier" project
- [ ] Interface loads correctly
- [ ] Audio-specific UI displays
- [ ] Microphone permission requested
- [ ] Audio capture works
- [ ] No console errors

**Expected Result**: Audio classifier loads

---

### 9. Numbers Classifier
- [ ] Create "Numbers Classifier" project
- [ ] Interface loads correctly
- [ ] Number recognition UI displays
- [ ] Drawing/input interface works
- [ ] No console errors

**Expected Result**: Numbers classifier loads

---

### 10. Text Classifier
- [ ] Create "Text Classifier" project
- [ ] Interface loads correctly
- [ ] Text input UI displays
- [ ] Text classification works
- [ ] No console errors

**Expected Result**: Text classifier loads

---

### 11. Navigation
- [ ] Back button works from any classifier
- [ ] Returns to dashboard correctly
- [ ] Can switch between projects
- [ ] No state loss when navigating
- [ ] No console errors

**Expected Result**: Navigation works smoothly

---

### 12. Project Management
- [ ] Projects save correctly
- [ ] Can open existing projects
- [ ] Project cards display on dashboard
- [ ] Project metadata correct
- [ ] Can delete projects (if implemented)

**Expected Result**: Project persistence works

---

### 13. Exit to Landing
- [ ] Click back/home button
- [ ] Returns to landing page
- [ ] Can re-enter Neura app
- [ ] State preserved/reset appropriately
- [ ] No console errors

**Expected Result**: Clean exit and re-entry

---

## 🐛 Error Checking

### Console Errors to Watch For
- [ ] Import/module errors
- [ ] Component rendering errors
- [ ] Type errors
- [ ] State management errors
- [ ] TensorFlow.js errors
- [ ] Media device errors

### Common Issues
- [ ] Webcam permission denied
- [ ] Microphone permission denied
- [ ] TensorFlow.js not loading
- [ ] Model training failures
- [ ] State not updating
- [ ] Navigation issues

---

## 📝 Test Results

### Environment
- **Date**: _______________
- **Browser**: _______________
- **OS**: _______________
- **Node Version**: _______________
- **Build Command**: _______________

### Summary
- **Tests Passed**: ___ / 13
- **Critical Issues**: _______________
- **Minor Issues**: _______________
- **Notes**: _______________

---

## 🚨 If Tests Fail

### Debugging Steps
1. Check browser console for errors
2. Verify import paths in failing component
3. Check if TensorFlow.js is loaded
4. Verify media permissions granted
5. Check network tab for failed requests
6. Review component props and state

### Common Fixes
- Clear browser cache
- Restart dev server
- Check TypeScript compilation
- Verify all dependencies installed
- Check for missing files

---

## ✅ Sign-Off

- [ ] All critical tests passed
- [ ] No blocking errors found
- [ ] Minor issues documented
- [ ] Ready for production use

**Tested By**: _______________
**Date**: _______________
**Status**: ⬜ PASS / ⬜ FAIL / ⬜ PARTIAL

---

## 📌 Notes

Use this space for additional observations:

```
[Your notes here]
```

---

*This checklist ensures the restructured LeapNeura module works correctly in all scenarios.*
