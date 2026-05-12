/**
 * MIT App Inventor Matrices Blocks
 */
import * as Blockly from 'blockly';
import { BLOCK_COLORS } from '../utils/blockColors';

// Create 2D Matrix
Blockly.Blocks['matrices_create_2d'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("create 2D matrix with size")
            .appendField(new Blockly.FieldNumber(2, 1), "ROWS")
            .appendField("×")
            .appendField(new Blockly.FieldNumber(2, 1), "COLS");
        this.appendDummyInput("DATA");
        this.setColour(BLOCK_COLORS.matrices);
        this.setOutput(true, "Matrix");
        this.setTooltip("Create a 2D matrix with specified dimensions.");
        this.updateShape_();
    },
    updateShape_: function () {
        // Simple visualization of 2x2 or 3x3 for outlook parity
        // In a real app, this would be more dynamic
    }
};

// Create Matrix with dimension list
Blockly.Blocks['matrices_create_with_dimensions'] = {
    init: function () {
        this.appendValueInput("DIMENSIONS")
            .setCheck("List")
            .appendField("create matrix with dimension list");
        this.appendValueInput("INITIAL_VALUE")
            .appendField("initialized with value");
        this.setColour(BLOCK_COLORS.matrices);
        this.setOutput(true, "Matrix");
        this.setTooltip("Create a matrix with dimensions specified in a list.");
    }
};

// Get Matrix Cell
Blockly.Blocks['matrices_get_cell'] = {
    init: function () {
        this.appendValueInput("MATRIX")
            .setCheck("Matrix")
            .appendField("get matrix cell")
            .appendField("matrix");
        this.appendValueInput("DIM1")
            .setCheck("Number")
            .appendField("dim1");
        this.appendValueInput("DIM2")
            .setCheck("Number")
            .appendField("dim2");
        this.setColour(BLOCK_COLORS.matrices);
        this.setOutput(true, null);
        this.setTooltip("Get value from a matrix cell.");
    }
};

// Set Matrix Cell
Blockly.Blocks['matrices_set_cell'] = {
    init: function () {
        this.appendValueInput("MATRIX")
            .setCheck("Matrix")
            .appendField("set matrix cell")
            .appendField("matrix");
        this.appendValueInput("VALUE")
            .appendField("value");
        this.appendValueInput("DIM1")
            .setCheck("Number")
            .appendField("dim1");
        this.appendValueInput("DIM2")
            .setCheck("Number")
            .appendField("dim2");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setColour(BLOCK_COLORS.matrices);
        this.setTooltip("Set value of a matrix cell.");
    }
};

// Get Matrix Row
Blockly.Blocks['matrices_get_row'] = {
    init: function () {
        this.appendValueInput("MATRIX")
            .setCheck("Matrix")
            .appendField("get matrix row")
            .appendField("matrix");
        this.appendValueInput("INDEX")
            .setCheck("Number")
            .appendField("row index");
        this.setColour(BLOCK_COLORS.matrices);
        this.setOutput(true, "List");
        this.setTooltip("Get a specific row from the matrix.");
    }
};

// Get Matrix Column
Blockly.Blocks['matrices_get_column'] = {
    init: function () {
        this.appendValueInput("MATRIX")
            .setCheck("Matrix")
            .appendField("get matrix column")
            .appendField("matrix");
        this.appendValueInput("INDEX")
            .setCheck("Number")
            .appendField("column index");
        this.setColour(BLOCK_COLORS.matrices);
        this.setOutput(true, "List");
        this.setTooltip("Get a specific column from the matrix.");
    }
};

// Get Matrix Dimensions
Blockly.Blocks['matrices_get_dimensions'] = {
    init: function () {
        this.appendValueInput("MATRIX")
            .setCheck("Matrix")
            .appendField("get matrix dimensions")
            .appendField("matrix");
        this.setColour(BLOCK_COLORS.matrices);
        this.setOutput(true, "List");
        this.setTooltip("Get dimensions of the matrix as a list.");
    }
};

export default {
    'matrices_create_2d': Blockly.Blocks['matrices_create_2d'],
    'matrices_create_with_dimensions': Blockly.Blocks['matrices_create_with_dimensions'],
    'matrices_get_cell': Blockly.Blocks['matrices_get_cell'],
    'matrices_set_cell': Blockly.Blocks['matrices_set_cell'],
    'matrices_get_row': Blockly.Blocks['matrices_get_row'],
    'matrices_get_column': Blockly.Blocks['matrices_get_column'],
    'matrices_get_dimensions': Blockly.Blocks['matrices_get_dimensions']
};
