# Studio (App Inventor) Completion Roadmap

## 📊 Current Status Analysis

Based on the MIT App Inventor documentation and your current implementation:

### ✅ **COMPLETED: 70%**

Your Studio module has these components fully implemented:

1. **Visual Designer System** ✅
   - `src/appinverter/index.jsx` - Main app container
   - `src/appinverter/components/Palette.jsx` - Component palette (30+ components)
   - `src/appinverter/components/PhoneCanvas.jsx` - Phone preview canvas
   - `src/appinverter/components/PropertiesPanel.jsx` - Property editor
   - `src/appinverter/components/BuildModal.jsx` - Build UI

2. **State Management** ✅
   - `src/appinverter/hooks/useAppState.js` - Complete state management
   - Multi-screen support
   - Component serialization
   - Property management

3. **Data Definitions** ✅
   - `src/appinverter/data/paletteComponents.js` - 30+ components defined
   - `src/appinverter/data/defaultProperties.js` - Default properties

4. **Code Generation Foundation** ✅
   - `src/appinverter/utils/codeGenerators.js` - Code generators exist
   - `generateAppTsx()` - React Native app generation
   - `generateStyles()` - Styles generation
   - `generateHandlers()` - Event handlers generation
   - `generateAndInjectZip()` - Build injection

5. **Build System Foundation** ✅
   - `electron/buildApk.js` - Build script exists
   - `electron/main.js` - IPC handlers configured
   - `electron/preload.js` - IPC bridge configured

6. **Integration** ✅
   - `src/App.tsx` - Routing configured
   - `src/LandingPage.tsx` - Studio card exists
   - Mode switching works

---

### ❌ **INCOMPLETE: 30%**

According to the documentation, you need to complete:

## 🎯 Phase 1: Blockly Integration (CRITICAL - 2 weeks)

### Current Status
- `BlocksView.jsx` is just a placeholder
- No Blockly workspace
- No block definitions
- No code generators

### What's Needed

#### 1.1 Install Dependencies
```bash
npm install blockly @blockly/field-angle @blockly/field-colour
```

#### 1.2 Create Block Definitions
Create `src/appinverter/blocks/definitions/` folder with:

**control.js** - Control flow blocks
```javascript
import Blockly from 'blockly';

// When component event
Blockly.Blocks['component_event'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("when")
        .appendField(new Blockly.FieldDropdown([
          ["Button1", "Button1"],
          ["Button2", "Button2"]
        ]), "COMPONENT")
        .appendField(new Blockly.FieldDropdown([
          ["Click", "Click"],
          ["LongClick", "LongClick"]
        ]), "EVENT");
    this.appendStatementInput("DO")
        .setCheck(null)
        .appendField("do");
    this.setColour(230);
    this.setTooltip("Execute code when component event occurs");
  }
};

// If/else block
Blockly.Blocks['controls_if'] = {
  // Use Blockly's built-in if/else
};

// For loop
Blockly.Blocks['controls_for'] = {
  // Use Blockly's built-in for loop
};
```

**logic.js** - Logic blocks
```javascript
// Comparison blocks
Blockly.Blocks['logic_compare'] = {
  // Use Blockly's built-in comparison
};

// Boolean operations
Blockly.Blocks['logic_operation'] = {
  // Use Blockly's built-in and/or/not
};
```

**components.js** - Component-specific blocks
```javascript
// Set component property
Blockly.Blocks['component_set_property'] = {
  init: function() {
    this.appendValueInput("VALUE")
        .setCheck(null)
        .appendField("set")
        .appendField(new Blockly.FieldDropdown([
          ["Label1", "Label1"],
          ["Button1", "Button1"]
        ]), "COMPONENT")
        .appendField(".")
        .appendField(new Blockly.FieldDropdown([
          ["Text", "Text"],
          ["BackgroundColor", "BackgroundColor"]
        ]), "PROPERTY")
        .appendField("to");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
  }
};

// Get component property
Blockly.Blocks['component_get_property'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["Label1", "Label1"],
          ["Button1", "Button1"]
        ]), "COMPONENT")
        .appendField(".")
        .appendField(new Blockly.FieldDropdown([
          ["Text", "Text"],
          ["Width", "Width"]
        ]), "PROPERTY");
    this.setOutput(true, null);
    this.setColour(160);
  }
};
```

#### 1.3 Create Code Generators
Create `src/appinverter/blocks/generators/reactnative.js`:

```javascript
import { javascriptGenerator } from 'blockly/javascript';

// Component event handler
javascriptGenerator['component_event'] = function(block) {
  const component = block.getFieldValue('COMPONENT');
  const event = block.getFieldValue('EVENT');
  const statements = javascriptGenerator.statementToCode(block, 'DO');
  
  return `handlers.${component}_${event} = () => {\n${statements}};\n`;
};

// Set component property
javascriptGenerator['component_set_property'] = function(block) {
  const component = block.getFieldValue('COMPONENT');
  const property = block.getFieldValue('PROPERTY');
  const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ASSIGNMENT) || '""';
  
  return `set${component}${property}(${value});\n`;
};

// Get component property
javascriptGenerator['component_get_property'] = function(block) {
  const component = block.getFieldValue('COMPONENT');
  const property = block.getFieldValue('PROPERTY');
  
  return [`${component.toLowerCase()}${property}`, javascriptGenerator.ORDER_ATOMIC];
};
```

#### 1.4 Enhance BlocksView.jsx
Replace the placeholder with actual Blockly workspace:

```javascript
import React, { useEffect, useRef, useState } from 'react';
import Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';

// Import block definitions
import '../blocks/definitions/control';
import '../blocks/definitions/logic';
import '../blocks/definitions/components';

// Import code generators
import '../blocks/generators/reactnative';

export default function BlocksView({ appState }) {
  const blocklyDiv = useRef(null);
  const workspaceRef = useRef(null);
  const [generatedCode, setGeneratedCode] = useState('');

  useEffect(() => {
    if (!blocklyDiv.current) return;

    // Create toolbox from app components
    const toolbox = createToolbox(appState);

    // Initialize Blockly workspace
    workspaceRef.current = Blockly.inject(blocklyDiv.current, {
      toolbox: toolbox,
      grid: {
        spacing: 20,
        length: 3,
        colour: '#ccc',
        snap: true
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 1.0,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2
      },
      trashcan: true
    });

    // Listen for changes
    workspaceRef.current.addChangeListener(() => {
      const code = javascriptGenerator.workspaceToCode(workspaceRef.current);
      setGeneratedCode(code);
      
      // Update app state with block logic
      appState.setBlockLogic(code);
    });

    return () => {
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
      }
    };
  }, [appState]);

  const createToolbox = (appState) => {
    const components = appState.screens.flatMap(s => s.components);
    
    return {
      kind: 'categoryToolbox',
      contents: [
        {
          kind: 'category',
          name: 'Control',
          colour: '230',
          contents: [
            { kind: 'block', type: 'controls_if' },
            { kind: 'block', type: 'controls_for' },
            { kind: 'block', type: 'controls_whileUntil' }
          ]
        },
        {
          kind: 'category',
          name: 'Logic',
          colour: '210',
          contents: [
            { kind: 'block', type: 'logic_compare' },
            { kind: 'block', type: 'logic_operation' },
            { kind: 'block', type: 'logic_negate' },
            { kind: 'block', type: 'logic_boolean' }
          ]
        },
        {
          kind: 'category',
          name: 'Math',
          colour: '230',
          contents: [
            { kind: 'block', type: 'math_number' },
            { kind: 'block', type: 'math_arithmetic' },
            { kind: 'block', type: 'math_single' }
          ]
        },
        {
          kind: 'category',
          name: 'Text',
          colour: '160',
          contents: [
            { kind: 'block', type: 'text' },
            { kind: 'block', type: 'text_join' },
            { kind: 'block', type: 'text_length' }
          ]
        },
        {
          kind: 'category',
          name: 'Components',
          colour: '160',
          contents: components.map(comp => ({
            kind: 'block',
            type: 'component_event',
            fields: {
              COMPONENT: comp.id
            }
          }))
        }
      ]
    };
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1" ref={blocklyDiv} />
      
      {/* Code preview panel */}
      <div className="h-48 bg-gray-900 text-green-400 font-mono text-xs p-4 overflow-auto">
        <div className="text-gray-500 mb-2">Generated Code:</div>
        <pre>{generatedCode || '// Drag blocks to generate code'}</pre>
      </div>
    </div>
  );
}
```

### Acceptance Criteria
- [ ] Can drag blocks from toolbox
- [ ] Can connect blocks together
- [ ] Blocks generate React Native code
- [ ] Code updates in real-time
- [ ] Component-specific blocks appear based on designer

---

## 🎯 Phase 2: Build System Setup (CRITICAL - 1 week)

### Current Status
- Build script exists but will fail
- No Android SDK
- No JDK
- No React Native template

### What's Needed

#### 2.1 Download Android SDK (2GB)
```bash
# Download Android Command Line Tools
# https://developer.android.com/studio#command-tools

# Extract to: d:\leapblocks\android-sdk\

# Install required components:
cd android-sdk/cmdline-tools/bin
sdkmanager "platform-tools" "platforms;android-30" "build-tools;30.0.3"
```

#### 2.2 Download JDK (150MB)
```bash
# Download OpenJDK 11 from https://adoptium.net/
# Extract to: d:\leapblocks\jdk\
```

#### 2.3 Create React Native Template
```bash
# Create template project
npx react-native init LeapBlocksTemplate --version 0.71.0

# Move to template folder
mv LeapBlocksTemplate d:\leapblocks\android-template\

# Configure for offline builds
cd android-template/android
# Edit gradle.properties:
org.gradle.caching=true
org.gradle.parallel=true
org.gradle.daemon=true
org.gradle.jvmargs=-Xmx1024m
```

#### 2.4 Fix buildApk.js
The current `electron/buildApk.js` has an issue with ES modules. Fix it:

```javascript
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

async function buildApk(appState, appRoot, onLog) {
  const templateDir = path.join(appRoot, 'android-template');
  const sdkDir = path.join(appRoot, 'android-sdk');
  const jdkDir = path.join(appRoot, 'jdk');

  const timestamp = Date.now();
  const tmpDir = path.join(os.tmpdir(), 'leapblocks', `build_${timestamp}`);
  const outputDir = path.join(appRoot, 'output');

  try {
    onLog("📦 Preparing build environment...");
    await fs.ensureDir(tmpDir);
    await fs.ensureDir(outputDir);

    onLog("📋 Copying React Native template...");
    await fs.copy(templateDir, tmpDir);

    onLog("🎨 Generating app code...");
    // Import code generators (CommonJS compatible)
    const { generateAppTsx, generateStyles, generateHandlers, generateAndInjectZip } = 
      require('../src/appinverter/utils/codeGenerators.js');
    
    await generateAndInjectZip(appState, templateDir, tmpDir);

    onLog("📥 Installing dependencies...");
    await runCommand('npm', ['ci'], tmpDir, onLog);

    onLog("🔨 Building APK with Gradle...");
    const buildEnv = {
      ...process.env,
      ANDROID_HOME: sdkDir,
      ANDROID_SDK_ROOT: sdkDir,
      JAVA_HOME: jdkDir,
      PATH: `${path.join(jdkDir, 'bin')};${process.env.PATH}`,
      GRADLE_OPTS: '-Xmx1024m -XX:MaxPermSize=512m'
    };

    const gradleScript = path.join(tmpDir, 'android', 'gradlew.bat');
    await runCommand(gradleScript, ['assembleRelease'], 
      path.join(tmpDir, 'android'), onLog, buildEnv);

    onLog("📦 Copying APK to output folder...");
    const appNameClean = (appState.appName || 'App').replace(/[^a-zA-Z0-9]/g, '');
    const apkSourcePath = path.join(tmpDir, 'android', 'app', 'build', 
      'outputs', 'apk', 'release', 'app-release.apk');
    const destApkPath = path.join(outputDir, `${appNameClean}.apk`);

    if (await fs.pathExists(apkSourcePath)) {
      await fs.copy(apkSourcePath, destApkPath);
    } else {
      throw new Error("APK not found at: " + apkSourcePath);
    }

    onLog("🧹 Cleaning up...");
    await fs.remove(tmpDir);

    onLog("✅ Build complete!");
    return destApkPath;

  } catch (error) {
    onLog("❌ Build failed: " + error.message);
    throw error;
  }
}

function runCommand(command, args, cwd, onLog, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: env || process.env,
      shell: true
    });

    child.stdout.on('data', (data) => {
      onLog(data.toString().trim());
    });

    child.stderr.on('data', (data) => {
      onLog(data.toString().trim());
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

module.exports = buildApk;
```

#### 2.5 Fix codeGenerators.js
Make it CommonJS compatible:

```javascript
// Change from:
export function generateAppTsx(appState) { ... }

// To:
function generateAppTsx(appState) { ... }

// At the end, add:
module.exports = {
  generateAppTsx,
  generateStyles,
  generateHandlers,
  generateAndInjectZip
};
```

### Acceptance Criteria
- [ ] Android SDK installed and configured
- [ ] JDK installed and configured
- [ ] React Native template created
- [ ] Build script runs without errors
- [ ] Can generate APK file
- [ ] APK installs on Android device

---

## 🎯 Phase 3: Enhanced Code Generation (HIGH - 2 weeks)

### Current Status
- Basic code generation exists
- Missing Blockly integration
- Missing state management
- Missing navigation

### What's Needed

#### 3.1 Integrate Blockly Code
Update `generateHandlers()` to use Blockly-generated code:

```javascript
function generateHandlers(appState) {
  const { screens, blockLogic } = appState;
  
  let handlersStr = `import { useState } from 'react';\n\n`;
  handlersStr += `// State variables\n`;
  
  // Add state for each component
  screens.forEach(screen => {
    screen.components.forEach(comp => {
      if (comp.type === 'Label' || comp.type === 'TextBox') {
        handlersStr += `const [${comp.id.toLowerCase()}Text, set${comp.id}Text] = useState('${comp.props.text || ''}');\n`;
      }
    });
  });
  
  handlersStr += `\n// Event Handlers\n`;
  handlersStr += `export const handlers = {\n`;
  
  // Add handlers from Blockly
  if (blockLogic) {
    handlersStr += blockLogic;
  }
  
  handlersStr += `};\n`;
  return handlersStr;
}
```

#### 3.2 Add Navigation
Update `generateAppTsx()` to include navigation:

```javascript
function generateAppTsx(appState) {
  const { screens, appName } = appState;
  
  let imports = `import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Image, Switch } from 'react-native';
import Slider from '@react-native-community/slider';
import { styles } from './src/styles';
import { handlers } from './src/handlers';\n\n`;

  imports += `const Stack = createStackNavigator();\n\n`;

  // Generate screen components
  let screenComponents = screens.map(screen => {
    const components = screen.components.map(comp => generateComponent(comp)).join('\n');
    
    return `function ${screen.id}({ navigation }) {
  return (
    <ScrollView style={styles.screen}>
      ${components}
    </ScrollView>
  );
}\n`;
  }).join('\n');

  // Generate navigation
  let navigation = `export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="${screens[0].id}">
        ${screens.map(s => `<Stack.Screen name="${s.id}" component={${s.id}} />`).join('\n        ')}
      </Stack.Navigator>
    </NavigationContainer>
  );
}\n`;

  return imports + screenComponents + navigation;
}
```

### Acceptance Criteria
- [ ] Blockly code integrates with generated app
- [ ] State management works correctly
- [ ] Multi-screen navigation works
- [ ] Event handlers execute properly
- [ ] Generated app compiles without errors

---

## 🎯 Phase 4: Component Library Expansion (MEDIUM - 2 weeks)

### Current Status
- 30 components implemented
- Need 50+ for MIT App Inventor parity

### What's Needed

Add these missing components to `paletteComponents.js`:

```javascript
// User Interface (add 6 more)
{ type: 'Notifier', label: 'Notifier', icon: '🔔', category: 'User Interface' },
{ type: 'PasswordTextBox', label: 'Password', icon: '🔒', category: 'User Interface' },
{ type: 'WebViewer', label: 'WebViewer', icon: '🌐', category: 'User Interface' },
{ type: 'ProgressBar', label: 'ProgressBar', icon: '📊', category: 'User Interface' },
{ type: 'RadioButton', label: 'RadioButton', icon: '⭕', category: 'User Interface' },
{ type: 'ToggleButton', label: 'ToggleButton', icon: '🔘', category: 'User Interface' },

// Media (add 4 more)
{ type: 'Player', label: 'Player', icon: '▶️', category: 'Media' },
{ type: 'SoundRecorder', label: 'Sound Recorder', icon: '🎙️', category: 'Media' },
{ type: 'SpeechRecognizer', label: 'Speech Recognizer', icon: '🎤', category: 'Media' },
{ type: 'TextToSpeech', label: 'Text to Speech', icon: '🗣️', category: 'Media' },

// Sensors (add 5 more)
{ type: 'Clock', label: 'Clock', icon: '⏰', category: 'Sensors' },
{ type: 'Pedometer', label: 'Pedometer', icon: '👟', category: 'Sensors' },
{ type: 'ProximitySensor', label: 'Proximity', icon: '📡', category: 'Sensors' },
{ type: 'OrientationSensor', label: 'Orientation', icon: '🧭', category: 'Sensors' },
{ type: 'BarcodeScanner', label: 'Barcode Scanner', icon: '📷', category: 'Sensors' },

// Storage (add 2 more)
{ type: 'CloudDB', label: 'CloudDB', icon: '☁️', category: 'Storage' },
{ type: 'FirebaseDB', label: 'Firebase DB', icon: '🔥', category: 'Storage' },

// Social (add 3 more)
{ type: 'Sharing', label: 'Sharing', icon: '📤', category: 'Social' },
{ type: 'ContactPicker', label: 'Contact Picker', icon: '📇', category: 'Social' },
{ type: 'PhoneCall', label: 'Phone Call', icon: '📞', category: 'Social' },
```

Then add code generation for each in `codeGenerators.js`.

### Acceptance Criteria
- [ ] 50+ components available
- [ ] All components have proper icons
- [ ] All components generate valid code
- [ ] All components have default properties

---

## 🎯 Phase 5: Testing & Polish (MEDIUM - 2 weeks)

### What's Needed

#### 5.1 Create Test App
Build a simple test app to verify everything works:

1. Create app with Button and Label
2. Add Blockly logic: when Button clicked, change Label text
3. Build APK
4. Install on device
5. Test functionality

#### 5.2 Performance Optimization
- Add lazy loading for BlocksView
- Optimize Blockly rendering
- Cache build dependencies
- Reduce memory usage

#### 5.3 Error Handling
- Better error messages
- Build error diagnostics
- Component validation
- Property validation

#### 5.4 Documentation
- User guide for students
- Component reference
- Tutorial videos
- Example projects

### Acceptance Criteria
- [ ] Test app builds successfully
- [ ] APK runs on Android device
- [ ] Performance is acceptable on low-spec systems
- [ ] Error messages are clear
- [ ] Documentation is complete

---

## 📋 Complete Task Checklist

### Phase 1: Blockly Integration (2 weeks)
- [ ] Install Blockly dependencies
- [ ] Create `blocks/definitions/control.js`
- [ ] Create `blocks/definitions/logic.js`
- [ ] Create `blocks/definitions/components.js`
- [ ] Create `blocks/generators/reactnative.js`
- [ ] Enhance `BlocksView.jsx` with Blockly workspace
- [ ] Test block rendering
- [ ] Test code generation
- [ ] Verify blocks connect properly

### Phase 2: Build System Setup (1 week)
- [ ] Download Android SDK (2GB)
- [ ] Download JDK (150MB)
- [ ] Create React Native template
- [ ] Fix `buildApk.js` ES module issue
- [ ] Fix `codeGenerators.js` CommonJS compatibility
- [ ] Configure Gradle for low-spec systems
- [ ] Test build pipeline
- [ ] Build first APK
- [ ] Install APK on device

### Phase 3: Enhanced Code Generation (2 weeks)
- [ ] Integrate Blockly code with handlers
- [ ] Add state management to generated code
- [ ] Add navigation to generated code
- [ ] Test multi-screen apps
- [ ] Test event handlers
- [ ] Verify generated code compiles
- [ ] Test on Android device

### Phase 4: Component Library Expansion (2 weeks)
- [ ] Add 6 UI components
- [ ] Add 4 Media components
- [ ] Add 5 Sensor components
- [ ] Add 2 Storage components
- [ ] Add 3 Social components
- [ ] Update code generators for new components
- [ ] Test all new components

### Phase 5: Testing & Polish (2 weeks)
- [ ] Create test app
- [ ] Build and test APK
- [ ] Optimize performance
- [ ] Improve error handling
- [ ] Write user documentation
- [ ] Create tutorial videos
- [ ] Create example projects

---

## 🎯 Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **Visual Designer** | Working | ✅ Working | ✅ |
| **Component Palette** | 50+ | 30 | 🟡 60% |
| **Blockly Editor** | Working | ❌ Placeholder | ❌ 0% |
| **Code Generation** | Complete | 🟡 Partial | 🟡 50% |
| **Build System** | Working | ❌ Not configured | ❌ 0% |
| **APK Generation** | < 3 min | ❌ Not tested | ❌ 0% |
| **Installation Size** | < 3GB | 2.5GB | ✅ |
| **Documentation** | Complete | ✅ Complete | ✅ |

---

## ⏱️ Timeline

```
Week 1-2:  Blockly Integration          [████████░░] 80% effort
Week 3:    Build System Setup           [████░░░░░░] 40% effort
Week 4-5:  Enhanced Code Generation     [██████░░░░] 60% effort
Week 6-7:  Component Library Expansion  [██████░░░░] 60% effort
Week 8-9:  Testing & Polish             [████░░░░░░] 40% effort

Total: 9 weeks to complete Studio module
```

---

## 🚀 Quick Start (This Week)

### Day 1: Install Blockly
```bash
cd d:\leapblocks
npm install blockly @blockly/field-angle @blockly/field-colour
```

### Day 2-3: Create Block Definitions
```bash
mkdir -p src/appinverter/blocks/definitions
mkdir -p src/appinverter/blocks/generators

# Create control.js, logic.js, components.js
# Create reactnative.js generator
```

### Day 4-5: Enhance BlocksView
- Replace placeholder with Blockly workspace
- Test block rendering
- Verify code generation

---

## 📊 Final Status

**Studio Module Completion: 70% → 100%**

To complete the Studio module according to the MIT App Inventor documentation:

1. **Phase 1 (CRITICAL):** Blockly Integration - 2 weeks
2. **Phase 2 (CRITICAL):** Build System Setup - 1 week
3. **Phase 3 (HIGH):** Enhanced Code Generation - 2 weeks
4. **Phase 4 (MEDIUM):** Component Library Expansion - 2 weeks
5. **Phase 5 (MEDIUM):** Testing & Polish - 2 weeks

**Total Time: 9 weeks**

**Critical Path: Phases 1-2 (3 weeks)** - These must be done first to have a working MVP.

---

## 🎯 Next Action

**Start with Phase 1: Blockly Integration**

1. Install Blockly: `npm install blockly`
2. Create block definitions folder
3. Implement basic blocks
4. Test in BlocksView

Would you like me to help you implement Phase 1 now?
