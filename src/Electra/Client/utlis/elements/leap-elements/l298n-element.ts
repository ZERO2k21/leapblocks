import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ElementPin } from '.';

@customElement('leap-l298n')
export class L298NElement extends LitElement {
  @property({ type: Boolean }) ena = true;
  @property({ type: Boolean }) enb = true;
  @property({ type: Boolean }) in1 = false;
  @property({ type: Boolean }) in2 = false;
  @property({ type: Boolean }) in3 = false;
  @property({ type: Boolean }) in4 = false;

  get pinInfo(): ElementPin[] {
    return [
      // Motor A (OUT1, OUT2)
      { name: 'OUT1', x: 23, y: 122, number: 1, signals: [] },
      { name: 'OUT2', x: 23, y: 153, number: 2, signals: [] },

      // Power (12V, GND, 5V)
      { name: '12V', x: 58, y: 178, number: 3, signals: [] },
      { name: 'GND', x: 85, y: 178, number: 4, signals: [] },
      { name: '5V', x: 113, y: 178, number: 5, signals: [] },

      // Motor B (OUT4, OUT3)
      { name: 'OUT4', x: 177, y: 122, number: 6, signals: [] },
      { name: 'OUT3', x: 177, y: 153, number: 7, signals: [] },

      // Control Pins (ENA, IN1, IN2, IN3, IN4, ENB)
      { name: 'ENA', x: 110, y: 178, number: 8, signals: [] },
      { name: 'IN1', x: 123, y: 178, number: 9, signals: [] },
      { name: 'IN2', x: 136, y: 178, number: 10, signals: [] },
      { name: 'IN3', x: 149, y: 178, number: 11, signals: [] },
      { name: 'IN4', x: 162, y: 178, number: 12, signals: [] },
      { name: 'ENB', x: 175, y: 178, number: 13, signals: [] },
    ];
  }

  render() {
    const enaColor = this.ena ? '#ef4444' : '#374151'; // Red jumper
    const enbColor = this.enb ? '#ef4444' : '#374151';
    const inColor = '#334155'; // Dark pin headers

    return html`
      <svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        style="filter: drop-shadow(0 2px 5px rgba(0,0,0,0.3));"
      >
        <!-- PCB Board -->
        <rect x="0" y="0" width="200" height="200" fill="#cc291d" />

        <!-- Mounting Holes -->
        <circle cx="14" cy="14" r="9" fill="#e2e8f0" stroke="#94a3b8" stroke-width="0.5" />
        <circle cx="186" cy="14" r="9" fill="#e2e8f0" stroke="#94a3b8" stroke-width="0.5" />
        <circle cx="14" cy="186" r="9" fill="#e2e8f0" stroke="#94a3b8" stroke-width="0.5" />
        <circle cx="186" cy="186" r="9" fill="#e2e8f0" stroke="#94a3b8" stroke-width="0.5" />

        <!-- Heatsink Area -->
        <g transform="translate(43, 10)">
          <!-- Heatsink Base -->
          <rect x="0" y="32" width="114" height="8" fill="#000" />
          <!-- Heatsink Fins -->
          <rect x="0" y="0" width="3" height="40" fill="#000" />
          <rect x="22" y="0" width="3" height="40" fill="#000" />
          <rect x="44" y="0" width="3" height="40" fill="#000" />
          <rect x="67" y="0" width="3" height="40" fill="#000" />
          <rect x="89" y="0" width="3" height="40" fill="#000" />
          <rect x="111" y="0" width="3" height="40" fill="#000" />
          <!-- Heatsink Horizontal Bar -->
          <rect x="0" y="0" width="114" height="2" fill="#000" />
          <rect x="0" y="40" width="114" height="20" fill="#000" />
          
          <!-- IC Pins -->
          <g transform="translate(8, 60)">
            ${Array.from({ length: 11 }).map((_, i) => html`
              <rect x="${i * 9}" y="0" width="4" height="18" fill="#e2e8f0" rx="1" />
            `)}
          </g>
        </g>

        <!-- Diodes Left -->
        <g transform="translate(10, 35)">
          ${Array.from({ length: 4 }).map((_, i) => html`
            <rect x="0" y="${i * 18}" width="26" height="10" fill="#000" />
            <rect x="20" y="${i * 18}" width="6" height="10" fill="#64748b" />
          `)}
        </g>

        <!-- Diodes Right -->
        <g transform="translate(164, 35)">
          ${Array.from({ length: 4 }).map((_, i) => html`
            <rect x="0" y="${i * 18}" width="26" height="10" fill="#000" />
            <rect x="0" y="${i * 18}" width="6" height="10" fill="#64748b" />
          `)}
        </g>

        <!-- Labels -->
        <text x="40" y="98" font-family="'Courier New', Courier, monospace" font-size="18" font-weight="900" fill="white">L298N</text>

        <!-- Large Capacitor -->
        <g transform="translate(58, 105)">
          <circle cx="15" cy="15" r="15" fill="#18181b" />
          <path d="M 0 15 A 15 15 0 0 1 30 15 L 30 25 A 15 15 0 0 1 0 25 Z" fill="#18181b" />
          <rect x="2" y="10" width="8" height="10" fill="#94a3b8" /> <!-- Polarity band -->
          <circle cx="15" cy="15" r="15" fill="none" stroke="#000" stroke-width="0.5" />
        </g>

        <!-- Small Capacitor -->
        <g transform="translate(120, 145)">
          <circle cx="15" cy="15" r="15" fill="#18181b" />
          <rect x="22" y="10" width="8" height="10" fill="#94a3b8" /> <!-- Polarity band -->
          <circle cx="15" cy="15" r="15" fill="none" stroke="#000" stroke-width="0.5" />
        </g>

        <!-- Voltage Regulator -->
        <g transform="translate(103, 103)">
          <rect x="12" y="0" width="36" height="32" rx="1" fill="#000" />
          <rect x="18" y="5" width="24" height="22" fill="#334155" />
          <!-- Regulator Pins -->
          <rect x="0" y="4" width="12" height="4" fill="#e2e8f0" />
          <rect x="0" y="14" width="12" height="4" fill="#e2e8f0" />
          <rect x="0" y="24" width="12" height="4" fill="#e2e8f0" />
        </g>

        <!-- Blue Terminal Blocks -->
        <!-- Left (Motor A) -->
        <g transform="translate(5, 108)">
          <rect x="0" y="0" width="36" height="50" fill="#0047ab" /> <!-- Base -->
          <rect x="2" y="0" width="34" height="50" fill="#2563eb" /> <!-- Top -->
          <!-- Screws -->
          <circle cx="18" cy="14" r="11" fill="#64748b" />
          <rect x="10" y="13.5" width="16" height="1" fill="#1e293b" transform="rotate(45, 18, 14)" />
          
          <circle cx="18" cy="45" r="11" fill="#64748b" />
          <rect x="10" y="44.5" width="16" height="1" fill="#1e293b" transform="rotate(45, 18, 45)" />
          
          <text x="0" y="-4" font-family="monospace" font-size="9" fill="white">OUT1</text>
          <text x="0" y="60" font-family="monospace" font-size="9" fill="white">OUT2</text>
        </g>

        <!-- Power (Bottom) -->
        <g transform="translate(43, 160)">
          <rect x="0" y="0" width="85" height="36" fill="#0047ab" />
          <rect x="0" y="2" width="85" height="34" fill="#2563eb" />
          <!-- Screws -->
          <circle cx="15" cy="18" r="11" fill="#64748b" />
          <rect x="7" y="17.5" width="16" height="1" fill="#1e293b" transform="rotate(45, 15, 18)" />
          
          <circle cx="42" cy="18" r="11" fill="#64748b" />
          <rect x="34" y="17.5" width="16" height="1" fill="#1e293b" transform="rotate(45, 42, 18)" />

          <circle cx="70" cy="18" r="11" fill="#64748b" />
          <rect x="62" y="17.5" width="16" height="1" fill="#1e293b" transform="rotate(45, 70, 18)" />
          
          <text x="15" y="-4" font-family="monospace" font-size="8" fill="white" text-anchor="middle">12V</text>
          <text x="42" y="-4" font-family="monospace" font-size="8" fill="white" text-anchor="middle">GND</text>
          <text x="70" y="-4" font-family="monospace" font-size="8" fill="white" text-anchor="middle">5V</text>
        </g>

        <!-- Right (Motor B) -->
        <g transform="translate(159, 108)">
          <rect x="0" y="0" width="36" height="50" fill="#0047ab" />
          <rect x="0" y="0" width="34" height="50" fill="#2563eb" />
          <!-- Screws -->
          <circle cx="18" cy="14" r="11" fill="#64748b" />
          <rect x="10" y="13.5" width="16" height="1" fill="#1e293b" transform="rotate(45, 18, 14)" />
          
          <circle cx="18" cy="45" r="11" fill="#64748b" />
          <rect x="10" y="44.5" width="16" height="1" fill="#1e293b" transform="rotate(45, 18, 45)" />
          
          <text x="36" y="-4" font-family="monospace" font-size="9" fill="white" text-anchor="end">OUT4</text>
          <text x="36" y="60" font-family="monospace" font-size="9" fill="white" text-anchor="end">OUT3</text>
        </g>

        <!-- Jumper 5VEN -->
        <g transform="translate(53, 138)">
          <rect x="0" y="0" width="24" height="10" fill="#1e293b" />
          <rect x="2" y="2" width="8" height="6" fill="#000" />
          <rect x="14" y="2" width="8" height="6" fill="#000" />
          <text x="26" y="8" font-family="monospace" font-size="8" fill="white">5VEN</text>
        </g>

        <!-- Control Pins -->
        <g transform="translate(103, 168)">
          <!-- Pin Base -->
          <rect x="0" y="0" width="85" height="24" fill="#000" />
          <!-- Headers -->
          ${[0, 13, 26, 39, 52, 65, 78].map((x, i) => html`
            <rect x="${x + 2}" y="2" width="10" height="10" fill="#1e293b" />
          `)}
          
          <!-- ENA Jumper (Red) -->
          <rect x="2" y="2" width="10" height="10" fill="${enaColor}" />
          <!-- ENB Jumper (Red) -->
          <rect x="80" y="2" width="10" height="10" fill="${enbColor}" />
          
          <!-- Labels -->
          <g font-family="monospace" font-size="6" fill="white" text-anchor="middle">
            <text x="7" y="22">ENA</text>
            <text x="20" y="22">IN1</text>
            <text x="33" y="22">IN2</text>
            <text x="46" y="22">IN3</text>
            <text x="59" y="22">IN4</text>
            <text x="72" y="22">ENB</text>
          </g>
        </g>
      </svg>
    `;
  }
}
