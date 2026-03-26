// Initial project state for Variables system
export const INITIAL_SPRITE_ID = 'sprite1';

export const getInitialState = () => ({
  // Global data structures
  globalVariables: {},
  globalLists: {},
  globalTables: {},

  // All sprites in the project
  sprites: {
    [INITIAL_SPRITE_ID]: {
      id: INITIAL_SPRITE_ID,
      name: 'Sprite 1',
      localVariables: {},
      localLists: {},
      localTables: {},
      blocks: '<xml xmlns="https://developers.google.com/blockly/xml"></xml>',
    }
  },

  // Currently selected/active sprite
  currentSpriteId: INITIAL_SPRITE_ID,

  // ID counters for unique IDs
  variableCounter: 0,
  listCounter: 0,
  tableCounter: 0,
});

// Generate unique variable ID
export const generateVariableId = (counter) => {
  return `var_${counter}_${Date.now()}`;
};
