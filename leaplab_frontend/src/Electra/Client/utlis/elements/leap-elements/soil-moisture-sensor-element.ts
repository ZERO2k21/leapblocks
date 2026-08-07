/**
 * Soil Moisture Sensor Module
 * 4-pin: VCC · GND · DO (digital) · AO (analog)
 *
 * Simulation properties:
 *   value     — moisture level (0 … 100, 0 = dry, 100 = wet)
 *   threshold — DO goes LOW when moisture > threshold (0 … 100, default 50)
 *   ledPower  — power LED on (always true when VCC connected)
 *   ledDO     — DO LED on when DO is LOW (moisture detected)
 *
 * Voltage mapping:
 *   V_ao = VCC × moistureLevel / 100
 *   wet = low resistance = high voltage
 */
import { css, html, LitElement, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ElementPin } from '.';
import { analog, GND, VCC } from './pin';

@customElement('leap-soil-moisture-sensor')
export class SoilMoistureSensorElement extends LitElement {
  /** Simulated moisture level (0 = dry, 100 = wet) */
  @property({ type: Number }) value = 0;

  /** DO threshold: DO pin goes LOW when moisture > threshold */
  @property({ type: Number }) threshold = 50;

  /** Power LED state */
  @property({ type: Boolean }) ledPower = false;

  /** DO LED state (mirrors DO pin — ON when moisture detected) */
  @property({ type: Boolean }) ledDO = false;

  readonly pinInfo: ElementPin[] = [
    { name: 'VCC', x: 172, y: 16,   signals: [VCC()] },
    { name: 'GND', x: 172, y: 26,   signals: [GND()] },
    { name: 'DO',  x: 172, y: 35.8, signals: [] },
    { name: 'AO',  x: 172, y: 45.5, signals: [analog(0)] },
  ];

  static get styles() {
    return css`
      :host { display: inline-block; }
      .wrap { position: relative; display: inline-block; line-height: 0; }
    `;
  }

  render() {
    const moisture  = Number(this.value) || 0;
    const threshold = Number(this.threshold) || 50;
    const doLow     = moisture > threshold;     // DO is active-LOW
    const voltage   = 5.0 * moisture / 100;
    const adcRaw    = Math.round((voltage / 5.0) * 1023);

    const showPower = this.ledPower;
    const showDO    = this.ledDO || doLow;

    // Moisture visual: brown-to-green gradient based on moisture
    const dryR = 139, dryG = 90, dryB = 43;    // brown
    const wetR = 34,  wetG = 139, wetB = 34;   // green
    const t = moisture / 100;
    const probeR = Math.round(dryR + (wetR - dryR) * t);
    const probeG = Math.round(dryG + (wetG - dryG) * t);
    const probeB = Math.round(dryB + (wetB - dryB) * t);
    const probeFill = `rgb(${probeR}, ${probeG}, ${probeB})`;

    return html`
      <div class="wrap">
        <svg
          width="45.95mm"
          height="16.267mm"
          version="1.1"
          viewBox="0 0 174 61.5"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <!-- Board -->
          <path
            d="m153 0h-136v61.5h136zm-129 52c1.9 0 3.44 1.5 3.44 3.34s-1.54 3.34-3.44 3.34-3.44-1.5-3.44-3.34 1.54-3.34 3.44-3.34zm98.3-29.8c4.17 0 7.55 3.38 7.55 7.55 0 4.17-3.38 7.55-7.55 7.55s-7.55-3.38-7.55-7.55c0-4.17 3.38-7.55 7.55-7.55zm-98.3-19.4c1.9 0 3.44 1.5 3.44 3.34 0 1.84-1.54 3.34-3.44 3.34s-3.44-1.5-3.44-3.34c0-1.84 1.54-3.34 3.44-3.34z"
            fill="#1c2546"
          />

          <!-- Fork probe area -->
          <rect x="8" y="15" width="44" height="35" rx="2" fill="#2a2a2a" stroke="#555" stroke-width="0.5" />

          <!-- Fork prongs (two parallel probes) -->
          <rect x="14" y="18" width="3" height="28" rx="1" fill="${probeFill}" stroke="#8b7355" stroke-width="0.5" />
          <rect x="42" y="18" width="3" height="28" rx="1" fill="${probeFill}" stroke="#8b7355" stroke-width="0.5" />

          <!-- Connecting traces on probe -->
          <line x1="15.5" y1="18" x2="43.5" y2="18" stroke="#b8860b" stroke-width="1.5" />

          <!-- Moisture droplets (visible when wet) -->
          ${moisture > 10 ? svg`
            <circle cx="20" cy="25" r="1.2" fill="#4fc3f7" opacity="${Math.min(1, moisture / 30)}" />
            <circle cx="30" cy="22" r="1.0" fill="#4fc3f7" opacity="${Math.min(1, moisture / 40)}" />
            <circle cx="38" cy="28" r="0.9" fill="#4fc3f7" opacity="${Math.min(1, moisture / 50)}" />
            <circle cx="25" cy="35" r="1.1" fill="#4fc3f7" opacity="${Math.min(1, moisture / 35)}" />
          ` : ''}

          <!-- Comparator chip -->
          <g fill="#dae3eb">
            <path d="m72.7 34.6h-9.67c-0.407 0-0.796 0.162-1.08 0.449-0.287 0.287-0.448 0.677-0.448 1.08v1e-3c0 0.406 0.161 0.796 0.448 1.08 0.288 0.287 0.677 0.448 1.08 0.448h9.67z" />
            <path d="m72.7 40.4h-9.67c-0.407 0-0.796 0.162-1.08 0.449-0.287 0.287-0.448 0.677-0.448 1.08v1e-3c0 0.406 0.161 0.796 0.448 1.08 0.288 0.287 0.677 0.448 1.08 0.448h9.67z" />
            <path d="m72.7 46.2h-9.67c-0.407 0-0.796 0.162-1.08 0.449-0.287 0.287-0.448 0.677-0.448 1.08v1e-3c0 0.406 0.161 0.796 0.448 1.08 0.288 0.288 0.677 0.449 1.08 0.449h9.67z" />
            <path d="m72.7 52h-9.67c-0.407 0-0.796 0.162-1.08 0.449-0.287 0.287-0.448 0.677-0.448 1.08v1e-3c0 0.406 0.161 0.796 0.448 1.08 0.288 0.288 0.677 0.449 1.08 0.449h9.67z" />
            <path d="m84.4 55.1h9.67c0.406 0 0.796-0.161 1.08-0.449 0.288-0.287 0.449-0.677 0.449-1.08v-1e-3c0-0.406-0.161-0.796-0.449-1.08-0.287-0.287-0.677-0.449-1.08-0.449h-9.67z" />
            <path d="m84.4 49.3h9.67c0.406 0 0.796-0.161 1.08-0.449 0.288-0.287 0.449-0.677 0.449-1.08v-1e-3c0-0.406-0.161-0.796-0.449-1.08-0.287-0.287-0.677-0.449-1.08-0.449h-9.67z" />
            <path d="m84.4 43.5h9.67c0.406 0 0.796-0.161 1.08-0.448 0.288-0.288 0.449-0.678 0.449-1.08v-1e-3c0-0.406-0.161-0.796-0.449-1.08-0.287-0.287-0.677-0.449-1.08-0.449h-9.67z" />
            <path d="m84.4 37.7h9.67c0.406 0 0.796-0.161 1.08-0.448 0.288-0.288 0.449-0.678 0.449-1.08v-1e-3c0-0.406-0.161-0.796-0.449-1.08-0.287-0.287-0.677-0.449-1.08-0.449h-9.67z" />
          </g>
          <rect x="70.3" y="33.2" width="16.1" height="23.3" fill="#29261c" />

          <!-- Threshold potentiometer -->
          <circle cx="78.9" cy="16" r="6.56" fill="#bcc2d5" />
          <path d="m78.9 6.72v18.6" fill="none" stroke="#3f3c40" stroke-width="2.5px" />
          <path d="m88.2 16h-18.6" fill="none" stroke="#3f3c40" stroke-width="2.5px" />

          <!-- Resistors -->
          <g fill="#dae3eb">
            <rect x="37.7" y="8.69" width="16.7" height="5.52" />
            <rect x="37.7" y="22" width="16.7" height="5.52" />
            <rect x="37.7" y="34.5" width="16.7" height="5.52" />
          </g>
          <rect x="41.9" y="34.3" width="8.43" height="5.9" fill="#29261c" />

          <!-- LEDs -->
          <rect x="118" y="4.77" width="13" height="4.29" fill="#dae3eb" />
          <rect x="121" y="4.62" width="6.55" height="4.59" fill="#fffefe" />
          <filter id="soilLedFilter" x="-0.8" y="-0.8" height="5.2" width="5.8">
            <feGaussianBlur stdDeviation="2" />
          </filter>
          ${showPower ? svg`<circle cx="124.5" cy="7" r="4" fill="green" filter="url(#soilLedFilter)" />` : ''}

          <rect x="118" y="52.6" width="13" height="4.29" fill="#dae3eb" />
          <rect x="121" y="52.5" width="6.55" height="4.59" fill="#fffefe" />
          ${showDO ? svg`<circle cx="124.5" cy="55" r="4" fill="red" filter="url(#soilLedFilter)" />` : ''}

          <!-- Text labels -->
          <text fill="#fffefe" font-size="4.4px" font-family="sans-serif">
            <tspan x="117.46" y="13.90">PWR</tspan>
            <tspan x="117.46" y="18.41">LED</tspan>
            <tspan x="133.16" y="17.37">VCC</tspan>
            <tspan x="133.16" y="26.87">GND</tspan>
            <tspan x="135.42" y="36.55">DO</tspan>
            <tspan x="135.42" y="46.359">AO</tspan>
            <tspan x="117.44" y="45.53">DO</tspan>
            <tspan x="117.44" y="50.036">LED</tspan>
          </text>

          <!-- Live readout -->
          <text font-family="monospace" font-size="3.8px" font-weight="bold" text-anchor="middle">
            <tspan x="28" y="52" fill="#4caf50">${moisture}% SOIL</tspan>
            <tspan x="78" y="57" fill="#bef264">${voltage.toFixed(2)}V / ${adcRaw}</tspan>
          </text>

          <!-- Board pins -->
          <path d="m143 11.7v38h8.39v-38z" fill="none" stroke="#fff" stroke-linejoin="round" stroke-width=".4px" />
          <g fill="#433b38">
            <path d="m144 42.1v6.55h6.55v-6.55z" />
            <path d="m144 32.3v6.55h6.55v-6.55z" />
            <path d="m144 22.6v6.55h6.55v-6.55z" />
            <path d="m144 12.9v6.55h6.55v-6.55z" />
          </g>
          <g fill="#9f9f9f">
            <path d="m147 43.9c-0.382 0-0.748 0.152-1.02 0.422-0.27 0.27-0.421 0.636-0.421 1.02v1e-3c0 0.382 0.151 0.748 0.421 1.02 0.271 0.271 0.637 0.422 1.02 0.422h26.1c0.233 0 0.423-0.189 0.423-0.423v-2.04c0-0.234-0.19-0.423-0.423-0.423h-26.1z" />
            <path d="m147 34.2c-0.382 0-0.748 0.152-1.02 0.422-0.27 0.27-0.421 0.636-0.421 1.02v1e-3c0 0.382 0.151 0.748 0.421 1.02 0.271 0.271 0.637 0.422 1.02 0.422h26.1c0.233 0 0.423-0.189 0.423-0.423v-2.04c0-0.234-0.19-0.423-0.423-0.423h-26.1z" />
            <path d="m147 24.4c-0.382 0-0.748 0.151-1.02 0.422-0.27 0.27-0.421 0.636-0.421 1.02v1e-3c0 0.382 0.151 0.748 0.421 1.02 0.271 0.27 0.637 0.422 1.02 0.422h26.1c0.233 0 0.423-0.19 0.423-0.423v-2.04c0-0.234-0.19-0.423-0.423-0.423h-26.1z" />
            <path d="m147 14.7c-0.382 0-0.748 0.152-1.02 0.422-0.27 0.27-0.421 0.637-0.421 1.02s0.151 0.749 0.421 1.02c0.271 0.27 0.637 0.422 1.02 0.422h26.1c0.233 0 0.423-0.19 0.423-0.424v-2.03c0-0.234-0.19-0.424-0.423-0.424h-26.1z" />
          </g>
        </svg>
      </div>
    `;
  }
}
