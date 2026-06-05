import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { getInitialState, generateVariableId } from '../data/initial-state';

// Action types
const ACTION_TYPES = {
  // Variables
  CREATE_VARIABLE: 'CREATE_VARIABLE',
  DELETE_VARIABLE: 'DELETE_VARIABLE',
  RENAME_VARIABLE: 'RENAME_VARIABLE',
  UPDATE_VARIABLE_VALUE: 'UPDATE_VARIABLE_VALUE',
  SET_VARIABLE_VISIBLE: 'SET_VARIABLE_VISIBLE',
  UPDATE_VARIABLE_POSITION: 'UPDATE_VARIABLE_POSITION',
  
  // Lists
  CREATE_LIST: 'CREATE_LIST',
  DELETE_LIST: 'DELETE_LIST',
  UPDATE_LIST_VALUE: 'UPDATE_LIST_VALUE',
  SET_LIST_VISIBLE: 'SET_LIST_VISIBLE',
  
  // Tables
  CREATE_TABLE: 'CREATE_TABLE',
  DELETE_TABLE: 'DELETE_TABLE',
  UPDATE_TABLE_CELL: 'UPDATE_TABLE_CELL',
  SET_TABLE_VISIBLE: 'SET_TABLE_VISIBLE',
  
  // Sprites
  SET_CURRENT_SPRITE: 'SET_CURRENT_SPRITE',
  CREATE_SPRITE: 'CREATE_SPRITE',
  DELETE_SPRITE: 'DELETE_SPRITE',
  UPDATE_SPRITE_BLOCKS: 'UPDATE_SPRITE_BLOCKS',
};

// Reducer
function variablesReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.CREATE_VARIABLE: {
      const { name, scope, initialValue = 0, spriteId } = action.payload;
      const variableId = generateVariableId(state.variableCounter);
      const variable = {
        id: variableId,
        name,
        value: initialValue,
        type: scope, // 'global' or 'local'
        visible: false,
        x: 50 + (state.variableCounter * 20),
        y: 50 + (state.variableCounter * 20),
      };

      let newState = { ...state, variableCounter: state.variableCounter + 1 };

      if (scope === 'global') {
        newState = {
          ...newState,
          globalVariables: {
            ...newState.globalVariables,
            [variableId]: variable,
          },
        };
      } else if (scope === 'local' && spriteId) {
        newState = {
          ...newState,
          sprites: {
            ...newState.sprites,
            [spriteId]: {
              ...newState.sprites[spriteId],
              localVariables: {
                ...newState.sprites[spriteId].localVariables,
                [variableId]: variable,
              },
            },
          },
        };
      }

      return newState;
    }

    case ACTION_TYPES.DELETE_VARIABLE: {
      const { variableId, scope, spriteId } = action.payload;
      let newState = { ...state };

      if (scope === 'global') {
        const { [variableId]: removed, ...restGlobal } = state.globalVariables;
        newState = { ...newState, globalVariables: restGlobal };
      } else if (scope === 'local' && spriteId) {
        const sprite = state.sprites[spriteId];
        const { [variableId]: removed, ...restLocal } = sprite.localVariables;
        newState = {
          ...newState,
          sprites: {
            ...newState.sprites,
            [spriteId]: {
              ...sprite,
              localVariables: restLocal,
            },
          },
        };
      }

      return newState;
    }

    case ACTION_TYPES.RENAME_VARIABLE: {
      const { variableId, newName, scope, spriteId } = action.payload;
      let newState = { ...state };

      if (scope === 'global') {
        const variable = state.globalVariables[variableId];
        newState = {
          ...newState,
          globalVariables: {
            ...newState.globalVariables,
            [variableId]: { ...variable, name: newName },
          },
        };
      } else if (scope === 'local' && spriteId) {
        const sprite = state.sprites[spriteId];
        const variable = sprite.localVariables[variableId];
        newState = {
          ...newState,
          sprites: {
            ...newState.sprites,
            [spriteId]: {
              ...sprite,
              localVariables: {
                ...sprite.localVariables,
                [variableId]: { ...variable, name: newName },
              },
            },
          },
        };
      }

      return newState;
    }

    case ACTION_TYPES.UPDATE_VARIABLE_VALUE: {
      const { variableId, value, scope, spriteId } = action.payload;
      let newState = { ...state };

      if (scope === 'global') {
        const variable = state.globalVariables[variableId];
        newState = {
          ...newState,
          globalVariables: {
            ...newState.globalVariables,
            [variableId]: { ...variable, value },
          },
        };
      } else if (scope === 'local' && spriteId) {
        const sprite = state.sprites[spriteId];
        const variable = sprite.localVariables[variableId];
        newState = {
          ...newState,
          sprites: {
            ...newState.sprites,
            [spriteId]: {
              ...sprite,
              localVariables: {
                ...sprite.localVariables,
                [variableId]: { ...variable, value },
              },
            },
          },
        };
      }

      return newState;
    }

    case ACTION_TYPES.SET_VARIABLE_VISIBLE: {
      const { variableId, visible, scope, spriteId } = action.payload;
      let newState = { ...state };

      if (scope === 'global') {
        const variable = state.globalVariables[variableId];
        newState = {
          ...newState,
          globalVariables: {
            ...newState.globalVariables,
            [variableId]: { ...variable, visible },
          },
        };
      } else if (scope === 'local' && spriteId) {
        const sprite = state.sprites[spriteId];
        const variable = sprite.localVariables[variableId];
        newState = {
          ...newState,
          sprites: {
            ...newState.sprites,
            [spriteId]: {
              ...sprite,
              localVariables: {
                ...sprite.localVariables,
                [variableId]: { ...variable, visible },
              },
            },
          },
        };
      }

      return newState;
    }

    case ACTION_TYPES.UPDATE_VARIABLE_POSITION: {
      const { variableId, x, y, scope, spriteId } = action.payload;
      let newState = { ...state };

      if (scope === 'global') {
        const variable = state.globalVariables[variableId];
        newState = {
          ...newState,
          globalVariables: {
            ...newState.globalVariables,
            [variableId]: { ...variable, x, y },
          },
        };
      } else if (scope === 'local' && spriteId) {
        const sprite = state.sprites[spriteId];
        const variable = sprite.localVariables[variableId];
        newState = {
          ...newState,
          sprites: {
            ...newState.sprites,
            [spriteId]: {
              ...sprite,
              localVariables: {
                ...sprite.localVariables,
                [variableId]: { ...variable, x, y },
              },
            },
          },
        };
      }

      return newState;
    }

    case ACTION_TYPES.CREATE_LIST: {
      const { name, scope, spriteId } = action.payload;
      const listId = `list_${state.listCounter}_${Date.now()}`;
      const list = {
        id: listId,
        name,
        value: [], // Array for list
        visible: false,
        x: 100,
        y: 100,
      };

      let newState = { ...state, listCounter: state.listCounter + 1 };
      if (scope === 'global') {
        newState.globalLists = { ...newState.globalLists, [listId]: list };
      } else if (spriteId) {
        newState.sprites[spriteId].localLists = { ...newState.sprites[spriteId].localLists, [listId]: list };
      }
      return newState;
    }

    case ACTION_TYPES.UPDATE_LIST_VALUE: {
      const { listId, value, scope, spriteId } = action.payload;
      const newState = { ...state };
      if (scope === 'global') {
        newState.globalLists[listId].value = value;
      } else if (spriteId) {
        newState.sprites[spriteId].localLists[listId].value = value;
      }
      return newState;
    }

    case ACTION_TYPES.CREATE_TABLE: {
      const { name, columns, scope, spriteId } = action.payload;
      const tableId = `table_${state.tableCounter}_${Date.now()}`;
      const table = {
        id: tableId,
        name,
        columns: columns || ['Column 1'],
        rows: [], // Data rows
        visible: false,
        x: 150,
        y: 150,
      };

      let newState = { ...state, tableCounter: state.tableCounter + 1 };
      if (scope === 'global') {
        newState.globalTables = { ...newState.globalTables, [tableId]: table };
      } else if (spriteId) {
        newState.sprites[spriteId].localTables = { ...newState.sprites[spriteId].localTables, [tableId]: table };
      }
      return newState;
    }

    case ACTION_TYPES.SET_LIST_VISIBLE: {
      const { listId, visible, scope, spriteId } = action.payload;
      let newState = { ...state };
      if (scope === 'global') {
        newState.globalLists[listId].visible = visible;
      } else if (spriteId) {
        newState.sprites[spriteId].localLists[listId].visible = visible;
      }
      return newState;
    }

    case ACTION_TYPES.SET_TABLE_VISIBLE: {
      const { tableId, visible, scope, spriteId } = action.payload;
      let newState = { ...state };
      if (scope === 'global') {
        newState.globalTables[tableId].visible = visible;
      } else if (spriteId) {
        newState.sprites[spriteId].localTables[tableId].visible = visible;
      }
      return newState;
    }

    case ACTION_TYPES.UPDATE_SPRITE_BLOCKS: {
      const { spriteId, blocks } = action.payload;
      return {
        ...state,
        sprites: {
          ...state.sprites,
          [spriteId]: {
            ...state.sprites[spriteId],
            blocks,
          },
        },
      };
    }

    case ACTION_TYPES.SET_CURRENT_SPRITE: {
      return {
        ...state,
        currentSpriteId: action.payload.spriteId,
      };
    }

    case ACTION_TYPES.CREATE_SPRITE: {
      const { spriteId, name } = action.payload;
      return {
        ...state,
        sprites: {
          ...state.sprites,
          [spriteId]: {
            id: spriteId,
            name: name || `Sprite ${Object.keys(state.sprites).length + 1}`,
            localVariables: {},
          },
        },
        currentSpriteId: spriteId,
      };
    }

    default:
      return state;
  }
}

// Context
const VariablesContext = createContext(null);

// Provider component
export function VariablesProvider({ children }) {
  const [state, dispatch] = useReducer(variablesReducer, getInitialState());

  // Action creators
  const createVariable = useCallback((name, scope, initialValue = 0) => {
    dispatch({
      type: ACTION_TYPES.CREATE_VARIABLE,
      payload: { name, scope, initialValue, spriteId: state.currentSpriteId },
    });
  }, [state.currentSpriteId]);

  const deleteVariable = useCallback((variableId, scope, spriteId = state.currentSpriteId) => {
    dispatch({
      type: ACTION_TYPES.DELETE_VARIABLE,
      payload: { variableId, scope, spriteId },
    });
  }, [state.currentSpriteId]);

  const renameVariable = useCallback((variableId, newName, scope, spriteId = state.currentSpriteId) => {
    dispatch({
      type: ACTION_TYPES.RENAME_VARIABLE,
      payload: { variableId, newName, scope, spriteId },
    });
  }, [state.currentSpriteId]);

  const updateVariableValue = useCallback((variableId, value, scope, spriteId = state.currentSpriteId) => {
    dispatch({
      type: ACTION_TYPES.UPDATE_VARIABLE_VALUE,
      payload: { variableId, value, scope, spriteId },
    });
  }, [state.currentSpriteId]);

  const setVariableVisible = useCallback((variableId, visible) => {
    const { globalVariables, globalLists, globalTables, sprites, currentSpriteId } = state;
    const currentSprite = sprites[currentSpriteId] || { localVariables: {}, localLists: {}, localTables: {} };

    let type = 'variable';
    let scope = 'global';

    if (globalVariables[variableId]) { type = 'variable'; scope = 'global'; }
    else if (globalLists[variableId]) { type = 'list'; scope = 'global'; }
    else if (globalTables[variableId]) { type = 'table'; scope = 'global'; }
    else if (currentSprite.localVariables[variableId]) { type = 'variable'; scope = 'local'; }
    else if (currentSprite.localLists[variableId]) { type = 'list'; scope = 'local'; }
    else if (currentSprite.localTables[variableId]) { type = 'table'; scope = 'local'; }

    dispatch({
      type: type === 'list' ? ACTION_TYPES.SET_LIST_VISIBLE : 
            type === 'table' ? ACTION_TYPES.SET_TABLE_VISIBLE : 
            ACTION_TYPES.SET_VARIABLE_VISIBLE,
      payload: { 
        [type === 'list' ? 'listId' : type === 'table' ? 'tableId' : 'variableId']: variableId, 
        visible, 
        scope, 
        spriteId: currentSpriteId 
      },
    });
  }, [state]);

  const updateVariablePosition = useCallback((variableId, x, y, scope, spriteId = state.currentSpriteId) => {
    dispatch({
      type: ACTION_TYPES.UPDATE_VARIABLE_POSITION,
      payload: { variableId, x, y, scope, spriteId },
    });
  }, [state.currentSpriteId]);

  const setCurrentSprite = useCallback((spriteId) => {
    dispatch({
      type: ACTION_TYPES.SET_CURRENT_SPRITE,
      payload: { spriteId },
    });
  }, []);

  const createList = useCallback((name, scope) => {
    dispatch({
      type: ACTION_TYPES.CREATE_LIST,
      payload: { name, scope, spriteId: state.currentSpriteId },
    });
  }, [state.currentSpriteId]);

  const updateListValue = useCallback((listId, value, scope) => {
    dispatch({
      type: ACTION_TYPES.UPDATE_LIST_VALUE,
      payload: { listId, value, scope, spriteId: state.currentSpriteId },
    });
  }, [state.currentSpriteId]);

  const createTable = useCallback((name, columns, scope) => {
    dispatch({
      type: ACTION_TYPES.CREATE_TABLE,
      payload: { name, columns, scope, spriteId: state.currentSpriteId },
    });
  }, [state.currentSpriteId]);

  const updateSpriteBlocks = useCallback((spriteId, blocks) => {
    dispatch({
      type: ACTION_TYPES.UPDATE_SPRITE_BLOCKS,
      payload: { spriteId, blocks },
    });
  }, []);

  const createSprite = useCallback((spriteId, name) => {
    dispatch({
      type: ACTION_TYPES.CREATE_SPRITE,
      payload: { spriteId, name },
    });
  }, []);

  // Helper: Get all accessible variables for current sprite (global + local)
  const getAccessibleVariables = useCallback(() => {
    const { globalVariables, sprites, currentSpriteId } = state;
    const currentSprite = sprites[currentSpriteId] || { localVariables: {}, localLists: {}, localTables: {} };

    const vars = [];
    const lists = [];
    const tables = [];

    // Global
    Object.values(globalVariables).forEach(v => vars.push({ ...v, scope: 'global' }));
    Object.values(state.globalLists || {}).forEach(l => lists.push({ ...l, scope: 'global' }));
    Object.values(state.globalTables || {}).forEach(t => tables.push({ ...t, scope: 'global' }));

    // Local
    Object.values(currentSprite.localVariables || {}).forEach(v => vars.push({ ...v, scope: 'local' }));
    Object.values(currentSprite.localLists || {}).forEach(l => lists.push({ ...l, scope: 'local' }));
    Object.values(currentSprite.localTables || {}).forEach(t => tables.push({ ...t, scope: 'local' }));

    return { variables: vars, lists, tables };
  }, [state]);

  // Helper: Get variable by ID
  const getVariable = useCallback((variableId) => {
    const { globalVariables, sprites, currentSpriteId } = state;

    // Check globals first (accessible from any sprite)
    if (globalVariables[variableId]) {
      return { ...globalVariables[variableId], scope: 'global' };
    }

    // Check current sprite's locals
    const currentSprite = sprites[currentSpriteId];
    if (currentSprite && currentSprite.localVariables[variableId]) {
      return { ...currentSprite.localVariables[variableId], scope: 'local' };
    }

    return null;
  }, [state]);

  const value = {
    state,
    actions: {
      createVariable,
      deleteVariable,
      renameVariable,
      updateVariableValue,
      setVariableVisible,
      updateVariablePosition,
      createList,
      updateListValue,
      createTable,
      setCurrentSprite,
      createSprite,
    },
    helpers: {
      getAccessibleVariables,
      getVariable,
    },
  };

  return (
    <VariablesContext.Provider value={value}>
      {children}
    </VariablesContext.Provider>
  );
}

// Custom hook
export function useVariables() {
  const context = useContext(VariablesContext);
  if (!context) {
    throw new Error('useVariables must be used within a VariablesProvider');
  }
  return context;
}

export default VariablesContext;
