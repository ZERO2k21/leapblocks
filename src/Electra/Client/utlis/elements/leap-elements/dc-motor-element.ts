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
      { name: 'POS', x: 5, y: 31, number: 1, signals: [] },
      { name: 'NEG', x: 5, y: 51, number: 2, signals: [] },
    ];
  }

  private _lastTimestamp = 0;
  private _rotation = 0;

  runAnimationLoop() {
    const animate = (timestamp: number) => {
      if (!this._lastTimestamp) this._lastTimestamp = timestamp;
      const delta = timestamp - this._lastTimestamp;
      this._lastTimestamp = timestamp;

      if (this.speed > 0) {
        const rotationDelta = (this.speed * delta * 0.5);
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
    const isRunning = this.speed > 0;
    
    return html`
      <div class="${isRunning ? 'vibrating' : ''}" style="width: 160px; height: 80px;">
        <svg
          width="160"
          height="80"
          viewBox="0 0 160 80"
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
            <rect x="0" y="0" width="85" height="60" rx="3" fill="url(#yellow-grad)" stroke="#b45309" stroke-width="0.5" />
            
            <!-- Housing Details (Screws/Lines) -->
            <line x1="0" y1="30" x2="85" y2="30" stroke="#b45309" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.4" />
            <circle cx="10" cy="10" r="2" fill="#b45309" opacity="0.2" />
            <circle cx="10" cy="50" r="2" fill="#b45309" opacity="0.2" />
            <circle cx="75" cy="10" r="2" fill="#b45309" opacity="0.2" />
            <circle cx="75" cy="50" r="2" fill="#b45309" opacity="0.2" />

            <!-- Output Shaft Area -->
            <rect x="65" y="15" width="20" height="30" rx="2" fill="#f59e0b" opacity="0.5" />
            
            <!-- Rotating Shaft -->
            <g transform="translate(75, 30) rotate(${this._rotation})">
              <!-- Cross or Gear Shape -->
              <rect x="-2" y="-12" width="4" height="24" rx="1" fill="#fef3c7" stroke="#b45309" stroke-width="0.5" />
              <rect x="-12" y="-2" width="24" height="4" rx="1" fill="#fef3c7" stroke="#b45309" stroke-width="0.5" />
              <circle cx="0" cy="0" r="5" fill="#fbbf24" stroke="#b45309" stroke-width="1" />
              <circle cx="0" cy="0" r="1.5" fill="#334155" />
            </g>
          </g>

          <!-- Front Plastic Tip -->
          <rect x="140" y="32" width="10" height="16" rx="1" fill="#fbbf24" stroke="#b45309" stroke-width="0.5" />
        </svg>
      </div>
    `;
  }
}
