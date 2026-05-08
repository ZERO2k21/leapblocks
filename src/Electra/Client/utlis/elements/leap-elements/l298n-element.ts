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

    return html`
      <svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        style="filter: drop-shadow(0 4px 10px rgba(0,0,0,0.4));"
      >
        <defs>
          <linearGradient id="pcb-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#ef4444;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#b91c1c;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="heatsink-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#18181b;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#3f3f46;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#18181b;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="terminal-block-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
          </linearGradient>
          <filter id="inner-bevel">
            <feOffset dx="1" dy="1" />
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feComposite operator="out" in="SourceGraphic" in2="blur" result="inverse" />
            <feFlood flood-color="white" flood-opacity="0.3" result="light" />
            <feComposite operator="in" in="light" in2="inverse" result="bevel" />
            <feComposite operator="over" in="bevel" in2="SourceGraphic" />
          </filter>
        </defs>

        <!-- PCB Board -->
        <rect x="0" y="0" width="200" height="200" rx="4" fill="url(#pcb-grad)" />
        <rect x="2" y="2" width="196" height="196" rx="3" fill="none" stroke="#dc2626" stroke-width="0.5" opacity="0.5" />

        <!-- Mounting Holes -->
        <circle cx="14" cy="14" r="8" fill="#cbd5e1" stroke="#475569" stroke-width="1" />
        <circle cx="186" cy="14" r="8" fill="#cbd5e1" stroke="#475569" stroke-width="1" />
        <circle cx="14" cy="186" r="8" fill="#cbd5e1" stroke="#475569" stroke-width="1" />
        <circle cx="186" cy="186" r="8" fill="#cbd5e1" stroke="#475569" stroke-width="1" />

        <!-- Heatsink Area -->
        <g transform="translate(43, 15)">
          <rect x="0" y="35" width="114" height="25" fill="url(#heatsink-grad)" rx="1" />
          ${[0, 19, 38, 57, 76, 95, 111].map(x => html`
            <rect x="${x}" y="0" width="3" height="40" fill="#000" rx="0.5" />
          `)}
          <rect x="0" y="0" width="114" height="4" fill="#000" rx="1" />
          
          <!-- Chip Label -->
          <text x="57" y="52" font-family="monospace" font-size="10" font-weight="bold" fill="#94a3b8" text-anchor="middle">L298N</text>
        </g>

        <!-- Blue Terminal Blocks (Premium Style) -->
        <g filter="url(#inner-bevel)">
          <!-- Left (Motor A) -->
          <g transform="translate(8, 105)">
            <rect x="0" y="0" width="34" height="54" rx="2" fill="url(#terminal-block-grad)" />
            <rect x="4" y="8" width="26" height="16" rx="1" fill="#1e3a8a" opacity="0.3" />
            <rect x="4" y="30" width="26" height="16" rx="1" fill="#1e3a8a" opacity="0.3" />
            
            <!-- Screws -->
            <circle cx="17" cy="16" r="10" fill="#94a3b8" stroke="#475569" stroke-width="0.5" />
            <path d="M 12 16 L 22 16 M 17 11 L 17 21" stroke="#1e293b" stroke-width="1.5" transform="rotate(45, 17, 16)" />
            
            <circle cx="17" cy="38" r="10" fill="#94a3b8" stroke="#475569" stroke-width="0.5" />
            <path d="M 12 38 L 22 38 M 17 33 L 17 43" stroke="#1e293b" stroke-width="1.5" transform="rotate(45, 17, 38)" />
            
            <text x="4" y="-4" font-family="monospace" font-size="8" font-weight="bold" fill="white">OUT1</text>
            <text x="4" y="64" font-family="monospace" font-size="8" font-weight="bold" fill="white">OUT2</text>
          </g>

          <!-- Power (Bottom) -->
          <g transform="translate(50, 158)">
            <rect x="0" y="0" width="80" height="34" rx="2" fill="url(#terminal-block-grad)" />
            <rect x="8" y="4" width="64" height="12" rx="1" fill="#1e3a8a" opacity="0.3" />
            
            ${[15, 40, 65].map(x => html`
              <circle cx="${x}" cy="17" r="9" fill="#94a3b8" stroke="#475569" stroke-width="0.5" />
              <path d="M ${x - 4} 17 L ${x + 4} 17 M ${x} 13 L ${x} 21" stroke="#1e293b" stroke-width="1.5" transform="rotate(45, ${x}, 17)" />
            `)}
            
            <text x="15" y="-4" font-family="monospace" font-size="7" font-weight="bold" fill="white" text-anchor="middle">12V</text>
            <text x="40" y="-4" font-family="monospace" font-size="7" font-weight="bold" fill="white" text-anchor="middle">GND</text>
            <text x="65" y="-4" font-family="monospace" font-size="7" font-weight="bold" fill="white" text-anchor="middle">5V</text>
          </g>

          <!-- Right (Motor B) -->
          <g transform="translate(158, 105)">
            <rect x="0" y="0" width="34" height="54" rx="2" fill="url(#terminal-block-grad)" />
            <rect x="4" y="8" width="26" height="16" rx="1" fill="#1e3a8a" opacity="0.3" />
            <rect x="4" y="30" width="26" height="16" rx="1" fill="#1e3a8a" opacity="0.3" />
            
            <circle cx="17" cy="16" r="10" fill="#94a3b8" stroke="#475569" stroke-width="0.5" />
            <path d="M 12 16 L 22 16 M 17 11 L 17 21" stroke="#1e293b" stroke-width="1.5" transform="rotate(45, 17, 16)" />
            
            <circle cx="17" cy="38" r="10" fill="#94a3b8" stroke="#475569" stroke-width="0.5" />
            <path d="M 12 38 L 22 38 M 17 33 L 17 43" stroke="#1e293b" stroke-width="1.5" transform="rotate(45, 17, 38)" />
            
            <text x="30" y="-4" font-family="monospace" font-size="8" font-weight="bold" fill="white" text-anchor="end">OUT4</text>
            <text x="30" y="64" font-family="monospace" font-size="8" font-weight="bold" fill="white" text-anchor="end">OUT3</text>
          </g>
        </g>

        <!-- Capacitors & Details -->
        <circle cx="75" cy="120" r="14" fill="#18181b" stroke="#000" />
        <rect x="61" y="115" width="4" height="10" fill="#94a3b8" />
        
        <circle cx="130" cy="140" r="12" fill="#18181b" stroke="#000" />
        <rect x="140" y="135" width="4" height="10" fill="#94a3b8" />

        <!-- Control Pins (Black Header) -->
        <g transform="translate(140, 165)">
          <rect x="0" y="0" width="50" height="25" rx="2" fill="#18181b" />
          ${[5, 13, 21, 29, 37, 45].map(x => html`
            <rect x="${x}" y="4" width="4" height="4" fill="#facc15" />
          `)}
          
          <!-- Jumper Overlays -->
          <rect x="4" y="2" width="6" height="12" rx="1" fill="${enaColor}" stroke="#000" stroke-width="0.5" />
          <rect x="44" y="2" width="6" height="12" rx="1" fill="${enbColor}" stroke="#000" stroke-width="0.5" />
          
          <g font-family="monospace" font-size="5" font-weight="bold" fill="#f8fafc" text-anchor="middle">
            <text x="7" y="22">ENA</text>
            <text x="46" y="22">ENB</text>
          </g>
        </g>

        <!-- Branding -->
        <text x="100" y="192" font-family="'Inter', sans-serif" font-size="8" font-weight="900" fill="white" opacity="0.3" text-anchor="middle" style="letter-spacing: 2px;">LEAPLAB MOTOR DRIVE</text>
      </svg>
    `;
  }
}
