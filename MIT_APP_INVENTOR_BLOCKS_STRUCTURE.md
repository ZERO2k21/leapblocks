# MIT App Inventor Blocks Structure - Complete Implementation Guide

## Overview
This document describes the exact block structure used in MIT App Inventor and how to implement it in LeapBlocks.

## Block Categories

### 1. Built-in Blocks (Always Available)

#### Control Blocks
- **if/then** - Conditional execution
- **if/then/else** - Conditional with alternative
- **for each number from/to/by** - Numeric loop
- **for each item in list** - List iteration
- **while** - Conditional loop
- **if/then/else if** - Multiple conditions
- **choose** - Ternary operator (test ? then : else)
- **do/result** - Execute and return value
- **evaluate but ignore** - Execute without using result
- **open another screen** - Navigate to screen
- **open another screen with start value** - Navigate with data
- **get start value** - Get passed data
- **close screen** - Close current screen
- **close screen with value** - Close and return data
- **close application** - Exit app
- **get plain start text** - Get plain text start value
- **close screen with plain text** - Close with plain text

#### Logic Blocks
- **true** - Boolean true
- **false** - Boolean false
- **not** - Logical NOT
- **=** - Equality comparison
- **≠** - Inequality comparison
- **and** - Logical AND
- **or** - Logical OR

#### Math Blocks
- **0** - Number literal
- **=** - Equal to
- **≠** - Not equal to
- **>** - Greater than
- **≥** - Greater than or equal
- **<** - Less than
- **≤** - Less than or equal
- **+** - Addition
- **-** - Subtraction
- **×** - Multiplication
- **/** - Division
- **^** - Exponentiation
- **random integer from/to** - Random number
- **random fraction** - Random 0-1
- **random set seed** - Set random seed
- **min** - Minimum value
- **max** - Maximum value
- **square root** - √x
- **abs** - Absolute value
- **neg** - Negative
- **log** - Logarithm
- **e^** - Exponential
- **round** - Round number
- **ceiling** - Round up
- **floor** - Round down
- **modulo** - Remainder
- **remainder** - Remainder
- **quotient** - Integer division
- **sin** - Sine
- **cos** - Cosine
- **tan** - Tangent
- **asin** - Arcsine
- **acos** - Arccosine
- **atan** - Arctangent
- **atan2** - Two-argument arctangent
- **convert radians to degrees** - Angle conversion
- **convert degrees to radians** - Angle conversion
- **format as decimal** - Number formatting
- **is a number?** - Type check
- **convert number** - Base conversion
- **bitwise and** - Bitwise AND
- **bitwise ior** - Bitwise OR
- **bitwise xor** - Bitwise XOR

#### Text Blocks
- **""** - Text literal
- **join** - Concatenate strings
- **length** - String length
- **is empty** - Check if empty
- **compare texts** - String comparison
- **trim** - Remove whitespace
- **upcase** - Convert to uppercase
- **downcase** - Convert to lowercase
- **starts at** - Find substring position
- **contains** - Check if contains substring
- **split at first** - Split string once
- **split at first of any** - Split at any delimiter
- **split** - Split into list
- **split at any** - Split at any delimiter
- **split at spaces** - Split by spaces
- **segment** - Extract substring
- **replace all** - Replace all occurrences
- **obfuscated text** - Encode text
- **is string?** - Type check
- **reverse** - Reverse string
- **replace all mappings** - Dictionary replacement

#### List Blocks
- **create empty list** - New empty list
- **make a list** - Create list with items
- **add items to list** - Append items
- **is in list?** - Check membership
- **length of list** - List size
- **is list empty?** - Check if empty
- **pick a random item** - Random selection
- **index in list** - Find item position
- **select list item** - Get item by index
- **replace list item** - Set item by index
- **remove list item** - Delete item
- **append to list** - Add to end
- **copy list** - Duplicate list
- **is a list?** - Type check
- **reverse list** - Reverse order
- **list to csv row** - Convert to CSV
- **list to csv table** - Convert to CSV table
- **list from csv row** - Parse CSV
- **list from csv table** - Parse CSV table
- **lookup in pairs** - Dictionary lookup
- **join items using separator** - Join with delimiter
- **sort list** - Sort ascending/descending

#### Color Blocks
- **basic color** - Color picker (20 colors)
- **make color** - RGB color
- **split color** - Get RGB components
- **make color from number** - Convert number to color

#### Variable Blocks
- **initialize global name to** - Create global variable
- **get** - Get variable value
- **set to** - Set variable value

#### Procedure Blocks
- **procedure do** - Define procedure
- **procedure result** - Define function
- **call** - Call procedure/function

### 2. Component Blocks (Dynamic)

For each component added to the screen, MIT App Inventor generates:

#### Event Blocks
Format: `when [ComponentName].[EventName]`

Example for Button1:
- `when Button1.Click do`
- `when Button1.LongClick do`
- `when Button1.TouchDown do`
- `when Button1.TouchUp do`
- `when Button1.GotFocus do`
- `when Button1.LostFocus do`

#### Method Blocks
Format: `call [ComponentName].[MethodName]`

Example for Canvas1:
- `call Canvas1.Clear`
- `call Canvas1.DrawCircle centerX centerY radius fill`
- `call Canvas1.DrawLine x1 y1 x2 y2`

#### Property Getter Blocks
Format: `[ComponentName].[PropertyName]`

Example for Button1:
- `Button1.Text`
- `Button1.BackgroundColor`
- `Button1.Enabled`
- `Button1.FontSize`
- `Button1.Width`
- `Button1.Height`
- `Button1.Visible`

#### Property Setter Blocks
Format: `set [ComponentName].[PropertyName] to`

Example for Button1:
- `set Button1.Text to`
- `set Button1.BackgroundColor to`
- `set Button1.Enabled to`
- `set Button1.FontSize to`

## Block Colors (MIT App Inventor Standard)

```javascript
const MIT_BLOCK_COLORS = {
  // Built-in blocks
  control: '#F59E0B',      // Orange (Control flow)
  logic: '#4A90E2',        // Blue (Boolean logic)
  math: '#5B67A5',         // Purple-blue (Mathematics)
  text: '#68A83A',         // Green (Text operations)
  lists: '#C03838',        // Red (List operations)
  colors: '#A55BA5',       // Purple (Color operations)
  variables: '#F97316',    // Orange-red (Variables)
  procedures: '#894FC4',   // Purple (Procedures/Functions)
  
  // Component blocks
  events: '#FACC15',       // Yellow (Component events)
  methods: '#894FC4',      // Purple (Component methods)
  getters: '#439970',      // Green (Property getters)
  setters: '#266643'       // Dark green (Property setters)
};
```

## Toolbox Structure

```xml
<xml>
  <!-- Built-in Blocks -->
  <category name="Control" colour="#F59E0B">
    <block type="controls_if"></block>
    <block type="controls_if_else"></block>
    <!-- ... more control blocks -->
  </category>
  
  <category name="Logic" colour="#4A90E2">
    <block type="logic_boolean"></block>
    <block type="logic_negate"></block>
    <!-- ... more logic blocks -->
  </category>
  
  <category name="Math" colour="#5B67A5">
    <block type="math_number"></block>
    <block type="math_arithmetic"></block>
    <!-- ... more math blocks -->
  </category>
  
  <category name="Text" colour="#68A83A">
    <block type="text"></block>
    <block type="text_join"></block>
    <!-- ... more text blocks -->
  </category>
  
  <category name="Lists" colour="#C03838">
    <block type="lists_create_empty"></block>
    <block type="lists_create_with"></block>
    <!-- ... more list blocks -->
  </category>
  
  <category name="Colors" colour="#A55BA5">
    <block type="colour_picker"></block>
    <block type="colour_rgb"></block>
    <!-- ... more color blocks -->
  </category>
  
  <category name="Variables" colour="#F97316" custom="VARIABLE">
  </category>
  
  <category name="Procedures" colour="#894FC4" custom="PROCEDURE">
  </category>
  
  <!-- Component Blocks (Dynamic) -->
  <category name="Screen1" colour="#FACC15">
    <block type="component_event">
      <field name="COMPONENT">Screen1</field>
      <field name="EVENT">Initialize</field>
    </block>
    <!-- ... more Screen1 blocks -->
  </category>
  
  <category name="Button1" colour="#FACC15">
    <block type="component_event">
      <field name="COMPONENT">Button1</field>
      <field name="EVENT">Click</field>
    </block>
    <block type="component_method">
      <field name="COMPONENT">Button1</field>
      <field name="METHOD">SetText</field>
    </block>
    <block type="component_get_property">
      <field name="COMPONENT">Button1</field>
      <field name="PROPERTY">Text</field>
    </block>
    <block type="component_set_property">
      <field name="COMPONENT">Button1</field>
      <field name="PROPERTY">Text</field>
    </block>
    <!-- ... more Button1 blocks -->
  </category>
</xml>
```

## Implementation Steps

1. **Create all built-in block definitions** in `src/appinverter/blocks/definitions/`
2. **Create component block generators** that dynamically create blocks based on added components
3. **Update toolbox generation** to include both built-in and component blocks
4. **Implement block colors** matching MIT App Inventor
5. **Add code generators** for React Native output

## Key Features

### Drag and Drop
- Blocks can be dragged from toolbox (flyout) to workspace
- Blocks can be dragged within workspace
- Blocks snap together when compatible
- Drag angle range: 360° (any direction)

### Block Behavior
- Blocks never collapse (collapse feature disabled)
- Blocks are always movable, deletable, and editable
- Pointer events enabled on all block elements
- Touch-friendly for mobile devices

### Workspace Features
- Grid with snapping (20px spacing)
- Zoom controls (0.3x to 3x)
- Scrollbars (horizontal and vertical)
- Trashcan for deleting blocks
- Save/load workspace state

## Next Steps

1. Implement all built-in block definitions
2. Create dynamic component block generation
3. Add proper block colors
4. Implement code generation for React Native
5. Test drag-and-drop functionality
6. Add block validation and error checking
