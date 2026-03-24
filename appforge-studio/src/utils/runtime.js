// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Variable Runtime System
// Global functions that execute during code runtime
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// This will be initialized with the variable state from VariablesContext
let runtimeState = {
  globalVariablesById: {}, // id -> variable object
  localVariablesById: {}, // id -> variable object (for current sprite)
  globalVariablesByName: {}, // name -> variable object (computed)
  localVariablesByName: {}, // name -> variable object (computed)
  currentSpriteId: 'sprite1',
  variableUpdateCallbacks: [],
};

/**
 * Initialize the runtime with current state
 * Called from BlockEditor when execution starts
 */
export function initializeRuntime(state) {
  // Build global variables maps
  const globalById = { ...state.globalVariables };
  const globalByName = {};
  Object.values(globalById).forEach(v => {
    globalByName[v.name] = v;
  });

  // Build local variables maps for current sprite
  const currentSprite = state.sprites[state.currentSpriteId];
  const localById = currentSprite ? { ...currentSprite.localVariables } : {};
  const localByName = {};
  Object.values(localById).forEach(v => {
    localByName[v.name] = v;
  });

  runtimeState = {
    globalVariablesById: globalById,
    localVariablesById: localById,
    globalVariablesByName: globalByName,
    localVariablesByName: localByName,
    currentSpriteId: state.currentSpriteId,
    variableUpdateCallbacks: [],
  };

  console.log('[Runtime] Initialized with state:', runtimeState);
}

/**
 * Subscribe to variable changes (for UI updates)
 * Returns an unsubscribe function
 */
export function onVariableUpdate(callback) {
  runtimeState.variableUpdateCallbacks.push(callback);
  // Return unsubscribe function
  return () => {
    const index = runtimeState.variableUpdateCallbacks.indexOf(callback);
    if (index > -1) {
      runtimeState.variableUpdateCallbacks.splice(index, 1);
    }
  };
}

/**
 * Notify all subscribers of variable update
 */
function notifyVariableUpdate(variableId, newValue, scope) {
  runtimeState.variableUpdateCallbacks.forEach(cb => {
    try {
      cb(variableId, newValue, scope);
    } catch (e) {
      console.error('[Runtime] Callback error:', e);
    }
  });
}

/**
 * Get variable value with scope resolution
 * Checks local first, then global
 */
export function getVariable(variableName) {
  // Check current sprite's local variables
  if (runtimeState.localVariablesByName[variableName]) {
    return runtimeState.localVariablesByName[variableName].value;
  }

  // Check global variables
  if (runtimeState.globalVariablesByName[variableName]) {
    return runtimeState.globalVariablesByName[variableName].value;
  }

  // Variable not found - create with default 0 (Scratch-like behavior)
  console.warn(`[Runtime] Variable '${variableName}' not found, creating with value 0`);
  const newVar = { name: variableName, value: 0, scope: 'global' };
  runtimeState.globalVariablesByName[variableName] = newVar;
  return 0;
}

/**
 * Set variable to specific value
 */
export function setVariable(variableName, value) {
  let variable = null;

  // Try local first
  if (runtimeState.localVariablesByName[variableName]) {
    variable = runtimeState.localVariablesByName[variableName];
  } else if (runtimeState.globalVariablesByName[variableName]) {
    variable = runtimeState.globalVariablesByName[variableName];
  } else {
    // Create new global variable
    console.log(`[Runtime] Creating new global variable '${variableName}'`);
    variable = { name: variableName, value: 0, scope: 'global', visible: false, x: 50, y: 50 };
    runtimeState.globalVariablesByName[variableName] = variable;
    runtimeState.globalVariablesById[variable.id] = variable;
  }

  // Update value
  const oldValue = variable.value;
  variable.value = value;

  // Determine scope
  const scope = runtimeState.localVariablesByName[variableName] ? 'local' : 'global';

  // Notify subscribers with variable ID, not just name
  notifyVariableUpdate(variable.id, value, scope);

  console.log(`[Runtime] set ${variableName} = ${value} (${scope})`);
  return value;
}

/**
 * Change variable by delta (increment/decrement)
 */
export function changeVariable(variableName, delta) {
  const currentValue = getVariable(variableName);
  const newValue = currentValue + delta;
  return setVariable(variableName, newValue);
}

/**
 * Show variable on stage (set visible flag)
 */
export function showVariable(variableName) {
  let variable = null;

  if (runtimeState.localVariablesByName[variableName]) {
    variable = runtimeState.localVariablesByName[variableName];
  } else if (runtimeState.globalVariablesByName[variableName]) {
    variable = runtimeState.globalVariablesByName[variableName];
  }

  if (variable) {
    variable.visible = true;
    notifyVariableUpdate(variable.id, variable.value, runtimeState.localVariablesByName[variableName] ? 'local' : 'global');
    console.log(`[Runtime] show variable ${variableName}`);
  } else {
    console.warn(`[Runtime] Cannot show non-existent variable '${variableName}'`);
  }
}

/**
 * Hide variable from stage (unset visible flag)
 */
export function hideVariable(variableName) {
  let variable = null;

  if (runtimeState.localVariablesByName[variableName]) {
    variable = runtimeState.localVariablesByName[variableName];
  } else if (runtimeState.globalVariablesByName[variableName]) {
    variable = runtimeState.globalVariablesByName[variableName];
  }

  if (variable) {
    variable.visible = false;
    notifyVariableUpdate(variable.id, variable.value, runtimeState.localVariablesByName[variableName] ? 'local' : 'global');
    console.log(`[Runtime] hide variable ${variableName}`);
  } else {
    console.warn(`[Runtime] Cannot hide non-existent variable '${variableName}'`);
  }
}

// Also expose for console debugging
window.runtimeDebug = {
  getState: () => runtimeState,
  getVariable,
  setVariable,
  changeVariable,
  showVariable,
  hideVariable,
  initializeRuntime,
};

console.log('[Runtime] Runtime functions loaded');
