import { css, html, LitElement, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ElementPin, GND, VCC, spi } from './pin';

const SVG_W = 40;
const SVG_H = 30;

@customElement('leap-mfrc522')
export class MFRC522Element extends LitElement {
  @property({ type: Boolean }) cardPresent = false;
  @property({ type: Array }) uid: number[] = [];
  @property() cardName = '';
  @property() label = '';

  readonly pinInfo: ElementPin[] = [
    { name: 'VCC',  x: 1,  y: 5,   signals: [VCC(3.3)] },
    { name: 'RST',  x: 1,  y: 10,  signals: [] },
    { name: 'GND',  x: 1,  y: 15,  signals: [GND()] },
    { name: 'IRQ',  x: 1,  y: 20,  signals: [] },
    { name: 'MISO', x: 1,  y: 25,  signals: [spi('MISO')] },
    { name: 'MOSI', x: 39, y: 25,  signals: [spi('MOSI')] },
    { name: 'SCK',  x: 39, y: 20,  signals: [spi('SCK')] },
    { name: 'SS',   x: 39, y: 15,  signals: [spi('SS')] },
  ];

  static get styles() {
    return css`
      :host { display: inline-block; }
      .mfrc522-wrap { position: relative; display: inline-block; line-height: 0; }
    `;
  }

  private renderSVG() {
    const { cardPresent, uid, cardName } = this;
    const uidHex = uid.length > 0 ? uid.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ') : '';

    return html`<svg
      width="120" height="90"
      viewBox="0 0 ${SVG_W} ${SVG_H}"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- PCB Board Background -->
      <rect x="0" y="0" width="${SVG_W}" height="${SVG_H}" rx="1.2" ry="1.2" fill="#1a3a5c" stroke="#0d2240" stroke-width="0.3"/>

      <!-- Copper trace area (darker region) -->
      <rect x="16" y="1" width="23" height="28" rx="0.5" fill="#14304a" opacity="0.6"/>

      <!-- Antenna coil traces (concentric arcs representing 13.56 MHz antenna) -->
      <g fill="none" stroke="#c8963c" stroke-width="0.35" opacity="0.85">
        <path d="M 38 15 A 10 10 0 0 1 38 25" />
        <path d="M 36 13 A 12 12 0 0 1 36 27" />
        <path d="M 34 11 A 14 14 0 0 1 34 29" />
        <path d="M 32 9 A 16 16 0 0 1 32 31" />
        <path d="M 30 7 A 18 18 0 0 1 30 33" />
      </g>

      <!-- Antenna center dot -->
      <circle cx="38" cy="20" r="0.5" fill="#c8963c" opacity="0.6"/>

      <!-- Crystal oscillator (silver oval) -->
      <ellipse cx="5" cy="4.5" rx="2.2" ry="1.2" fill="#c0c0c0" stroke="#888" stroke-width="0.15"/>

      <!-- MFRC522 IC chip (black square) -->
      <rect x="3.5" y="11" width="5.5" height="5.5" rx="0.3" fill="#1a1a1a" stroke="#333" stroke-width="0.1"/>
      <!-- IC pin 1 marker -->
      <circle cx="4.2" cy="11.7" r="0.25" fill="#555"/>
      <!-- IC pins (small dots) -->
      <g fill="#aaa">
        <rect x="3.8" y="10.5" width="0.3" height="0.5" rx="0.1"/>
        <rect x="4.5" y="10.5" width="0.3" height="0.5" rx="0.1"/>
        <rect x="5.2" y="10.5" width="0.3" height="0.5" rx="0.1"/>
        <rect x="5.9" y="10.5" width="0.3" height="0.5" rx="0.1"/>
        <rect x="6.6" y="10.5" width="0.3" height="0.5" rx="0.1"/>
        <rect x="7.3" y="10.5" width="0.3" height="0.5" rx="0.1"/>
        <rect x="3.8" y="16.5" width="0.3" height="0.5" rx="0.1"/>
        <rect x="4.5" y="16.5" width="0.3" height="0.5" rx="0.1"/>
        <rect x="5.2" y="16.5" width="0.3" height="0.5" rx="0.1"/>
        <rect x="5.9" y="16.5" width="0.3" height="0.5" rx="0.1"/>
        <rect x="6.6" y="16.5" width="0.3" height="0.5" rx="0.1"/>
        <rect x="7.3" y="16.5" width="0.3" height="0.5" rx="0.1"/>
      </g>

      <!-- Passive components (capacitors, resistors) -->
      <g fill="#8B7355" opacity="0.7">
        <rect x="10" y="3" width="1.2" height="0.6" rx="0.1"/>
        <rect x="12" y="3" width="1.2" height="0.6" rx="0.1"/>
        <rect x="14" y="3" width="1.2" height="0.6" rx="0.1"/>
        <rect x="10" y="6" width="0.8" height="0.4" rx="0.1"/>
        <rect x="12" y="6" width="0.8" height="0.4" rx="0.1"/>
        <rect x="14" y="6" width="0.8" height="0.4" rx="0.1"/>
        <rect x="10" y="9" width="1.2" height="0.6" rx="0.1"/>
        <rect x="12" y="9" width="1.2" height="0.6" rx="0.1"/>
      </g>

      <!-- Bottom resistor network -->
      <g fill="#8B7355" opacity="0.6">
        <rect x="3" y="22" width="1" height="0.5" rx="0.1"/>
        <rect x="5" y="22" width="1" height="0.5" rx="0.1"/>
        <rect x="7" y="22" width="1" height="0.5" rx="0.1"/>
        <rect x="9" y="22" width="1" height="0.5" rx="0.1"/>
      </g>

      <!-- Left pin header (VCC, RST, GND, IRQ, MISO) -->
      <g>
        <rect x="-0.8" y="3.5" width="1.6" height="23" rx="0.3" fill="#222" stroke="#444" stroke-width="0.1"/>
        <!-- Pin holes -->
        <circle cx="0" cy="5"  r="0.5" fill="#333" stroke="#888" stroke-width="0.1"/>
        <circle cx="0" cy="10" r="0.5" fill="#333" stroke="#888" stroke-width="0.1"/>
        <circle cx="0" cy="15" r="0.5" fill="#333" stroke="#888" stroke-width="0.1"/>
        <circle cx="0" cy="20" r="0.5" fill="#333" stroke="#888" stroke-width="0.1"/>
        <circle cx="0" cy="25" r="0.5" fill="#333" stroke="#888" stroke-width="0.1"/>
      </g>

      <!-- Right pin header (MOSI, SCK, SS) -->
      <g>
        <rect x="39.2" y="13.5" width="1.6" height="13" rx="0.3" fill="#222" stroke="#444" stroke-width="0.1"/>
        <circle cx="40" cy="15" r="0.5" fill="#333" stroke="#888" stroke-width="0.1"/>
        <circle cx="40" cy="20" r="0.5" fill="#333" stroke="#888" stroke-width="0.1"/>
        <circle cx="40" cy="25" r="0.5" fill="#333" stroke="#888" stroke-width="0.1"/>
      </g>

      <!-- Pin labels (left side) -->
      <text font-family="monospace" font-size="1.8" fill="#8ab4d8" text-anchor="middle">
        <tspan x="2.8" y="5.6">VCC</tspan>
        <tspan x="2.8" y="10.6">RST</tspan>
        <tspan x="2.8" y="15.6">GND</tspan>
        <tspan x="2.8" y="20.6">IRQ</tspan>
        <tspan x="2.8" y="25.6">MISO</tspan>
      </text>

      <!-- Pin labels (right side) -->
      <text font-family="monospace" font-size="1.8" fill="#8ab4d8" text-anchor="middle">
        <tspan x="37.5" y="15.6">MOSI</tspan>
        <tspan x="37.5" y="20.6">SCK</tspan>
        <tspan x="37.5" y="25.6">SS</tspan>
      </text>

      <!-- Module label -->
      <text font-family="monospace" font-size="2" fill="#5a8aad" text-anchor="middle" font-weight="bold">
        <tspan x="20" y="28.5">RFID-RC522</tspan>
      </text>

      <!-- Card present indicator -->
      ${cardPresent ? html`
        <g>
          <circle cx="38" cy="5" r="1.2" fill="#22c55e" opacity="0.9"/>
          <circle cx="38" cy="5" r="1.2" fill="none" stroke="#22c55e" stroke-width="0.2" opacity="0.5">
            <animate attributeName="r" values="1.2;2;1.2" dur="1.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.5s" repeatCount="indefinite"/>
          </circle>
        </g>
        <!-- UID display -->
        <text font-family="monospace" font-size="1.5" fill="#22c55e" text-anchor="middle" font-weight="bold">
          <tspan x="20" y="2">UID: ${uidHex}</tspan>
        </text>
      ` : ''}

      <!-- Mounting holes -->
      <circle cx="2" cy="2" r="0.6" fill="none" stroke="#3a5a7c" stroke-width="0.15"/>
      <circle cx="38" cy="2" r="0.6" fill="none" stroke="#3a5a7c" stroke-width="0.15"/>
      <circle cx="2" cy="28" r="0.6" fill="none" stroke="#3a5a7c" stroke-width="0.15"/>
      <circle cx="38" cy="28" r="0.6" fill="none" stroke="#3a5a7c" stroke-width="0.15"/>
    </svg>`;
  }

  override render() {
    return html`
      <div class="mfrc522-wrap">
        ${this.renderSVG()}
      </div>
    `;
  }
}
