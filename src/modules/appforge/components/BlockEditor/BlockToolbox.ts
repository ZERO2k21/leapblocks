/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AppForge — Blockly Toolbox Config
// Dynamic categories based on placed components
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import type { AFComponent } from '../../AppForgeStudio';
import componentsData from '../../data/components.json';

export function getToolboxConfig(placedComponents: AFComponent[]) {
  const categories: any[] = [];

  // ── Category 1: Control ─────────────────
  categories.push({
    kind: 'category', name: '🔄 Control', colour: 120,
    contents: [
      { kind: 'block', type: 'controls_if' },
      { kind: 'block', type: 'controls_ifelse' },
      { kind: 'block', type: 'controls_repeat_ext', inputs: { TIMES: { shadow: { type: 'math_number', fields: { NUM: 10 } } } } },
      { kind: 'block', type: 'controls_whileUntil' },
      { kind: 'block', type: 'controls_for' },
      { kind: 'block', type: 'controls_forEach' },
      { kind: 'block', type: 'controls_flow_statements' },
    ],
  });

  // ── Category 2: Logic ───────────────────
  categories.push({
    kind: 'category', name: '💡 Logic', colour: 210,
    contents: [
      { kind: 'block', type: 'logic_compare' },
      { kind: 'block', type: 'logic_operation' },
      { kind: 'block', type: 'logic_negate' },
      { kind: 'block', type: 'logic_boolean' },
      { kind: 'block', type: 'logic_ternary' },
      { kind: 'block', type: 'logic_null' },
    ],
  });

  // ── Category 3: Math ────────────────────
  categories.push({
    kind: 'category', name: '🔢 Math', colour: 230,
    contents: [
      { kind: 'block', type: 'math_number' },
      { kind: 'block', type: 'math_arithmetic' },
      { kind: 'block', type: 'math_single' },
      { kind: 'block', type: 'math_trig' },
      { kind: 'block', type: 'math_number_property' },
      { kind: 'block', type: 'math_round' },
      { kind: 'block', type: 'math_modulo' },
      { kind: 'block', type: 'math_random_int' },
      { kind: 'block', type: 'math_random_float' },
    ],
  });

  // ── Category 4: Text ────────────────────
  categories.push({
    kind: 'category', name: '📝 Text', colour: 160,
    contents: [
      { kind: 'block', type: 'text' },
      { kind: 'block', type: 'text_join' },
      { kind: 'block', type: 'text_length' },
      { kind: 'block', type: 'text_isEmpty' },
      { kind: 'block', type: 'text_indexOf' },
      { kind: 'block', type: 'text_charAt' },
      { kind: 'block', type: 'text_changeCase' },
      { kind: 'block', type: 'text_trim' },
      { kind: 'block', type: 'text_print' },
    ],
  });

  // ── Category 5: Lists ──────────────────
  categories.push({
    kind: 'category', name: '📋 Lists', colour: 260,
    contents: [
      { kind: 'block', type: 'lists_create_empty' },
      { kind: 'block', type: 'lists_create_with' },
      { kind: 'block', type: 'lists_repeat' },
      { kind: 'block', type: 'lists_length' },
      { kind: 'block', type: 'lists_isEmpty' },
      { kind: 'block', type: 'lists_indexOf' },
      { kind: 'block', type: 'lists_getIndex' },
      { kind: 'block', type: 'lists_setIndex' },
    ],
  });

  // ── Category 6: Variables ───────────────
  categories.push({ kind: 'category', name: '📦 Variables', colour: 330, custom: 'VARIABLE' });

  // ── Category 7: Functions ───────────────
  categories.push({ kind: 'category', name: '⚡ Functions', colour: 290, custom: 'PROCEDURE' });

  // ── Category 8: Screen ──────────────────
  categories.push({
    kind: 'category', name: '📱 Screen', colour: 0,
    contents: [
      { kind: 'block', type: 'screen_set_title' },
      { kind: 'block', type: 'screen_set_bg_color' },
      { kind: 'block', type: 'screen_open' },
      { kind: 'block', type: 'screen_close' },
      { kind: 'block', type: 'screen_get_width' },
      { kind: 'block', type: 'screen_get_height' },
    ],
  });

  // ── Category 9: WiFi ────────────────────
  categories.push({
    kind: 'category', name: '📶 WiFi', colour: 210,
    contents: [
      { kind: 'block', type: 'wifi_scan' },
      { kind: 'block', type: 'wifi_connect' },
      { kind: 'block', type: 'wifi_disconnect' },
      { kind: 'block', type: 'wifi_is_connected' },
      { kind: 'block', type: 'wifi_get_ssid' },
      { kind: 'block', type: 'wifi_get_ip' },
      { kind: 'block', type: 'wifi_get_signal' },
      { kind: 'block', type: 'wifi_on_connected' },
    ],
  });

  // ── Category 10: Bluetooth ─────────────
  categories.push({
    kind: 'category', name: '📡 Bluetooth', colour: 280,
    contents: [
      { kind: 'block', type: 'bt_enable' },
      { kind: 'block', type: 'bt_disable' },
      { kind: 'block', type: 'bt_is_enabled' },
      { kind: 'block', type: 'bt_scan' },
      { kind: 'block', type: 'bt_connect' },
      { kind: 'block', type: 'bt_disconnect' },
      { kind: 'block', type: 'bt_is_connected' },
      { kind: 'block', type: 'bt_send_text' },
      { kind: 'block', type: 'bt_send_bytes' },
      { kind: 'block', type: 'bt_on_data' },
      { kind: 'block', type: 'bt_on_connected' },
      { kind: 'block', type: 'bt_on_disconnected' },
      { kind: 'block', type: 'bt_get_devices' },
      { kind: 'block', type: 'bt_get_name' },
    ],
  });

  // ── Category 11: Sensors ────────────────
  categories.push({
    kind: 'category', name: '🔬 Sensors', colour: 60,
    contents: [
      { kind: 'block', type: 'sensor_accelerometer' },
      { kind: 'block', type: 'sensor_gyroscope' },
      { kind: 'block', type: 'sensor_compass' },
      { kind: 'block', type: 'sensor_light' },
      { kind: 'block', type: 'sensor_proximity' },
      { kind: 'block', type: 'sensor_pressure' },
      { kind: 'block', type: 'sensor_steps' },
    ],
  });

  // ── Category 12: Placed Components ─────
  if (placedComponents.length > 0) {
    const compBlocks: any[] = [];
    placedComponents.forEach(comp => {
      const def = (componentsData as any[]).find(d => d.name === comp.type);
      if (!def) return;

      // Events
      (def.events || []).forEach((ev: string) => {
        compBlocks.push({ kind: 'block', type: `${def.name}_${ev}`.toLowerCase() });
      });
      // Methods
      (def.methods || []).forEach((m: string) => {
        compBlocks.push({ kind: 'block', type: `${def.name}_${m}`.toLowerCase() });
      });
      // Getter / Setter
      if ((def.properties || []).length > 0) {
        compBlocks.push({ kind: 'block', type: `${def.name}_get_property`.toLowerCase() });
        compBlocks.push({ kind: 'block', type: `${def.name}_set_property`.toLowerCase() });
      }
    });

    if (compBlocks.length > 0) {
      categories.push({
        kind: 'category', name: '🧱 My Components', colour: 340,
        contents: compBlocks,
      });
    }
  }

  return { kind: 'categoryToolbox', contents: categories };
}
