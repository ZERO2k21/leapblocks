import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ElementPin } from '.';

@customElement('leap-a4988')
export class A4988Element extends LitElement {
    @property() enable = false;
    @property() ms1 = false;
    @property() ms2 = false;
    @property() ms3 = false;
    @property() reset = true;
    @property() sleep = true;
    @property() step = false;
    @property() dir = false;

    get pinInfo(): ElementPin[] {
        return [
            { name: 'ENABLE', x: 0, y: 35.91, number: 1, signals: [] },
            { name: 'MS1', x: 0, y: 71.81, number: 2, signals: [] },
            { name: 'MS2', x: 0, y: 107.72, number: 3, signals: [] },
            { name: 'MS3', x: 0, y: 143.62, number: 4, signals: [] },
            { name: 'RESET', x: 0, y: 179.53, number: 5, signals: [] },
            { name: 'SLEEP', x: 0, y: 215.43, number: 6, signals: [] },
            { name: 'STEP', x: 0, y: 251.34, number: 7, signals: [] },
            { name: 'DIR', x: 0, y: 287.24, number: 8, signals: [] },
            { name: 'VDD', x: 113.39, y: 35.91, number: 9, signals: [] },
            { name: 'GND', x: 113.39, y: 71.81, number: 10, signals: [] },
            { name: '2B', x: 113.39, y: 107.72, number: 11, signals: [] },
            { name: '2A', x: 113.39, y: 143.62, number: 12, signals: [] },
            { name: '1A', x: 113.39, y: 179.53, number: 13, signals: [] },
            { name: '1B', x: 113.39, y: 215.43, number: 14, signals: [] },
            { name: 'VMOT', x: 113.39, y: 251.34, number: 15, signals: [] },
            { name: 'GND2', x: 113.39, y: 287.24, number: 16, signals: [] },
        ];
    }

    render() {
        const stepColor = this.step ? '#4ade80' : '#374151';
        const dirColor = this.dir ? '#60a5fa' : '#374151';
        const enabledColor = !this.enable ? '#10b981' : '#ef4444';
        const sleepColor = this.sleep ? '#10b981' : '#ef4444';
        const resetColor = this.reset ? '#10b981' : '#ef4444';

        return html`
      <svg
        width="113.39"
        height="325.04"
        viewBox="0 0 113.39 325.04"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="board-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#1e3a8a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
          </filter>
        </defs>

        <!-- PCB Board -->
        <rect
          x="0"
          y="0"
          width="113.39"
          height="325.04"
          rx="3"
          ry="3"
          fill="url(#board-gradient)"
          stroke="#1e293b"
          stroke-width="1"
          filter="url(#shadow)"
        />

        <!-- IC Chip (A4988) -->
        <rect
          x="25"
          y="120"
          width="63.39"
          height="85"
          rx="2"
          fill="#1f2937"
          stroke="#374151"
          stroke-width="1.5"
        />

        <!-- IC Label -->
        <text
          x="56.695"
          y="155"
          font-family="monospace"
          font-size="10"
          fill="#9ca3af"
          text-anchor="middle"
        >
          A4988
        </text>
        <text
          x="56.695"
          y="170"
          font-family="monospace"
          font-size="7"
          fill="#6b7280"
          text-anchor="middle"
        >
          STEPPER
        </text>
        <text
          x="56.695"
          y="182"
          font-family="monospace"
          font-size="7"
          fill="#6b7280"
          text-anchor="middle"
        >
          DRIVER
        </text>

        <!-- Left Side Pins -->
        <g id="left-pins">
          <!-- ENABLE -->
          <rect x="0" y="32.91" width="15" height="6" fill="#d1d5db" stroke="#9ca3af" stroke-width="0.5"/>
          <text x="18" y="38" font-family="monospace" font-size="6" fill="#e5e7eb">ENABLE</text>
          <circle cx="8" cy="35.91" r="2" fill="${enabledColor}" opacity="0.8"/>

          <!-- MS1 -->
          <rect x="0" y="68.81" width="15" height="6" fill="#d1d5db" stroke="#9ca3af" stroke-width="0.5"/>
          <text x="18" y="74" font-family="monospace" font-size="6" fill="#e5e7eb">MS1</text>
          <circle cx="8" cy="71.81" r="2" fill="${this.ms1 ? '#fbbf24' : '#374151'}" opacity="0.8"/>

          <!-- MS2 -->
          <rect x="0" y="104.72" width="15" height="6" fill="#d1d5db" stroke="#9ca3af" stroke-width="0.5"/>
          <text x="18" y="110" font-family="monospace" font-size="6" fill="#e5e7eb">MS2</text>
          <circle cx="8" cy="107.72" r="2" fill="${this.ms2 ? '#fbbf24' : '#374151'}" opacity="0.8"/>

          <!-- MS3 -->
          <rect x="0" y="140.62" width="15" height="6" fill="#d1d5db" stroke="#9ca3af" stroke-width="0.5"/>
          <text x="18" y="146" font-family="monospace" font-size="6" fill="#e5e7eb">MS3</text>
          <circle cx="8" cy="143.62" r="2" fill="${this.ms3 ? '#fbbf24' : '#374151'}" opacity="0.8"/>

          <!-- RESET -->
          <rect x="0" y="176.53" width="15" height="6" fill="#d1d5db" stroke="#9ca3af" stroke-width="0.5"/>
          <text x="18" y="182" font-family="monospace" font-size="6" fill="#e5e7eb">RESET</text>
          <circle cx="8" cy="179.53" r="2" fill="${resetColor}" opacity="0.8"/>

          <!-- SLEEP -->
          <rect x="0" y="212.43" width="15" height="6" fill="#d1d5db" stroke="#9ca3af" stroke-width="0.5"/>
          <text x="18" y="218" font-family="monospace" font-size="6" fill="#e5e7eb">SLEEP</text>
          <circle cx="8" cy="215.43" r="2" fill="${sleepColor}" opacity="0.8"/>

          <!-- STEP -->
          <rect x="0" y="248.34" width="15" height="6" fill="#d1d5db" stroke="#9ca3af" stroke-width="0.5"/>
          <text x="18" y="254" font-family="monospace" font-size="6" fill="#e5e7eb">STEP</text>
          <circle cx="8" cy="251.34" r="2" fill="${stepColor}" opacity="0.8"/>

          <!-- DIR -->
          <rect x="0" y="284.24" width="15" height="6" fill="#d1d5db" stroke="#9ca3af" stroke-width="0.5"/>
          <text x="18" y="290" font-family="monospace" font-size="6" fill="#e5e7eb">DIR</text>
          <circle cx="8" cy="287.24" r="2" fill="${dirColor}" opacity="0.8"/>
        </g>

        <!-- Right Side Pins -->
        <g id="right-pins">
          <!-- VDD -->
          <rect x="98.39" y="32.91" width="15" height="6" fill="#d1d5db" stroke="#9ca3af" stroke-width="0.5"/>
          <text x="95" y="38" font-family="monospace" font-size="6" fill="#e5e7eb" text-anchor="end">VDD</text>

          <!-- GND -->
          <rect x="98.39" y="68.81" width="15" height="6" fill="#d1d5db" stroke="#9ca3af" stroke-width="0.5"/>
          <text x="95" y="74" font-family="monospace" font-size="6" fill="#e5e7eb" text-anchor="end">GND</text>

          <!-- 2B -->
          <rect x="98.39" y="104.72" width="15" height="6" fill="#d1d5db" stroke="#9ca3af" stroke-width="0.5"/>
          <text x="95" y="110" font-family="monospace" font-size="6" fill="#e5e7eb" text-anchor="end">2B</text>

          <!-- 2A -->
          <rect x="98.39" y="140.62" width="15" height="6" fill="#d1d5db" stroke="#9ca3af" stroke-width="0.5"/>
          <text x="95" y="146" font-family="monospace" font-size="6" fill="#e5e7eb" text-anchor="end">2A</text>

          <!-- 1A -->
          <rect x="98.39" y="176.53" width="15" height="6" fill="#d1d5db" stroke="#9ca3af" stroke-width="0.5"/>
          <text x="95" y="182" font-family="monospace" font-size="6" fill="#e5e7eb" text-anchor="end">1A</text>

          <!-- 1B -->
          <rect x="98.39" y="212.43" width="15" height="6" fill="#d1d5db" stroke="#9ca3af" stroke-width="0.5"/>
          <text x="95" y="218" font-family="monospace" font-size="6" fill="#e5e7eb" text-anchor="end">1B</text>

          <!-- VMOT -->
          <rect x="98.39" y="248.34" width="15" height="6" fill="#d1d5db" stroke="#9ca3af" stroke-width="0.5"/>
          <text x="95" y="254" font-family="monospace" font-size="6" fill="#e5e7eb" text-anchor="end">VMOT</text>

          <!-- GND2 -->
          <rect x="98.39" y="284.24" width="15" height="6" fill="#d1d5db" stroke="#9ca3af" stroke-width="0.5"/>
          <text x="95" y="290" font-family="monospace" font-size="6" fill="#e5e7eb" text-anchor="end">GND</text>
        </g>

        <!-- Potentiometer (current adjustment) -->
        <circle cx="56.695" cy="50" r="8" fill="#fbbf24" stroke="#f59e0b" stroke-width="1"/>
        <circle cx="56.695" cy="50" r="5" fill="#1f2937" stroke="#374151" stroke-width="0.5"/>
        <line x1="56.695" y1="50" x2="60" y2="46" stroke="#9ca3af" stroke-width="1" stroke-linecap="round"/>

        <!-- Capacitors -->
        <rect x="20" y="260" width="8" height="15" rx="1" fill="#374151" stroke="#4b5563" stroke-width="0.5"/>
        <rect x="85" y="260" width="8" height="15" rx="1" fill="#374151" stroke="#4b5563" stroke-width="0.5"/>

        <!-- Status LED indicators -->
        <circle cx="30" cy="90" r="2.5" fill="${this.step ? '#22c55e' : '#1f2937'}" opacity="0.9"/>
        <circle cx="83" cy="90" r="2.5" fill="${!this.enable && this.sleep ? '#22c55e' : '#1f2937'}" opacity="0.9"/>

        <!-- Board text -->
        <text x="56.695" y="315" font-family="monospace" font-size="8" fill="#94a3b8" text-anchor="middle">
          A4988
        </text>
      </svg>
    `;
    }
}
