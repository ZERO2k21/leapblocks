import * as Blockly from 'blockly/core';

// Load Blockly extensions in a stable order before any app modules touch them.
import 'blockly/blocks';
import 'blockly/javascript';

export * from 'blockly/core';
export { javascriptGenerator } from 'blockly/javascript';
export default Blockly;
