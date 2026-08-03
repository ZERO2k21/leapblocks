/**
 * IR Obstacle Avoidance Sensor Module (Robocraze / FC-51 style)
 * 3-pin: VCC · OUT · GND
 *
 * Output signal logic:
 *   Active LOW: OUT pin goes LOW (0V) when obstacle detected, HIGH (5V/3.3V) when path clear.
 */
import { css, html, LitElement, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ElementPin, GND, VCC } from './pin';

@customElement('leap-ir-obstacle-sensor')
export class IRObstacleSensorElement extends LitElement {

  /** When true, obstacle is detected in front of IR sensors (OUT = LOW) */
  @property({ type: Boolean }) obstacleDetected = false;

  /** Power LED status */
  @property({ type: Boolean }) ledPower = false;

  /** Output Signal LED status */
  @property({ type: Boolean }) ledSignal = false;

  readonly pinInfo: ElementPin[] = [
    { name: 'VCC', x: 194, y: 15.5, number: 1, signals: [VCC()] },
    { name: 'OUT', x: 194, y: 31.0, number: 2, signals: [] },
    { name: 'GND', x: 194, y: 46.5, number: 3, signals: [GND()] },
  ];

  static get styles() {
    return css`
      :host { display: inline-block; position: relative; }

      .wrap {
        position: relative;
        display: inline-block;
        line-height: 0;
      }

      /* Glow effect when obstacle is detected */
      .obstacle-glow {
        position: absolute;
        left: 8%;
        top: 50%;
        transform: translateY(-50%);
        width: 30px;
        height: 40px;
        border-radius: 50%;
        pointer-events: none;
        transition: opacity 0.25s ease, box-shadow 0.25s ease;
        opacity: 0;
      }

      :host([obstacledetected]) .obstacle-glow,
      .obstacle-glow.active {
        opacity: 1;
        box-shadow:
          0 0 12px 6px rgba(239, 68, 68, 0.6),
          0 0 24px 12px rgba(239, 68, 68, 0.3);
      }
    `;
  }

  render() {
    const active = this.obstacleDetected;
    const showPower = this.ledPower;
    const showSignal = this.ledSignal || active;

    return html`
      <div class="wrap">
        <svg
          width="50mm"
          height="16mm"
          version="1.1"
          viewBox="0 0 200 62"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- PCB Body (Dark Blue) -->
          <rect x="25" y="2" width="150" height="58" rx="4" fill="#1e3a8a" stroke="#172554" stroke-width="1.5" />
          
          <!-- Mounting Hole -->
          <circle cx="145" cy="31" r="6" fill="#0f172a" stroke="#94a3b8" stroke-width="1.2" />

          <!-- Transmitting IR LED (Clear transparent) -->
          <g>
            <path d="M 5,20 L 25,20 L 25,28 L 5,28 Z" fill="#e2e8f0" opacity="0.85" stroke="#94a3b8" stroke-width="0.8" />
            <circle cx="9" cy="24" r="5" fill="#f8fafc" opacity="0.9" />
            ${active ? svg`
              <circle cx="9" cy="24" r="8" fill="rgba(56, 189, 248, 0.4)">
                <animate attributeName="r" values="6;10;6" dur="0.8s" repeatCount="indefinite"/>
              </circle>
            ` : ''}
          </g>

          <!-- Receiving Photodiode IR LED (Black) -->
          <g>
            <path d="M 5,34 L 25,34 L 25,42 L 5,42 Z" fill="#0f172a" stroke="#334155" stroke-width="0.8" />
            <circle cx="9" cy="38" r="5" fill="#020617" />
            ${active ? svg`
              <circle cx="9" cy="38" r="8" fill="rgba(239, 68, 68, 0.5)">
                <animate attributeName="r" values="6;10;6" dur="0.8s" repeatCount="indefinite"/>
              </circle>
            ` : ''}
          </g>

          <!-- LM393 IC (Black SOIC-8) -->
          <rect x="90" y="23" width="24" height="16" rx="1" fill="#0f172a" stroke="#334155" stroke-width="0.5" />
          <circle cx="93" cy="26" r="1" fill="#64748b" />
          <text x="102" y="33" fill="#94a3b8" font-size="5" font-family="sans-serif" text-anchor="middle">LM393</text>

          <!-- Sensitivity Potentiometer (Blue Box with Silver Screw) -->
          <rect x="52" y="19" width="22" height="24" rx="2" fill="#2563eb" stroke="#1d4ed8" stroke-width="1" />
          <circle cx="63" cy="31" r="7" fill="#cbd5e1" stroke="#64748b" stroke-width="0.8" />
          <line x1="58" y1="31" x2="68" y2="31" stroke="#334155" stroke-width="1.5" />
          <line x1="63" y1="26" x2="63" y2="36" stroke="#334155" stroke-width="1.5" />

          <!-- Power LED (Power indicator) -->
          <circle cx="122" cy="18" r="3" fill="${showPower ? '#ef4444' : '#450a0a'}" />
          ${showPower ? svg`<circle cx="122" cy="18" r="5" fill="rgba(239, 68, 68, 0.4)" />` : ''}
          <text x="122" y="11" fill="#cbd5e1" font-size="4" font-family="sans-serif" text-anchor="middle">PWR</text>

          <!-- Signal LED (Obstacle indicator) -->
          <circle cx="122" cy="44" r="3" fill="${showSignal ? '#22c55e' : '#052e16'}" />
          ${showSignal ? svg`<circle cx="122" cy="44" r="5" fill="rgba(34, 197, 94, 0.4)" />` : ''}
          <text x="122" y="54" fill="#cbd5e1" font-size="4" font-family="sans-serif" text-anchor="middle">OUT</text>

          <!-- Pin Headers (3 pins: VCC, OUT, GND) -->
          <g fill="#c6bf95" stroke="#854d0e" stroke-width="0.5">
            <!-- VCC Pin -->
            <rect x="175" y="11" width="22" height="9" rx="1" />
            <!-- OUT Pin -->
            <rect x="175" y="26.5" width="22" height="9" rx="1" />
            <!-- GND Pin -->
            <rect x="175" y="42" width="22" height="9" rx="1" />
          </g>

          <!-- Pin Labels on PCB -->
          <text fill="#ffffff" font-family="monospace" font-size="6" font-weight="bold">
            <tspan x="168" y="17.5">VCC</tspan>
            <tspan x="168" y="33">OUT</tspan>
            <tspan x="168" y="48.5">GND</tspan>
          </text>
        </svg>

        <!-- Obstacle glow overlay -->
        <div class="obstacle-glow ${active ? 'active' : ''}"></div>
      </div>
    `;
  }
}
