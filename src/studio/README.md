# AppInventor Module

This folder contains all the AppInventor (Studio) related files for the LeapLab application.

## Overview

AppInventor is the "Studio" track in LeapLab, focused on **App & Game Development**. It provides a visual interface for building mobile applications using a drag-and-drop component system.

## Folder Structure

```
appinverter/
├── components/          # React components for the UI
│   ├── BlocksView.jsx      # Block-based programming view
│   ├── BuildModal.jsx      # APK build modal dialog
│   ├── Palette.jsx         # Component palette sidebar
│   ├── PhoneCanvas.jsx     # Phone preview canvas
│   └── PropertiesPanel.jsx # Component properties editor
├── data/               # Static data and configurations
│   ├── defaultProperties.js    # Default component properties
│   └── paletteComponents.js    # Available UI components
├── hooks/              # Custom React hooks
│   └── useAppState.js      # App state management hook
├── utils/              # Utility functions
│   └── codeGenerators.js   # Code generation for APK builds
├── index.jsx           # Main entry point
└── README.md           # This file
```

## Key Features

- **Visual Designer**: Drag-and-drop interface for building app layouts
- **Component Palette**: Pre-built UI components (buttons, labels, images, etc.)
- **Properties Panel**: Configure component properties and behaviors
- **Block Programming**: Visual block-based logic programming
- **APK Build**: Generate Android APK files from designs
- **Live Preview**: Real-time phone canvas preview

## Usage

The AppInventor module is loaded when users select the "Studio" card from the landing page. It provides a complete environment for creating mobile applications without writing code.

## Integration

- **Entry Point**: `src/App.tsx` lazy-loads this module
- **Build System**: `electron/buildApk.js` uses the code generators
- **Mode**: Activated via `mode === 'appinventor'` in the app router

## Related Files

- `src/App.tsx` - Main app router and lazy loader
- `electron/buildApk.js` - APK build process handler

## Keywords

appinventor, app inventor, studio, mobile app, app development, game development, visual programming, drag and drop, component builder, apk builder, android app
