// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AppForge — Custom Blockly Blocks
// WiFi, Bluetooth, Sensor blocks
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import * as Blockly from 'blockly';

let registered = false;

export function registerCustomBlocks(componentDefs: any[]) {
  if (registered) return;
  registered = true;

  // ── Component Event Blocks ──────────────
  componentDefs.forEach(comp => {
    (comp.events || []).forEach((eventName: string) => {
      const blockType = `${comp.name}_${eventName}`.toLowerCase();
      if (Blockly.Blocks[blockType]) return;
      Blockly.Blocks[blockType] = {
        init() {
          this.appendDummyInput()
            .appendField(`when ${comp.name}.${eventName}`)
            .appendField(new Blockly.FieldImage(getEventIcon(comp.category), 16, 16, '*'));
          this.appendStatementInput('DO').setCheck(null).appendField('do');
          this.setColour(getCategoryColor(comp.category));
          this.setTooltip(`Fires when ${comp.name} ${eventName} happens`);
          this.setHelpUrl('');
        },
      };
    });

    // Component Method Blocks
    (comp.methods || []).forEach((methodName: string) => {
      const blockType = `${comp.name}_${methodName}`.toLowerCase();
      if (Blockly.Blocks[blockType]) return;
      Blockly.Blocks[blockType] = {
        init() {
          this.appendDummyInput()
            .appendField(`call ${comp.name}.${methodName}`);
          this.appendValueInput('VALUE').setCheck(null).appendField('value');
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(getCategoryColor(comp.category));
          this.setTooltip(`Call ${comp.name}.${methodName}`);
        },
      };
    });

    // Component Property Getter
    const getterType = `${comp.name}_get_property`.toLowerCase();
    if (!Blockly.Blocks[getterType]) {
      const propNames = (comp.properties || []).map((p: any) => p.name);
      if (propNames.length > 0) {
        Blockly.Blocks[getterType] = {
          init() {
            this.appendDummyInput()
              .appendField(`${comp.name}.`)
              .appendField(new Blockly.FieldDropdown(propNames.map((n: string) => [n, n])), 'PROP');
            this.setOutput(true, null);
            this.setColour(getCategoryColor(comp.category));
            this.setTooltip(`Get ${comp.name} property`);
          },
        };
      }
    }

    // Component Property Setter
    const setterType = `${comp.name}_set_property`.toLowerCase();
    if (!Blockly.Blocks[setterType]) {
      const propNames = (comp.properties || []).map((p: any) => p.name);
      if (propNames.length > 0) {
        Blockly.Blocks[setterType] = {
          init() {
            this.appendValueInput('VALUE')
              .setCheck(null)
              .appendField(`set ${comp.name}.`)
              .appendField(new Blockly.FieldDropdown(propNames.map((n: string) => [n, n])), 'PROP')
              .appendField('to');
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(getCategoryColor(comp.category));
            this.setTooltip(`Set ${comp.name} property`);
          },
        };
      }
    }
  });

  // ── WiFi Blocks (8) ─────────────────────
  registerBlock('wifi_scan', 210, 'WiFi Scan', { statement: true, tooltip: 'Scan for available WiFi networks' });
  registerBlock('wifi_connect', 210, 'WiFi Connect', { valueInputs: [['SSID', 'SSID'], ['PASSWORD', 'password']], statement: true });
  registerBlock('wifi_disconnect', 210, 'WiFi Disconnect', { statement: true });
  registerBlock('wifi_is_connected', 210, 'WiFi is connected?', { output: 'Boolean' });
  registerBlock('wifi_get_ssid', 210, 'WiFi current SSID', { output: 'String' });
  registerBlock('wifi_get_ip', 210, 'WiFi IP address', { output: 'String' });
  registerBlock('wifi_get_signal', 210, 'WiFi signal strength', { output: 'Number' });
  registerBlock('wifi_on_connected', 210, 'when WiFi connected', { hat: true });

  // ── Bluetooth Blocks (14) ──────────────
  registerBlock('bt_enable', 280, 'Bluetooth enable', { statement: true });
  registerBlock('bt_disable', 280, 'Bluetooth disable', { statement: true });
  registerBlock('bt_is_enabled', 280, 'Bluetooth is enabled?', { output: 'Boolean' });
  registerBlock('bt_scan', 280, 'Bluetooth scan devices', { statement: true });
  registerBlock('bt_connect', 280, 'Bluetooth connect', { valueInputs: [['ADDRESS', 'address']], statement: true });
  registerBlock('bt_disconnect', 280, 'Bluetooth disconnect', { statement: true });
  registerBlock('bt_is_connected', 280, 'Bluetooth is connected?', { output: 'Boolean' });
  registerBlock('bt_send_text', 280, 'Bluetooth send text', { valueInputs: [['DATA', 'text']], statement: true });
  registerBlock('bt_send_bytes', 280, 'Bluetooth send bytes', { valueInputs: [['DATA', 'bytes']], statement: true });
  registerBlock('bt_on_data', 280, 'when Bluetooth data received', { hat: true });
  registerBlock('bt_on_connected', 280, 'when Bluetooth connected', { hat: true });
  registerBlock('bt_on_disconnected', 280, 'when Bluetooth disconnected', { hat: true });
  registerBlock('bt_get_devices', 280, 'Bluetooth paired devices', { output: 'Array' });
  registerBlock('bt_get_name', 280, 'Bluetooth device name', { output: 'String' });

  // ── Sensor Blocks (7) ──────────────────
  registerBlock('sensor_accelerometer', 60, 'Accelerometer [x y z]', { output: 'Array' });
  registerBlock('sensor_gyroscope', 60, 'Gyroscope [x y z]', { output: 'Array' });
  registerBlock('sensor_compass', 60, 'Compass heading', { output: 'Number' });
  registerBlock('sensor_light', 60, 'Light level', { output: 'Number' });
  registerBlock('sensor_proximity', 60, 'Proximity distance', { output: 'Number' });
  registerBlock('sensor_pressure', 60, 'Barometer pressure', { output: 'Number' });
  registerBlock('sensor_steps', 60, 'Step count', { output: 'Number' });

  // ── Control Flow ────────────────────────
  // (Built-in Blockly blocks: controls_if, controls_repeat_ext, etc. are already available)

  // ── Screen Blocks ────────────────────────
  registerBlock('screen_set_title', 0, 'set Screen title', { valueInputs: [['TITLE', 'title']], statement: true });
  registerBlock('screen_set_bg_color', 0, 'set Screen background color', { valueInputs: [['COLOR', 'color']], statement: true });
  registerBlock('screen_open', 0, 'open screen', { valueInputs: [['SCREEN', 'screenName']], statement: true });
  registerBlock('screen_close', 0, 'close current screen', { statement: true });
  registerBlock('screen_get_width', 0, 'Screen width', { output: 'Number' });
  registerBlock('screen_get_height', 0, 'Screen height', { output: 'Number' });
}

function registerBlock(type: string, color: number, label: string, opts: {
  statement?: boolean;
  output?: string;
  hat?: boolean;
  valueInputs?: [string, string][];
  tooltip?: string;
}) {
  if (Blockly.Blocks[type]) return;
  Blockly.Blocks[type] = {
    init() {
      const input = this.appendDummyInput().appendField(label);
      (opts.valueInputs || []).forEach(([name, fieldLabel]) => {
        this.appendValueInput(name).setCheck(null).appendField(fieldLabel);
      });
      if (opts.hat) {
        this.appendStatementInput('DO').setCheck(null).appendField('do');
      }
      if (opts.statement) {
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
      }
      if (opts.output) {
        this.setOutput(true, opts.output);
      }
      this.setColour(color);
      this.setTooltip(opts.tooltip || label);
    },
  };
}

function getCategoryColor(category: string): number {
  const map: Record<string, number> = {
    UI: 160, Layout: 200, Media: 300, Drawing: 20,
    Sensors: 60, Connectivity: 210, Storage: 120,
    UserInterface: 330, Social: 260, Maps: 180,
  };
  return map[category] || 230;
}

function getEventIcon(category: string): string {
  return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><text y="13" font-size="12">⚡</text></svg>';
}
