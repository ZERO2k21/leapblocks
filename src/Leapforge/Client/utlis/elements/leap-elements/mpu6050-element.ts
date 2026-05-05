/**
 * MPU6050 — 6-axis IMU (accelerometer + gyroscope)
 * I2C interface, address 0x68 (AD0=LOW) or 0x69 (AD0=HIGH)
 *
 * Simulation properties (set by LeapNode from store sensorValues):
 *   accelX/Y/Z  — acceleration in g  (-2 … +2)
 *   gyroX/Y/Z   — angular rate in °/s (-250 … +250)
 *   temp        — temperature in °C  (-40 … +85)
 */
import { css, html, LitElement, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ElementPin } from '.';
import { GND, i2c, VCC } from './pin';

@customElement('leap-mpu6050')
export class MPU6050Element extends LitElement {
  // ── Simulation sensor values ─────────────────────────────────────────────
  @property({ type: Number }) accelX = 0;
  @property({ type: Number }) accelY = 0;
  @property({ type: Number }) accelZ = 1;
  @property({ type: Number }) gyroX  = 0;
  @property({ type: Number }) gyroY  = 0;
  @property({ type: Number }) gyroZ  = 0;
  @property({ type: Number }) temp   = 25;

  /** Legacy LED property kept for backward compat */
  @property({ type: Boolean }) led1 = false;

  readonly pinInfo: ElementPin[] = [
    { name: 'INT', x: 7.28,  y: 5.78, signals: [] },
    { name: 'AD0', x: 16.9,  y: 5.78, signals: [] },
    { name: 'XCL', x: 26.4,  y: 5.78, signals: [] },
    { name: 'XDA', x: 36.0,  y: 5.78, signals: [] },
    { name: 'SDA', x: 45.6,  y: 5.78, signals: [i2c('SDA')] },
    { name: 'SCL', x: 55.2,  y: 5.78, signals: [i2c('SCL')] },
    { name: 'GND', x: 64.8,  y: 5.78, signals: [GND()] },
    { name: 'VCC', x: 74.4,  y: 5.78, signals: [VCC()] },
  ];

  static get styles() {
    return css`
      :host { display: inline-block; position: relative; }
      .wrap { position: relative; display: inline-block; line-height: 0; }

      /* Sensor readout overlay */
      .readout {
        position: absolute;
        bottom: 2px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 3px;
        pointer-events: none;
      }
      .chip {
        font-size: 4px;
        font-family: monospace;
        font-weight: 700;
        color: #bef264;
        background: rgba(0,0,0,0.7);
        border-radius: 2px;
        padding: 1px 2px;
        white-space: nowrap;
        letter-spacing: 0.02em;
      }
    `;
  }

  render() {
    const { led1, accelX, accelY, accelZ, gyroX, gyroY, gyroZ, temp } = this;

    // Format helpers
    const fmt = (v: number) => (v >= 0 ? '+' : '') + v.toFixed(2);

    return html`
      <div class="wrap">
        <svg
          width="21.6mm"
          height="16.2mm"
          clip-rule="evenodd"
          fill-rule="evenodd"
          version="1.1"
          viewBox="0 0 81.6 61.2"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="pin-pattern" height="2.1" width="14" patternUnits="userSpaceOnUse">
              <path
                d="m2.09 1.32c0.124 0 0.243-0.049 0.331-0.137 0.086-0.086 0.137-0.206 0.137-0.33v-0.387c0-0.124-0.050-0.242-0.137-0.33-0.087-0.087-0.207-0.137-0.331-0.137h-1.62v1.32z"
                fill="#f5f9f0"
              />
            </pattern>
          </defs>

          <!-- Board -->
          <path
            d="m81.6 0h-81.6v61.2h81.6zm-10 44.9c3.8 0 6.88 3.08 6.88 6.88 0 3.8-3.08 6.89-6.88 6.89-3.8 0-6.89-3.09-6.89-6.89 0-3.8 3.09-6.88 6.89-6.88zm-61.6 0c3.8 0 6.89 3.08 6.89 6.88 0 3.8-3.09 6.89-6.89 6.89-3.8 0-6.88-3.09-6.88-6.89 0-3.8 3.08-6.88 6.88-6.88zm-2.74-41.9c1.55 0 2.81 1.26 2.81 2.81s-1.26 2.8-2.81 2.8-2.8-1.26-2.8-2.8 1.26-2.81 2.8-2.81zm19.2 0c1.55 0 2.81 1.26 2.81 2.81s-1.26 2.8-2.81 2.8c-1.55 0-2.8-1.26-2.8-2.8s1.26-2.81 2.8-2.81zm-9.58 0c1.55 0 2.81 1.26 2.81 2.81s-1.26 2.8-2.81 2.8c-1.55 0-2.8-1.26-2.8-2.8s1.26-2.81 2.8-2.81zm19.2 0c1.55 0 2.81 1.26 2.81 2.81s-1.26 2.8-2.81 2.8c-1.55 0-2.8-1.26-2.8-2.8s1.26-2.81 2.8-2.81zm9.58 0c1.55 0 2.8 1.26 2.8 2.81s-1.26 2.8-2.8 2.8c-1.55 0-2.81-1.26-2.81-2.8s1.26-2.81 2.81-2.81zm19.2 0c1.55 0 2.8 1.26 2.8 2.81s-1.26 2.8-2.8 2.8-2.81-1.26-2.81-2.8 1.26-2.81 2.81-2.81zm-9.58 0c1.55 0 2.8 1.26 2.8 2.81s-1.26 2.8-2.8 2.8c-1.55 0-2.81-1.26-2.81-2.8s1.26-2.81 2.81-2.81zm19.2 0c1.55 0 2.8 1.26 2.8 2.81s-1.26 2.8-2.8 2.8c-1.55 0-2.81-1.26-2.81-2.8s1.26-2.81 2.81-2.81z"
            fill="#16619d"
          />

          <!-- Right Chip -->
          <g fill="#fefdf4">
            <rect x="74.5" y="23.1" width="2.01" height="4.81" />
            <rect x="67.8" y="33" width="2.01" height="4.81" />
            <rect x="71.2" y="23.1" width="2.01" height="4.81" />
            <rect x="67.8" y="23.1" width="2.01" height="4.81" />
            <rect x="74.5" y="33" width="2.01" height="4.81" />
          </g>
          <g fill="#31322e">
            <rect x="74.5" y="25.5" width="2.01" height="2.4" />
            <rect x="67.8" y="33" width="2.01" height="2.4" />
            <rect x="71.2" y="25.5" width="2.01" height="2.4" />
            <rect x="67.8" y="25.5" width="2.01" height="2.4" />
            <rect x="74.5" y="33" width="2.01" height="2.4" />
          </g>

          <!-- Resistors -->
          <g fill="#e5e5e5">
            <rect x="12" y="21.3" width="3.83" height="9.3" />
            <rect x="17.7" y="21.3" width="3.83" height="9.3" />
            <rect x="56.5" y="21.3" width="3.83" height="9.3" />
            <rect x="51.2" y="21.3" width="3.83" height="9.3" />
            <rect x="17.7" y="35.6" width="3.83" height="9.3" />
            <rect x="23.3" y="21.3" width="3.83" height="9.3" />
            <rect x="62.2" y="21.3" width="3.83" height="9.3" />
            <rect x="51.2" y="35.8" width="3.83" height="9.3" />
            <rect x="56.9" y="35.8" width="3.83" height="9.3" />
          </g>
          <path d="m76 42.6v-3.13h-7.59v3.13z" fill="#fefdf4" />
          <rect x="23.1" y="35.6" width="3.83" height="9.3" fill="#e5e5e5" />

          <g fill="#26232b">
            <rect x="17.7" y="23.4" width="3.83" height="5.31" />
            <rect x="56.5" y="23.4" width="3.83" height="5.31" />
            <rect x="51.2" y="23.4" width="3.83" height="5.31" />
            <rect x="17.7" y="37.7" width="3.83" height="5.31" />
          </g>
          <g fill="#d8c18d">
            <rect x="23.3" y="23.4" width="3.83" height="5.31" />
            <rect x="62.2" y="23.4" width="3.83" height="5.31" />
            <rect x="51.2" y="37.8" width="3.83" height="5.31" />
            <rect x="56.9" y="37.8" width="3.83" height="5.31" />
            <path d="m74.3 42.6v-3.13h-4.33v3.13z" />
          </g>
          <g>
            <rect x="23.1" y="37.7" width="3.83" height="5.31" fill="#a06352" />
            <rect x="31.8" y="47.1" width="15.6" height="6.03" fill="#f3c338" />
            <rect x="67.3" y="27.9" width="9.76" height="5.28" fill="#010303" />
          </g>

          <!-- MPU6050 Chip -->
          <rect transform="translate(47,26)" width="5" height="14.5" fill="url(#pin-pattern)" />
          <rect transform="translate(32.3,40) rotate(180)" width="5" height="14.5" fill="url(#pin-pattern)" />
          <rect transform="translate(46.5,40.7) rotate(90)" width="5" height="14.5" fill="url(#pin-pattern)" />
          <rect transform="translate(32.3,26) rotate(270)" width="5" height="14.5" fill="url(#pin-pattern)" />
          <rect x="31.8" y="25.4" width="15.6" height="15.6" />

          <!-- LED -->
          <rect x="12" y="23.4" width="3.83" height="5.31" fill="#f5ecde" />
          <filter id="ledFilter" x="-0.8" y="-0.8" height="5.2" width="5.8">
            <feGaussianBlur stdDeviation="2" />
          </filter>
          ${led1 ? svg`<circle cx="13.9" cy="25.5" r="3.5" fill="#80ff80" filter="url(#ledFilter)" />` : ''}

          <!-- PCB Pins -->
          <g fill="none" stroke="#d0ae88" stroke-width=".648px">
            <circle cx="64.8" cy="5.78" r="2.81" />
            <circle cx="55.2" cy="5.78" r="2.81" />
            <circle cx="45.6" cy="5.78" r="2.81" />
            <circle cx="36"   cy="5.78" r="2.81" />
            <circle cx="26.4" cy="5.78" r="2.81" />
            <circle cx="16.9" cy="5.78" r="2.81" />
            <circle cx="7.28" cy="5.78" r="2.81" />
            <circle cx="74.4" cy="5.78" r="2.81" />
          </g>

          <!-- Text -->
          <text transform="rotate(90)" fill="#ffffff" font-family="sans-serif" font-size="3.6px" x="10.056">
            <tspan x="10.056" y="-6">INT</tspan>
            <tspan x="10.056" y="-15.5">AD0</tspan>
            <tspan x="10.056" y="-25.157">XCL</tspan>
            <tspan x="10.056" y="-34.5">XDA</tspan>
            <tspan x="10.056" y="-44.38">SDA</tspan>
            <tspan x="9.911"  y="-54">SCL</tspan>
            <tspan x="10.057" y="-63.54">GND</tspan>
            <tspan x="10.057" y="-73">VCC</tspan>
          </text>

          <!-- Live sensor value overlay on chip -->
          <text font-family="monospace" font-size="2.8px" fill="#bef264" text-anchor="middle">
            <tspan x="40" y="30.5">A ${fmt(accelX)} ${fmt(accelY)} ${fmt(accelZ)}g</tspan>
            <tspan x="40" y="34.5">G ${fmt(gyroX)} ${fmt(gyroY)} ${fmt(gyroZ)}°</tspan>
            <tspan x="40" y="38.5">T ${temp.toFixed(1)}°C</tspan>
          </text>
        </svg>
      </div>
    `;
  }
}
