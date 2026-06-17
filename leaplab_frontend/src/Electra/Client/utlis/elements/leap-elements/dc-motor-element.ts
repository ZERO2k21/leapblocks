import { html, css, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ElementPin } from '.';

@customElement('leap-dc-motor')
export class DCMotorElement extends LitElement {
  @property({ type: Number }) speed = 0;
  @property({ type: String }) direction = 'cw';

  static styles = css`
    @keyframes glow-pulse {
      0%, 100% { opacity: 0.2; }
      50% { opacity: 0.5; }
    }
    .running-glow {
      animation: glow-pulse 0.25s ease-in-out infinite;
    }
  `;

  get pinInfo(): ElementPin[] {
    return [
      { name: 'POS', x: 2, y: 31, number: 1, signals: [] },
      { name: 'NEG', x: 2, y: 51, number: 2, signals: [] },
    ];
  }

  private _rafId = 0;
  private _lastTimestamp = 0;
  private _visualSpeed = 0;
  private _rotation = 0;
  private _lastDirection = 'cw';

  private _animate = (timestamp: number) => {
    if (!this._lastTimestamp) this._lastTimestamp = timestamp;
    const dt = Math.min(timestamp - this._lastTimestamp, 50);
    this._lastTimestamp = timestamp;

    const targetSpeed = this.speed !== 0 ? Math.abs(this.speed) : 0;

    // Fast acceleration, slower deceleration (coasting)
    if (targetSpeed > this._visualSpeed) {
      this._visualSpeed = Math.min(this._visualSpeed + dt * 0.005, targetSpeed);
    } else if (targetSpeed < this._visualSpeed) {
      this._visualSpeed = Math.max(this._visualSpeed - dt * 0.0012, 0);
    }

    if (this._visualSpeed > 0.001) {
      if (this.speed !== 0) this._lastDirection = this.direction;
      const rotationDelta = this._visualSpeed * dt * 0.8;
      this._rotation += (this._lastDirection === 'cw' ? rotationDelta : -rotationDelta);
      this._rotation %= 360;
      this.requestUpdate();
    }

    if (this._visualSpeed > 0.001 || this.speed !== 0) {
      this._rafId = requestAnimationFrame(this._animate);
    } else {
      this._rafId = 0;
    }
  };

  private _startAnimation() {
    if (!this._rafId) {
      this._lastTimestamp = 0;
      this._rafId = requestAnimationFrame(this._animate);
    }
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('speed') || changedProperties.has('direction')) {
      if (this.speed !== 0 || this._visualSpeed > 0.001) {
        this._startAnimation();
      }
    }
  }

  render() {
    const isRunning = this._visualSpeed > 0.01;

    // Brush commutation jitter — subtle unevenness in rotation
    const jitter = isRunning ? (Math.random() - 0.5) * this._visualSpeed * 0.3 : 0;
    const displayRotation = this._rotation + jitter;

    const treadAngles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
    const spokeAngles = [0, 72, 144, 216, 288];
    const speedLinesAlpha = this._visualSpeed > 0.3 ? Math.min((this._visualSpeed - 0.3) / 0.7, 0.4) : 0;

    return html`
      <div style="width: 200px; height: 80px;">
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
            <radialGradient id="glow-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style="stop-color:#ef4444;stop-opacity:0.6" />
              <stop offset="100%" style="stop-color:#ef4444;stop-opacity:0" />
            </radialGradient>
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

          <!-- Motor Body -->
          <g filter="url(#shadow)">
            ${isRunning ? html`
              <rect x="2" y="25" width="12" height="30" rx="2" fill="url(#glow-grad)" class="running-glow" />
            ` : ''}
            <rect x="2" y="25" width="12" height="30" rx="2" fill="#334155" />
            <rect x="10" y="20" width="45" height="40" rx="4" fill="url(#silver-grad)" stroke="#64748b" stroke-width="0.5" />
            <rect x="0" y="28" width="6" height="8" rx="1" fill="#d97706" />
            <rect x="0" y="44" width="6" height="8" rx="1" fill="#d97706" />
            <circle cx="3" cy="32" r="1.5" fill="#1e293b" />
            <circle cx="3" cy="48" r="1.5" fill="#1e293b" />
            <text x="32" y="40" font-family="monospace" font-size="7" font-weight="bold" fill="#64748b" transform="rotate(-90, 32, 40)" text-anchor="middle">DC 3-6V</text>
          </g>
          
          <!-- Yellow Gearbox -->
          <g transform="translate(55, 10)" filter="url(#shadow)">
            <rect x="0" y="0" width="50" height="60" rx="3" fill="url(#yellow-grad)" stroke="#b45309" stroke-width="0.5" />
            <line x1="0" y1="30" x2="50" y2="30" stroke="#b45309" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.4" />
            <circle cx="8" cy="8" r="2" fill="#b45309" opacity="0.2" />
            <circle cx="8" cy="52" r="2" fill="#b45309" opacity="0.2" />
            <circle cx="42" cy="8" r="2" fill="#b45309" opacity="0.2" />
            <circle cx="42" cy="52" r="2" fill="#b45309" opacity="0.2" />
            <circle cx="50" cy="30" r="5" fill="#e5e7eb" stroke="#9ca3af" stroke-width="0.5" />
            <circle cx="50" cy="30" r="2.5" fill="#d1d5db" stroke="#6b7280" stroke-width="0.3" />
          </g>

          <!-- Axle -->
          <rect x="105" y="38" width="20" height="4" rx="1" fill="#9ca3af" stroke="#6b7280" stroke-width="0.3" />

          <!-- Speed lines (visible above ~30% speed) -->
          ${speedLinesAlpha > 0 ? html`
            <g opacity="${speedLinesAlpha}">
              <line x1="100" y1="20" x2="115" y2="18" stroke="#94a3b8" stroke-width="1" stroke-linecap="round" />
              <line x1="102" y1="60" x2="112" y2="58" stroke="#94a3b8" stroke-width="0.8" stroke-linecap="round" />
              <line x1="108" y1="14" x2="118" y2="12" stroke="#94a3b8" stroke-width="0.6" stroke-linecap="round" />
              <line x1="106" y1="66" x2="116" y2="64" stroke="#94a3b8" stroke-width="0.6" stroke-linecap="round" />
            </g>
          ` : ''}

          <!-- Wheel -->
          <g transform="translate(125, 40) rotate(${displayRotation})">
            <circle cx="0" cy="0" r="32" fill="#1e293b" stroke="#0f172a" stroke-width="1.5" />
            ${treadAngles.map(angle => html`
              <line x1="${Math.cos(angle * Math.PI / 180) * 26}" y1="${Math.sin(angle * Math.PI / 180) * 26}" x2="${Math.cos(angle * Math.PI / 180) * 32}" y2="${Math.sin(angle * Math.PI / 180) * 32}" stroke="#374151" stroke-width="3" stroke-linecap="round" />
            `)}
            <circle cx="0" cy="0" r="24" fill="#334155" stroke="#475569" stroke-width="0.5" />
            <circle cx="0" cy="0" r="18" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" />
            ${spokeAngles.map(angle => html`
              <line x1="${Math.cos(angle * Math.PI / 180) * 5}" y1="${Math.sin(angle * Math.PI / 180) * 5}" x2="${Math.cos(angle * Math.PI / 180) * 16}" y2="${Math.sin(angle * Math.PI / 180) * 16}" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round" />
              <polygon points="${Math.cos(angle * Math.PI / 180) * 16},${Math.sin(angle * Math.PI / 180) * 16} ${Math.cos((angle - 15) * Math.PI / 180) * 12},${Math.sin((angle - 15) * Math.PI / 180) * 12} ${Math.cos((angle + 15) * Math.PI / 180) * 12},${Math.sin((angle + 15) * Math.PI / 180) * 12}" fill="#64748b" />
            `)}
            <circle cx="0" cy="0" r="5" fill="#fbbf24" stroke="#b45309" stroke-width="1" />
            <circle cx="0" cy="0" r="2" fill="#334155" />
            <circle cx="0" cy="-14" r="3" fill="#ef4444" stroke="#b91c1c" stroke-width="0.5" />
          </g>

          <!-- Direction Indicator -->
          ${isRunning ? html`
            <path d="${this._lastDirection === 'cw' ? 'M 138 4 A 16 16 0 0 1 152 16' : 'M 152 4 A 16 16 0 0 0 138 16'}" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" />
            <polygon points="${this._lastDirection === 'cw' ? '152,16 149,10 155,12' : '138,16 135,12 141,10'}" fill="#22c55e" />
            <text x="145" y="3" font-family="monospace" font-size="7" font-weight="bold" fill="#22c55e" text-anchor="middle">${this._lastDirection === 'cw' ? 'CW' : 'CCW'}</text>
          ` : ''}
        </svg>
      </div>
    `;
  }
}
