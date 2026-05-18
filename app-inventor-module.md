# app-inventor-module

## Goal
Build the MIT App Inventor module with Electron desktop packaging and APK build capability within the existing LeapBlocks React app.

## Tasks
- [ ] Task 1: Create React UI state hooks (`useAppState.js`) and data definitions (`paletteComponents.js`, `defaultProperties.js`). → Verify: Can import without errors.
- [ ] Task 2: Create UI Components (`Palette`, `PhoneCanvas`, `PropertiesPanel`, `TopBar`, `BlocksView`, `BuildModal`) and assemble in `index.jsx`. → Verify: UI renders correctly and drag-and-drop state updates.
- [ ] Task 3: Create APK React Native code generators (`utils/codeGenerators.js`). → Verify: Generators output valid syntax strings for `App.tsx` and `styles.ts`.
- [ ] Task 4: Create Electron main process scripts (`main.js`, `preload.js`, `buildApk.js`). → Verify: IPC commands load and execute correctly.
- [ ] Task 5: Update `package.json` with `electron-builder` configuration and dev dependencies. → Verify: `npm run electron:dev` starts the app.
- [ ] Task 6: Wire up `App.jsx` routing and the home screen card `onClick` to `/app-inventor`. → Verify: Navigation flows correctly from home.
- [ ] Task 7: End-to-End Test. → Verify: Running an APK build streams logs and results in an `.apk` file or clear error message.

## Done When
- [ ] All 6 phases from the user specification are completed.
- [ ] The drag-and-drop designer works with the property editor.
- [ ] The "Build APK" button triggers the electron native Gradle build pipeline.
