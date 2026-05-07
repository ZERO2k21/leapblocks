/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { html, LitElement, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ElementPin } from './pin';

/**
 * Single-Channel 5V Relay Module
 * 
 * Control Pins (left side):
 * - VCC: Power supply (5V)
 * - GND: Ground
 * - IN: Signal input (HIGH = relay ON, LOW = relay OFF)
 * 
 * Switch Terminals (right side):
 * - NO (Normally Open): Closed when relay is energized
 * - COM (Common): Common terminal
 * - NC (Normally Closed): Open when relay is energized
 * 
 * How it works:
 * - When IN is LOW: COM connects to NC (normally closed circuit)
 * - When IN is HIGH: COM connects to NO (switches to normally open circuit)
 * 
 * Sources (content rephrased for compliance with licensing restrictions):
 * - Arduino relay module documentation
 * - Electronics tutorials on relay operation
 */

@customElement('leap-relay-module')
export class RelayModuleElement extends LitElement {
    /** Whether the relay is energized (IN pin is HIGH) */
    @property({ type: Boolean }) energized = false;

    /** LED indicator state */
    @property({ type: Boolean }) led = false;

    readonly pinInfo: ElementPin[] = [
        // Control pins (left side)
        { name: 'VCC', x: 2, y: 3, signals: [{ type: 'power', signal: 'VCC' }], number: 1 },
        { name: 'GND', x: 2, y: 6, signals: [{ type: 'power', signal: 'GND' }], number: 2 },
        { name: 'IN', x: 2, y: 9, signals: [], number: 3 },

        // Switch terminals (right side)
        { name: 'NO', x: 28, y: 3, signals: [], number: 4 },
        { name: 'COM', x: 28, y: 6, signals: [], number: 5 },
        { name: 'NC', x: 28, y: 9, signals: [], number: 6 },
    ];

    static styles = css`
    :host {
      display: inline-block;
    }
  `;

    render() {
        // LED color: red when energized, dark when off
        const ledColor = this.led ? '#ef4444' : '#7f1d1d';
        // Contact indicator
        const activeContact = this.energized ? 'NO' : 'NC';
        const contactLineY = this.energized ? 3.5 : 8.5;

        return html`
      <svg
        width="30mm"
        height="12mm"
        version="1.1"
        viewBox="0 0 30 12"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- Main PCB body (red) -->
        <rect x="3" y="0.5" width="24" height="11" rx="0.5" fill="#dc2626" stroke="#991b1b" stroke-width="0.3" />

        <!-- Blue relay module area -->
        <rect x="8" y="2" width="14" height="8" rx="0.3" fill="#3b82f6" stroke="#1e40af" stroke-width="0.3" />
        
        <!-- Relay label -->
        <text x="15" y="6.5" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="2.5" font-weight="bold">
          Relay
        </text>
        <text x="15" y="8.5" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="1.5">
          Module
        </text>

        <!-- LED indicator (top right) -->
        <circle cx="23" cy="3" r="0.8" fill="${ledColor}" stroke="#450a0a" stroke-width="0.2" />
        <text x="23" y="1.5" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="1.2">
          LED1
        </text>

        <!-- Control pins labels (left side) -->
        <g fill="white" font-family="Arial, sans-serif" font-size="1.3" font-weight="bold">
          <text x="4.5" y="3.5">VCC</text>
          <text x="4.5" y="6.5">GND</text>
          <text x="4.5" y="9.5">IN</text>
        </g>

        <!-- Switch terminal labels (right side) -->
        <g fill="white" font-family="Arial, sans-serif" font-size="1.3" font-weight="bold" text-anchor="end">
          <text x="25.5" y="3.5">NO</text>
          <text x="25.5" y="6.5">COM</text>
          <text x="25.5" y="9.5">NC</text>
        </g>

        <!-- Pin holes (left side - control) -->
        <g fill="#1e293b" stroke="#0f172a" stroke-width="0.2">
          <circle cx="2" cy="3" r="0.6" />
          <circle cx="2" cy="6" r="0.6" />
          <circle cx="2" cy="9" r="0.6" />
        </g>

        <!-- Pin holes (right side - switch terminals) -->
        <g fill="#1e293b" stroke="#0f172a" stroke-width="0.2">
          <circle cx="28" cy="3" r="0.6" />
          <circle cx="28" cy="6" r="0.6" />
          <circle cx="28" cy="9" r="0.6" />
        </g>

        <!-- Contact indicator line (shows which terminal is connected) -->
        <line x1="23" y1="6" x2="26" y2="${contactLineY}" 
              stroke="#fbbf24" stroke-width="0.4" stroke-linecap="round"
              style="transition: all 80ms linear;" />

        <!-- Active contact indicator text -->
        <text x="15" y="11" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="1.2" font-weight="bold">
          ${activeContact}
        </text>

        <!-- PWR label (top left) -->
        <text x="4" y="1.5" fill="white" font-family="Arial, sans-serif" font-size="1.2" font-weight="bold">
          PWR
        </text>

        <!-- NO COMM NC label (top right) -->
        <text x="26" y="1.5" text-anchor="end" fill="white" font-family="Arial, sans-serif" font-size="1" font-weight="bold">
          NO COMM NC
        </text>
      </svg>
    `;
    }
}
