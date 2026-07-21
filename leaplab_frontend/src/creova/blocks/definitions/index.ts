import './builtin_blocks';
import './text';
import './lists';
import './color_component_blocks';
import './dictionary_blocks';
import './matrices';
import './variables';
import './procedures';

import * as Blockly from 'blockly';

export { LEAP_COLORS } from './builtin_blocks';
export { createComponentBlocks } from './color_component_blocks';

export function initializeAllBlocks() {
    if (typeof Blockly !== 'undefined') {
        if (Blockly.ConnectionChecker && Blockly.ConnectionChecker.prototype) {
            Blockly.ConnectionChecker.prototype.doTypeChecks = function () {
                return true;
            };
        }
        if (Blockly.Connection && Blockly.Connection.prototype) {
            Blockly.Connection.prototype.checkType_ = function () {
                return true;
            };
        }
        if (Blockly.utils && Blockly.utils.xml) {
            const originalTextToDom = Blockly.utils.xml.textToDom;
            Blockly.utils.xml.textToDom = function (text: string) {
                if (typeof text === 'string') {
                    text = text
                        .replace(/id="([^"]*?)_field([^"]*?)"/g, 'id="$1_fld$2"')
                        .replace(/id="([^"]*?)_connection([^"]*?)"/g, 'id="$1_conn$2"');
                }
                return originalTextToDom.call(this, text);
            };
        }
    }
    console.log('Leap App Inventor blocks initialized');
}
