/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { ElementPin } from './pin';
import { safeDefine } from './utils/safe-define';

// Pin positions in mm (SVG viewBox is 0 0 21 10)
const y1Pos = 1.35;   // top row (mm)
const y2Pos = 8.65;   // bottom row (mm)
const x1Pos = 1.45;   // NO pins
const x2Pos = 6.61;   // NC pins
const x3Pos = 11.9;   // P (pole) pins
const x4Pos = 19.58;  // COIL pins

export class KS2EMDC5Element extends LitElement {
  /** Whether the relay coil is energized (coil powered) */
  @property({ type: Boolean }) energized = false;

  readonly pinInfo: ElementPin[] = [
    { name: 'NO2',   x: x1Pos, y: y1Pos, signals: [], number: 8 },
    { name: 'NC2',   x: x2Pos, y: y1Pos, signals: [], number: 6 },
    { name: 'P2',    x: x3Pos, y: y1Pos, signals: [], number: 4 },
    { name: 'COIL2', x: x4Pos, y: y1Pos, signals: [{ type: 'power', signal: 'GND' }], number: 1 },
    { name: 'NO1',   x: x1Pos, y: y2Pos, signals: [], number: 9 },
    { name: 'NC1',   x: x2Pos, y: y2Pos, signals: [], number: 11 },
    { name: 'P1',    x: x3Pos, y: y2Pos, signals: [], number: 13 },
    { name: 'COIL1', x: x4Pos, y: y2Pos, signals: [], number: 16 },
  ];

  render() {
    // Coil indicator color: green when energized, dark when not
    const coilColor = this.energized ? '#4ade80' : '#6b7280';
    // Armature line: shifts when energized to show contact switching
    const armatureY = this.energized ? 3.2 : 5.0;
    // Active contact label
    const activeContact = this.energized ? 'NO' : 'NC';

    return html`
      <svg
        width="21mm"
        height="10mm"
        version="1.1"
        viewBox="0 0 21 10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- Body -->
        <g stroke-width=".4" fill="#f7b93c" stroke="#dda137">
          <rect x=".20" y=".20" width="20.6" height="9.61" ry=".58" />
          <rect x="20.2" y="4.5" width=".40" height="1" fill="#dda137" />
        </g>

        <!-- Pin holes -->
        <g fill="none" stroke="#dda137" stroke-width=".47">
          <ellipse cx="1.6"   cy="1.35" rx=".76" ry=".76" />
          <ellipse cx="6.68"  cy="1.35" rx=".76" ry=".76" />
          <ellipse cx="11.76" cy="1.35" rx=".76" ry=".76" />
          <ellipse cx="19.38" cy="1.35" rx=".76" ry=".76" />
          <ellipse cx="1.6"   cy="8.65" rx=".76" ry=".76" />
          <ellipse cx="6.68"  cy="8.65" rx=".76" ry=".76" />
          <ellipse cx="11.76" cy="8.65" rx=".76" ry=".76" />
          <ellipse cx="19.38" cy="8.65" rx=".76" ry=".76" />
        </g>

        <!-- Coil indicator (right side, glows green when energized) -->
        <rect x="16.5" y="3.5" width="2.2" height="3" rx=".3"
              fill="${coilColor}" opacity=".85" />

        <!-- Armature / contact bridge (moves up when energized) -->
        <line x1="9.5" y1="${armatureY}" x2="13.5" y2="${armatureY}"
              stroke="#1e293b" stroke-width=".5" stroke-linecap="round"
              style="transition: all 60ms linear;" />

        <!-- Label -->
        <text fill="#4a3510" font-family="sans-serif" font-size="2.8222px">
          <tspan x="1.07" y="6.03">KS2E-M-DC5</tspan>
        </text>

        <!-- Active contact indicator -->
        <text fill="#1e293b" font-family="sans-serif" font-size="1.8px" font-weight="bold">
          <tspan x="9.6" y="${armatureY - 0.6}">${activeContact}</tspan>
        </text>
      </svg>
    `;
  }
}

safeDefine('leap-ks2e-m-dc5', KS2EMDC5Element);
