/**
 * MQ-series Gas Sensor Module (MQ-2, MQ-3, MQ-5, etc.)
 * 4-pin: AOUT (analog) · DOUT (digital) · GND · VCC
 *
 * Simulation properties:
 *   value     — gas concentration 0–100 (0 = clean air, 100 = max gas)
 *   threshold — DOUT goes LOW when concentration > threshold (default 50)
 *   ledPower  — power LED (always on when VCC connected)
 *   ledD0     — D0 LED (on when gas detected, i.e. DOUT LOW)
 *
 * Voltage mapping (MQ sensor + 10kΩ load resistor, VCC=5V):
 *   V_aout = VCC × (concentration / 100)   (low = clean, high = gas)
 *   DOUT   = LOW when concentration > threshold (active-LOW comparator)
 */
import { css, html, LitElement, svg } from 'lit';
import { property } from 'lit/decorators.js';
import { analog, ElementPin, GND, VCC } from './pin';
import { safeDefine } from './utils/safe-define';

export class GasSensorElement extends LitElement {
  /** Gas concentration 0–100 (0 = clean air, 100 = max gas) */
  @property({ type: Number }) value = 0;

  /** DOUT threshold: DOUT goes LOW when concentration > threshold */
  @property({ type: Number }) threshold = 50;

  /** Power LED — on when VCC connected */
  @property({ type: Boolean }) ledPower = false;

  /** D0 LED — on when gas detected (DOUT LOW) */
  @property({ type: Boolean }) ledD0 = false;

  readonly pinInfo: ElementPin[] = [
    { name: 'AOUT', y: 16.5, x: 137, number: 1, signals: [analog(0)] },
    { name: 'DOUT', y: 26.4, x: 137, number: 2, signals: [] },
    { name: 'GND',  y: 36.5, x: 137, number: 3, signals: [GND()] },
    { name: 'VCC',  y: 46.2, x: 137, number: 4, signals: [VCC()] },
  ];

  static get styles() {
    return css`
      :host { display: inline-block; }
      .wrap { position: relative; display: inline-block; line-height: 0; }
    `;
  }

  /** AOUT voltage: 0V = clean air, 5V = max gas */
  private _concentrationToVoltage(pct: number): number {
    return 5.0 * Math.max(0, Math.min(100, pct)) / 100;
  }

  render() {
    const concentration = Number(this.value) || 0;
    const threshold     = Number(this.threshold) || 50;
    const gasDetected   = concentration > threshold;
    const voltage       = this._concentrationToVoltage(concentration);
    const adcRaw        = Math.round((voltage / 5.0) * 1023);

    const showPower = this.ledPower;
    const showD0    = this.ledD0 || gasDetected;

    // Sensor dome colour — shifts from grey to orange/brown as gas increases
    const r = Math.round(186 + (concentration / 100) * 60);
    const g = Math.round(179 - (concentration / 100) * 80);
    const b = Math.round(173 - (concentration / 100) * 100);
    const domeColor  = `rgb(${r},${g},${b})`;
    const innerColor = `rgb(${Math.round(176 + (concentration / 100) * 50)},${Math.round(163 - (concentration / 100) * 70)},${Math.round(157 - (concentration / 100) * 90)})`;

    return html`
      <div class="wrap">
        <svg
          width="36.232mm"
          height="16.617mm"
          fill-rule="evenodd"
          version="1.1"
          viewBox="0 0 137 59.5"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <defs>
            <pattern id="gas-mesh" width="4.1" height="4.1" patternUnits="userSpaceOnUse">
              <path
                d="m0 0v4.09h0.4v-0.85l0.42 0.381v0.469h0.4v-0.0996l0.109 0.0996h0.711v-0.799l0.42 0.379v0.42h0.398v-0.0488l0.0547 0.0488h0.766v-0.75l0.42 0.381v0.369h0.4v-4.09h-0.4v0.311l-0.334-0.311h-0.598l0.111 0.0996v0.9l-0.42-0.379v-0.621h-0.398v0.25l-0.277-0.25h-0.6l0.0566 0.0508v0.9l-0.42-0.381v-0.57h-0.4v0.201l-0.223-0.201zm0.4 0.359 0.42 0.381v0.9l-0.42-0.381zm1.64 0.0508 0.42 0.391v0.889l-0.42-0.379zm1.64 0.0605 0.42 0.379v0.891l-0.42-0.381zm-2.46 0.639 0.42 0.381v0.9l-0.42-0.381zm1.64 0.0508 0.42 0.381v0.898l-0.42-0.379zm-2.46 0.641 0.42 0.379v0.9l-0.42-0.379zm1.64 0.0488 0.42 0.381v0.9l-0.42-0.381zm1.64 0.0508 0.42 0.379v0.9l-0.42-0.379zm-2.46 0.65 0.42 0.379v0.9l-0.42-0.379zm1.64 0.0488 0.42 0.381v0.9l-0.42-0.381z"
                fill="#949392"
              />
            </pattern>
            <g id="gas-pin">
              <path
                fill="#c6bf95"
                d="m29 4.6c0.382 0 0.748-0.152 1.02-0.422s0.422-0.636 0.422-1.02v-1e-3c0-0.382-0.152-0.748-0.422-1.02s-0.636-0.422-1.02-0.422h-26.1c-0.234 0-0.423 0.189-0.423 0.423v2.04c0 0.234 0.189 0.423 0.423 0.423h26.1z"
              />
              <rect x="0" y="0" width="6.9" height="6.9" />
            </g>
            <filter id="gasLedFilter" x="-1" y="-1" width="4" height="4">
              <feGaussianBlur stdDeviation="1.5" />
            </filter>
          </defs>

          <!-- Board -->
          <path
            d="m113 0h-113v59.5h113zm-1.6 53.2c0 2.62-2.12 4.74-4.74 4.74s-4.74-2.12-4.74-4.74c0-2.62 2.12-4.74 4.74-4.74s4.74 2.12 4.74 4.74zm-110 0c0 2.62 2.12 4.74 4.74 4.74 2.62 0 4.74-2.12 4.74-4.74 0-2.62-2.12-4.74-4.74-4.74-2.62 0-4.74 2.12-4.74 4.74zm105-51.6c2.62 0 4.74 2.12 4.74 4.74 0 2.62-2.12 4.74-4.74 4.74s-4.74-2.12-4.74-4.74c0-2.62 2.12-4.74 4.74-4.74zm-101 0c-2.62 0-4.74 2.12-4.74 4.74 0 2.62 2.12 4.74 4.74 4.74 2.62 0 4.74-2.12 4.74-4.74 0-2.62-2.12-4.74-4.74-4.74z"
            fill="#0664af"
          />

          <!-- Pins -->
          <use xlink:href="#gas-pin" x="107" y="12" />
          <use xlink:href="#gas-pin" x="107" y="21.3" />
          <use xlink:href="#gas-pin" x="107" y="31.1" />
          <use xlink:href="#gas-pin" x="107" y="40.9" />

          <!-- Sensor dome — colour-reactive to gas concentration -->
          <circle cx="47.7" cy="29.8" r="31.2" fill="none" stroke="#fff" stroke-width=".4px" />
          <circle cx="47.7" cy="29.8" r="28.8" fill="${domeColor}" />
          <circle cx="47.7" cy="29.8" r="25.8" fill="${innerColor}" />
          <circle cx="47.7" cy="29.8" r="21.4" fill="#bab3ad" />
          <circle cx="47.7" cy="29.8" r="21.4" fill="url(#gas-mesh)" />

          <!-- Gas cloud glow when detected -->
          ${gasDetected ? svg`
            <circle cx="47.7" cy="29.8" r="${18 + concentration * 0.1}" fill="rgba(180,120,0,0.25)" opacity="0.6">
              <animate attributeName="r" values="${18 + concentration * 0.1};${22 + concentration * 0.12};${18 + concentration * 0.1}" dur="1s" repeatCount="indefinite"/>
            </circle>
          ` : ''}

          <!-- Pin labels -->
          <text fill="#ffffff" font-family="sans-serif" font-size="3.72px">
            <tspan x="94.656" y="16.729">AOUT</tspan>
            <tspan x="94.656" y="26.098">DOUT</tspan>
            <tspan x="94.656" y="35.911">GND</tspan>
            <tspan x="94.656" y="45.696">VCC</tspan>
          </text>

          <!-- Power LED -->
          <rect x="81.321793" y="5.8179226" width="8.5262499" height="3.8281121" fill="#999999" />
          <rect x="83.162689" y="5.8179226" width="4.8444595" height="3.8281121" fill="#e6e6e6" />
          ${showPower ? svg`<circle cx="85.5" cy="8" r="2.5" fill="#03f704" filter="url(#gasLedFilter)" />` : ''}

          <!-- D0 LED -->
          <rect x="81.018036" y="48.700188" width="8.5262499" height="3.8281121" fill="#999999" />
          <rect x="82.858932" y="48.700188" width="4.8444595" height="3.8281121" fill="#e6e6e6" />
          ${showD0 ? svg`<circle cx="85" cy="50" r="2.5" fill="${gasDetected ? '#ff8800' : '#03f704'}" filter="url(#gasLedFilter)" />` : ''}

          <!-- LED labels -->
          <text fill="#ffffff" font-family="sans-serif" font-size="3px">
            <tspan x="80.213432" y="4.7265162">PWR LED</tspan>
            <tspan x="80.463821" y="55.852409">D0 LED</tspan>
          </text>

          <!-- Live readout -->
          <text font-family="monospace" font-size="3.5px" font-weight="bold" text-anchor="middle">
            <tspan x="47.7" y="26" fill="${gasDetected ? '#f97316' : '#64748b'}">${gasDetected ? 'GAS!' : 'CLEAN'} ${concentration}%</tspan>
            <tspan x="47.7" y="31" fill="#bef264">${voltage.toFixed(2)}V / ${adcRaw}</tspan>
          </text>
        </svg>
      </div>
    `;
  }
}

safeDefine('leap-gas-sensor', GasSensorElement);
