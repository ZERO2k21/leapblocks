/**
 * EM-18 RFID Reader Module
 * 5-pin: VCC · TX · LED · BUZZER · GND
 *
 * Operating Voltage: 5V DC
 * Operating Frequency: 125 kHz
 * Reading Range: Up to 10 cm
 * Baud Rate: 9600 bps (default)
 *
 * Output signal:
 *   TX pin sends 12-byte ASCII card UID at 9600 baud when card is detected.
 *   Active HIGH: TX pin idles HIGH, sends data when card present.
 */
import { css, html, LitElement, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ElementPin, GND, VCC } from './pin';

@customElement('leap-em18-rfid')
export class Em18RfidElement extends LitElement {

  /** When true, a card is within reading range */
  @property({ type: Boolean }) cardPresent = false;

  /** Card UID string (10 hex chars, e.g. "E24B891F00") */
  @property({ type: String }) cardUid = 'E24B891F00';

  /** Power LED status */
  @property({ type: Boolean }) ledPower = false;

  /** Buzzer active status */
  @property({ type: Boolean }) buzzerActive = false;

  readonly pinInfo: ElementPin[] = [
    { name: 'VCC', x: 15, y: 95, number: 1, signals: [VCC(5)] },
    { name: 'TX', x: 30, y: 95, number: 2, signals: [{ type: 'usart', signal: 'TX', bus: 1 }] },
    { name: 'LED', x: 45, y: 95, number: 3, signals: [] },
    { name: 'BUZZER', x: 60, y: 95, number: 4, signals: [] },
    { name: 'GND', x: 75, y: 95, number: 5, signals: [GND()] },
  ];

  static get styles() {
    return css`
      :host { display: inline-block; position: relative; }

      .wrap {
        position: relative;
        display: inline-block;
        line-height: 0;
      }

      /* Card detection glow effect */
      .card-glow {
        position: absolute;
        left: 50%;
        top: 30%;
        transform: translate(-50%, -50%);
        width: 60px;
        height: 60px;
        border-radius: 50%;
        pointer-events: none;
        transition: opacity 0.3s ease, box-shadow 0.3s ease;
        opacity: 0;
      }

      :host([cardpresent]) .card-glow,
      .card-glow.active {
        opacity: 1;
        box-shadow:
          0 0 15px 8px rgba(34, 197, 94, 0.6),
          0 0 30px 15px rgba(34, 197, 94, 0.3);
      }

      /* Buzzer sound wave animation */
      .buzzer-waves {
        position: absolute;
        right: 15%;
        top: 25%;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      :host([buzzeractive]) .buzzer-waves,
      .buzzer-waves.active {
        opacity: 1;
      }
    `;
  }

  render() {
    const active = this.cardPresent;
    const showPower = this.ledPower;
    const showBuzzer = this.buzzerActive;

    return html`
      <div class="wrap">
        <svg
          width="38mm"
          height="40mm"
          version="1.1"
          viewBox="0 0 100 105"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- PCB Body (Dark Blue/Teal) -->
          <rect x="5" y="5" width="90" height="85" rx="4" fill="#0d4f4f" stroke="#0a3d3d" stroke-width="1.5" />

          <!-- Antenna Coil (125 kHz) -->
          <g>
            <rect x="15" y="15" width="70" height="50" rx="3" fill="none" stroke="#c9a227" stroke-width="2" />
            <rect x="20" y="20" width="60" height="40" rx="2" fill="none" stroke="#c9a227" stroke-width="1.5" />
            <rect x="25" y="25" width="50" height="30" rx="2" fill="none" stroke="#c9a227" stroke-width="1" />
          </g>

          <!-- EM-18 IC Chip -->
          <rect x="30" y="30" width="40" height="20" rx="2" fill="#1a1a1a" stroke="#333" stroke-width="0.8" />
          <text x="50" y="42" fill="#94a3b8" font-size="6" font-family="sans-serif" text-anchor="middle" font-weight="bold">EM-18</text>

          <!-- TX LED (Green when transmitting) -->
          <circle cx="20" cy="72" r="4" fill="${active ? '#22c55e' : '#052e16'}" stroke="#166534" stroke-width="0.5" />
          ${active ? svg`<circle cx="20" cy="72" r="6" fill="rgba(34, 197, 94, 0.4)" />` : ''}
          <text x="20" y="82" fill="#cbd5e1" font-size="4" font-family="sans-serif" text-anchor="middle">TX</text>

          <!-- Power LED (Red) -->
          <circle cx="40" cy="72" r="4" fill="${showPower ? '#ef4444' : '#450a0a'}" stroke="#991b1b" stroke-width="0.5" />
          ${showPower ? svg`<circle cx="40" cy="72" r="6" fill="rgba(239, 68, 68, 0.4)" />` : ''}
          <text x="40" y="82" fill="#cbd5e1" font-size="4" font-family="sans-serif" text-anchor="middle">PWR</text>

          <!-- Buzzer -->
          <rect x="55" y="68" width="14" height="10" rx="2" fill="#1a1a1a" stroke="#333" stroke-width="0.5" />
          <circle cx="62" cy="73" r="3" fill="#333" stroke="#555" stroke-width="0.3" />
          ${showBuzzer ? svg`
            <circle cx="62" cy="73" r="6" fill="none" stroke="#fbbf24" stroke-width="0.5" opacity="0.6">
              <animate attributeName="r" values="5;8;5" dur="0.3s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.6;0.2;0.6" dur="0.3s" repeatCount="indefinite"/>
            </circle>
          ` : ''}
          <text x="62" y="82" fill="#cbd5e1" font-size="4" font-family="sans-serif" text-anchor="middle">BUZ</text>

          <!-- Pin Headers (5 pins: VCC, TX, LED, BUZZER, GND) -->
          <g fill="#c6bf95" stroke="#854d0e" stroke-width="0.5">
            <!-- VCC Pin -->
            <rect x="8" y="90" width="14" height="10" rx="1" />
            <!-- TX Pin -->
            <rect x="23" y="90" width="14" height="10" rx="1" />
            <!-- LED Pin -->
            <rect x="38" y="90" width="14" height="10" rx="1" />
            <!-- BUZZER Pin -->
            <rect x="53" y="90" width="14" height="10" rx="1" />
            <!-- GND Pin -->
            <rect x="68" y="90" width="14" height="10" rx="1" />
          </g>

          <!-- Pin Labels on PCB -->
          <text fill="#ffffff" font-family="monospace" font-size="5" font-weight="bold">
            <tspan x="10" y="103">VCC</tspan>
            <tspan x="26" y="103">TX</tspan>
            <tspan x="41" y="103">LED</tspan>
            <tspan x="54" y="103">BUZ</tspan>
            <tspan x="70" y="103">GND</tspan>
          </text>

          <!-- Card detection indicator -->
          ${active ? svg`
            <g>
              <text x="50" y="15" fill="#22c55e" font-size="5" font-family="sans-serif" text-anchor="middle" font-weight="bold">CARD DETECTED</text>
            </g>
          ` : ''}
        </svg>

        <!-- Card detection glow overlay -->
        <div class="card-glow ${active ? 'active' : ''}"></div>

        <!-- Buzzer sound waves overlay -->
        <div class="buzzer-waves ${showBuzzer ? 'active' : ''}">
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path d="M10 5 Q15 10 10 15" fill="none" stroke="#fbbf24" stroke-width="1" opacity="0.6">
              <animate attributeName="opacity" values="0.6;0.2;0.6" dur="0.3s" repeatCount="indefinite"/>
            </path>
            <path d="M12 3 Q18 10 12 17" fill="none" stroke="#fbbf24" stroke-width="1" opacity="0.4">
              <animate attributeName="opacity" values="0.4;0.1;0.4" dur="0.3s" repeatCount="indefinite"/>
            </path>
          </svg>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'leap-em18-rfid': Em18RfidElement;
  }
}
