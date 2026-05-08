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
          <!-- Terminals (Tabs) -->
          <rect x="0" y="25" width="8" height="12" fill="#d97706" rx="1" /> <!-- POS -->
          <rect x="0" y="45" width="8" height="12" fill="#d97706" rx="1" /> <!-- NEG -->
          <circle cx="5" cy="31" r="2" fill="#475569" /> <!-- Hole POS -->
          <circle cx="5" cy="51" r="2" fill="#475569" /> <!-- Hole NEG -->

          <!-- Motor Back (Black End) -->
          <path d="M 8 20 L 15 20 L 15 60 L 8 60 Z" fill="#1f2937" />
          
          <!-- Silver Motor Body -->
          <rect x="15" y="20" width="35" height="40" fill="#cbd5e1" stroke="#94a3b8" stroke-width="0.5" />
          <text x="35" y="40" font-family="sans-serif" font-size="8" font-weight="bold" fill="#64748b" transform="rotate(-90, 35, 40)" text-anchor="middle">DC 3-6V</text>

          <!-- Yellow Gearbox -->
          <g transform="translate(50, 10)">
            <!-- Main Body -->
            <rect x="0" y="0" width="90" height="60" rx="4" fill="#fbbf24" stroke="#d97706" stroke-width="1" />
            <rect x="0" y="25" width="90" height="10" fill="#f59e0b" opacity="0.3" /> <!-- Center Line -->
            
            <!-- Shaft Output Area -->
            <rect x="75" y="15" width="15" height="30" fill="#f59e0b" rx="2" />
            
            <!-- Shaft -->
            <g transform="translate(85, 30) rotate(${this._rotation})">
              <rect x="-2" y="-12" width="4" height="24" fill="#fbbf24" stroke="#d97706" stroke-width="0.5" />
              <circle cx="0" cy="0" r="4" fill="#f59e0b" stroke="#d97706" />
            </g>
          </g>
          
          <!-- Front Gearbox Tip -->
          <rect x="140" y="32" width="10" height="16" fill="#fbbf24" stroke="#d97706" stroke-width="1" />
        </svg>
      </div>
    `;
  }
}
