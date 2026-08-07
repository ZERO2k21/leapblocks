/**
 * IR Proximity Sensor Module
 * 3-pin: VCC · GND · OUT (digital, active LOW)
 *
 * Simulation properties:
 *   detected — object detected (boolean, OUT goes LOW when true)
 *   ledPower — power LED on (always true when VCC connected)
 *   ledOut   — signal LED on when object detected
 *
 * Behavior:
 *   OUT pin = LOW when object detected (active-LOW)
 *   Detects nearby objects using IR reflection
 */
import { css, html, LitElement, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ElementPin } from '.';
import { GND, VCC } from './pin';

@customElement('leap-proximity-sensor')
export class ProximitySensorElement extends LitElement {
  /** Object detected state */
  @property({ type: Boolean }) detected = false;

  /** Power LED state */
  @property({ type: Boolean }) ledPower = false;

  /** Signal LED state (ON when object detected) */
  @property({ type: Boolean }) ledSignal = false;

  readonly pinInfo: ElementPin[] = [
    { name: 'VCC', x: 130, y: 50,  signals: [VCC()] },
    { name: 'GND', x: 130, y: 60,  signals: [GND()] },
    { name: 'OUT', x: 130, y: 70,  signals: [] },
  ];

  static get styles() {
    return css`
      :host { display: inline-block; }
      .wrap { position: relative; display: inline-block; line-height: 0; }
    `;
  }

  render() {
    const showPower = this.ledPower;
    const showSignal = this.ledSignal || this.detected;
    const irGlow = this.detected ? 0.8 : 0.15;

    return html`
      <div class="wrap">
        <svg
          width="34.925mm"
          height="20.32mm"
          version="1.1"
          viewBox="0 0 132 77"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <!-- Board -->
          <path
            d="m116 0h-100v77h100zm-93 68c1.9 0 3.44 1.5 3.44 3.34s-1.54 3.34-3.44 3.34-3.44-1.5-3.44-3.34 1.54-3.34 3.44-3.34zm75.6-46.5c3.3 0 5.98 2.68 5.98 5.98s-2.68 5.98-5.98 5.98-5.98-2.68-5.98-5.98 2.68-5.98 5.98-5.98zm-75.6-19.5c1.9 0 3.44 1.5 3.44 3.34 0 1.84-1.54 3.34-3.44 3.34s-3.44-1.5-3.44-3.34c0-1.84 1.54-3.34 3.44-3.34z"
            fill="#1c2546"
          />

          <!-- IR LED (emitter) -->
          <rect x="12" y="25" width="14" height="14" rx="2" fill="#2a2a2a" stroke="#555" stroke-width="0.5" />
          <circle cx="19" cy="32" r="4" fill="#4a0000" stroke="#8b0000" stroke-width="0.5" />
          <!-- IR emission glow -->
          <circle cx="19" cy="32" r="6" fill="none" stroke="#ff4444" stroke-width="0.5" opacity="${irGlow}" />
          <circle cx="19" cy="32" r="8" fill="none" stroke="#ff4444" stroke-width="0.3" opacity="${irGlow * 0.5}" />

          <!-- Photodiode (receiver) -->
          <rect x="12" y="42" width="14" height="14" rx="2" fill="#2a2a2a" stroke="#555" stroke-width="0.5" />
          <circle cx="19" cy="49" r="4" fill="#000033" stroke="#000088" stroke-width="0.5" />

          <!-- Comparator chip -->
          <g fill="#dae3eb">
            <path d="m52 30h-7.5c-0.3 0-0.58 0.12-0.79 0.33-0.21 0.21-0.33 0.49-0.33 0.79v0c0 0.3 0.12 0.58 0.33 0.79 0.21 0.21 0.49 0.33 0.79 0.33h7.5z" />
            <path d="m52 36h-7.5c-0.3 0-0.58 0.12-0.79 0.33-0.21 0.21-0.33 0.49-0.33 0.79v0c0 0.3 0.12 0.58 0.33 0.79 0.21 0.21 0.49 0.33 0.79 0.33h7.5z" />
            <path d="m52 42h-7.5c-0.3 0-0.58 0.12-0.79 0.33-0.21 0.21-0.33 0.49-0.33 0.79v0c0 0.3 0.12 0.58 0.33 0.79 0.21 0.21 0.49 0.33 0.79 0.33h7.5z" />
            <path d="m52 48h-7.5c-0.3 0-0.58 0.12-0.79 0.33-0.21 0.21-0.33 0.49-0.33 0.79v0c0 0.3 0.12 0.58 0.33 0.79 0.21 0.21 0.49 0.33 0.79 0.33h7.5z" />
            <path d="m60 50h7.5c0.3 0 0.58-0.12 0.79-0.33 0.21-0.21 0.33-0.49 0.33-0.79v0c0-0.3-0.12-0.58-0.33-0.79-0.21-0.21-0.49-0.33-0.79-0.33h-7.5z" />
            <path d="m60 44h7.5c0.3 0 0.58-0.12 0.79-0.33 0.21-0.21 0.33-0.49 0.33-0.79v0c0-0.3-0.12-0.58-0.33-0.79-0.21-0.21-0.49-0.33-0.79-0.33h-7.5z" />
            <path d="m60 38h7.5c0.3 0 0.58-0.12 0.79-0.33 0.21-0.21 0.33-0.49 0.33-0.79v0c0-0.3-0.12-0.58-0.33-0.79-0.21-0.21-0.49-0.33-0.79-0.33h-7.5z" />
            <path d="m60 32h7.5c0.3 0 0.58-0.12 0.79-0.33 0.21-0.21 0.33-0.49 0.33-0.79v0c0-0.3-0.12-0.58-0.33-0.79-0.21-0.21-0.49-0.33-0.79-0.33h-7.5z" />
          </g>
          <rect x="50.5" y="29" width="11.5" height="21.5" fill="#29261c" />

          <!-- Threshold potentiometer -->
          <circle cx="56" cy="14" r="5.5" fill="#bcc2d5" />
          <path d="m56 6v11" fill="none" stroke="#3f3c40" stroke-width="2px" />
          <path d="m64 14h-16" fill="none" stroke="#3f3c40" stroke-width="2px" />

          <!-- Power LED -->
          <rect x="80" y="8" width="10" height="3.5" fill="#dae3eb" />
          <rect x="82" y="7.8" width="5" height="3.8" fill="#fffefe" />
          <filter id="proxLedFilter" x="-0.8" y="-0.8" height="5.2" width="5.8">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
          ${showPower ? svg`<circle cx="84.5" cy="10" r="3" fill="green" filter="url(#proxLedFilter)" />` : ''}

          <!-- Signal LED -->
          <rect x="80" y="65" width="10" height="3.5" fill="#dae3eb" />
          <rect x="82" y="64.8" width="5" height="3.8" fill="#fffefe" />
          ${showSignal ? svg`<circle cx="84.5" cy="67" r="3" fill="red" filter="url(#proxLedFilter)" />` : ''}

          <!-- Text labels -->
          <text fill="#fffefe" font-size="4px" font-family="sans-serif">
            <tspan x="78" y="17">PWR</tspan>
            <tspan x="100" y="16">VCC</tspan>
            <tspan x="100" y="24">GND</tspan>
            <tspan x="102" y="52">OUT</tspan>
            <tspan x="78" y="63">SIG</tspan>
            <tspan x="78" y="70">LED</tspan>
          </text>

          <!-- Detection indicator -->
          ${this.detected ? svg`
            <text font-family="monospace" font-size="5px" font-weight="bold" text-anchor="middle" fill="#ef4444">
              <tspan x="42" y="62">OBJECT</tspan>
              <tspan x="42" y="68">DETECTED</tspan>
            </text>
          ` : svg`
            <text font-family="monospace" font-size="5px" font-weight="bold" text-anchor="middle" fill="#22c55e">
              <tspan x="42" y="65">NO OBJECT</tspan>
            </text>
          `}

          <!-- Board pins -->
          <path d="m112 36v25h8.5v-25z" fill="none" stroke="#fff" stroke-linejoin="round" stroke-width=".4px" />
          <g fill="#433b38">
            <path d="m113 55v5.5h5.5v-5.5z" />
            <path d="m113 45v5.5h5.5v-5.5z" />
            <path d="m113 35v5.5h5.5v-5.5z" />
          </g>
          <g fill="#9f9f9f">
            <path d="m116 56.5c-0.3 0-0.58 0.12-0.79 0.33-0.21 0.21-0.33 0.49-0.33 0.79v0c0 0.3 0.12 0.58 0.33 0.79 0.21 0.21 0.49 0.33 0.79 0.33h20c0.18 0 0.33-0.15 0.33-0.33v-1.6c0-0.18-0.15-0.33-0.33-0.33h-20z" />
            <path d="m116 46.5c-0.3 0-0.58 0.12-0.79 0.33-0.21 0.21-0.33 0.49-0.33 0.79v0c0 0.3 0.12 0.58 0.33 0.79 0.21 0.21 0.49 0.33 0.79 0.33h20c0.18 0 0.33-0.15 0.33-0.33v-1.6c0-0.18-0.15-0.33-0.33-0.33h-20z" />
            <path d="m116 36.5c-0.3 0-0.58 0.12-0.79 0.33-0.21 0.21-0.33 0.49-0.33 0.79s0.12 0.58 0.33 0.79c0.21 0.21 0.49 0.33 0.79 0.33h20c0.18 0 0.33-0.15 0.33-0.33v-1.6c0-0.18-0.15-0.33-0.33-0.33h-20z" />
          </g>
        </svg>
      </div>
    `;
  }
}
