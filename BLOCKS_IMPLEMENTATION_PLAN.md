# MIT App Inventor Blocks Implementation Plan

## 🎯 Overview

This document outlines the complete implementation of MIT App Inventor's Blocks Editor, including all block types, component blocks, and code generation functionality.

---

## 📚 MIT App Inventor Blocks Architecture

### Block Categories (From MIT App Inventor)

1. **Built-in Blocks**
   - Control (if/else, loops, etc.)
   - Logic (boolean operations)
   - Math (arithmetic, comparisons)
   - Text (string operations)
   - Lists (array operations)
   - Colors
   - Variables
   - Procedures (functions)

2. **Component Blocks** (Generated per component)
   - Event handlers (when Button1.Click)
   - Method calls (call Button1.SetText)
   - Property getters (Button1.Text)
   - Property setters (set Button1.Text to)

3. **Screen Blocks**
   - Screen initialization
   - Screen events

---

## 🏗️ Implementation Structure

```
src/appinverter/blocks/
├── definitions/           # Block definitions
│   ├── control.js        # Control blocks (if, loops, etc.)
│   ├── logic.js          # Logic blocks (and, or, not, etc.)
│   ├── math.js           # Math blocks (+, -, *, /, etc.)
│   ├── text.js           # Text blocks (join, length, etc.)
│   ├── lists.js          # List blocks (create, add, get, etc.)
│   ├── colors.js         # Color blocks
│   ├── variables.js      # Variable blocks
│   ├── procedures.js     # Procedure/function blocks
│   └── components.js     # Component block generator
│
├── generators/           # Code generators
│   ├── javascript.js     # JavaScript code generation
│   ├── reactnative.js    # React Native code generation
│   └── yail.js          # YAIL generation (optional)
│
├── toolbox/             # Blockly toolbox configuration
│   ├── builtin.js       # Built-in blocks toolbox
│   └── components.js    # Component blocks toolbox
│
└── utils/
    ├── blockColors.js   # Block color scheme
    └── blockHelpers.js  # Helper functions
```

---

## 🎨 Block Color Scheme (MIT App Inventor Style)

```javascript
export const BLOCK_COLORS = {
  // Built-in blocks
  control: '#E8B024',      // Yellow/Gold
  logic: '#4A90E2',        // Blue
  math: '#5B67A5',         // Purple
  text: '#77C043',         // Green
  lists: '#D94848',        // Red
  colors: '#A55B80',       // Pink/Purple
  variables: '#9C27B0',    // Purple
  procedures: '#632D99',   // Dark Purple
  
  // Component blocks
  events: '#FFD700',       // Gold (when blocks)
  methods: '#8B4789',      // Purple (call blocks)
  properties: '#4A90E2',   // Blue (get/set blocks)
  
  // Special
  screen: '#FF6F00',       // Orange
};
```

---

## 📦 Block Definitions

### 1. Control Blocks

```javascript
// if/then/else
Blockly.Blocks['controls_if'] = {
  init: function() {
    this.appendValueInput('IF0')
        .setCheck('Boolean')
        .appendField('if');
    this.appendStatementInput('DO0')
        .appendField('then');
    this.appendStatementInput('ELSE')
        .appendField('else');
    this.setColour(BLOCK_COLORS.control);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
  }
};

// for each loop
Blockly.Blocks['controls_forEach'] = {
  init: function() {
    this.appendValueInput('LIST')
        .setCheck('Array')
        .appendField('for each')
        .appendField(new Blockly.FieldVariable('item'), 'VAR')
        .appendField('in list');
    this.appendStatementInput('DO')
        .appendField('do');
    this.setColour(BLOCK_COLORS.control);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
  }
};

// while loop
Blockly.Blocks['controls_while'] = {
  init: function() {
    this.appendValueInput('BOOL')
        .setCheck('Boolean')
        .appendField('while');
    this.appendStatementInput('DO')
        .appendField('do');
    this.setColour(BLOCK_COLORS.control);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
  }
};
```

### 2. Component Event Blocks

```javascript
// Generate event block for each component
function generateEventBlock(componentType, componentId, eventName) {
  const blockName = `${componentId}_${eventName}`;
  
  Blockly.Blocks[blockName] = {
    init: function() {
      this.appendDummyInput()
          .appendField('when')
          .appendField(componentId)
          .appendField('.')
          .appendField(eventName);
      this.appendStatementInput('DO')
          .appendField('do');
      this.setColour(BLOCK_COLORS.events);
      this.setTooltip(`Triggered when ${componentId} ${eventName} event occurs`);
    }
  };
  
  return blockName;
}

// Example: Button Click event
// when Button1.Click
//   do [statements]
```

### 3. Component Method Blocks

```javascript
// Generate method call block
function generateMethodBlock(componentType, componentId, methodName, params) {
  const blockName = `${componentId}_${methodName}`;
  
  Blockly.Blocks[blockName] = {
    init: function() {
      this.appendDummyInput()
          .appendField('call')
          .appendField(componentId)
          .appendField('.')
          .appendField(methodName);
      
      // Add parameter inputs
      params.forEach((param, index) => {
        this.appendValueInput(`ARG${index}`)
            .setCheck(param.type)
            .appendField(param.name);
      });
      
      this.setColour(BLOCK_COLORS.methods);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
    }
  };
  
  return blockName;
}

// Example: Button.SetText method
// call Button1.SetText
//   text [value]
```

### 4. Component Property Blocks

```javascript
// Generate property getter block
function generatePropertyGetterBlock(componentId, propertyName) {
  const blockName = `${componentId}_get_${propertyName}`;
  
  Blockly.Blocks[blockName] = {
    init: function() {
      this.appendDummyInput()
          .appendField(componentId)
          .appendField('.')
          .appendField(propertyName);
      this.setOutput(true, null);
      this.setColour(BLOCK_COLORS.properties);
    }
  };
  
  return blockName;
}

// Generate property setter block
function generatePropertySetterBlock(componentId, propertyName, propertyType) {
  const blockName = `${componentId}_set_${propertyName}`;
  
  Blockly.Blocks[blockName] = {
    init: function() {
      this.appendValueInput('VALUE')
          .setCheck(propertyType)
          .appendField('set')
          .appendField(componentId)
          .appendField('.')
          .appendField(propertyName)
          .appendField('to');
      this.setColour(BLOCK_COLORS.properties);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
    }
  };
  
  return blockName;
}

// Example: Button.Text property
// Button1.Text (getter)
// set Button1.Text to [value] (setter)
```

---

## 🔧 Component Block Specifications

### Button Component Blocks

```javascript
const BUTTON_BLOCKS = {
  events: [
    {
      name: 'Click',
      description: 'User tapped and released the button'
    },
    {
      name: 'LongClick',
      description: 'User held the button down'
    },
    {
      name: 'TouchDown',
      description: 'User touched the button'
    },
    {
      name: 'TouchUp',
      description: 'User released the button'
    }
  ],
  
  methods: [
    {
      name: 'SetText',
      params: [{ name: 'text', type: 'String' }],
      description: 'Set the button text'
    }
  ],
  
  properties: [
    {
      name: 'Text',
      type: 'String',
      getter: true,
      setter: true
    },
    {
      name: 'BackgroundColor',
      type: 'Color',
      getter: true,
      setter: true
    },
    {
      name: 'Enabled',
      type: 'Boolean',
      getter: true,
      setter: true
    },
    {
      name: 'FontSize',
      type: 'Number',
      getter: true,
      setter: true
    },
    {
      name: 'Visible',
      type: 'Boolean',
      getter: true,
      setter: true
    }
  ]
};
```

### Label Component Blocks

```javascript
const LABEL_BLOCKS = {
  events: [
    {
      name: 'Click',
      description: 'User tapped the label'
    }
  ],
  
  methods: [],
  
  properties: [
    {
      name: 'Text',
      type: 'String',
      getter: true,
      setter: true
    },
    {
      name: 'TextColor',
      type: 'Color',
      getter: true,
      setter: true
    },
    {
      name: 'FontSize',
      type: 'Number',
      getter: true,
      setter: true
    }
  ]
};
```

### TextBox Component Blocks

```javascript
const TEXTBOX_BLOCKS = {
  events: [
    {
      name: 'GotFocus',
      description: 'User tapped on the text box'
    },
    {
      name: 'LostFocus',
      description: 'User tapped outside the text box'
    }
  ],
  
  methods: [
    {
      name: 'RequestFocus',
      params: [],
      description: 'Set focus to this text box'
    }
  ],
  
  properties: [
    {
      name: 'Text',
      type: 'String',
      getter: true,
      setter: true
    },
    {
      name: 'Hint',
      type: 'String',
      getter: true,
      setter: true
    },
    {
      name: 'Enabled',
      type: 'Boolean',
      getter: true,
      setter: true
    }
  ]
};
```

---

## 🎯 Code Generation

### React Native Code Generation

```javascript
// Event handler generation
javascriptGenerator['Button1_Click'] = function(block) {
  const statements = javascriptGenerator.statementToCode(block, 'DO');
  
  return `
// Button1 Click event handler
const handleButton1Click = () => {
  ${statements}
};
`;
};

// Method call generation
javascriptGenerator['Button1_SetText'] = function(block) {
  const text = javascriptGenerator.valueToCode(block, 'ARG0', Order.ATOMIC);
  return `setButton1Text(${text});\n`;
};

// Property getter generation
javascriptGenerator['Button1_get_Text'] = function(block) {
  return ['button1Text', Order.ATOMIC];
};

// Property setter generation
javascriptGenerator['Button1_set_Text'] = function(block) {
  const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.ATOMIC);
  return `setButton1Text(${value});\n`;
};
```

### Complete App Generation

```javascript
function generateReactNativeApp(blocks, components) {
  // 1. Generate imports
  const imports = generateImports(components);
  
  // 2. Generate state variables
  const stateVars = generateStateVariables(components);
  
  // 3. Generate event handlers from blocks
  const eventHandlers = generateEventHandlers(blocks);
  
  // 4. Generate component JSX
  const componentJSX = generateComponentJSX(components, eventHandlers);
  
  // 5. Combine into complete app
  return `
${imports}

export default function App() {
  ${stateVars}
  
  ${eventHandlers}
  
  return (
    <View style={styles.container}>
      ${componentJSX}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
`;
}
```

---

## 📋 Implementation Checklist

### Phase 1: Core Blocks System ✅
- [x] Setup Blockly library
- [ ] Create block color scheme
- [ ] Implement control blocks
- [ ] Implement logic blocks
- [ ] Implement math blocks
- [ ] Implement text blocks
- [ ] Implement list blocks
- [ ] Implement variable blocks
- [ ] Implement procedure blocks

### Phase 2: Component Block Generator
- [ ] Create component block generator
- [ ] Generate event blocks dynamically
- [ ] Generate method blocks dynamically
- [ ] Generate property blocks dynamically
- [ ] Create toolbox configuration

### Phase 3: Code Generation
- [ ] Setup JavaScript generator
- [ ] Implement control block generators
- [ ] Implement logic block generators
- [ ] Implement math block generators
- [ ] Implement text block generators
- [ ] Implement component block generators
- [ ] Create React Native code generator

### Phase 4: Integration
- [ ] Integrate with Designer
- [ ] Sync blocks with components
- [ ] Update blocks when components change
- [ ] Save/load block workspace
- [ ] Export generated code

### Phase 5: Advanced Features
- [ ] Block search
- [ ] Block categories
- [ ] Custom blocks
- [ ] Block validation
- [ ] Error handling
- [ ] Undo/Redo

---

## 🚀 Usage Example

### Creating a Simple App with Blocks

**Designer**: Add Button1 and Label1

**Blocks**:
```
when Button1.Click
  do set Label1.Text to "Hello World!"
```

**Generated Code**:
```javascript
const handleButton1Click = () => {
  setLabel1Text("Hello World!");
};

<TouchableOpacity onPress={handleButton1Click}>
  <Text>Click Me</Text>
</TouchableOpacity>

<Text>{label1Text}</Text>
```

---

## 📚 Resources

- MIT App Inventor Blocks Reference: http://ai2.appinventor.mit.edu/reference/blocks/
- Blockly Documentation: https://developers.google.com/blockly
- MIT App Inventor Source: https://github.com/mit-cml/appinventor-sources

---

**Status**: Ready for Implementation
**Estimated Time**: 3-4 weeks for complete implementation
**Priority**: High - Core functionality for app logic
