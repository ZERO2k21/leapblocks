# Creova Module - Visual Android Designer & Blockly App Creator

Welcome to **Creova**, a visual, block-based mobile app design and compilation workspace built into LeapBlocks. Creova brings the core concepts of MIT App Inventor into a modern stack, allowing users to design mobile apps visually and program them using Blockly blocks, which are then compiled into native Android applications (APKs) via a React Native build server.

---

## 🎨 Core Architecture & Sub-Systems

The Creova module acts as a complete IDE for visual mobile design and event-driven block-based coding, consisting of four primary layers:

### 1. Visual UI Designer (`designer` view)
* Users design user interfaces visually by dragging components (Buttons, Labels, Image assets, Text fields, Layouts, and non-visual components like Bluetooth or Sensors) onto a virtual phone screen mockup.
* Handled in React via layout containers and absolute/relative layout renderers, with component properties tracked inside a global state slice.

### 2. Blockly Logic Editor (`blocks` view)
* An event-driven block workspace where users define app behaviors (e.g. *"When Button1 is clicked, set Label1 text to..."*).
* Leverages custom Blockly blocks defined under `src/creova/blocks/`.

### 3. C++ / JS React Native Generator (`blocks/generators/reactnative`)
* When building the application, Blockly XML is loaded into a virtual workspace and transpiled using a custom React Native generator wrapper.
* The generator compiles the blocks into standard JavaScript code compatible with the mobile framework client.

### 4. Compilation & APK Build Service (`hooks/useBuildApk.js`)
* Combines the visual screen component hierarchy, assets, and transpiled JavaScript logic into a unified JSON project state.
* If running on Electron, sends the compiled manifest to the main build process (`electronAPI.buildApk`).
* The build server receives the React Native layout, packages it, signs it, and compiles it into a production-ready `.apk` file, outputting build log callbacks back to the user interface.

---

## 📂 Directory Layout

```
src/creova/
├── README.md                  # Developer guide & architecture manual
├── index.jsx                  # Module entry controller & tab router
├── creova.jsx                 # Alternate layout wrapper
├── apk/                       # Output packages, templates, and signing keys
├── blocks/                    # Blockly blocks and generators
│   ├── definitions/           # Custom block categories and inputs definitions
│   └── generators/            # Block-to-code transpilation definitions (ReactNative)
├── build-server/              # Local React Native build configurations and gradle templates
├── components/                # Designer panels, layout mockups, toolbox, blocks view
├── data/                      # Sample templates, block logic configurations
├── docs/                      # Technical specification sheets
├── engine/                    # UI component managers and layout renderers
├── hooks/                     # Custom hooks
│   ├── useAppState.js         # Tracks screens, active components, and app settings
│   ├── useBuildApk.js         # Serializes layout + blocks and starts APK compiler
│   ├── useKeyboardShortcuts.js# Undo, redo, copy, paste, and save shortcuts
│   └── useProjectActions.js   # New/Open/Save/Import projects logic
├── legacy/                    # Deprecated code wrappers, custom-toolbox handlers
└── utils/                     # Serializers, JSON validators, project structure creators
```

---

## 🚀 Mount the Component

To mount the Creova designer and block code workspace:

```tsx
import AppInventor from './creova';

const MobileAppBuilder = () => {
  return (
    <div className="w-screen h-screen">
      <AppInventor
        onBack={() => console.log('Returned to dashboard')}
        onRedirectToElectra={(data) => console.log('Switch to hardware:', data)}
      />
    </div>
  );
};
```
