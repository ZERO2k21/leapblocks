/**
 * Heart Rate / Pulse Sensor
 * 3-pin: GND · VCC · OUT (analog pulse signal)
 *
 * Simulation properties:
 *   bpm       — heart rate in beats per minute (20–200, default 72)
 *   beatPhase — 0.0–1.0 position within current beat cycle (driven by CircuitEngine timer)
 *
 * Signal model:
 *   The OUT pin outputs an analog voltage that pulses with each heartbeat.
 *   Peak voltage ≈ 3.3V, baseline ≈ 1.65V (mid-supply).
 *   The pulse shape follows a simplified ECG: sharp rise, quick fall, baseline.
 *   V_out = 1.65 + 1.65 × pulse(beatPhase)
 *
 * The CircuitEngine drives the OUT ADC channel with a time-varying voltage
 * computed from the current beat phase, updated every animation frame.
 */
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { analog, ElementPin, GND, VCC } from './pin';

/** Real PulseSensor.com ADC output model — matches analogRead() values */
function pulseSensorADC(phase: number): number {
  const breathingDrift = 40 * Math.sin(2 * Math.PI * phase * 0.15);
  let beat = 0;
  if (phase < 0.05)       beat = 380 * (phase / 0.05);
  else if (phase < 0.10)  beat = 380 * (1 - (phase - 0.05) / 0.05);
  else if (phase < 0.18)  beat = -80 * Math.sin(Math.PI * (phase - 0.10) / 0.08);
  else if (phase < 0.35)  beat = 60  * Math.sin(Math.PI * (phase - 0.18) / 0.17);
  const noise = 8 * Math.sin(phase * 137.5) + 5 * Math.sin(phase * 251.3);
  return Math.round(512 + breathingDrift + beat + noise);
}

@customElement('leap-heart-beat-sensor')
export class HeartBeatSensorElement extends LitElement {
  /** Heart rate in BPM */
  @property({ type: Number }) bpm = 72;

  /** Current beat phase 0.0–1.0, updated by CircuitEngine */
  @property({ type: Number }) beatPhase = 0;

  /** Live ADC value (0–1023) as read by analogRead() — updated by CircuitEngine */
  @property({ type: Number }) adcValue = 512;

  readonly pinInfo: ElementPin[] = [
    { name: 'GND', y: 17.8, x: 87, number: 1, signals: [GND()] },
    { name: 'VCC', y: 27.5, x: 87, number: 2, signals: [VCC()] },
    { name: 'OUT', y: 37.5, x: 87, number: 3, signals: [analog(0)] },
  ];

  static get styles() {
    return css`
      :host { display: inline-block; }
      .wrap { position: relative; display: inline-block; line-height: 0; }
    `;
  }

  render() {
    const bpm       = Math.max(20, Math.min(200, Number(this.bpm) || 72));
    const phase     = Number(this.beatPhase) || 0;
    const adcNow    = Number(this.adcValue) || pulseSensorADC(phase);
    const voltage   = (adcNow / 1023) * 5.0;

    // ECG waveform: 40 sample points — map ADC 0–1023 to SVG Y coordinates
    const W = 37.4, H = 19.1, X0 = 17.3, Y0 = 11.7;
    const midY = Y0 + H / 2;
    const points = Array.from({ length: 41 }, (_, i) => {
      const t = i / 40;
      // Show 1.5 cycles, offset so current phase is at 75% of the display
      const displayPhase = (t + phase - 0.75 + 2) % 1;
      const adc = pulseSensorADC(displayPhase);
      // Map ADC 0–1023 to Y: 512 = midY, 1023 = top, 0 = bottom
      const y = midY - ((adc - 512) / 511) * (H * 0.45);
      return `${X0 + t * W},${y.toFixed(2)}`;
    }).join(' ');

    // Sensor pad glow — pulses red when ADC is above 650 (beat peak)
    const glowIntensity = Math.max(0, (adcNow - 512) / 511);
    const padColor = `rgb(${Math.round(187 + 68 * glowIntensity)},${Math.round(185 - 60 * glowIntensity)},${Math.round(185 - 60 * glowIntensity)})`;

    return html`
      <div class="wrap">
        <svg
          width="23.4mm"
          height="20.943mm"
          version="1.1"
          viewBox="0 0 88.4 79.2"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- Board -->
          <path
            d="m71.2 0h-71.2v55.6h71.2zm-62.6 41.4c2.65 0 4.79 2.15 4.79 4.79 0 2.64-2.15 4.79-4.79 4.79-2.64 0-4.79-2.15-4.79-4.79 0-2.65 2.15-4.79 4.79-4.79zm0-36.7c2.65 0 4.79 2.15 4.79 4.79 0 2.64-2.15 4.79-4.79 4.79-2.64 0-4.79-2.15-4.79-4.79 0-2.65 2.15-4.79 4.79-4.79z"
            fill="#19365e"
          />

          <!-- Sensor pads — colour-reactive to heartbeat -->
          <circle cx="22.6" cy="46.9" r="3.23" fill="${padColor}" />
          <circle cx="33.4" cy="46.9" r="3.23" fill="${padColor}" />

          <!-- Chip outline -->
          <path d="m57.5 13.5v28.6h8.39v-28.6z" fill="none" stroke="#fff" stroke-width=".9px" />
          <g fill="#29261c">
            <path d="m58.4 34.2v6.55h6.55v-6.55z" />
            <path d="m58.4 24.5v6.55h6.55v-6.55z" />
            <path d="m58.4 14.8v6.56h6.55v-6.56z" />
          </g>

          <!-- Pin leads -->
          <g fill="#9f9f9f">
            <path d="m61.9 36.1c-0.382 0-0.748 0.152-1.02 0.422s-0.422 0.637-0.422 1.02 0.152 0.748 0.422 1.02c0.27 0.27 0.636 0.422 1.02 0.422h26.1c0.234 0 0.423-0.19 0.423-0.424v-2.04c0-0.233-0.189-0.423-0.423-0.423h-26.1z" />
            <path d="m61.9 26.3c-0.382 0-0.748 0.152-1.02 0.422s-0.422 0.637-0.422 1.02 0.152 0.748 0.422 1.02c0.27 0.27 0.636 0.422 1.02 0.422h26.1c0.234 0 0.423-0.19 0.423-0.424v-2.04c0-0.233-0.189-0.423-0.423-0.423h-26.1z" />
            <path d="m61.9 16.6c-0.382 0-0.748 0.152-1.02 0.422s-0.422 0.636-0.422 1.02v1e-3c0 0.382 0.152 0.748 0.422 1.02s0.636 0.422 1.02 0.422h26.1c0.234 0 0.423-0.189 0.423-0.423v-2.04c0-0.234-0.189-0.423-0.423-0.423h-26.1z" />
          </g>

          <!-- Sensor contact circles -->
          <g transform="translate(-6.88 -4.2)" fill="#0e0f0d" stroke="#bbb9b9" stroke-linejoin="miter" stroke-width="1.83px">
            <circle cx="29.8" cy="22.6" r="2.59" />
            <circle cx="29.8" cy="12.2" r="2.59" />
            <circle cx="29.8" cy="41.3" r="2.59" />
            <circle cx="39.9" cy="22.6" r="2.59" />
            <circle cx="39.9" cy="12.2" r="2.59" />
            <circle cx="39.9" cy="41.3" r="2.59" />
          </g>

          <!-- Mounting holes -->
          <circle cx="8.58" cy="9.42" r="4.79" fill="none" stroke="#bbb9b9" stroke-linejoin="miter" stroke-width="1.1px" />
          <circle cx="8.58" cy="46.2" r="4.79" fill="none" stroke="#bbb9b9" stroke-linejoin="miter" stroke-width="1.1px" />

          <!-- Sensor body (white face) -->
          <rect x="17.3" y="11.7" width="21.3" height="3.68" fill="#fdfefe" />
          <path d="m37.4 15.4h-19v19.1c0 5.24 4.24 9.48 9.48 9.48 5.24 0 9.48-4.24 9.48-9.48z" fill="#fdfefe" />
          <path d="m35.4 15.4h-15v18.8c0 1.98 0.789 3.89 2.19 5.29 1.4 1.4 3.31 2.19 5.29 2.19s3.89-0.788 5.29-2.19c1.4-1.4 2.19-3.31 2.19-5.29z" fill="#d5d5d5" />

          <!-- Live ECG waveform on sensor face -->
          <polyline
            points="${points}"
            fill="none"
            stroke="#ef4444"
            stroke-width="0.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <!-- Connector -->
          <path d="m64 9.39h-4.68" fill="none" stroke="#fffefe" stroke-linejoin="miter" stroke-width=".85px" />

          <!-- Finger/probe assembly -->
          <g transform="translate(-6.88 -4.2)">
            <rect x="26.5" y="59.8" width="16.4" height="20.9" fill="#d3d9de" />
            <circle cx="34.8" cy="64.3" r="2.37" fill="#a8b2c8" />
            <path d="m40.7 62.8h-2.75v19.2c0 0.364 0.145 0.713 0.403 0.971 0.257 0.258 0.607 0.402 0.971 0.402h1e-3c0.364 0 0.714-0.144 0.971-0.402 0.258-0.258 0.403-0.607 0.403-0.971v-19.2z" fill="#b9c5de" />
            <rect x="37.9" y="62.8" width="2.75" height="17.9" fill="#a8b2c8" />
            <path d="m32.4 69.5h-2.75v12.5c0 0.364 0.145 0.713 0.402 0.971 0.258 0.258 0.607 0.402 0.972 0.402s0.714-0.144 0.972-0.402c0.257-0.258 0.402-0.607 0.402-0.971v-12.5z" fill="#b9c5de" />
            <g fill="#a8b2c8">
              <rect x="29.6" y="69.5" width="2.75" height="11.2" />
              <path d="m35.5 72.2c0.142 0 0.277-0.056 0.377-0.156 0.101-0.1 0.157-0.236 0.157-0.377v-1.68c0-0.142-0.056-0.277-0.157-0.377-0.1-0.1-0.235-0.157-0.377-0.157h-3.97c-0.364 0-0.714 0.145-0.971 0.403-0.258 0.257-0.403 0.607-0.403 0.971v1e-3c0 0.364 0.145 0.713 0.403 0.971 0.257 0.258 0.607 0.402 0.971 0.402h3.97z" />
              <path d="m38.8 65.5c0.141 0 0.277-0.056 0.377-0.156s0.157-0.236 0.157-0.377v-1.68c0-0.142-0.057-0.277-0.157-0.377-0.1-0.101-0.236-0.157-0.377-0.157h-3.97c-0.364 0-0.714 0.145-0.972 0.403-0.257 0.257-0.402 0.607-0.402 0.971v1e-3c0 0.364 0.145 0.713 0.402 0.971 0.258 0.258 0.608 0.402 0.972 0.402h3.97z" />
            </g>
          </g>

          <!-- Resistors -->
          <g transform="translate(-6.88 -4.2)">
            <rect x="47" y="29.2" width="13.4" height="4.43" fill="#bbb9b9" />
            <rect x="50.3" y="29" width="6.77" height="4.74" fill="#29261c" />
          </g>
          <g transform="translate(-6.88 -4.2)">
            <rect x="47" y="20" width="13.4" height="4.43" fill="#bbb9b9" />
            <rect x="50.3" y="19.9" width="6.77" height="4.74" fill="#29261c" />
          </g>
          <path d="m38.9 23.3h15.9v7.76h-15.9z" fill="none" stroke="#fff" stroke-linejoin="miter" stroke-width=".6px" />
          <path d="m38.9 14.1h15.9v7.76h-15.9z" fill="none" stroke="#fff" stroke-linejoin="miter" stroke-width=".6px" />

          <!-- Leads -->
          <path d="m31.8 15h2.49v-6.79c0-0.33-0.131-0.647-0.365-0.88-0.233-0.234-0.55-0.365-0.88-0.365h-1e-3c-0.33 0-0.647 0.131-0.88 0.365-0.234 0.233-0.365 0.55-0.365 0.88z" fill="#d2d2d2" />
          <path d="m21.7 15h2.49v-6.79c0-0.33-0.131-0.647-0.365-0.88-0.233-0.234-0.55-0.365-0.88-0.365h-1e-3c-0.33 0-0.647 0.131-0.88 0.365-0.234 0.233-0.365 0.55-0.365 0.88z" fill="#d2d2d2" />

          <!-- BPM + ADC readout matching analogRead() output -->
          <text font-family="monospace" font-size="3.5px" font-weight="bold">
            <tspan x="57" y="50" fill="#ef4444" text-anchor="middle">${bpm} BPM</tspan>
            <tspan x="57" y="55" fill="#bef264" text-anchor="middle">ADC: ${adcNow} / ${voltage.toFixed(2)}V</tspan>
          </text>
        </svg>
      </div>
    `;
  }
}
