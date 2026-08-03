/**
 * RFID-RC522 Module Element
 * 8-pin SPI RFID Reader/Writer module (MFRC522)
 * Vertical Orientation (Antenna Top, Pins Bottom)
 * Pins: SDA · SCK · MOSI · MISO · IRQ · GND · RST · 3.3V
 */
import { css, html, LitElement, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ElementPin, GND, VCC } from './pin';

@customElement('leap-rfid-rc522')
export class RFIDRC522Element extends LitElement {

  /** RFID Card/Tag presence indicator */
  @property({ type: Boolean }) cardPresent = false;

  /** Tag UID string when card present */
  @property({ type: String }) cardUid = 'DE AD BE EF';

  /** Power LED status */
  @property({ type: Boolean }) ledPower = true;

  readonly pinInfo: ElementPin[] = [
    { name: 'SDA', x: 13, y: 154, number: 1, signals: [] },
    { name: 'SCK', x: 25, y: 154, number: 2, signals: [] },
    { name: 'MOSI', x: 37, y: 154, number: 3, signals: [] },
    { name: 'MISO', x: 49, y: 154, number: 4, signals: [] },
    { name: 'IRQ', x: 61, y: 154, number: 5, signals: [] },
    { name: 'GND', x: 73, y: 154, number: 6, signals: [GND()] },
    { name: 'RST', x: 85, y: 154, number: 7, signals: [] },
    { name: '3.3V', x: 97, y: 154, number: 8, signals: [VCC()] },
  ];

  static get styles() {
    return css`
      :host { display: inline-block; position: relative; }

      .wrap {
        position: relative;
        display: inline-block;
        line-height: 0;
      }

      /* Glow effect when RFID card is detected */
      .card-glow {
        position: absolute;
        left: 50%;
        top: 30%;
        transform: translate(-50%, -50%);
        width: 70px;
        height: 70px;
        border-radius: 50%;
        pointer-events: none;
        transition: opacity 0.25s ease, box-shadow 0.25s ease;
        opacity: 0;
      }

      :host([cardpresent]) .card-glow,
      .card-glow.active {
        opacity: 1;
        box-shadow:
          0 0 18px 10px rgba(56, 189, 248, 0.75),
          0 0 36px 20px rgba(56, 189, 248, 0.45);
      }
    `;
  }

  render() {
    const active = this.cardPresent;
    const showPower = this.ledPower;

    return html`
      <div class="wrap">
        <svg
          width="41mm"
          height="60mm"
          version="1.1"
          viewBox="0 0 110 160"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- PCB Body (Dark Blue RFID Board) -->
          <rect x="4" y="4" width="102" height="152" rx="5" fill="#1b365d" stroke="#0f2342" stroke-width="1.5" />

          <!-- Corner Mounting Holes -->
          <circle cx="12" cy="12" r="3.5" fill="#0f172a" stroke="#94a3b8" stroke-width="1" />
          <circle cx="98" cy="12" r="3.5" fill="#0f172a" stroke="#94a3b8" stroke-width="1" />
          <circle cx="12" cy="148" r="3.5" fill="#0f172a" stroke="#94a3b8" stroke-width="1" />
          <circle cx="98" cy="148" r="3.5" fill="#0f172a" stroke="#94a3b8" stroke-width="1" />

          <!-- RFID Antenna Concentric Loops (Top Section) -->
          <g fill="none" stroke="#ffffff" stroke-width="1" opacity="0.85">
            <rect x="14" y="20" width="82" height="65" rx="6" />
            <rect x="19" y="25" width="72" height="55" rx="5" />
            <rect x="24" y="30" width="62" height="45" rx="4" />
            <rect x="29" y="35" width="52" height="35" rx="3" />
          </g>

          <!-- RFID Signal Wave Graphic -->
          <g transform="translate(55, 52.5)">
            <circle cx="0" cy="0" r="3" fill="#ffffff" opacity="0.9" />
            <path d="M -8,-8 A 11.3 11.3 0 0 1 8,-8" fill="none" stroke="#ffffff" stroke-width="1.2" />
            <path d="M -13,-13 A 18.3 18.3 0 0 1 13,-13" fill="none" stroke="#ffffff" stroke-width="1.2" />
            <path d="M -18,-18 A 25.4 25.4 0 0 1 18,-18" fill="none" stroke="#ffffff" stroke-width="1.2" />
            
            <path d="M -8,8 A 11.3 11.3 0 0 0 8,8" fill="none" stroke="#ffffff" stroke-width="1.2" />
            <path d="M -13,13 A 18.3 18.3 0 0 0 13,13" fill="none" stroke="#ffffff" stroke-width="1.2" />
            <path d="M -18,18 A 25.4 25.4 0 0 0 18,18" fill="none" stroke="#ffffff" stroke-width="1.2" />
          </g>

          <!-- Silkscreen Text: RFID-RC522 (Top) -->
          <text
            x="55"
            y="14"
            fill="#ffffff"
            font-size="7"
            font-family="sans-serif"
            font-weight="bold"
            text-anchor="middle"
            letter-spacing="1"
            opacity="0.9"
          >RFID-RC522</text>

          <!-- MFRC522 IC Chip (QFN Package) -->
          <rect x="44" y="96" width="22" height="22" rx="1" fill="#0f172a" stroke="#334155" stroke-width="0.8" />
          <!-- Pin dot on chip -->
          <circle cx="47" cy="99" r="1" fill="#94a3b8" />
          <text x="55" y="107" fill="#cbd5e1" font-size="4.5" font-family="monospace" text-anchor="middle">MFRC</text>
          <text x="55" y="113" fill="#cbd5e1" font-size="4.5" font-family="monospace" text-anchor="middle">522</text>

          <!-- Crystal Oscillator (Silver Oval Left) -->
          <rect x="15" y="98" width="18" height="10" rx="4" fill="#cbd5e1" stroke="#64748b" stroke-width="0.8" />
          <text x="24" y="104.5" fill="#334155" font-size="3.8" font-family="sans-serif" font-weight="bold" text-anchor="middle">27.120</text>

          <!-- SMD Resistors / Capacitors -->
          <g fill="#475569" stroke="#cbd5e1" stroke-width="0.4">
            <rect x="16" y="114" width="6" height="3" rx="0.5" />
            <rect x="25" y="114" width="6" height="3" rx="0.5" />
            <rect x="74" y="98" width="6" height="3" rx="0.5" />
            <rect x="83" y="98" width="6" height="3" rx="0.5" />
            <rect x="74" y="105" width="6" height="3" rx="0.5" />
            <rect x="83" y="105" width="6" height="3" rx="0.5" />
          </g>

          <!-- Power LED -->
          <circle cx="85" cy="116" r="2.5" fill="${showPower ? '#ef4444' : '#450a0a'}" />
          ${showPower ? svg`<circle cx="85" cy="116" r="4" fill="rgba(239, 68, 68, 0.4)" />` : ''}

          <!-- Pin Headers & Silkscreen Labels at Bottom -->
          <g font-size="4.5" font-family="monospace" font-weight="bold" fill="#ffffff" text-anchor="middle" opacity="0.9">
            <text x="13" y="146" transform="rotate(-90 13 146)">SDA</text>
            <text x="25" y="146" transform="rotate(-90 25 146)">SCK</text>
            <text x="37" y="146" transform="rotate(-90 37 146)">MOSI</text>
            <text x="49" y="146" transform="rotate(-90 49 146)">MISO</text>
            <text x="61" y="146" transform="rotate(-90 61 146)">IRQ</text>
            <text x="73" y="146" transform="rotate(-90 73 146)">GND</text>
            <text x="85" y="146" transform="rotate(-90 85 146)">RST</text>
            <text x="97" y="146" transform="rotate(-90 97 146)">3.3V</text>

            <!-- Black Header Strip at Bottom -->
            <rect x="8" y="149" width="94" height="9" fill="#0f172a" rx="1" />

            <!-- 8 Pin Pads -->
            <circle cx="13" cy="154" r="2.2" fill="#e2e8f0" stroke="#64748b" stroke-width="0.8" />
            <circle cx="25" cy="154" r="2.2" fill="#e2e8f0" stroke="#64748b" stroke-width="0.8" />
            <circle cx="37" cy="154" r="2.2" fill="#e2e8f0" stroke="#64748b" stroke-width="0.8" />
            <circle cx="49" cy="154" r="2.2" fill="#e2e8f0" stroke="#64748b" stroke-width="0.8" />
            <circle cx="61" cy="154" r="2.2" fill="#e2e8f0" stroke="#64748b" stroke-width="0.8" />
            <circle cx="73" cy="154" r="2.2" fill="#e2e8f0" stroke="#64748b" stroke-width="0.8" />
            <circle cx="85" cy="154" r="2.2" fill="#e2e8f0" stroke="#64748b" stroke-width="0.8" />
            <circle cx="97" cy="154" r="2.2" fill="#e2e8f0" stroke="#64748b" stroke-width="0.8" />
          </g>

          <!-- Card Active Scan Animation -->
          ${active ? svg`
            <g transform="translate(55, 52.5)">
              <circle cx="0" cy="0" r="30" fill="none" stroke="#38bdf8" stroke-width="1.5" opacity="0.6">
                <animate attributeName="r" values="10;38" dur="1.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0" dur="1.2s" repeatCount="indefinite" />
              </circle>
              <circle cx="0" cy="0" r="20" fill="none" stroke="#0ea5e9" stroke-width="1" opacity="0.8">
                <animate attributeName="r" values="5;28" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
              </circle>
            </g>
          ` : ''}
        </svg>

        <div class="card-glow ${active ? 'active' : ''}"></div>
      </div>
    `;
  }
}
