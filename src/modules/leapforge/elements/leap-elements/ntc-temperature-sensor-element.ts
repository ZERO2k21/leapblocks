/**
 * NTC Thermistor Temperature Sensor (103 / 10kΩ NTC)
 * 3-pin: GND · VCC · OUT (analog voltage)
 *
 * Simulation:
 *   value — temperature in °C (-40 … +125)
 *           The OUT pin voltage is computed from the NTC voltage-divider formula:
 *           V_out = VCC × R_NTC / (R_series + R_NTC)
 *           where R_NTC = R0 × exp(B × (1/T - 1/T0))
 *           R0=10kΩ, B=3950, T0=298.15K, R_series=10kΩ, VCC=5V
 */
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { analog, ElementPin, GND, VCC } from './pin';

@customElement('leap-ntc-temperature-sensor')
export class NTCTemperatureSensorElement extends LitElement {
  /** Simulated temperature in °C */
  @property({ type: Number }) value = 25;

  readonly pinInfo: ElementPin[] = [
    { name: 'GND', y: 26.2, x: 135, number: 1, signals: [GND()] },
    { name: 'VCC', y: 35.8, x: 135, number: 2, signals: [VCC()] },
    { name: 'OUT', y: 45.5, x: 135, number: 3, signals: [analog(0)] },
  ];

  static get styles() {
    return css`
      :host { display: inline-block; position: relative; }
      .wrap { position: relative; display: inline-block; line-height: 0; }

      /* Temperature badge */
      .temp-badge {
        position: absolute;
        top: 50%;
        left: 38%;
        transform: translate(-50%, -50%);
        font-size: 7px;
        font-family: monospace;
        font-weight: 800;
        color: #fff;
        background: rgba(0,0,0,0.55);
        border-radius: 3px;
        padding: 2px 4px;
        pointer-events: none;
        white-space: nowrap;
        letter-spacing: 0.03em;
      }
    `;
  }

  /** Compute the NTC output voltage for a given temperature (°C). */
  private _tempToVoltage(tempC: number): number {
    const t = isFinite(tempC) ? tempC : 25;
    const R0 = 10000;
    const B  = 3950;
    const T0 = 298.15;
    const Rs = 10000;
    const VCC = 5.0;
    const T = t + 273.15;
    const R_ntc = R0 * Math.exp(B * (1 / T - 1 / T0));
    return VCC * R_ntc / (Rs + R_ntc);
  }

  /** Colour-code the thermistor body based on temperature */
  private _bodyColor(tempC: number): string {
    const t = isFinite(tempC) ? tempC : 25;
    if (t < 0)   return '#6ee7f7';
    if (t < 40)  return '#151312';
    if (t < 80)  return '#f97316';
    return '#ef4444';
  }

  render() {
    const temp = Number(this.value) || 25;  // coerce — PartPicker passes value=true (boolean)
    const voltage = this._tempToVoltage(temp);
    const bodyColor = this._bodyColor(temp);
    const tempLabel = `${temp >= 0 ? '+' : ''}${temp.toFixed(1)}°C`;
    const vLabel = `${voltage.toFixed(2)}V`;

    return html`
      <div class="wrap">
        <svg
          width="35.826mm"
          height="19mm"
          version="1.1"
          viewBox="0 0 135.4 71.782"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <clipPath id="ntc-clip">
              <path d="m15.336 49.725c-0.945 0.682-2.127 1.088-3.411 1.088-3.104 0-5.612-2.374-5.612-5.281s2.508-5.281 5.612-5.281c1.038 0 2.009 0.266 2.842 0.728 2.108 0.79 3.314 1.004 5.699 0.917 0 0-2.134 1.335-1.968 2.97 0.149 1.458 3.053 2.494 3.053 2.494-2.438 0.388-4.177 1.403-6.215 2.365z" />
            </clipPath>
          </defs>

          <!-- Board -->
          <path
            d="m115.3 0h-90.421v71.782h90.421zm-66.145 56.313c3.27 0 5.925 2.608 5.925 5.878s-2.655 5.924-5.925 5.924-5.925-2.654-5.925-5.924 2.655-5.878 5.925-5.878zm16.013-7.96c3.27 0 5.925 2.654 5.925 5.924s-2.655 5.925-5.925 5.925-5.924-2.655-5.924-5.925 2.654-5.924 5.924-5.924zm-33.698 1.324c2.29 0 4.149 1.859 4.149 4.148 0 2.29-1.859 4.149-4.149 4.149-2.289 0-4.148-1.859-4.148-4.149 0-2.289 1.859-4.148 4.148-4.148zm59.914 0.635c2.041 0 3.698 1.657 3.698 3.698s-1.657 3.698-3.698 3.698-3.698-1.657-3.698-3.698 1.657-3.698 3.698-3.698zm-11.4-8.143c2.041 0 3.698 1.657 3.698 3.698s-1.657 3.698-3.698 3.698-3.698-1.657-3.698-3.698 1.657-3.698 3.698-3.698zm-14.816-1.811c2.041 0 3.698 1.657 3.698 3.698s-1.657 3.698-3.698 3.698-3.698-1.657-3.698-3.698 1.657-3.698 3.698-3.698zm0-15.974c2.041 0 3.698 1.657 3.698 3.698s-1.657 3.698-3.698 3.698-3.698-1.657-3.698-3.698 1.657-3.698 3.698-3.698zm14.816-3.203c2.041 0 3.698 1.657 3.698 3.698s-1.657 3.698-3.698 3.698-3.698-1.657-3.698-3.698 1.657-3.698 3.698-3.698zm-14.816-9.601c3.27 0 5.925 2.654 5.925 5.924s-2.655 5.925-5.925 5.925-5.924-2.655-5.924-5.925 2.654-5.924 5.924-5.924zm-33.698 2.228c2.29 0 4.149 1.859 4.149 4.148 0 2.29-1.859 4.149-4.149 4.149-2.289 0-4.148-1.859-4.148-4.149 0-2.289 1.859-4.148 4.148-4.148zm59.914 0.288c2.041 0 3.698 1.657 3.698 3.698s-1.657 3.698-3.698 3.698-3.698-1.657-3.698-3.698 1.657-3.698 3.698-3.698zm-48.154-5.701c0-1.635 2.963-4.729 5.925-4.729s5.925 3.094 5.925 4.729c0 3.27-2.655 7.121-5.925 7.121s-5.925-3.851-5.925-7.121z"
            fill="#0f3661"
          />

          <!-- Chip outline -->
          <path d="m104.45 21.602v28.578h8.389v-28.578z" fill="none" stroke="#fff" stroke-width=".9px" />

          <!-- Chip body (temperature-reactive colour) -->
          <g fill="${bodyColor}">
            <path d="m105.37 42.328v6.554h6.554v-6.554z" />
            <path d="m105.37 32.604v6.554h6.554v-6.554z" />
            <path d="m105.37 22.865v6.554h6.554v-6.554z" />
          </g>

          <!-- Pins (silver leads) -->
          <g fill="#9f9f9f">
            <path d="m108.85 44.165c-0.382 0-0.749 0.151-1.019 0.422-0.27 0.27-0.422 0.636-0.422 1.018v1e-3c0 0.382 0.152 0.748 0.422 1.018s0.637 0.422 1.019 0.422h26.131c0.234 0 0.424-0.189 0.424-0.423v-2.035c0-0.234-0.19-0.423-0.424-0.423h-26.131z" />
            <path d="m108.85 34.441c-0.382 0-0.749 0.151-1.019 0.422-0.27 0.27-0.422 0.636-0.422 1.018v1e-3c0 0.382 0.152 0.748 0.422 1.018s0.637 0.422 1.019 0.422h26.131c0.234 0 0.424-0.189 0.424-0.423v-2.035c0-0.234-0.19-0.423-0.424-0.423h-26.131z" />
            <path d="m108.85 24.701c-0.382 0-0.749 0.152-1.019 0.422-0.27 0.271-0.422 0.637-0.422 1.019s0.152 0.749 0.422 1.019 0.637 0.422 1.019 0.422h26.131c0.234 0 0.424-0.19 0.424-0.423v-2.035c0-0.234-0.19-0.424-0.424-0.424h-26.131z" />
          </g>

          <!-- Capacitor -->
          <path d="m96.494 43.126v-14.495h-4.787v14.495z" fill="#bbb9b9" />
          <path d="m96.661 39.537v-7.317h-5.121v7.317z" fill="#29261c" />

          <!-- Mounting holes -->
          <g fill="none" stroke="#bbb9b9" stroke-linejoin="miter">
            <circle cx="31.465" cy="17.956" r="4.149" stroke-width="2.5px" />
            <circle cx="31.465" cy="53.825" r="4.149" stroke-width="2.5px" />
            <circle cx="65.163" cy="54.277" r="5.925" stroke-width=".95px" />
            <circle cx="65.163" cy="17.504" r="5.925" stroke-width=".95px" />
            <circle cx="65.163" cy="28.082" r="3.698" stroke-width="2.23px" />
            <circle cx="65.163" cy="44.056" r="3.698" stroke-width="2.23px" />
            <circle cx="49.15"  cy="62.191" r="5.925" stroke-width=".75px" />
            <circle cx="49.15"  cy="9.591"  r="5.925" stroke-width=".75px" />
          </g>

          <!-- Sensor pads -->
          <ellipse cx="48.82" cy="25.397" rx="6.375" ry="4.839" fill="#bababa" />
          <ellipse cx="48.82" cy="46.384" rx="6.375" ry="4.839" fill="#bbb9b9" />
          <circle  cx="48.82" cy="25.397" r="2.612" fill="#eceee9" />
          <circle  cx="48.82" cy="46.384" r="2.612" fill="#eceee9" />

          <!-- Traces -->
          <path d="m48.82 25.397c-8.828 4.288-19.813 9.008-38 11.393" fill="none" stroke="#d6d8d4" stroke-linejoin="miter" stroke-width=".95px" />
          <path d="m48.82 45.922c-9.482-5.223-20.452-6.013-38-4.789" fill="none" stroke="#d8d8d3" stroke-linejoin="miter" stroke-width=".95px" />

          <!-- NTC bead (temperature-reactive colour) -->
          <path
            d="m9.023 43.72c-0.945 0.682-2.127 1.088-3.411 1.088-3.104 0-5.612-2.374-5.612-5.281s2.508-5.281 5.612-5.281c1.038 0 2.009 0.266 2.842 0.728 2.108 0.79 3.314 1.004 5.699 0.917 0 0-2.134 1.335-1.968 2.97 0.149 1.458 3.053 2.494 3.053 2.494-2.438 0.388-4.177 1.403-6.215 2.365z"
            fill="${bodyColor}"
          />
          <g transform="translate(-6.313,-6.005)" clip-path="url(#ntc-clip)">
            <path
              d="m16.648 41.782c-0.617 0-1.284-0.077-1.895 0-2.276 0.284-4.755 1.806-6.429 3.282-0.732 0.645-1.351 1.332-1.854 2.171-0.172 0.287-0.363 0.562-0.527 0.852-8e-3 0.012-0.215 0.396-0.248 0.362-0.152-0.151-0.044-0.995-0.044-1.151 0-1.394 0.015-2.694 0.341-4.059 0.435-1.827 0.867-4.205 2.407-5.497 0.593-0.497 1.419-0.714 2.138-0.941 0.989-0.311 2.096-0.55 3.145-0.406 1.754 0.241 3.113 2.109 3.428 3.768 0.08 0.421-0.08 0.892-0.08 1.31"
              fill="#615a59"
            />
          </g>

          <!-- Coil circles -->
          <g r="3.698" fill="none" stroke="#bbb9b9" stroke-linejoin="miter" stroke-width="2.23px">
            <circle cx="91.379" cy="17.794" />
            <circle cx="91.379" cy="54.01" />
          </g>

          <!-- Inductor pads -->
          <path d="m79.979 41.028c3.519 0 6.375 2.168 6.375 4.839 0 2.67-2.856 4.839-6.375 4.839-3.518 0-6.375-2.169-6.375-4.839 0-2.671 2.857-4.839 6.375-4.839zm0 1.141c2.041 0 3.698 1.657 3.698 3.698s-1.657 3.698-3.698 3.698-3.698-1.657-3.698-3.698 1.657-3.698 3.698-3.698z" fill="#bbb9b9" />
          <path d="m79.979 20.04c3.519 0 6.375 2.169 6.375 4.839 0 2.671-2.856 4.839-6.375 4.839-3.518 0-6.375-2.168-6.375-4.839 0-2.67 2.857-4.839 6.375-4.839zm0 1.141c2.041 0 3.698 1.657 3.698 3.698s-1.657 3.698-3.698 3.698-3.698-1.657-3.698-3.698 1.657-3.698 3.698-3.698z" fill="#bbb9b9" />

          <!-- Chip outline 2 -->
          <path d="m89.905 44.462v-17.142h8.391v17.142z" fill="none" stroke="#fff" stroke-linejoin="miter" stroke-width=".65px" />

          <!-- Chip label -->
          <text fill="#fffefe" font-family="sans-serif" transform="rotate(-90)">
            <tspan x="-39.297 -37.036 -34.776" y="95.418" font-size="3.735px">103</tspan>
            <tspan x="-61.485" y="111.57" font-size="9.778px">S</tspan>
            <tspan x="-15.512" y="111.573" font-size="15.828px">-</tspan>
          </text>

          <!-- Live temperature + voltage overlay -->
          <text font-family="monospace" font-size="5px" font-weight="bold" text-anchor="middle">
            <tspan x="57" y="38" fill="#f97316">${tempLabel}</tspan>
            <tspan x="57" y="45" fill="#bef264">${vLabel}</tspan>
          </text>
        </svg>
      </div>
    `;
  }
}
