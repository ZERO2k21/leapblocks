# Variables Blocks Panel Implementation Plan

## Overview
Implement the VARIABLES BLOCKS PANEL exactly as specified in the requirements, including UI structure, block functionality, runtime logic, and stage monitors.

## Current State Analysis
- Existing variable blocks are implemented in `animation-blocks.ts` (data_setvariableto, data_changevariableby, etc.)
- Variables category exists in toolbox but uses `LEAP_VARIABLES` custom type with empty contents
- AnimationVM already has variable storage logic using Map<string, number | string>
- IntermediateApp.tsx handles Blockly dialogs and workspace events
- Custom toolbox system uses PictoBloxCategory for circular icons

## Detailed Implementation Steps

### 1. UI Structure Implementation
#### Sidebar Category Button
- Create Variables category button with:
  - Circle icon with orange color #FF8C1A
  - Label: "Variables"
  - Pink circle below labeled "My Blocks" (using existing My Blocks category)

#### Panel Content Structure
Implement two sections in the Variables category flyout:
- **Variables Section**: Contains variable creation buttons and variable-specific blocks
- **My Blocks Section**: Contains custom procedure blocks

### 2. Variables Category Enhancement
Modify the Variables category in animation-blocks.ts toolbox definition:
- Change color to #FF8C1A (orange)
- Add proper custom icon handling
- Implement dynamic content generation for variable blocks

### 3. Variable Creation Modal Dialog
Create a modal dialog for "Make a Variable" button with:
- Variable name text input
- Scope radio buttons: "For all sprites" (default) | "For this sprite only"
- Confirm/Cancel buttons
- On confirm: create variable and show in variable list

### 4. Variable Storage and Retrieval Logic
Enhance existing variable storage:
- Use window.runtimeVariables = {} as specified
- Implement get/set/change/show/hide operations
- Ensure proper scoping (global vs local per sprite)
- Add green flag reset functionality

### 5. Stage Monitor Functionality
Implement draggable overlay boxes:
- Show [varName]: [value] format
- Positionable anywhere on stage
- Visibility controlled by checkbox OR "show variable" block
- Real-time updates when variable changes

### 6. Dynamic Dropdowns
Ensure all variable dropdowns:
- Automatically list all created variables
- Update in real-time when variables are created/deleted
- Work for variables, lists, and tables

### 7. List and Table Functionality
Add:
- "Make a List" button with modal for named list creation
- "Make a Table" button with modal for named 2D table creation
- Corresponding blocks for list/table operations

### 8. My Blocks Section Enhancement
Update My Blocks section:
- Add section header: "My Blocks" (bold text)
- Ensure "Make a Block" button opens block builder modal
- Maintain existing procedure blocks

### 9. Runtime Logic Verification
Verify and enhance existing block logic:
- SET block: runtimeVariables[varName] = value;
- CHANGE block: runtimeVariables[varName] = (parseFloat(runtimeVariables[varName]) || 0) + parseFloat(amount);
- SHOW/HIDE: Toggle stage monitor visibility
- GREEN FLAG: Reset all variables to initial value (0 or "")

### 10. Styling Implementation
Apply exact specifications:
- Block color: #FF8C1A (orange)
- Button style: border: 1px solid #ccc, border-radius: 4px, padding: 8px, width: 100%, background: white
- Section header: font-weight: bold, font-size: 14px, color: #333, margin: 10px 0 6px 0
- Variable pill: background: #FF8C1A, color: white, border-radius: 12px, padding: 3px 10px

## Files to Modify
1. `leapblocks/leapblocks/src/blocks/animation-blocks.ts` - Main blocks definition and toolbox
2. `leapblocks/leapblocks/src/IntermediateApp.tsx` - UI components, modals, and event handling
3. `leapblocks/leapblocks/src/vm/AnimationVM.ts` - Variable storage and runtime logic
4. `leapblocks/leapblocks/src/custom-toolbox.ts` - Icon/color enhancements (if needed)
5. New modal components for variable/list/table creation

## Dependencies
- React state management for UI components
- Blockly event system for workspace changes
- Existing custom toolbox infrastructure
- AnimationVM for runtime execution

## Testing Considerations
- Variable creation with different scopes
- Block execution correctness
- Stage monitor visibility toggling
- Dropdown updates
- Green flag reset functionality
- List/table creation and manipulation
- My Blocks integration

## Estimated Task Breakdown
See todo list for detailed step-by-step implementation order.