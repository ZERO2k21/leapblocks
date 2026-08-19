/**
 * PIR Motion Sensor (HC-SR501 style)
 * 3-pin: VCC · OUT · GND
 *
 * Simulation properties:
 *   motionDetected — when true, OUT pin is HIGH (motion active)
 *                    shown as a green glow on the dome + status badge
 */
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ElementPin, GND, VCC } from './pin';

// SVG viewBox: 0 0 90.7 92.4  (px units, used as-is)
// Rendered at 24mm × 24.448mm via SVG width/height attributes

@customElement('leap-pir-motion-sensor')
export class PIRMotionSensorElement extends LitElement {

  /** When true the OUT pin is HIGH — motion detected. */
  @property({ type: Boolean }) motionDetected = false;

  readonly pinInfo: ElementPin[] = [
    { name: 'VCC', x: 36.178,  y: 92, number: 1, signals: [VCC()] },
    { name: 'OUT', x: 45.9175, y: 92, number: 2, signals: [] },
    { name: 'GND', x: 55.6415, y: 92, number: 3, signals: [GND()] },
  ];

  static get styles() {
    return css`
      :host { display: inline-block; position: relative; }

      .pir-wrap {
        position: relative;
        display: inline-block;
        line-height: 0;
      }

      /* Motion-active glow on the dome */
      .dome-glow {
        position: absolute;
        /* dome centre in SVG coords: cx=46.7 cy=33.8 r=31
           SVG renders at 24mm wide → scale ≈ 24/90.7 = 0.2645
           centre px ≈ 46.7*0.2645 = 12.35mm, 33.8*0.2645 = 8.94mm */
        left: 50%;
        top: 37%;
        transform: translate(-50%, -50%);
        width: 60%;
        height: 60%;
        border-radius: 50%;
        pointer-events: none;
        transition: opacity 0.25s ease, box-shadow 0.25s ease;
        opacity: 0;
      }

      :host([motiondetected]) .dome-glow,
      .dome-glow.active {
        opacity: 1;
        box-shadow:
          0 0 8px 4px rgba(74, 222, 128, 0.55),
          0 0 20px 8px rgba(74, 222, 128, 0.25);
      }

      /* Status badge */
      .status-badge {
        position: absolute;
        bottom: 28%;
        left: 50%;
        transform: translateX(-50%);
        font-size: 5px;
        font-family: monospace;
        font-weight: 800;
        letter-spacing: 0.04em;
        padding: 1px 3px;
        border-radius: 3px;
        pointer-events: none;
        transition: opacity 0.2s;
        white-space: nowrap;
      }

      .status-badge.motion {
        background: rgba(74, 222, 128, 0.9);
        color: #0f172a;
        opacity: 1;
      }

      .status-badge.idle {
        background: rgba(100, 116, 139, 0.6);
        color: #cbd5e1;
        opacity: 0.7;
      }
    `;
  }

  render() {
    const active = this.motionDetected;
    return html`
      <div class="pir-wrap">
        <svg
          width="24mm"
          height="24.448mm"
          version="1.1"
          viewBox="0 0 90.7 92.4"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- Pins -->
          <g fill="#c6bf95">
            <path d="m54.2 91c0 0.383 0.151 0.749 0.422 1.02 0.27 0.27 0.636 0.422 1.02 0.422h1e-3c0.382 0 0.748-0.152 1.02-0.422s0.422-0.636 0.422-1.02v-26.1c0-0.234-0.189-0.423-0.423-0.423h-2.04c-0.234 0-0.423 0.189-0.423 0.423v26.1z" />
            <path d="m44.5 91c0 0.383 0.151 0.749 0.422 1.02 0.27 0.27 0.636 0.422 1.02 0.422h1e-3c0.382 0 0.748-0.152 1.02-0.422s0.422-0.636 0.422-1.02v-26.1c0-0.234-0.189-0.423-0.423-0.423h-2.04c-0.234 0-0.423 0.189-0.423 0.423v26.1z" />
            <path d="m34.7 91c0 0.383 0.152 0.749 0.422 1.02s0.637 0.422 1.02 0.422 0.749-0.152 1.02-0.422 0.422-0.636 0.422-1.02v-26.1c0-0.234-0.19-0.423-0.424-0.423h-2.03c-0.234 0-0.424 0.189-0.424 0.423v26.1z" />
          </g>

          <!-- PCB body -->
          <path
            d="m90.7 0h-90.7v74.3h90.7zm-5.38 32.1c2.09 0 3.78 1.7 3.78 3.78s-1.7 3.78-3.78 3.78c-2.09 0-3.78-1.7-3.78-3.78s1.7-3.78 3.78-3.78zm-77.1 0c2.09 0 3.78 1.7 3.78 3.78s-1.7 3.78-3.78 3.78c-2.09 0-3.78-1.7-3.78-3.78s1.7-3.78 3.78-3.78z"
            fill="#253674"
          />

          <!-- PCB surface -->
          <rect x="14.3" y="1.28" width="65.5" height="65.5" fill="#dde5e3" />
          <rect x="17.1" y="4.14" width="59.8" height="59.8" fill="#d1dfe1" />

          <!-- Dome base -->
          <circle cx="46.7" cy="33.8" r="31" fill="${active ? '#3d6b4a' : '#d3d5d6'}" />
          <circle cx="46.7" cy="33.8" r="28.2" fill="${active ? '#4ade80' : '#d9e1e1'}" opacity="${active ? '0.35' : '1'}" />

          <!-- Dome fresnel pattern -->
          <clipPath id="pir-clip">
            <circle cx="52.5" cy="39.2" r="28.2" />
          </clipPath>
          <g transform="translate(-5.81 -5.45)" clip-path="url(#pir-clip)" fill="${active ? '#86efac' : '#fbfcfb'}">
            <path d="m52.8 13.7c11.2 2.94 21.3 18.3 21.8 30.5 0 0 6.16-8.84-2.25-20.6-7.05-9.89-19.5-9.87-19.5-9.87z" />
            <path d="m52.2 64.8c-7.37 0.013-19.8-6.53-22.1-14 0 0-0.102 4.33 6.99 10.2 5.95 4.94 15.1 3.75 15.1 3.75z" />
            <g fill="none" stroke="${active ? '#4ade80' : '#d2d8d8'}" stroke-width=".4px">
              <path d="m32.9 18-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m32.9 27.4-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m32.9 36.9-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m32.9 46.3-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m32.9 55.7-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m32.9 65.1-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m41.1 13.3-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m41.1 22.7-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m41.1 32.1-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m41.1 41.6-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m41.1 51-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m41.1 60.4-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m49.3 18-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m49.3 27.4-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m49.3 36.9-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m49.3 46.3-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m49.3 55.7-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m49.3 65.1-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m57.4 13.3-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m57.4 22.7-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m57.4 32.1-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m57.4 41.6-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m57.4 51-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m57.4 60.4-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m65.6 18-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m65.6 27.4-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m65.6 36.9-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m65.6 46.3-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m65.6 55.7-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m65.6 65.1-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m73.8 13.3-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m73.8 22.7-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m73.8 32.1-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m73.8 41.6-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m73.8 51-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m73.8 60.4-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m81.9 18-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m81.9 27.4-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m81.9 36.9-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m81.9 46.3-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m81.9 55.7-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m81.9 65.1-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m90.1 13.3-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m90.1 22.7-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m90.1 32.1-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m90.1 41.6-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m90.1 51-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
              <path d="m90.1 60.4-2.72 4.71h-5.44l-2.72-4.71 2.72-4.71h5.44z" />
            </g>
          </g>

          <!-- Pin labels -->
          <text fill="#ffffff" font-family="sans-serif">
            <tspan x="33.293" y="73.864" font-size="9.88px">+</tspan>
            <tspan x="43.531" y="72.609" font-size="6.38px">D</tspan>
          </text>
          <path d="m57.9 70.8h-4.67v-0.81h4.67z" fill="#fff" />
        </svg>

        <!-- Dome glow overlay (CSS-driven) -->
        <div class="dome-glow ${active ? 'active' : ''}"></div>

        <!-- Motion status badge -->
        <div class="status-badge ${active ? 'motion' : 'idle'}">
          ${active ? 'MOTION' : 'IDLE'}
        </div>
      </div>
    `;
  }
}
