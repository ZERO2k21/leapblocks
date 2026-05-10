import { html, css, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ElementPin } from '.';

@customElement('leap-dc-motor')
export class DCMotorElement extends LitElement {
  @property({ type: Number }) speed = 0; // 0 to 1
  @property({ type: String }) direction = 'cw';

  static styles = css`
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes spin-ccw {
      from { transform: rotate(360deg); }
      to { transform: rotate(0deg); }
    }
    @keyframes vibrate {
      0% { transform: translate(0,0); }
      25% { transform: translate(0.5px, 0.5px); }
      50% { transform: translate(-0.5px, 0.5px); }
      75% { transform: translate(0.5px, -0.5px); }
      100% { transform: translate(0,0); }
    }
    .spinning {
      transform-origin: center;
    }
    .vibrating {
      animation: vibrate 0.05s infinite linear;
    }
  `;

  get pinInfo(): ElementPin[] {
    return [
      { name: 'POS', x: 2, y: 31, number: 1, signals: [] },
      { name: 'NEG', x: 2, y: 51, number: 2, signals: [] },
    ];
  }

  private _lastTimestamp = 0;
  private _rotation = 0;

  runAnimationLoop() {
    const animate = (timestamp: number) => {
      if (!this._lastTimestamp) this._lastTimestamp = timestamp;
      const delta = timestamp - this._lastTimestamp;
      this._lastTimestamp = timestamp;

      if (this.speed !== 0) {
        const absSpeed = Math.abs(this.speed);
        const rotationDelta = (absSpeed * delta * 0.8);
        this._rotation += (this.direction === 'cw' ? rotationDelta : -rotationDelta);
        this._rotation %= 360;
        this.requestUpdate();
      }
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  firstUpdated() {
    this.runAnimationLoop();
  }

  render() {
    const isRunning = this.speed !== 0;

    // Pre-compute spoke geometry for the wheel
    const treadAngles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
    const spokeAngles = [0, 72, 144, 216, 288];

    return html`
      <div class="${isRunning ? 'vibrating' : ''}" style="width: 200px; height: 80px;">
        <svg
          width="200"
          height="80"
          viewBox="0 0 200 80"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="silver-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#cbd5e1;stop-opacity:1" />
              <stop offset="50%" style="stop-color:#f1f5f9;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#94a3b8;stop-opacity:1" />
            </linearGradient>
            <linearGradient id="yellow-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#fcd34d;stop-opacity:1" />
              <stop offset="50%" style="stop-color:#fbbf24;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#d97706;stop-opacity:1" />
            </linearGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
              <feOffset dx="0.5" dy="0.5" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <!-- Motor Body (Silver) -->
          <g filter="url(#shadow)">
            <!-- Back Plastic Cap -->
            <rect x="2" y="25" width="12" height="30" rx="2" fill="#334155" />
            
            <!-- Main Metal Cylinder -->
            <rect x="10" y="20" width="45" height="40" rx="4" fill="url(#silver-grad)" stroke="#64748b" stroke-width="0.5" />
            
            <!-- Terminals -->
            <rect x="0" y="28" width="6" height="8" rx="1" fill="#d97706" /> <!-- POS -->
            <rect x="0" y="44" width="6" height="8" rx="1" fill="#d97706" /> <!-- NEG -->
            <circle cx="3" cy="32" r="1.5" fill="#1e293b" />
            <circle cx="3" cy="48" r="1.5" fill="#1e293b" />

            <!-- Text on Body -->
            <text x="32" y="40" font-family="monospace" font-size="7" font-weight="bold" fill="#64748b" transform="rotate(-90, 32, 40)" text-anchor="middle">DC 3-6V</text>
          </g>
          
          <!-- Yellow Gearbox -->
          <g transform="translate(55, 10)" filter="url(#shadow)">
            <!-- Main Housing -->
            <rect x="0" y="0" width="50" height="60" rx="3" fill="url(#yellow-grad)" stroke="#b45309" stroke-width="0.5" />
            
            <!-- Housing Details (Screws/Lines) -->
            <line x1="0" y1="30" x2="50" y2="30" stroke="#b45309" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.4" />
            <circle cx="8" cy="8" r="2" fill="#b45309" opacity="0.2" />
            <circle cx="8" cy="52" r="2" fill="#b45309" opacity="0.2" />
            <circle cx="42" cy="8" r="2" fill="#b45309" opacity="0.2" />
            <circle cx="42" cy="52" r="2" fill="#b45309" opacity="0.2" />

            <!-- Shaft Bearing -->
            <circle cx="50" cy="30" r="5" fill="#e5e7eb" stroke="#9ca3af" stroke-width="0.5" />
            <circle cx="50" cy="30" r="2.5" fill="#d1d5db" stroke="#6b7280" stroke-width="0.3" />
          </g>

          <!-- Axle connecting gearbox to wheel (Shortened) -->
          <rect x="105" y="38" width="20" height="4" rx="1" fill="#9ca3af" stroke="#6b7280" stroke-width="0.3" />

          <!-- Wheel/Tire Assembly (Shifted Left) -->
          <g transform="translate(125, 40) rotate(${this._rotation})">
            <!-- Outer Tire (black rubber) -->
            <circle cx="0" cy="0" r="32" fill="#1e293b" stroke="#0f172a" stroke-width="1.5" />
            
            <!-- Tire Tread Marks -->
            ${treadAngles.map(angle => html`
              <line 
                x1="${Math.cos(angle * Math.PI / 180) * 26}" 
                y1="${Math.sin(angle * Math.PI / 180) * 26}" 
                x2="${Math.cos(angle * Math.PI / 180) * 32}" 
                y2="${Math.sin(angle * Math.PI / 180) * 32}" 
                stroke="#374151" stroke-width="3" stroke-linecap="round"
              />
            `)}
            
            <!-- Inner Tire Wall -->
            <circle cx="0" cy="0" r="24" fill="#334155" stroke="#475569" stroke-width="0.5" />
            
            <!-- Wheel Rim (silver) -->
            <circle cx="0" cy="0" r="18" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" />
            
            <!-- 5 Spokes with arrow markers -->
            ${spokeAngles.map(angle => html`
              <line 
                x1="${Math.cos(angle * Math.PI / 180) * 5}" 
                y1="${Math.sin(angle * Math.PI / 180) * 5}" 
                x2="${Math.cos(angle * Math.PI / 180) * 16}" 
                y2="${Math.sin(angle * Math.PI / 180) * 16}" 
                stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"
              />
              <polygon 
                points="${Math.cos(angle * Math.PI / 180) * 16},${Math.sin(angle * Math.PI / 180) * 16} ${Math.cos((angle - 15) * Math.PI / 180) * 12},${Math.sin((angle - 15) * Math.PI / 180) * 12} ${Math.cos((angle + 15) * Math.PI / 180) * 12},${Math.sin((angle + 15) * Math.PI / 180) * 12}"
                fill="#64748b"
              />
            `)}
            
            <!-- Center Hub -->
            <circle cx="0" cy="0" r="5" fill="#fbbf24" stroke="#b45309" stroke-width="1" />
            <circle cx="0" cy="0" r="2" fill="#334155" />
            
            <!-- Red dot marker for tracking rotation -->
            <circle cx="0" cy="-14" r="3" fill="#ef4444" stroke="#b91c1c" stroke-width="0.5" />
          </g>

          <!-- Direction Indicator (non-rotating, shown only when running) -->
          ${isRunning ? html`
            <!-- Direction Arrow Arc -->
            <path 
              d="${this.direction === 'cw'
          ? 'M 138 4 A 16 16 0 0 1 152 16'
          : 'M 152 4 A 16 16 0 0 0 138 16'}" 
              fill="none" 
              stroke="#22c55e" 
              stroke-width="2" 
              stroke-linecap="round"
            />
            <!-- Arrow head -->
            <polygon 
              points="${this.direction === 'cw'
          ? '152,16 149,10 155,12'
          : '138,16 135,12 141,10'}" 
              fill="#22c55e" 
            />
            <!-- CW/CCW Label -->
            <text 
              x="145" y="3" 
              font-family="monospace" 
              font-size="7" 
              font-weight="bold" 
              fill="#22c55e" 
              text-anchor="middle"
            >${this.direction === 'cw' ? 'CW' : 'CCW'}</text>
          ` : ''}
        </svg>
      </div>
    `;
  }
}
