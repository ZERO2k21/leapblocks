import { getTarget, wait } from './common';

export default function defineExtensionBlocks(Blockly, javascriptGenerator) {
    if (!Blockly || !javascriptGenerator) return;

    // Face Detection Blocks (Color: Redish #D43D41)

    // 1. Camera Switch
    Blockly.Blocks['fd_camera'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("📷", "junior-block-icon"))
                .appendField(new Blockly.FieldDropdown([["On", "on"], ["Off", "off"], ["Flip", "flip"]]), "ACTION");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#D43D41");
        }
    };
    javascriptGenerator.forBlock['fd_camera'] = (block) => {
        const action = block.getFieldValue("ACTION");
        return `if(window.fdCameraToggle) window.fdCameraToggle("${action}");\n${wait()}`;
    };

    // 2. Analyze Image
    Blockly.Blocks['fd_analyze'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("👤", "junior-block-icon"))
                .appendField(new Blockly.FieldDropdown([["Analyze", "analyze"], ["Show Detection", "show"], ["Hide Detection", "hide"]]), "ACTION");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#D43D41");
        }
    };
    javascriptGenerator.forBlock['fd_analyze'] = (block) => {
        const action = block.getFieldValue("ACTION");
        return `if(window.fdAnalyze) window.fdAnalyze("${action}");\n${wait()}`;
    };

    // 3. Count Faces
    Blockly.Blocks['fd_count'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("👥", "junior-block-icon"))
                .appendField();
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#D43D41");
        }
    };
    javascriptGenerator.forBlock['fd_count'] = () => {
        return `if(window.fdCountFaces) { window.say(${getTarget()}, window.fdCountFaces() + " faces detected"); } else { window.say(${getTarget()}, "1 face detected"); }\n${wait()}`;
    };

    // 4. Guess Emotion
    Blockly.Blocks['fd_guess_emotion'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("🙂", "junior-block-icon"))
                .appendField();
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#D43D41");
        }
    };
    javascriptGenerator.forBlock['fd_guess_emotion'] = () => {
        return `if(window.fdGuessEmotion) { window.say(${getTarget()}, "Emotion: " + window.fdGuessEmotion()); } else { window.say(${getTarget()}, "Emotion: Happy"); }\n${wait()}`;
    };

    // 5. Feature detect (Eye L dropdown)
    Blockly.Blocks['fd_feature'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("👁️", "junior-block-icon"))
                .appendField(new Blockly.FieldDropdown([
                    ["Eye L", "left_eye"],
                    ["Eye R", "right_eye"],
                    ["Smile", "smile"],
                    ["Nose", "nose"],
                    ["Face", "face"]
                ]), "FEATURE");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#D43D41");
        }
    };
    javascriptGenerator.forBlock['fd_feature'] = (block) => {
        const feature = block.getFieldValue("FEATURE");
        return `window.say(${getTarget()}, "Found " + "${feature}");\n${wait()}`;
    };

    // 6. When Emotion (Smile dropdown) Hat Block
    Blockly.Blocks['fd_when_emotion'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("🎭", "junior-icon-large"))
                .appendField(new Blockly.FieldDropdown([
                    ["Smile", "smile"],
                    ["Angry", "angry"],
                    ["Sad", "sad"],
                    ["Neutral", "neutral"],
                    ["Disgusted", "disgusted"],
                    ["Surprised", "surprised"],
                    ["Fearful", "fearful"]
                ]), "EMOTION");
            this.setNextStatement(true);
            this.setColour("#D43D41");
            this.setDeletable(true);
        }
    };
    javascriptGenerator.forBlock['fd_when_emotion'] = () => '// On Emotion\n';

    // ==========================================
    // Hand Pose Detection Blocks (Color: #D43D41)
    // ==========================================

    // 1. Camera Switch (Hand Pose)
    Blockly.Blocks['hp_camera'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("📷", "junior-block-icon"))
                .appendField(new Blockly.FieldDropdown([["On", "on"], ["Off", "off"], ["Flip", "flip"]]), "ACTION");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#D43D41");
        }
    };
    javascriptGenerator.forBlock['hp_camera'] = (block) => {
        const action = block.getFieldValue("ACTION");
        return `if(window.hpCameraToggle) window.hpCameraToggle("${action}");\n${wait()}`;
    };

    // 2. Analyze Hand
    Blockly.Blocks['hp_analyze'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("✋", "junior-block-icon"))
                .appendField(new Blockly.FieldDropdown([["Show Detection", "show"], ["Hide Detection", "hide"]]), "ACTION");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#D43D41");
        }
    };
    javascriptGenerator.forBlock['hp_analyze'] = (block) => {
        const action = block.getFieldValue("ACTION");
        return `if(window.hpAnalyze) window.hpAnalyze("${action}");\n${wait()}`;
    };

    // 3. Move with Hand (Finger Landmark)
    Blockly.Blocks['hp_move_with'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("👆", "junior-block-icon"))
                .appendField(new Blockly.FieldDropdown([
                    ["Thumb", "thumb"],
                    ["Index", "index"],
                    ["Middle", "middle"],
                    ["Ring", "ring"],
                    ["Pinky", "pinky"],
                    ["Base", "base"]
                ]), "FINGER");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#D43D41");
        }
    };
    javascriptGenerator.forBlock['hp_move_with'] = (block) => {
        const finger = block.getFieldValue("FINGER");
        // Move active sprite to the finger's position on screen
        return `if(window.hpMoveSpriteToFinger) window.hpMoveSpriteToFinger(${getTarget()}, "${finger}");\n${wait()}`;
    };

    // 4. Guess Finger Sign
    Blockly.Blocks['hp_guess_sign'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("✌️", "junior-block-icon"))
                .appendField();
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#D43D41");
        }
    };
    javascriptGenerator.forBlock['hp_guess_sign'] = () => {
        return `if(window.hpGuessSign) { window.say(${getTarget()}, "Sign: " + window.hpGuessSign()); } else { window.say(${getTarget()}, "Sign: Peace"); }\n${wait()}`;
    };

    // 5. When Hand Sign (Event Hat Block)
    Blockly.Blocks['hp_when_sign'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("🖐️", "junior-icon-large"))
                .appendField(new Blockly.FieldDropdown([
                    ["1", "1"],
                    ["2 / Peace", "2"],
                    ["3", "3"],
                    ["4", "4"],
                    ["5 / Open", "5"],
                    ["Thumbs Up", "thumbs_up"],
                    ["Thumbs Down", "thumbs_down"],
                    ["Point Left", "point_left"],
                    ["Point Right", "point_right"],
                    ["OK", "ok"],
                    ["Rock", "rock"],
                    ["L-Shape", "l_shape"]
                ]), "SIGN");
            this.setNextStatement(true);
            this.setColour("#D43D41");
            this.setDeletable(true);
        }
    };
    javascriptGenerator.forBlock['hp_when_sign'] = () => '// On Hand Sign\n';
}
