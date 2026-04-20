# NeuraML Functionality Test Checklist

## Pre-Test Setup
- [ ] Ensure all dependencies are installed (`npm install` in root)
- [ ] Verify lucide-react is available (v0.562.0)
- [ ] Check that assets folder contains required logos:
  - `assets/leaplab_logo_transparent.png`
  - `assets/Copy of CREOLEAP LOGO LEAP INTO THE AI FUTURE Final.svg`

## 1. Navigation & UI Tests

### Header Component
- [ ] **Home Button**
  - Click home button → Should navigate back to main menu
  - Hover effect works (background changes)
  - Icon displays correctly

- [ ] **LeapLab Logo & Branding**
  - Logo displays correctly
  - "LEAPLAB" text in yellow
  - "NEURA ML" text in white
  - Proper spacing and alignment

- [ ] **Tutorials Button**
  - Button displays with book icon
  - Hover effect works
  - (Functionality to be implemented)

- [ ] **Utility Icons**
  - Feedback icon displays
  - Achievements icon displays
  - Settings icon displays
  - Help icon displays
  - All icons have hover effects

- [ ] **Sign In Button**
  - Button displays with avatar
  - "LB" initials show in avatar
  - Hover effect works
  - (Functionality to be implemented)

- [ ] **Creoleap Logo**
  - Right-side logo displays
  - Proper sizing and positioning

### Project Name Input (in Classifier View)
- [ ] Input field displays with brain emoji
- [ ] Can type and edit project name
- [ ] Save button (green circle) displays
- [ ] Save button hover effect works
- [ ] Save button click triggers console.log

### Sub-Header (in Classifier View)
- [ ] Purple gradient background displays
- [ ] Project info card shows:
  - Brain emoji
  - Project name
  - Project type
- [ ] Status badge displays correctly:
  - "Untrained" in amber
  - "Trained" in green (after training)
- [ ] Export Model button displays and hovers
- [ ] Settings button displays and hovers

## 2. My Projects Page

### Layout
- [ ] Page loads without errors
- [ ] Header displays correctly
- [ ] Sub-header bar with search and buttons displays
- [ ] Table header displays (5 columns)

### Empty State
- [ ] When no projects:
  - Animated icons display (brain, text, hand, mic, cat)
  - "No projects yet" message shows
  - "Create New Project" button displays

### Project List
- [ ] After creating projects:
  - Projects display in table rows
  - Project icon shows based on type
  - Project name and description display
  - Type column shows correct type
  - Classes count displays
  - Last updated date shows
  - Status badge displays
  - Row hover effect works (purple background)
  - Click row opens project

### Actions
- [ ] Search box filters projects by name
- [ ] "Create New Project" button opens create page
- [ ] "Open ML Project" button (functionality TBD)

## 3. Create Project Page

### Layout
- [ ] Page loads without errors
- [ ] Header displays correctly
- [ ] Modal-style card displays

### Project Details Section
- [ ] "Enter Project Details" heading displays
- [ ] Project name input field works
- [ ] Description input field works (optional)
- [ ] Input focus effects work (purple underline)
- [ ] Error clears when typing

### Project Type Selection
- [ ] "Select Project Type" heading displays
- [ ] All 7 project types display:
  1. Image Classifier (🖼️)
  2. Object Detection (🔍)
  3. Pose Classifier (🧍)
  4. Hand Pose Classifier (🖐️)
  5. Audio Classifier (🎙️)
  6. Numbers (C/R) (📊)
  7. Text Classifier (📝)
- [ ] Click type → Card highlights with colored background
- [ ] Selected type shows colored border and background
- [ ] Emoji and label display correctly

### Validation & Creation
- [ ] Create button disabled when:
  - No project name entered
  - No project type selected
- [ ] Error message shows when trying to create without required fields
- [ ] Create button enabled when both fields filled
- [ ] Click Create → Project created and opens classifier
- [ ] Back button returns to projects page

## 4. Object Detection Classifier

### Model Loading
- [ ] Info banner displays (COCO-SSD description)
- [ ] "Load Detection Model" button displays
- [ ] Click Load → Button shows "Loading model…"
- [ ] Model loads successfully (~10 MB download)
- [ ] Button disabled during loading

### Camera & Detection
- [ ] "Start Camera & Detect" button displays after model loads
- [ ] Click Start → Camera permission requested
- [ ] Camera feed displays in black rounded container
- [ ] Detection counter displays (green badge)
- [ ] "Stop Camera" button displays while running
- [ ] Bounding boxes draw on detected objects
- [ ] Object labels show with confidence %
- [ ] Detection results update in real-time

### Detection Results
- [ ] "Detected Objects" panel displays
- [ ] Each detected object shows as purple badge
- [ ] Object name and confidence % display
- [ ] Results update as objects change

### Navigation
- [ ] Back button in header works
- [ ] Returns to projects page

## 5. Image Classifier

### Three-Panel Layout
- [ ] Left panel (Classes) displays
- [ ] Middle panel (Training) displays
- [ ] Right panel (Testing) displays
- [ ] Panels are properly sized and scrollable

### Classes Panel
- [ ] Two default classes display (Class 1, Class 2)
- [ ] "Add Class" button displays
- [ ] Click Add Class → New class added
- [ ] Each class card shows:
  - Colored header
  - Class name (editable)
  - Delete button (X)
  - Webcam button
  - Upload button
  - Sample count
  - Sample thumbnails

### Sample Collection
- [ ] Click Webcam → WebcamModal opens
- [ ] Camera feed displays
- [ ] Capture button works
- [ ] Samples added to class
- [ ] Click Upload → File picker opens
- [ ] Select images → Thumbnails display
- [ ] Sample count updates

### Training Panel
- [ ] Sample counts display for each class
- [ ] "Train Model" button disabled until 5+ samples per class
- [ ] Advanced settings toggle works
- [ ] Epochs slider works
- [ ] Click Train → Progress bar animates
- [ ] Training completes → Success message
- [ ] Accuracy displays

### Testing Panel
- [ ] Disabled until model trained
- [ ] After training → Camera option available
- [ ] Predictions display with confidence bars
- [ ] Real-time prediction updates

## 6. Audio Classifier

### Layout
- [ ] Three-panel layout displays
- [ ] Two default sound classes display

### Recording
- [ ] Click record button → Mic permission requested
- [ ] Recording indicator shows
- [ ] Click stop → Audio sample saved
- [ ] Sample count updates

### Training & Testing
- [ ] Training panel displays
- [ ] Testing panel displays
- [ ] (Full functionality TBD)

## 7. Pose Classifier

### Layout
- [ ] Three-panel layout displays
- [ ] Two default pose classes display

### Sample Collection
- [ ] Webcam button works
- [ ] Pose capture functionality
- [ ] (MoveNet integration TBD)

## 8. Hand Pose Classifier

### Layout
- [ ] Classes display with colored headers
- [ ] Webcam preview displays
- [ ] Capture button works

### Gesture Capture
- [ ] Click Webcam → Camera starts
- [ ] Video displays (mirrored)
- [ ] Click Capture → Gesture saved
- [ ] Sample count updates
- [ ] Hand emoji icons display

### Training
- [ ] Training panel displays
- [ ] Can train with 2+ classes with samples
- [ ] Progress bar animates
- [ ] Success message displays

## 9. Text Classifier

### Layout
- [ ] Classes display with colored headers
- [ ] Text input fields display

### Sample Collection
- [ ] Type text in input field
- [ ] Press Enter or click Add → Sample added
- [ ] Sample displays as badge
- [ ] Click X on badge → Sample removed
- [ ] Multiple samples per class work

### Training & Testing
- [ ] Training panel works
- [ ] Testing panel displays
- [ ] Type test text → Prediction shows
- [ ] Confidence bars display

## 10. Numbers Classifier

### CSV Upload
- [ ] Upload CSV button displays
- [ ] Click Upload → File picker opens
- [ ] Select CSV → Data loads
- [ ] Row/column count displays
- [ ] Table preview shows (first 5 rows)
- [ ] All columns display

### Column Mapping
- [ ] Label column dropdown displays
- [ ] Can select label column
- [ ] Feature columns list updates

### Training
- [ ] Train button disabled until CSV loaded
- [ ] Click Train → Progress bar animates
- [ ] Training completes → Success message

### Testing
- [ ] Input fields for each feature column
- [ ] Enter values → Predict button enabled
- [ ] Click Predict → Result displays
- [ ] Confidence bars show

## Performance Tests

### Load Times
- [ ] Initial page load < 2 seconds
- [ ] Project list loads instantly
- [ ] Classifier opens < 1 second
- [ ] Model loading shows progress

### Camera Performance
- [ ] Camera feed smooth (30 fps)
- [ ] Detection runs without lag
- [ ] No memory leaks during extended use

### Responsiveness
- [ ] UI responds immediately to clicks
- [ ] No frozen states
- [ ] Smooth animations

## Browser Compatibility

### Chrome/Edge
- [ ] All features work
- [ ] Camera access works
- [ ] Mic access works
- [ ] No console errors

### Firefox
- [ ] All features work
- [ ] Camera access works
- [ ] Mic access works

### Safari
- [ ] All features work
- [ ] Camera access works
- [ ] Mic access works

## Error Handling

### Camera/Mic Errors
- [ ] Permission denied → Alert shows
- [ ] Camera in use → Proper error message
- [ ] Mic in use → Proper error message

### Model Loading Errors
- [ ] Network error → Error message displays
- [ ] Retry option available

### Validation Errors
- [ ] Empty fields → Error messages show
- [ ] Invalid data → Proper feedback

## Accessibility

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Enter key works on buttons
- [ ] Escape closes modals

### Screen Reader
- [ ] Button labels are descriptive
- [ ] Alt text on images
- [ ] ARIA labels where needed

## Known Issues / TODOs
- [ ] Save functionality (currently console.log)
- [ ] Export model functionality
- [ ] Settings panel implementation
- [ ] Tutorials integration
- [ ] Sign In functionality
- [ ] Feedback/Achievements/Help modals
- [ ] Project persistence (localStorage/backend)
- [ ] Model export formats
- [ ] Advanced training options

---

## Test Results Summary

**Date Tested:** _______________
**Tester:** _______________
**Browser:** _______________
**OS:** _______________

**Total Tests:** _____ / _____
**Passed:** _____
**Failed:** _____
**Blocked:** _____

**Critical Issues:**
1. 
2. 
3. 

**Notes:**


