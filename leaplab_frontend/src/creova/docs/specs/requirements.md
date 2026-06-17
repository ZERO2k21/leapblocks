# Studio (AppInventor) - APK Builder Requirements

## Introduction

This document outlines the requirements for transforming the LeapLab Studio module into a complete MIT App Inventor-style visual app development environment with APK building capabilities. The goal is to create a desktop application that allows users to design mobile apps visually and compile them into Android APK files.

## Glossary

- **APK**: Android Package Kit - the file format used to distribute and install Android applications
- **MIT App Inventor**: A web-based visual programming platform for creating Android apps using drag-and-drop blocks
- **Component Designer**: The visual interface where users drag and drop UI components
- **Blocks Editor**: The visual programming interface where users define app behavior using blocks
- **Build Server**: The backend service that compiles the visual design into an APK file
- **Kawa**: A Scheme-to-JVM compiler used by MIT App Inventor
- **Gradle**: Android's build automation tool
- **Capacitor**: A cross-platform native runtime for web apps
- **Cordova**: A mobile application development framework
- **React Native**: A framework for building native apps using React
- **WebView**: An Android component that displays web content in an app

## Research Summary: MIT App Inventor Architecture

### How MIT App Inventor Works

Based on research from official MIT App Inventor documentation and community resources:

1. **Two-Window System**:
   - **Component Designer**: Visual drag-and-drop interface for UI layout
   - **Blocks Editor**: Visual programming interface for app behavior

2. **Component System**:
   - Pre-built components organized by categories (User Interface, Layout, Media, Sensors, Storage, Connectivity)
   - Each component has configurable properties (color, size, text, etc.)
   - Components can trigger events and respond to user interactions

3. **Build Process**:
   - User designs app in Component Designer
   - User programs behavior in Blocks Editor
   - App Inventor generates Scheme code from blocks
   - Kawa compiler cross-compiles Scheme to JVM bytecode
   - Android toolchain converts bytecode to DEX format
   - Final APK is packaged with resources and signed

4. **Key Features**:
   - Real-time testing via Companion app
   - Live development and debugging
   - Export to APK for distribution
   - Support for multiple screens
   - Asset management (images, sounds, etc.)
   - Extension system for custom components

## APK Build Options Analysis

### Option 1: Native Android Build (Gradle + Android SDK)

**Description**: Use the official Android build toolchain with Gradle and Android SDK to compile a native Android app.

**How It Works**:
1. Generate Android project structure (Java/Kotlin source files)
2. Convert visual design to Android XML layouts
3. Generate Java/Kotlin code for component logic
4. Use Gradle to compile and package APK
5. Sign APK with keystore

**Pros**:
- ✅ True native Android app with full performance
- ✅ Access to all Android APIs and features
- ✅ Standard Android development workflow
- ✅ Can be uploaded to Google Play Store
- ✅ No runtime overhead or WebView dependencies
- ✅ Best performance for complex apps

**Cons**:
- ❌ Requires Android SDK installation (~1-2 GB)
- ❌ Requires JDK installation
- ❌ Complex build process (5-10 minutes for first build)
- ❌ Platform-specific (Windows/Mac/Linux differences)
- ❌ Requires code generation for each component type
- ❌ Steeper learning curve for maintenance

**Current Status**: Partially implemented in `electron/buildApk.js`

**Estimated Implementation Time**: 3-4 weeks

---

### Option 2: Capacitor (Web-to-Native Bridge)

**Description**: Use Capacitor to wrap the web-based app design in a native Android container with access to native APIs.

**How It Works**:
1. Generate HTML/CSS/JavaScript from visual design
2. Use Capacitor CLI to create Android project
3. Capacitor bridges web code to native Android APIs
4. Build APK using Gradle (managed by Capacitor)
5. Deploy to device or emulator

**Pros**:
- ✅ Modern, actively maintained (by Ionic team)
- ✅ Good documentation and community support
- ✅ Access to native APIs via plugins
- ✅ Easier to maintain than pure native
- ✅ Can target iOS as well (future expansion)
- ✅ Faster development cycle
- ✅ Smaller codebase to maintain

**Cons**:
- ❌ Still requires Android SDK and Gradle
- ❌ Slight performance overhead (WebView)
- ❌ Larger APK size (~5-10 MB base)
- ❌ Not true native UI (uses WebView)
- ❌ Some native features require plugins

**Estimated Implementation Time**: 2-3 weeks

---

### Option 3: React Native (JavaScript-to-Native)

**Description**: Generate React Native code from visual design and compile to native Android app.

**How It Works**:
1. Convert visual design to React Native components
2. Generate JavaScript code for app logic
3. Use React Native CLI to build Android APK
4. Metro bundler packages JavaScript
5. Native modules handle platform-specific code

**Pros**:
- ✅ True native components (not WebView)
- ✅ Excellent performance
- ✅ Large ecosystem of libraries
- ✅ Hot reload for development
- ✅ Can target iOS as well
- ✅ Industry-standard framework

**Cons**:
- ❌ Requires Node.js, React Native CLI, Android SDK
- ❌ Complex setup and configuration
- ❌ Steep learning curve
- ❌ Requires mapping App Inventor components to React Native
- ❌ Longer build times
- ❌ More dependencies to manage

**Estimated Implementation Time**: 4-6 weeks

---

### Option 4: Cordova (Legacy Web-to-Native)

**Description**: Use Apache Cordova to wrap web content in a native Android container.

**How It Works**:
1. Generate HTML/CSS/JavaScript from visual design
2. Use Cordova CLI to create Android project
3. Cordova wraps web content in WebView
4. Plugins provide access to native features
5. Build APK using Gradle

**Pros**:
- ✅ Mature, well-established framework
- ✅ Large plugin ecosystem
- ✅ Simple architecture
- ✅ Good for simple apps
- ✅ Smaller learning curve

**Cons**:
- ❌ Older technology (being replaced by Capacitor)
- ❌ Performance issues with complex apps
- ❌ WebView limitations
- ❌ Less active development
- ❌ Still requires Android SDK
- ❌ Not recommended for new projects

**Estimated Implementation Time**: 2-3 weeks

---

### Option 5: WebView Wrapper (Simplest Approach)

**Description**: Create a minimal Android app that loads the web-based app design in a WebView.

**How It Works**:
1. Generate HTML/CSS/JavaScript from visual design
2. Create Android project with single WebView activity
3. Bundle web assets in APK
4. WebView loads and displays the app
5. JavaScript bridge for limited native features

**Pros**:
- ✅ Simplest implementation
- ✅ Fastest development time
- ✅ Minimal dependencies
- ✅ Easy to maintain
- ✅ Small codebase
- ✅ Works for simple apps

**Cons**:
- ❌ Very limited native functionality
- ❌ Poor performance for complex apps
- ❌ No access to most Android APIs
- ❌ Not suitable for sensor-heavy apps
- ❌ Limited offline capabilities
- ❌ Not professional-grade solution

**Estimated Implementation Time**: 1-2 weeks

---

### Option 6: Cloud Build Service (External API)

**Description**: Use a third-party cloud service to build APKs (similar to MIT App Inventor's approach).

**How It Works**:
1. Package app design as JSON/XML
2. Send to cloud build service API
3. Service compiles APK on remote server
4. Download completed APK

**Pros**:
- ✅ No local SDK installation required
- ✅ Consistent build environment
- ✅ No platform-specific issues
- ✅ Fastest for end users
- ✅ Scalable infrastructure

**Cons**:
- ❌ Requires internet connection
- ❌ Dependency on external service
- ❌ Potential privacy concerns
- ❌ Recurring costs for API usage
- ❌ Limited customization
- ❌ Vendor lock-in

**Examples**: PhoneGap Build (discontinued), Appery.io, BuildFire

**Estimated Implementation Time**: 1-2 weeks (integration only)

---

## Recommended Approach: Hybrid Strategy

**Primary Method**: **Option 1 (Native Android Build)** for full-featured, professional-grade apps

**Fallback Method**: **Option 2 (Capacitor)** for faster development and easier maintenance

**Rationale**:
- Native Android build provides the best performance and full API access
- Capacitor offers a good balance of features and ease of use
- Both can coexist - let users choose based on their needs
- Start with Capacitor for MVP, add native build later

---

## User Stories

### Requirement 1: Component Designer Interface

**User Story**: As a student, I want to drag and drop UI components onto a phone canvas, so that I can visually design my app's interface without writing code.

#### Acceptance Criteria

1. **WHERE** the user is in the Studio Designer view, **THE** system **SHALL** display a component palette with categorized components (User Interface, Layout, Media, Sensors, Storage, Connectivity)

2. **WHERE** the user drags a component from the palette, **THE** system **SHALL** allow dropping it onto the phone canvas at the cursor position

3. **WHERE** a component is dropped on the canvas, **THE** system **SHALL** create a new instance with default properties and add it to the component tree

4. **WHERE** the user clicks on a component in the canvas, **THE** system **SHALL** select it and display its properties in the properties panel

5. **WHERE** the user drags a component within the canvas, **THE** system **SHALL** update its position in real-time with visual feedback

6. **WHERE** the user deletes a component, **THE** system **SHALL** remove it from the canvas and component tree

7. **WHERE** the user has multiple components, **THE** system **SHALL** support z-index ordering (bring to front, send to back)

#### Correctness Properties

- **Property 1.1**: For any component drag operation, the component SHALL appear at the exact drop coordinates
- **Property 1.2**: Component selection SHALL be mutually exclusive (only one component selected at a time)
- **Property 1.3**: Component deletion SHALL not affect other components' positions or properties

---

### Requirement 2: Properties Panel

**User Story**: As a student, I want to configure component properties (text, color, size, etc.), so that I can customize my app's appearance and behavior.

#### Acceptance Criteria

1. **WHERE** a component is selected, **THE** system **SHALL** display all editable properties in the properties panel

2. **WHERE** the user changes a text property, **THE** system **SHALL** update the component immediately on the canvas

3. **WHERE** the user changes a color property, **THE** system **SHALL** provide a color picker and apply the color in real-time

4. **WHERE** the user changes a size property, **THE** system **SHALL** validate the input and resize the component on the canvas

5. **WHERE** the user changes a boolean property (visible, enabled), **THE** system **SHALL** toggle the property with a switch control

6. **WHERE** the user changes an image property, **THE** system **SHALL** allow file upload and display the image in the component

7. **WHERE** no component is selected, **THE** system **SHALL** display screen-level properties (background color, title, orientation)

#### Correctness Properties

- **Property 2.1**: Property changes SHALL be reflected on the canvas within 100ms
- **Property 2.2**: Invalid property values SHALL be rejected with clear error messages
- **Property 2.3**: Property changes SHALL be reversible via undo/redo

---

### Requirement 3: Blocks Editor

**User Story**: As a student, I want to program my app's behavior using visual blocks, so that I can add interactivity without writing code.

#### Acceptance Criteria

1. **WHERE** the user switches to Blocks view, **THE** system **SHALL** display a blocks workspace with a blocks palette

2. **WHERE** the user drags a block from the palette, **THE** system **SHALL** allow snapping it to compatible blocks

3. **WHERE** blocks are connected, **THE** system **SHALL** validate type compatibility and show visual feedback

4. **WHERE** the user creates an event handler block, **THE** system **SHALL** associate it with the corresponding component

5. **WHERE** the user adds logic blocks (if/else, loops, variables), **THE** system **SHALL** enforce correct nesting and syntax

6. **WHERE** the user adds function blocks, **THE** system **SHALL** allow calling component methods and accessing properties

7. **WHERE** the user saves the project, **THE** system **SHALL** serialize both the visual design and blocks code

#### Correctness Properties

- **Property 3.1**: Block connections SHALL only allow type-compatible blocks
- **Property 3.2**: Event handlers SHALL be uniquely associated with components
- **Property 3.3**: Block execution order SHALL follow visual top-to-bottom, left-to-right flow

---

### Requirement 4: Multi-Screen Support

**User Story**: As a student, I want to create multiple screens in my app, so that I can build apps with navigation between different views.

#### Acceptance Criteria

1. **WHERE** the user clicks "Add Screen", **THE** system **SHALL** create a new blank screen with a unique name

2. **WHERE** the user switches between screens, **THE** system **SHALL** save the current screen state and load the selected screen

3. **WHERE** the user renames a screen, **THE** system **SHALL** update all references in blocks code

4. **WHERE** the user deletes a screen, **THE** system **SHALL** warn if blocks reference that screen and prevent deletion if it's the last screen

5. **WHERE** the user adds navigation blocks, **THE** system **SHALL** provide a dropdown of available screens

6. **WHERE** the app runs, **THE** system **SHALL** start with the first screen (Screen1) by default

#### Correctness Properties

- **Property 4.1**: Screen names SHALL be unique within a project
- **Property 4.2**: Screen deletion SHALL cascade to remove associated blocks
- **Property 4.3**: Navigation SHALL preserve app state when switching screens

---

### Requirement 5: APK Build System (Native Android)

**User Story**: As a student, I want to build my app into an APK file, so that I can install it on my Android device and share it with others.

#### Acceptance Criteria

1. **WHERE** the user clicks "Build APK", **THE** system **SHALL** validate the project for completeness (app name, package name, at least one screen)

2. **WHERE** validation passes, **THE** system **SHALL** generate Android project files (Java/Kotlin source, XML layouts, resources)

3. **WHERE** project files are generated, **THE** system **SHALL** invoke Gradle to compile the APK

4. **WHERE** Gradle build succeeds, **THE** system **SHALL** sign the APK with a debug or release keystore

5. **WHERE** the APK is built, **THE** system **SHALL** save it to the output folder and notify the user

6. **WHERE** the build fails, **THE** system **SHALL** display error logs and suggest fixes

7. **WHERE** the user has Android SDK installed, **THE** system **SHALL** detect it automatically or prompt for installation

#### Correctness Properties

- **Property 5.1**: Generated APK SHALL install and run on Android 5.0+ devices
- **Property 5.2**: Build process SHALL be idempotent (same input → same output)
- **Property 5.3**: Build errors SHALL be logged with timestamps and error codes

---

### Requirement 6: APK Build System (Capacitor Alternative)

**User Story**: As a student, I want a faster APK build option, so that I can quickly test my app without waiting for a full native build.

#### Acceptance Criteria

1. **WHERE** the user selects "Quick Build (Capacitor)", **THE** system **SHALL** generate HTML/CSS/JavaScript from the visual design

2. **WHERE** web assets are generated, **THE** system **SHALL** use Capacitor CLI to create an Android project

3. **WHERE** Capacitor project is created, **THE** system **SHALL** copy web assets to the Android project

4. **WHERE** assets are copied, **THE** system **SHALL** invoke Capacitor build to generate APK

5. **WHERE** the APK is built, **THE** system **SHALL** save it to the output folder with a "capacitor" suffix

6. **WHERE** the user needs native features, **THE** system **SHALL** automatically include required Capacitor plugins

#### Correctness Properties

- **Property 6.1**: Capacitor build SHALL complete in under 3 minutes
- **Property 6.2**: Generated APK SHALL be 5-10 MB smaller than native build
- **Property 6.3**: Web-to-native bridge SHALL handle all component interactions correctly

---

### Requirement 7: Asset Management

**User Story**: As a student, I want to upload and manage images, sounds, and other assets, so that I can use them in my app.

#### Acceptance Criteria

1. **WHERE** the user clicks "Upload Asset", **THE** system **SHALL** open a file picker for images, sounds, or videos

2. **WHERE** a file is selected, **THE** system **SHALL** validate the file type and size (max 10 MB per file)

3. **WHERE** validation passes, **THE** system **SHALL** copy the file to the project assets folder

4. **WHERE** an asset is uploaded, **THE** system **SHALL** display it in the assets panel with a thumbnail

5. **WHERE** the user deletes an asset, **THE** system **SHALL** warn if components reference it and remove references if confirmed

6. **WHERE** the user builds the APK, **THE** system **SHALL** bundle all assets in the APK

#### Correctness Properties

- **Property 7.1**: Asset names SHALL be unique within a project
- **Property 7.2**: Asset deletion SHALL update all component references
- **Property 7.3**: Assets SHALL be accessible at runtime via relative paths

---

### Requirement 8: Live Testing (Companion App)

**User Story**: As a student, I want to test my app on my phone in real-time, so that I can see changes immediately without building an APK.

#### Acceptance Criteria

1. **WHERE** the user clicks "Live Test", **THE** system **SHALL** generate a QR code with connection details

2. **WHERE** the user scans the QR code with the Companion app, **THE** system **SHALL** establish a WebSocket connection

3. **WHERE** the connection is established, **THE** system **SHALL** send the current app state to the Companion app

4. **WHERE** the user makes changes in the designer, **THE** system **SHALL** push updates to the Companion app in real-time

5. **WHERE** the user interacts with the app on the phone, **THE** system **SHALL** execute blocks code and update the UI

6. **WHERE** the connection is lost, **THE** system **SHALL** display a reconnection prompt

#### Correctness Properties

- **Property 8.1**: Live updates SHALL be delivered within 500ms of changes
- **Property 8.2**: Companion app SHALL maintain app state during reconnection
- **Property 8.3**: Blocks execution SHALL match APK behavior exactly

---

### Requirement 9: Project Save/Load

**User Story**: As a student, I want to save my project and load it later, so that I can work on my app over multiple sessions.

#### Acceptance Criteria

1. **WHERE** the user clicks "Save Project", **THE** system **SHALL** serialize the entire project (screens, components, blocks, assets) to a JSON file

2. **WHERE** the project is saved, **THE** system **SHALL** display a success message with the file path

3. **WHERE** the user clicks "Load Project", **THE** system **SHALL** open a file picker for .aip files (App Inventor Project)

4. **WHERE** a project file is selected, **THE** system **SHALL** validate the file format and version

5. **WHERE** validation passes, **THE** system **SHALL** load all screens, components, blocks, and assets

6. **WHERE** the user has unsaved changes, **THE** system **SHALL** prompt to save before loading a new project

7. **WHERE** the user closes the app, **THE** system **SHALL** auto-save the project to a temporary location

#### Correctness Properties

- **Property 9.1**: Saved projects SHALL be loadable across different OS versions
- **Property 9.2**: Project files SHALL be backward compatible with older versions
- **Property 9.3**: Auto-save SHALL occur every 2 minutes or after significant changes

---

### Requirement 10: Component Library Parity with MIT App Inventor

**User Story**: As a student familiar with MIT App Inventor, I want access to the same components, so that I can build similar apps in LeapLab Studio.

#### Acceptance Criteria

1. **WHERE** the user opens the component palette, **THE** system **SHALL** provide at least 50 components across 8 categories

2. **WHERE** the user adds a Button component, **THE** system **SHALL** support properties: Text, BackgroundColor, TextColor, FontSize, Width, Height, Visible, Enabled

3. **WHERE** the user adds a Label component, **THE** system **SHALL** support properties: Text, TextColor, FontSize, FontBold, FontItalic, TextAlignment

4. **WHERE** the user adds a TextBox component, **THE** system **SHALL** support properties: Text, Hint, NumbersOnly, MultiLine, PasswordMode

5. **WHERE** the user adds a Canvas component, **THE** system **SHALL** support drawing methods: DrawCircle, DrawLine, DrawPoint, DrawText

6. **WHERE** the user adds a Sensor component, **THE** system **SHALL** support events: AccelerationChanged, LocationChanged, OrientationChanged

7. **WHERE** the user adds a Storage component, **THE** system **SHALL** support methods: StoreValue, GetValue, ClearAll

#### Correctness Properties

- **Property 10.1**: All MIT App Inventor basic components SHALL be available
- **Property 10.2**: Component properties SHALL match MIT App Inventor naming and behavior
- **Property 10.3**: Component events SHALL fire in the same order as MIT App Inventor

---

## Non-Functional Requirements

### Performance

1. **WHERE** the user drags a component, **THE** system **SHALL** update the canvas at 60 FPS
2. **WHERE** the user builds an APK, **THE** system **SHALL** complete in under 5 minutes for projects with <50 components
3. **WHERE** the user loads a project, **THE** system **SHALL** display the designer within 2 seconds

### Usability

1. **WHERE** the user is new to the system, **THE** system **SHALL** provide a tutorial on first launch
2. **WHERE** the user makes an error, **THE** system **SHALL** display helpful error messages with suggested fixes
3. **WHERE** the user needs help, **THE** system **SHALL** provide context-sensitive documentation

### Compatibility

1. **WHERE** the system builds an APK, **THE** APK **SHALL** run on Android 5.0 (API 21) and above
2. **WHERE** the system runs on Windows, **THE** system **SHALL** support Windows 10 and 11
3. **WHERE** the system runs on Mac, **THE** system **SHALL** support macOS 11 (Big Sur) and above

### Security

1. **WHERE** the system builds an APK, **THE** APK **SHALL** be signed with a valid keystore
2. **WHERE** the user uploads assets, **THE** system **SHALL** scan for malware
3. **WHERE** the system stores projects, **THE** system **SHALL** encrypt sensitive data (API keys, passwords)

---

## Technical Constraints

1. The system MUST run as an Electron desktop application
2. The system MUST use React for the UI
3. The system MUST support offline operation (no cloud dependency for basic features)
4. The system MUST integrate with existing LeapLab architecture
5. The system SHOULD reuse existing components (IgniteTopbar, etc.)

---

## Dependencies

1. **Android SDK**: Required for native APK builds (Option 1)
2. **JDK 11+**: Required for Gradle builds
3. **Node.js 16+**: Required for Capacitor builds (Option 2)
4. **Gradle 7+**: Required for Android builds
5. **Blockly**: Required for visual blocks editor
6. **Electron**: Required for desktop app packaging

---

## Success Criteria

The Studio module will be considered successful when:

1. ✅ Users can create a simple "Hello World" app in under 5 minutes
2. ✅ Users can build an APK that installs and runs on Android devices
3. ✅ The system supports at least 50 components from MIT App Inventor
4. ✅ The blocks editor supports all basic programming constructs (variables, loops, conditionals, functions)
5. ✅ The system can load and save projects reliably
6. ✅ The APK build process completes in under 5 minutes
7. ✅ The system provides clear error messages and debugging tools
8. ✅ The system is stable and does not crash during normal use

---

## Out of Scope (Future Enhancements)

1. iOS app building (future release)
2. Cloud storage and collaboration (future release)
3. Custom extension development (future release)
4. Advanced debugging tools (breakpoints, step-through) (future release)
5. App analytics and crash reporting (future release)
6. Google Play Store publishing integration (future release)
7. In-app purchases and monetization (future release)
8. Push notifications (future release)

---

## Appendix: APK Build Options Comparison Matrix

| Feature | Native Android | Capacitor | React Native | Cordova | WebView | Cloud Build |
|---------|---------------|-----------|--------------|---------|---------|-------------|
| **Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Ease of Setup** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Build Speed** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Native API Access** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐⭐⭐ |
| **Maintenance** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **APK Size** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Offline Support** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ |
| **Future-Proof** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Cost** | Free | Free | Free | Free | Free | Paid |
| **Recommended** | ✅ Primary | ✅ Fallback | ⚠️ Advanced | ❌ Legacy | ❌ Too Limited | ⚠️ Dependency |

---

## ✅ DECISION MADE: Best Method for Low-End Computers

### Selected Approach: **Capacitor (Option 2)** with Optimizations

**Rationale for Low-End Computer Support**:

1. **Minimal SDK Requirements**:
   - Capacitor requires smaller Android SDK footprint (~500 MB vs 2 GB for full native)
   - Can use pre-built Capacitor CLI instead of full Android Studio
   - Node.js is lightweight and already required for Electron

2. **Faster Build Times**:
   - Web-to-native conversion is faster than full Gradle compilation
   - First build: ~2-3 minutes (vs 5-10 minutes for native)
   - Incremental builds: ~30 seconds (vs 2-3 minutes for native)

3. **Lower Memory Usage**:
   - Capacitor build process uses ~1 GB RAM (vs 4 GB for Android Studio)
   - Can run on computers with 4 GB RAM minimum
   - No need for Android Emulator (uses real device or lightweight testing)

4. **Simpler Toolchain**:
   - Fewer dependencies to install and manage
   - Less disk space required (~2 GB total vs 5-6 GB for native)
   - Easier troubleshooting for students

5. **Progressive Enhancement Path**:
   - Start with Capacitor for all users
   - Add "Pro Build" (Native Android) option later for advanced users with better hardware
   - Users can choose based on their computer specs

### Implementation Strategy

**Phase 1: Capacitor Build (Weeks 1-3)**
- ✅ Implement HTML/CSS/JavaScript code generation from visual design
- ✅ Integrate Capacitor CLI for APK building
- ✅ Add progress indicators and build logs
- ✅ Optimize for low-end computers (memory management, incremental builds)

**Phase 2: UI Optimization (Week 4)**
- ✅ Add build caching to speed up subsequent builds
- ✅ Implement background build process (non-blocking UI)
- ✅ Add system requirements checker (warn if specs too low)

**Phase 3: Native Build Option (Future)**
- ⏳ Add "Advanced Build" option for users with better hardware
- ⏳ Implement full Gradle-based native compilation
- ⏳ Let users choose build method based on their needs

---

## Copyright and Licensing Analysis

### ✅ Safe to Use - Open Source Components

1. **MIT App Inventor**:
   - **License**: Apache License 2.0 + Creative Commons Attribution ShareAlike 3.0
   - **Status**: ✅ Free and open source
   - **Usage**: We can study the architecture and concepts, but must implement our own code
   - **Attribution**: Must credit MIT App Inventor in documentation
   - **Source**: https://github.com/mit-cml/appinventor-sources

2. **Google Blockly**:
   - **License**: Apache License 2.0
   - **Status**: ✅ Free and open source, no attribution required
   - **Usage**: Can use Blockly library directly in our project
   - **Source**: https://github.com/google/blockly

3. **Capacitor**:
   - **License**: MIT License
   - **Status**: ✅ Free and open source
   - **Usage**: Can use Capacitor as build tool
   - **Source**: https://capacitorjs.com

### ⚠️ Cannot Copy Directly

1. **MIT App Inventor UI Design**:
   - **Status**: ⚠️ Visual design and layout are copyrighted
   - **Solution**: Create similar but distinct UI design
   - **Approach**: Use same concepts (two-panel layout, component palette) but different visual style

2. **MIT App Inventor Component Names**:
   - **Status**: ⚠️ Exact component names may be trademarked
   - **Solution**: Use similar but not identical names, or use generic names
   - **Example**: "TinyDB" → "LocalStorage", "AccelerometerSensor" → "Accelerometer"

3. **MIT App Inventor Branding**:
   - **Status**: ❌ Cannot use "App Inventor" name or MIT branding
   - **Solution**: Use "LeapLab Studio" branding throughout
   - **Approach**: Make it clear this is inspired by, not affiliated with, MIT App Inventor

### ✅ Our Approach - Legal and Ethical

1. **Inspired By, Not Copied From**:
   - Study MIT App Inventor's concepts and workflow
   - Implement our own code from Leap
   - Create our own visual design and branding
   - Use open source libraries (Blockly, Capacitor) legally

2. **Attribution**:
   - Credit MIT App Inventor in documentation: "Inspired by MIT App Inventor"
   - Credit Google Blockly: "Powered by Google Blockly"
   - Include all required license notices in About dialog

3. **Differentiation**:
   - Use LeapLab branding and color scheme
   - Add unique features (integration with other LeapLab modules)
   - Different component organization and naming
   - Enhanced for desktop (not web-based like MIT App Inventor)

---

## Additional Requirements: UI Designer (Like MIT App Inventor)

### Requirement 11: Component Designer Layout (MIT App Inventor Style)

**User Story**: As a student familiar with MIT App Inventor, I want the same two-panel designer layout, so that I can design apps the same way I learned.

#### Acceptance Criteria

1. **WHERE** the user opens Designer view, **THE** system **SHALL** display a three-panel layout: Palette (left), Viewer (center), Components/Properties (right)

2. **WHERE** the Palette panel is displayed, **THE** system **SHALL** organize components into collapsible categories matching MIT App Inventor: User Interface, Layout, Media, Drawing and Animation, Maps, Sensors, Social, Storage, Connectivity

3. **WHERE** the Viewer panel is displayed, **THE** system **SHALL** show a phone mockup with the current screen's components

4. **WHERE** the Components panel is displayed, **THE** system **SHALL** show a tree view of all components on the current screen

5. **WHERE** the Properties panel is displayed, **THE** system **SHALL** show all properties of the selected component with appropriate input controls

6. **WHERE** the user drags a component from Palette to Viewer, **THE** system **SHALL** add it to the Components tree and select it

7. **WHERE** the user clicks a component in the tree, **THE** system **SHALL** highlight it in the Viewer and show its properties

8. **WHERE** the user renames a component, **THE** system **SHALL** update all references in blocks code automatically

#### Correctness Properties

- **Property 11.1**: Component tree SHALL always reflect the exact state of the Viewer
- **Property 11.2**: Property changes SHALL be immediately visible in the Viewer
- **Property 11.3**: Component selection SHALL be synchronized across Viewer, Components tree, and Properties panel

---

### Requirement 12: Blocks Editor (Google Blockly Integration)

**User Story**: As a student, I want to program my app using visual blocks exactly like MIT App Inventor, so that I can code without typing.

#### Acceptance Criteria

1. **WHERE** the user switches to Blocks view, **THE** system **SHALL** display a Blockly workspace with a blocks palette on the left

2. **WHERE** the Blocks palette is displayed, **THE** system **SHALL** organize blocks into categories: Built-in (Control, Logic, Math, Text, Lists, Colors, Variables, Procedures), Component blocks (for each component on screen)

3. **WHERE** the user clicks a component category, **THE** system **SHALL** show all available blocks for that component (events, methods, properties)

4. **WHERE** the user drags an event block, **THE** system **SHALL** create an event handler that executes when that event fires

5. **WHERE** the user drags a method block, **THE** system **SHALL** allow calling that method with appropriate parameters

6. **WHERE** the user drags a property getter/setter block, **THE** system **SHALL** allow reading or writing that property value

7. **WHERE** the user connects blocks, **THE** system **SHALL** validate type compatibility and show error if types don't match

8. **WHERE** the user creates a variable, **THE** system **SHALL** add getter/setter blocks to the Variables category

9. **WHERE** the user creates a procedure, **THE** system **SHALL** add a call block to the Procedures category

10. **WHERE** the user saves the project, **THE** system **SHALL** serialize blocks to XML format (Blockly standard)

#### Correctness Properties

- **Property 12.1**: Block connections SHALL only allow type-compatible blocks (number to number, text to text, etc.)
- **Property 12.2**: Event handlers SHALL execute in the order they are defined
- **Property 12.3**: Variable scope SHALL be enforced (global vs local variables)
- **Property 12.4**: Blocks code SHALL generate valid JavaScript that runs identically in Companion app and built APK

---

### Requirement 13: Component Blocks Auto-Generation

**User Story**: As a student, I want blocks to automatically appear for my components, so that I don't have to manually create them.

#### Acceptance Criteria

1. **WHERE** the user adds a component in Designer, **THE** system **SHALL** automatically generate blocks for that component in the Blocks palette

2. **WHERE** a Button component is added, **THE** system **SHALL** generate blocks: Button.Click event, Button.Text property getter/setter, Button.BackgroundColor property getter/setter, Button.Enabled property getter/setter

3. **WHERE** a Label component is added, **THE** system **SHALL** generate blocks: Label.Text property getter/setter, Label.TextColor property getter/setter, Label.FontSize property getter/setter

4. **WHERE** a TextBox component is added, **THE** system **SHALL** generate blocks: TextBox.Text property getter/setter, TextBox.GotFocus event, TextBox.LostFocus event

5. **WHERE** a Canvas component is added, **THE** system **SHALL** generate blocks: Canvas.Touched event, Canvas.Dragged event, Canvas.DrawCircle method, Canvas.DrawLine method, Canvas.Clear method

6. **WHERE** a Sensor component is added, **THE** system **SHALL** generate blocks: Sensor.Changed event, Sensor.Value property getter

7. **WHERE** the user deletes a component, **THE** system **SHALL** remove its blocks from the palette and warn if blocks are in use

8. **WHERE** the user renames a component, **THE** system **SHALL** update all block labels automatically

#### Correctness Properties

- **Property 13.1**: Block generation SHALL complete within 100ms of component addition
- **Property 13.2**: Block removal SHALL cascade to delete orphaned blocks in workspace
- **Property 13.3**: Component rename SHALL update all existing blocks without breaking connections

---

### Requirement 14: Built-in Blocks (Control Flow, Logic, Math, Text, Lists)

**User Story**: As a student, I want standard programming blocks (if/else, loops, math, text), so that I can write complete programs.

#### Acceptance Criteria

1. **WHERE** the user opens the Control category, **THE** system **SHALL** provide blocks: if/then, if/then/else, for each loop, while loop, for range loop, break, continue

2. **WHERE** the user opens the Logic category, **THE** system **SHALL** provide blocks: equals, not equals, and, or, not, true, false, comparison operators (<, >, <=, >=)

3. **WHERE** the user opens the Math category, **THE** system **SHALL** provide blocks: number, arithmetic operators (+, -, *, /), modulo, power, square root, absolute value, min, max, random integer, random fraction

4. **WHERE** the user opens the Text category, **THE** system **SHALL** provide blocks: text string, join, length, is empty, compare texts, trim, upcase, downcase, substring, replace

5. **WHERE** the user opens the Lists category, **THE** system **SHALL** provide blocks: create empty list, create list with items, add item to list, insert item at index, replace item at index, remove item, get item at index, length of list, is empty, find item, sort list

6. **WHERE** the user opens the Colors category, **THE** system **SHALL** provide blocks: color picker, make color from RGB, split color to RGB

7. **WHERE** the user opens the Variables category, **THE** system **SHALL** allow creating global and local variables with initialize, get, and set blocks

8. **WHERE** the user opens the Procedures category, **THE** system **SHALL** allow creating procedures with parameters and return values

#### Correctness Properties

- **Property 14.1**: Control flow blocks SHALL execute in correct order (sequential, conditional, iterative)
- **Property 14.2**: Math operations SHALL follow standard operator precedence
- **Property 14.3**: List operations SHALL handle empty lists and out-of-bounds indices gracefully
- **Property 14.4**: Variable scope SHALL be enforced (global accessible everywhere, local only in procedure)

---

### Requirement 15: Real-time Block Validation and Error Highlighting

**User Story**: As a student, I want to see errors in my blocks immediately, so that I can fix them before building the app.

#### Acceptance Criteria

1. **WHERE** the user connects incompatible blocks, **THE** system **SHALL** highlight the connection in red and show an error tooltip

2. **WHERE** the user leaves a required input empty, **THE** system **SHALL** highlight the block in yellow and show a warning

3. **WHERE** the user creates a circular reference (variable depends on itself), **THE** system **SHALL** highlight the blocks in red and show an error

4. **WHERE** the user references a deleted component, **THE** system **SHALL** highlight the block in red and show "Component not found" error

5. **WHERE** the user fixes an error, **THE** system **SHALL** remove the error highlighting immediately

6. **WHERE** the user hovers over an error, **THE** system **SHALL** display a tooltip with the error message and suggested fix

7. **WHERE** the user clicks "Check Blocks", **THE** system **SHALL** scan all blocks and display a list of errors and warnings

#### Correctness Properties

- **Property 15.1**: Error detection SHALL complete within 200ms of block change
- **Property 15.2**: Error messages SHALL be clear and actionable
- **Property 15.3**: Error highlighting SHALL not interfere with block dragging or editing

---

## Updated Success Criteria

The Studio module will be considered successful when:

1. ✅ Users can create a simple "Hello World" app in under 5 minutes
2. ✅ Users can build an APK using Capacitor in under 3 minutes on a 4 GB RAM computer
3. ✅ The system supports at least 50 components matching MIT App Inventor
4. ✅ The blocks editor uses Google Blockly and supports all basic programming constructs
5. ✅ The UI layout matches MIT App Inventor's three-panel designer and blocks editor
6. ✅ Component blocks are auto-generated when components are added in Designer
7. ✅ The system provides real-time error validation in blocks editor
8. ✅ The system can load and save projects reliably
9. ✅ The APK build process works on low-end computers (4 GB RAM, 2 GB free disk space)
10. ✅ The system provides clear error messages and debugging tools
11. ✅ All open source licenses are properly attributed
12. ✅ The system is stable and does not crash during normal use

---

**Next Steps**: Proceed to create the technical design document with:
- Detailed architecture for Capacitor build pipeline
- Blockly integration specifications
- Component-to-blocks mapping system
- Code generation strategy (visual design → HTML/CSS/JS)
- Low-end computer optimization techniques
