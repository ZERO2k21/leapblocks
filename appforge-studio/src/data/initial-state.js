// Initial project state for Variables system
export const getInitialState = () => ({
  // Global variables accessible from any sprite
  globalVariables: {},

  // All sprites in the project
  sprites: {
    'sprite1': {
      id: 'sprite1',
      name: 'Sprite 1',
      localVariables: {},
      // Other sprite properties would go here (costumes, scripts, etc.)
    }
  },

  // Currently selected/active sprite
  currentSpriteId: 'sprite1',

  // Variable ID counter for unique IDs
  variableCounter: 0,
});

// Generate unique variable ID
export const generateVariableId = (counter) => {
  return `var_${counter}_${Date.now()}`;
};
