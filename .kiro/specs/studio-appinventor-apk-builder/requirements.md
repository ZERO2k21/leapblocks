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

## Decision Required

**You need to choose the APK build approach:**

1. **Start with Native Android (Option 1)** - Best quality, longer development time
2. **Start with Capacitor (Option 2)** - Good balance, faster development
3. **Hybrid Approach** - Implement both, let users choose

**Recommendation**: Start with **Capacitor (Option 2)** for MVP, then add **Native Android (Option 1)** as "Advanced Build" option later.

This provides:
- ✅ Faster time to market
- ✅ Easier maintenance
- ✅ Good enough performance for most apps
- ✅ Path to upgrade to native later
- ✅ Lower barrier to entry (smaller SDK requirements)

---

**Next Steps**: Once you approve this requirements document, I will create the technical design document with architecture diagrams, component specifications, and implementation details.
