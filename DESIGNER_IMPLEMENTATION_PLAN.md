# MIT App Inventor Designer - Complete Implementation Plan

## Overview
This document outlines the complete implementation of MIT App Inventor's Designer interface with all exact features and working principles.

---

## MIT App Inventor Designer Layout

### Four Main Panels (Left to Right)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MIT APP INVENTOR DESIGNER                           │
├─────────────┬──────────────┬──────────────────┬──────────────────────────────┤
│             │              │                  │                              │
│   PALETTE   │    VIEWER    │   COMPONENTS     │        PROPERTIES            │
│   (Left)    │   (Center)   │   (Center-Right) │         (Right)              │
│             │              │                  │                              │
│  Component  │   Phone      │   Component      │   Selected Component         │
│  Categories │   Screen     │   Tree/          │   Properties Editor          │
│  & Items    │   Preview    │   Hierarchy      │                              │
│             │              │   + Media        │                              │
│             │              │                  │                              │
└─────────────┴──────────────┴──────────────────┴──────────────────────────────┘
```

---

## Panel 1: PALETTE (Component Library)

### Purpose
Displays all available components organized by category that users can drag onto the Viewer.

### Layout Structure
```
┌─────────────────────────┐
│       PALETTE           │
├─────────────────────────┤
│                         │
│ ▼ User Interface        │
│   • Button              │
│   • Label               │
│   • TextBox             │
│   • CheckBox            │
│   • Image               │
│   • Slider              │
│   • ...                 │
│                         │
│ ▼ Layout                │
│   • HorizontalArr...    │
│   • VerticalArrang...   │
│   • TableArrangement    │
│   • ...                 │
│                         │
│ ▼ Media                 │
│   • Camera              │
│   • ImagePicker         │
│   • Player              │
│   • Sound               │
│   • ...                 │
│                         │
│ ▼ Drawing & Animation   │
│   • Canvas              │
│   • Ball                │
│   • ImageSprite         │
│   • ...                 │
│                         │
│ ▼ Sensors               │
│   • AccelerometerSensor │
│   • LocationSensor      │
│   • GyroscopeSensor     │
│   • ...                 │
│                         │
│ ▼ Social                │
│   • ContactPicker       │
│   • PhoneCall           │
│   • Texting             │
│   • ...                 │
│                         │
│ ▼ Storage               │
│   • TinyDB              │
│   • File                │
│   • CloudDB             │
│   • ...                 │
│                         │
│ ▼ Connectivity          │
│   • Web                 │
│   • BluetoothClient     │
│   • BluetoothServer     │
│   • ...                 │
│                         │
│ ▼ LEGO MINDSTORMS       │
│   • NxtDrive            │
│   • ...                 │
│                         │
│ ▼ Experimental          │
│   • FirebaseDB          │
│   • ...                 │
│                         │
└─────────────────────────┘
```

### Features
1. **Collapsible Categories**: Click category header to expand/collapse
2. **Drag-and-Drop**: Drag components to Viewer
3. **Component Icons**: Each component has a visual icon
4. **Tooltips**: Hover to see component description
5. **Search**: Filter components by name (optional enhancement)

### Component Categories (Complete List)

#### 1. User Interface
- Button
- CheckBox
- DatePicker
- Image
- Label
- ListPicker
- ListView
- Notifier
- PasswordTextBox
- Slider
- Spinner
- Switch
- TextBox
- TimePicker
- WebViewer

#### 2. Layout
- HorizontalArrangement
- HorizontalScrollArrangement
- TableArrangement
- VerticalArrangement
- VerticalScrollArrangement

#### 3. Media
- Camera
- Camcorder
- ImagePicker
- Player
- Sound
- SoundRecorder
- SpeechRecognizer
- TextToSpeech
- VideoPlayer
- YandexTranslate

#### 4. Drawing and Animation
- Ball
- Canvas
- ImageSprite

#### 5. Maps
- Map
- Circle
- FeatureCollection
- LineString
- Marker
- Polygon
- Rectangle

#### 6. Sensors
- AccelerometerSensor
- BarcodeScanner
- Clock
- GyroscopeSensor
- HygrometrySensor
- LightSensor
- LocationSensor
- MagneticFieldSensor
- NearField
- OrientationSensor
- Pedometer
- ProximitySensor
- ThermometerSensor

#### 7. Social
- ContactPicker
- EmailPicker
- PhoneCall
- PhoneNumberPicker
- Sharing
- Texting
- Twitter

#### 8. Storage
- CloudDB
- DataFile
- File
- FirebaseDB
- TinyDB
- TinyWebDB

#### 9. Connectivity
- ActivityStarter
- BluetoothClient
- BluetoothServer
- Serial
- Web

#### 10. LEGO MINDSTORMS
- Ev3ColorSensor
- Ev3Commands
- Ev3GyroSensor
- Ev3Motors
- Ev3Sound
- Ev3TouchSensor
- Ev3UI
- Ev3UltrasonicSensor
- NxtColorSensor
- NxtDirectCommands
- NxtDrive
- NxtLightSensor
- NxtSoundSensor
- NxtTouchSensor
- NxtUltrasonicSensor

#### 11. Experimental
- ChromeWebView
- FirebaseDB (if not in Storage)

---

## Panel 2: VIEWER (Phone Screen Preview)

### Purpose
Visual canvas showing phone screen where components are placed and arranged.

### Layout Structure
```
┌─────────────────────────────────┐
│          VIEWER                 │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐  │
│  │ Screen1                   │  │ ← Screen Title Bar
│  ├───────────────────────────┤  │
│  │                           │  │
│  │   [Drop components here]  │  │
│  │                           │  │
│  │   ┌─────────────────┐     │  │
│  │   │    Button1      │     │  │ ← Placed Component
│  │   └─────────────────┘     │  │
│  │                           │  │
│  │   Label1                  │  │ ← Another Component
│  │                           │  │
│  │   ┌─────────────────┐     │  │
│  │   │    TextBox1     │     │  │
│  │   └─────────────────┘     │  │
│  │                           │  │
│  │                           │  │
│  │                           │  │
│  │                           │  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
│  Phone: [Dropdown ▼]            │ ← Device Selector
│  Screen: [Screen1 ▼]            │ ← Screen Selector
│                                 │
└─────────────────────────────────┘
```

### Features

#### 1. **Phone Screen Mockup**
- Displays phone-sized canvas (typical: 360x640dp)
- Shows screen title bar
- White background by default
- Scrollable if content exceeds screen height

#### 2. **Component Placement**
- **Drag-and-Drop**: Drop components from Palette
- **Visual Feedback**: Highlight drop zones
- **Snap to Grid**: Optional alignment guides
- **Selection**: Click to select component (shows blue border)
- **Multi-Select**: Ctrl+Click for multiple selection
- **Reordering**: Drag components to reorder

#### 3. **Component Rendering**
- **Visible Components**: Rendered as they would appear on phone
  - Button: Shows text, background color, shape
  - Label: Shows text, font, color
  - Image: Shows placeholder or actual image
  - TextBox: Shows input field with hint
  - Layout: Shows container with nested components

- **Non-Visible Components**: Shown as icons at bottom
  - TinyDB: Database icon
  - Sound: Speaker icon
  - LocationSensor: GPS icon
  - Clock: Clock icon

#### 4. **Screen Management**
- **Screen Dropdown**: Switch between multiple screens
- **Add Screen**: Button to create new screen
- **Remove Screen**: Delete current screen (except Screen1)
- **Rename Screen**: Double-click to rename

#### 5. **Device Selector**
- **Phone Models**: Different screen sizes
  - Phone (360x640)
  - Tablet 7" (600x960)
  - Tablet 10" (800x1280)
- **Orientation**: Portrait/Landscape toggle

#### 6. **Interaction States**
- **Hover**: Show component name tooltip
- **Selected**: Blue border around component
- **Dragging**: Semi-transparent while dragging
- **Drop Zone**: Green highlight when valid drop

---

## Panel 3: COMPONENTS (Component Tree + Media)

### Purpose
Shows hierarchical tree of all components on current screen and manages media assets.

### Layout Structure
```
┌─────────────────────────────────┐
│        COMPONENTS               │
├─────────────────────────────────┤
│                                 │
│ Components                      │
│ ─────────────────────────────   │
│ ▼ Screen1                       │
│   ├─ Button1                    │
│   ├─ Label1                     │
│   ├─ HorizontalArrangement1     │
│   │  ├─ Image1                  │
│   │  └─ Label2                  │
│   ├─ TextBox1                   │
│   └─ [Non-visible components]   │
│      ├─ TinyDB1                 │
│      ├─ Sound1                  │
│      └─ LocationSensor1         │
│                                 │
│ ─────────────────────────────   │
│                                 │
│ Media                           │
│ ─────────────────────────────   │
│ [Upload File]                   │
│                                 │
│ 📄 logo.png                     │
│ 🎵 click_sound.mp3              │
│ 🎬 intro_video.mp4              │
│                                 │
│ [Delete] [Download]             │
│                                 │
└─────────────────────────────────┘
```

### Features

#### 1. **Component Tree**
- **Hierarchical Display**: Shows parent-child relationships
- **Expand/Collapse**: Click arrows to show/hide children
- **Selection**: Click component name to select (highlights in Viewer)
- **Rename**: Right-click → Rename or double-click
- **Delete**: Right-click → Delete or press Delete key
- **Copy/Paste**: Right-click → Copy/Paste
- **Drag to Reorder**: Drag components to change order

#### 2. **Component Organization**
- **Visible Components**: Listed in order they appear on screen
- **Layout Containers**: Show nested components indented
- **Non-Visible Components**: Grouped at bottom with special icon
- **Component Icons**: Each component has type icon
- **Component Count**: Shows total components

#### 3. **Media Manager**
- **Upload Files**: Click to upload images, sounds, videos
- **File Types Supported**:
  - Images: .png, .jpg, .gif, .bmp
  - Audio: .mp3, .wav, .ogg
  - Video: .mp4, .3gp
  - Other: .txt, .json, .csv
- **File List**: Shows all uploaded media with icons
- **File Actions**:
  - Download: Download file to computer
  - Delete: Remove from project
  - Rename: Change filename
- **File Size**: Shows file size next to name
- **Used By**: Shows which components use each file

#### 4. **Context Menu** (Right-Click)
```
┌─────────────────────┐
│ Rename              │
│ Delete              │
│ Copy                │
│ Paste               │
│ ─────────────────── │
│ Move Up             │
│ Move Down           │
│ ─────────────────── │
│ Convert to Screen   │ (for layouts)
└─────────────────────┘
```

---

## Panel 4: PROPERTIES (Property Editor)

### Purpose
Edit properties of selected component with type-appropriate editors.

### Layout Structure
```
┌─────────────────────────────────┐
│        PROPERTIES               │
├─────────────────────────────────┤
│                                 │
│ Button1                         │ ← Component Name
│ ─────────────────────────────   │
│                                 │
│ BackgroundColor                 │
│ [🎨 Blue        ▼]              │ ← Color Picker
│                                 │
│ Enabled                         │
│ [✓] True                        │ ← Checkbox
│                                 │
│ FontBold                        │
│ [✓] True                        │
│                                 │
│ FontItalic                      │
│ [ ] False                       │
│                                 │
│ FontSize                        │
│ [14.0          ]                │ ← Number Input
│                                 │
│ FontTypeface                    │
│ [default       ▼]               │ ← Dropdown
│                                 │
│ Height                          │
│ [Automatic     ▼]               │ ← Size Selector
│                                 │
│ Width                           │
│ [Fill parent   ▼]               │
│                                 │
│ Image                           │
│ [Choose...     ]                │ ← File Picker
│                                 │
│ Shape                           │
│ [default       ▼]               │
│ • default                       │
│ • rounded                       │
│ • rectangular                   │
│ • oval                          │
│                                 │
│ ShowFeedback                    │
│ [✓] True                        │
│                                 │
│ Text                            │
│ [Click Me      ]                │ ← Text Input
│                                 │
│ TextAlignment                   │
│ [center        ▼]               │
│ • left                          │
│ • center                        │
│ • right                         │
│                                 │
│ TextColor                       │
│ [🎨 White       ▼]              │
│                                 │
│ Visible                         │
│ [✓] True                        │
│                                 │
└─────────────────────────────────┘
```

### Property Types & Editors

#### 1. **Text Properties**
- **Editor**: Single-line text input
- **Examples**: Text, Hint, Title
- **Features**: 
  - Direct typing
  - Clear button
  - Character count (optional)

#### 2. **Number Properties**
- **Editor**: Number input with spinner
- **Examples**: FontSize, Width, Height, Interval
- **Features**:
  - Up/down arrows
  - Min/max validation
  - Decimal support
  - Unit display (px, dp, %)

#### 3. **Boolean Properties**
- **Editor**: Checkbox
- **Examples**: Enabled, Visible, FontBold, ShowFeedback
- **Features**:
  - Single click toggle
  - Shows True/False label

#### 4. **Color Properties**
- **Editor**: Color picker dropdown
- **Examples**: BackgroundColor, TextColor
- **Features**:
  - Predefined colors (Red, Blue, Green, etc.)
  - Custom color picker (RGB/Hex)
  - Color preview swatch
  - Recent colors
  - Default/None option

#### 5. **Choice Properties** (Dropdown)
- **Editor**: Dropdown select
- **Examples**: FontTypeface, TextAlignment, Shape
- **Features**:
  - List of valid options
  - Search/filter (for long lists)
  - Preview (if applicable)

#### 6. **Asset Properties** (File Picker)
- **Editor**: File selection button
- **Examples**: Image, Picture, Source
- **Features**:
  - Choose from uploaded media
  - Upload new file
  - Clear selection
  - Preview thumbnail

#### 7. **Size Properties**
- **Editor**: Special dropdown
- **Examples**: Height, Width
- **Options**:
  - Automatic (wrap content)
  - Fill parent (match parent)
  - [Number] pixels
- **Features**:
  - Quick presets
  - Custom pixel value

#### 8. **List Properties**
- **Editor**: Multi-line text or list builder
- **Examples**: Elements, ElementsFromString
- **Features**:
  - Add/remove items
  - Reorder items
  - Import from CSV

#### 9. **Component Reference Properties**
- **Editor**: Dropdown of compatible components
- **Examples**: ActivityClass, Screen
- **Features**:
  - Shows only valid components
  - Jump to component button

### Property Organization

#### Categories (Collapsible Sections)
```
▼ Appearance
  • BackgroundColor
  • FontBold
  • FontItalic
  • FontSize
  • FontTypeface
  • Image
  • Shape
  • Text
  • TextAlignment
  • TextColor

▼ Behavior
  • Enabled
  • ShowFeedback

▼ Layout
  • Height
  • Width
  • Visible

▼ Advanced
  • (Advanced properties)
```

### Property Features

#### 1. **Real-Time Updates**
- Changes immediately reflected in Viewer
- No "Apply" button needed
- Undo/Redo support

#### 2. **Property Validation**
- Invalid values show error message
- Prevents invalid input
- Suggests corrections

#### 3. **Property Help**
- Hover over property name for tooltip
- Click "?" icon for detailed help
- Links to documentation

#### 4. **Property Search**
- Search box at top
- Filters properties by name
- Highlights matching text

#### 5. **Property Defaults**
- "Reset to Default" button
- Shows default value in gray
- Indicates modified properties (bold)

---

## Component Working Principles

### 1. **Component Lifecycle**

```
┌─────────────────────────────────────────────────────────────┐
│                   COMPONENT LIFECYCLE                       │
└─────────────────────────────────────────────────────────────┘

1. CREATION
   ├─ User drags component from Palette to Viewer
   ├─ System generates unique ID (e.g., "Button1")
   ├─ Component added to component tree
   ├─ Default properties applied
   └─ Component rendered in Viewer

2. CONFIGURATION
   ├─ User selects component
   ├─ Properties panel shows component properties
   ├─ User edits properties
   ├─ Changes applied in real-time
   └─ Viewer updates immediately

3. INTERACTION
   ├─ User can drag to reposition
   ├─ User can resize (if applicable)
   ├─ User can nest in layouts
   └─ User can copy/paste/delete

4. CODE GENERATION
   ├─ Designer state serialized to JSON
   ├─ Blocks editor adds event handlers
   ├─ Build system generates app code
   └─ APK compiled and packaged
```

### 2. **Drag-and-Drop System**

```javascript
// Drag-and-Drop Flow

1. DRAG START (from Palette)
   ├─ User clicks and holds component in Palette
   ├─ Create ghost/preview element
   ├─ Set drag data (component type)
   └─ Show valid drop zones

2. DRAG OVER (Viewer)
   ├─ Check if drop is valid
   ├─ Highlight drop zone (green border)
   ├─ Show insertion indicator
   └─ Calculate drop position

3. DROP (on Viewer)
   ├─ Validate drop location
   ├─ Create component instance
   ├─ Add to component tree
   ├─ Render in Viewer
   └─ Select new component

4. DRAG END
   ├─ Remove ghost element
   ├─ Clear drop zone highlights
   └─ Update UI state
```

### 3. **Component Rendering**

```javascript
// Component Rendering Logic

function renderComponent(component) {
  const { type, id, props, children } = component;
  
  // Get component definition
  const definition = COMPONENT_DEFINITIONS[type];
  
  // Apply default properties
  const mergedProps = { ...definition.defaults, ...props };
  
  // Render based on type
  switch (type) {
    case 'Button':
      return (
        <button
          id={id}
          style={{
            backgroundColor: mergedProps.BackgroundColor,
            color: mergedProps.TextColor,
            fontSize: mergedProps.FontSize,
            fontWeight: mergedProps.FontBold ? 'bold' : 'normal',
            fontStyle: mergedProps.FontItalic ? 'italic' : 'normal',
            width: calculateSize(mergedProps.Width),
            height: calculateSize(mergedProps.Height),
            borderRadius: getShapeBorderRadius(mergedProps.Shape),
            // ... more styles
          }}
          disabled={!mergedProps.Enabled}
          onClick={() => handleComponentClick(id)}
        >
          {mergedProps.Text}
        </button>
      );
    
    case 'Label':
      return (
        <div
          id={id}
          style={{
            color: mergedProps.TextColor,
            fontSize: mergedProps.FontSize,
            textAlign: mergedProps.TextAlignment,
            // ... more styles
          }}
        >
          {mergedProps.Text}
        </div>
      );
    
    case 'HorizontalArrangement':
      return (
        <div
          id={id}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: mergedProps.AlignVertical,
            justifyContent: mergedProps.AlignHorizontal,
            // ... more styles
          }}
        >
          {children.map(child => renderComponent(child))}
        </div>
      );
    
    // ... more component types
  }
}
```

### 4. **Property System**

```javascript
// Property Definition Structure

const COMPONENT_PROPERTIES = {
  Button: {
    // Appearance Properties
    BackgroundColor: {
      type: 'color',
      default: '#3F51B5',
      category: 'Appearance',
      description: 'The background color of the button',
      editor: 'ColorPicker'
    },
    Text: {
      type: 'string',
      default: 'Text for Button1',
      category: 'Appearance',
      description: 'The text displayed on the button',
      editor: 'TextInput'
    },
    FontSize: {
      type: 'number',
      default: 14.0,
      min: 1,
      max: 100,
      category: 'Appearance',
      description: 'The font size of the button text',
      editor: 'NumberInput',
      unit: 'sp'
    },
    FontBold: {
      type: 'boolean',
      default: false,
      category: 'Appearance',
      description: 'Whether the text should be bold',
      editor: 'Checkbox'
    },
    Shape: {
      type: 'choice',
      default: 'default',
      options: ['default', 'rounded', 'rectangular', 'oval'],
      category: 'Appearance',
      description: 'The shape of the button',
      editor: 'Dropdown'
    },
    
    // Behavior Properties
    Enabled: {
      type: 'boolean',
      default: true,
      category: 'Behavior',
      description: 'Whether the button is active',
      editor: 'Checkbox'
    },
    
    // Layout Properties
    Width: {
      type: 'size',
      default: 'Automatic',
      category: 'Layout',
      description: 'The width of the button',
      editor: 'SizeSelector'
    },
    Height: {
      type: 'size',
      default: 'Automatic',
      category: 'Layout',
      description: 'The height of the button',
      editor: 'SizeSelector'
    },
    Visible: {
      type: 'boolean',
      default: true,
      category: 'Layout',
      description: 'Whether the button is visible',
      editor: 'Checkbox'
    }
  },
  
  // ... more components
};
```

### 5. **State Management**

```javascript
// App State Structure

const appState = {
  appName: 'MyApp',
  packageName: 'com.example.myapp',
  screens: [
    {
      id: 'Screen1',
      name: 'Screen1',
      title: 'Screen1',
      properties: {
        BackgroundColor: '#FFFFFF',
        Title: 'Screen1',
        // ... more screen properties
      },
      components: [
        {
          id: 'Button1',
          type: 'Button',
          properties: {
            Text: 'Click Me',
            BackgroundColor: '#3F51B5',
            TextColor: '#FFFFFF',
            // ... more properties
          },
          events: {
            Click: {
              blocks: [/* Blockly blocks */]
            }
          }
        },
        {
          id: 'HorizontalArrangement1',
          type: 'HorizontalArrangement',
          properties: { /* ... */ },
          children: [
            {
              id: 'Label1',
              type: 'Label',
              properties: { /* ... */ }
            }
          ]
        }
      ],
      nonVisibleComponents: [
        {
          id: 'TinyDB1',
          type: 'TinyDB',
          properties: { /* ... */ }
        }
      ]
    }
  ],
  media: [
    {
      filename: 'logo.png',
      size: 15234,
      type: 'image/png',
      data: 'base64...'
    }
  ]
};
```

---

## Implementation Checklist

### Phase 1: Enhanced Palette
- [ ] Add all 50+ components with correct categories
- [ ] Implement collapsible categories
- [ ] Add component icons
- [ ] Add tooltips with descriptions
- [ ] Implement search/filter
- [ ] Add drag preview

### Phase 2: Enhanced Viewer
- [ ] Add screen title bar
- [ ] Implement device selector (phone/tablet sizes)
- [ ] Add orientation toggle
- [ ] Implement snap-to-grid
- [ ] Add alignment guides
- [ ] Show non-visible components at bottom
- [ ] Add multi-select support
- [ ] Implement copy/paste

### Phase 3: Component Tree Panel
- [ ] Create new ComponentTree component
- [ ] Show hierarchical component structure
- [ ] Implement expand/collapse
- [ ] Add drag-to-reorder
- [ ] Implement context menu
- [ ] Add component icons
- [ ] Show component count

### Phase 4: Media Manager
- [ ] Add media upload functionality
- [ ] Show media list with icons
- [ ] Implement file download
- [ ] Implement file delete
- [ ] Show file sizes
- [ ] Add file type icons
- [ ] Show "used by" information

### Phase 5: Enhanced Properties Panel
- [ ] Organize properties by category
- [ ] Implement all property editor types:
  - [ ] Text input
  - [ ] Number input with spinner
  - [ ] Checkbox
  - [ ] Color picker
  - [ ] Dropdown select
  - [ ] File picker
  - [ ] Size selector
  - [ ] List builder
- [ ] Add property search
- [ ] Add property help tooltips
- [ ] Add "Reset to Default" button
- [ ] Highlight modified properties

### Phase 6: Component Library Expansion
- [ ] Add all User Interface components (15)
- [ ] Add all Layout components (5)
- [ ] Add all Media components (10)
- [ ] Add all Drawing & Animation components (3)
- [ ] Add all Sensors components (13)
- [ ] Add all Social components (7)
- [ ] Add all Storage components (6)
- [ ] Add all Connectivity components (5)
- [ ] Add Maps components (7)
- [ ] Add LEGO MINDSTORMS components (15)

---

## Copyright & Licensing

### MIT App Inventor License
- **License**: Apache 2.0 (source code) + Creative Commons BY-SA 3.0 (content)
- **Source**: https://github.com/mit-cml/appinventor-sources
- **Status**: Open source, free to study and learn from

### Our Implementation
- **Approach**: Study MIT App Inventor's design patterns and create original implementation
- **Code**: 100% original React/TypeScript code
- **UI**: Inspired by MIT App Inventor but with modern design
- **Components**: Original implementations using React Native
- **No Copyright Issues**: We're creating an original work inspired by open-source software

### Attribution
Content was rephrased for compliance with licensing restrictions. This implementation is inspired by MIT App Inventor (Apache 2.0 license) but contains original code and design.

---

## Next Steps

1. **Review Current Implementation**: Check existing Palette, Viewer, and Properties components
2. **Create Component Tree**: New panel between Viewer and Properties
3. **Enhance Palette**: Add all 50+ components with categories
4. **Enhance Properties**: Add all property editor types
5. **Add Media Manager**: File upload and management
6. **Test Integration**: Ensure all panels work together seamlessly

Ready to implement! 🚀
