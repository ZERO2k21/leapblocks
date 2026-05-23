// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Variable Runtime System
// Global functions that execute during code runtime
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// This will be initialized with the variable state from VariablesContext
let runtimeState = {
  globalVariablesById: {},
  localVariablesById: {},
  globalListsById: {},
  localListsById: {},
  globalTablesById: {},
  localTablesById: {},

  globalVariablesByName: {},
  localVariablesByName: {},
  globalListsByName: {},
  localListsByName: {},
  globalTablesByName: {},
  localTablesByName: {},

  currentSpriteId: 'sprite1',
  variableUpdateCallbacks: [],
};

/**
 * Initialize the runtime with current state
 * Called from BlockEditor when execution starts
 */
export function initializeRuntime(state) {
  const buildMaps = (objs) => {
    const byId = { ...objs };
    const byName = {};
    Object.values(byId).forEach(v => { byName[v.name] = v; });
    return { byId, byName };
  };

  const globalVars = buildMaps(state.globalVariables);
  const globalLists = buildMaps(state.globalLists || {});
  const globalTables = buildMaps(state.globalTables || {});

  const currentSprite = state.sprites[state.currentSpriteId] || {};
  const localVars = buildMaps(currentSprite.localVariables || {});
  const localLists = buildMaps(currentSprite.localLists || {});
  const localTables = buildMaps(currentSprite.localTables || {});

  runtimeState = {
    globalVariablesById: globalVars.byId,
    globalVariablesByName: globalVars.byName,
    globalListsById: globalLists.byId,
    globalListsByName: globalLists.byName,
    globalTablesById: globalTables.byId,
    globalTablesByName: globalTables.byName,

    localVariablesById: localVars.byId,
    localVariablesByName: localVars.byName,
    localListsById: localLists.byId,
    localListsByName: localLists.byName,
    localTablesById: localTables.byId,
    localTablesByName: localTables.byName,

    currentSpriteId: state.currentSpriteId,
    variableUpdateCallbacks: runtimeState.variableUpdateCallbacks || [],
  };

  console.log('[Runtime] Initialized with full state');
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

  // Variable not found - create with default 0 (leap-like behavior)
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

// ─────────────────────────────────────────────────────────────────────────────
// LIST OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

function getList(name) {
  return runtimeState.localListsByName[name] || runtimeState.globalListsByName[name];
}

export function addToList(name, item) {
  const list = getList(name);
  if (list) {
    list.value.push(item);
    notifyVariableUpdate(list.id, list.value, runtimeState.localListsByName[name] ? 'local' : 'global');
  }
}

export function deleteFromList(name, index) {
  const list = getList(name);
  if (list) {
    const idx = parseInt(index, 10) - 1; // 1-based to 0-based
    if (idx >= 0 && idx < list.value.length) {
      list.value.splice(idx, 1);
      notifyVariableUpdate(list.id, list.value, runtimeState.localListsByName[name] ? 'local' : 'global');
    }
  }
}

export function deleteAllFromList(name) {
  const list = getList(name);
  if (list) {
    list.value = [];
    notifyVariableUpdate(list.id, list.value, runtimeState.localListsByName[name] ? 'local' : 'global');
  }
}

export function insertInList(name, item, index) {
  const list = getList(name);
  if (list) {
    const idx = parseInt(index, 10) - 1;
    list.value.splice(idx, 0, item);
    notifyVariableUpdate(list.id, list.value, runtimeState.localListsByName[name] ? 'local' : 'global');
  }
}

export function replaceInList(name, index, item) {
  const list = getList(name);
  if (list) {
    const idx = parseInt(index, 10) - 1;
    if (idx >= 0 && idx < list.value.length) {
      list.value[idx] = item;
      notifyVariableUpdate(list.id, list.value, runtimeState.localListsByName[name] ? 'local' : 'global');
    }
  }
}

export function getItemOfList(name, index) {
  const list = getList(name);
  if (list) {
    const idx = parseInt(index, 10) - 1;
    return list.value[idx] || "";
  }
  return "";
}

export function getListLength(name) {
  const list = getList(name);
  return list ? list.value.length : 0;
}

export function listContains(name, item) {
  const list = getList(name);
  return list ? list.value.includes(item) : false;
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLE OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

function getTable(name) {
  return runtimeState.localTablesByName[name] || runtimeState.globalTablesByName[name];
}

export function getTableCell(name, row, col) {
  const table = getTable(name);
  if (table) {
    const rIdx = parseInt(row, 10) - 1;
    const cIdx = table.columns.indexOf(col);
    if (rIdx >= 0 && rIdx < table.rows.length && cIdx !== -1) {
      return table.rows[rIdx][cIdx];
    }
  }
  return "";
}

export function setTableCell(name, row, col, value) {
  const table = getTable(name);
  if (table) {
    const rIdx = parseInt(row, 10) - 1;
    let cIdx = table.columns.indexOf(col);
    // If col is a number, use it as index
    if (cIdx === -1 && !isNaN(col)) cIdx = parseInt(col, 10) - 1;

    if (rIdx >= 0 && rIdx < table.rows.length && cIdx >= 0 && cIdx < table.columns.length) {
      table.rows[rIdx][cIdx] = value;
      notifyVariableUpdate(table.id, table.rows, runtimeState.localTablesByName[name] ? 'local' : 'global');
    }
  }
}

export function addTableRow(name, data) {
  const table = getTable(name);
  if (table) {
    table.rows.push(Array.isArray(data) ? data : []);
    notifyVariableUpdate(table.id, table.rows, runtimeState.localTablesByName[name] ? 'local' : 'global');
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
  addToList,
  deleteFromList,
  deleteAllFromList,
  insertInList,
  replaceInList,
  getItemOfList,
  getListLength,
  listContains,
  getTableCell,
  setTableCell,
  addTableRow,
  initializeRuntime,
};

console.log('[Runtime] Runtime functions loaded');
