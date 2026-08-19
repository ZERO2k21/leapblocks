/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { html, css, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ElementPin } from '.';

/**
 * Mini DC Water Pump Element (3V - 6V / 12V Submersible / Centrifugal Pump)
 * 
 * Pins:
 * - POS (+ / VCC): Positive Power Terminal
 * - NEG (- / GND): Ground / Negative Terminal
 */
@customElement('leap-water-pump')
export class WaterPumpElement extends LitElement {
  @property({ type: Number }) speed = 0;
  @property({ type: Boolean }) running = false;
  @property({ type: String }) direction = 'cw';
  @property({ type: Number }) flowRate = 0;

  static styles = css`
    :host {
      display: inline-block;
    }
    @keyframes glow-pulse {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.8; }
    }
    .running-glow {
      animation: glow-pulse 0.4s ease-in-out infinite;
    }
  `;

  get pinInfo(): ElementPin[] {
    return [
      { name: 'POS', x: 2, y: 35, number: 1, signals: [{ type: 'power', signal: 'VCC' }], description: 'Positive Terminal (+)' },
      { name: 'NEG', x: 2, y: 55, number: 2, signals: [{ type: 'power', signal: 'GND' }], description: 'Negative Terminal (-)' },
    ];
  }

  private _rafId = 0;
  private _lastTimestamp = 0;
  private _visualSpeed = 0;
  private _rotation = 0;
  private _waterOffset = 0;

  connectedCallback() {
    super.connectedCallback();
    const spd = Number(this.speed) || 0;
    if (this.running || spd > 0) {
      this._startAnimation();
    }
  }

  private _animate = (timestamp: number) => {
    if (!this._lastTimestamp) this._lastTimestamp = timestamp;
    const dt = Math.min(timestamp - this._lastTimestamp, 50);
    this._lastTimestamp = timestamp;

    const spd = Number(this.speed) || 0;
    const active = Boolean(this.running) || spd > 0;
    const targetSpeed = active ? (spd > 0 ? Math.abs(spd) : 1.0) : 0;

    // Smooth speed acceleration and coasting
    if (targetSpeed > this._visualSpeed) {
      this._visualSpeed = Math.min(this._visualSpeed + dt * 0.02, targetSpeed);
    } else if (targetSpeed < this._visualSpeed) {
      this._visualSpeed = Math.max(this._visualSpeed - dt * 0.01, 0);
    }

    if (this._visualSpeed > 0.001) {
      const rotationDelta = Math.max(this._visualSpeed * dt * 2.0, 1.5);
      this._rotation += (this.direction === 'ccw' ? -rotationDelta : rotationDelta);
      this._rotation %= 360;

      this._waterOffset = (this._waterOffset + Math.max(this._visualSpeed * dt * 1.0, 1.0)) % 30;
      this.requestUpdate();
    }

    if (this._visualSpeed > 0.001 || active) {
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
    if (changedProperties.has('speed') || changedProperties.has('running') || changedProperties.has('direction')) {
      const spd = Number(this.speed) || 0;
      const active = Boolean(this.running) || spd > 0;
      console.log(`[LEAP WATER PUMP] 💦 WebComponent state updated: running=${active}, speed=${spd}, dir=${this.direction}`);
      if (active || this._visualSpeed > 0.001) {
        this._startAnimation();
      }
    }
  }

  render() {
    const isRunning = this._visualSpeed > 0.01;
    const displayFlowRate = Math.round(this._visualSpeed * 120); // Liters per hour

    // Water bubble particle positions along outlet pipe
    const bubbleOffsets = [0, 10, 20];

    return html`
      <div style="width: 180px; height: 90px;">
        <svg
          width="180"
          height="90"
          viewBox="0 0 180 90"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <!-- Metallic Body Gradient -->
            <linearGradient id="pump-body-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#334155;stop-opacity:1" />
              <stop offset="40%" style="stop-color:#475569;stop-opacity:1" />
              <stop offset="70%" style="stop-color:#1e293b;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
            </linearGradient>

            <!-- Chamber Gradient -->
            <linearGradient id="chamber-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#0284c7;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#0369a1;stop-opacity:1" />
            </linearGradient>

            <!-- Water Liquid Gradient -->
            <linearGradient id="water-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:#38bdf8;stop-opacity:0.8" />
              <stop offset="50%" style="stop-color:#0284c7;stop-opacity:0.9" />
              <stop offset="100%" style="stop-color:#0ea5e9;stop-opacity:0.8" />
            </linearGradient>

            <!-- Glow Gradient -->
            <radialGradient id="pump-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style="stop-color:#0284c7;stop-opacity:0.8" />
              <stop offset="100%" style="stop-color:#0284c7;stop-opacity:0" />
            </radialGradient>

            <!-- Shadow Filter -->
            <filter id="pump-shadow" x="-10%" y="-10%" width="130%" height="130%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
              <feOffset dx="1" dy="1.5" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.35" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <!-- Motor / Pump Main Body Shadow Group -->
          <g filter="url(#pump-shadow)">
            <!-- Terminal Pins (POS / NEG) on Left -->
            <rect x="0" y="31" width="8" height="8" rx="1.5" fill="#ef4444" stroke="#b91c1c" stroke-width="0.5" />
            <text x="4" y="37" font-family="sans-serif" font-size="6" font-weight="bold" fill="#ffffff" text-anchor="middle">+</text>

            <rect x="0" y="51" width="8" height="8" rx="1.5" fill="#334155" stroke="#1e293b" stroke-width="0.5" />
            <text x="4" y="57" font-family="sans-serif" font-size="7" font-weight="bold" fill="#ffffff" text-anchor="middle">-</text>

            <!-- Main Motor Cylinder -->
            <rect x="8" y="22" width="60" height="46" rx="5" fill="url(#pump-body-grad)" stroke="#64748b" stroke-width="0.5" />
            <rect x="14" y="27" width="48" height="3" fill="#0284c7" opacity="0.6" />
            <rect x="14" y="60" width="48" height="3" fill="#0284c7" opacity="0.6" />

            <!-- Motor Label -->
            <text x="38" y="44" font-family="monospace" font-size="7" font-weight="bold" fill="#94a3b8" text-anchor="middle">WATER PUMP</text>
            <text x="38" y="52" font-family="sans-serif" font-size="6" fill="#0284c7" text-anchor="middle">DC 3V-6V</text>

            <!-- Status Indicator LED -->
            <circle cx="60" cy="30" r="2.5" fill="${isRunning ? '#0ea5e9' : '#475569'}" />
            ${isRunning ? html`
              <circle cx="60" cy="30" r="4" fill="url(#pump-glow)" class="running-glow" />
            ` : ''}

            <!-- Pump Housing / Impeller Chamber -->
            <rect x="68" y="18" width="54" height="54" rx="12" fill="url(#chamber-grad)" stroke="#0369a1" stroke-width="1" />
            <circle cx="95" cy="45" r="21" fill="#0c4a6e" stroke="#38bdf8" stroke-width="1.5" />

            <!-- Rotating Impeller Blades -->
            <g transform="translate(95, 45) rotate(${this._rotation})">
              <circle cx="0" cy="0" r="6" fill="#e0f2fe" stroke="#0284c7" stroke-width="1" />
              <!-- 4 Impeller Vanes -->
              <path d="M 0 -5 C 8 -15 14 -12 12 -2 C 10 5 0 5 0 -5 Z" fill="#38bdf8" stroke="#0284c7" stroke-width="0.5" />
              <path d="M 5 0 C 15 8 12 14 2 12 C -5 10 -5 0 5 0 Z" fill="#38bdf8" stroke="#0284c7" stroke-width="0.5" />
              <path d="M 0 5 C -8 15 -14 12 -12 2 C -10 -5 0 -5 0 5 Z" fill="#38bdf8" stroke="#0284c7" stroke-width="0.5" />
              <path d="M -5 0 C -15 -8 -12 -14 -2 -12 C 5 -10 5 0 -5 0 Z" fill="#38bdf8" stroke="#0284c7" stroke-width="0.5" />
              <circle cx="0" cy="0" r="3" fill="#0284c7" />
            </g>

            <!-- Water Inlet Pipe (Bottom Front) -->
            <rect x="87" y="72" width="16" height="12" rx="2" fill="#0284c7" stroke="#0369a1" stroke-width="0.8" />
            <line x1="91" y1="84" x2="99" y2="84" stroke="#e0f2fe" stroke-width="1.5" stroke-linecap="round" />

            <!-- Water Outlet Nozzle & Transparent Water Pipe (Right Side) -->
            <path d="M 122 37 L 165 37 C 168 37 170 39 170 42 L 170 48 C 170 51 168 53 165 53 L 122 53 Z" fill="url(#water-grad)" stroke="#0284c7" stroke-width="0.8" opacity="${isRunning ? 0.95 : 0.4}" />

            <!-- Water Particles / Flow Motion in Outlet Pipe -->
            ${isRunning ? bubbleOffsets.map(offset => {
              const posX = 126 + ((this._waterOffset + offset) % 38);
              return html`
                <circle cx="${posX}" cy="42" r="1.5" fill="#ffffff" opacity="0.8" />
                <circle cx="${posX + 4}" cy="48" r="1" fill="#e0f2fe" opacity="0.9" />
              `;
            }) : ''}

            <!-- Water Spray / Flow Jet Emitting from Nozzle -->
            ${isRunning ? html`
              <g transform="translate(170, 45)">
                <!-- Animated Water Jet Drops -->
                <ellipse cx="${(this._waterOffset % 8) + 2}" cy="-3" rx="2.5" ry="1.2" fill="#38bdf8" opacity="0.8" />
                <ellipse cx="${(this._waterOffset % 8) + 6}" cy="2" rx="3" ry="1.5" fill="#7dd3fc" opacity="0.9" />
                <ellipse cx="${(this._waterOffset % 8) + 10}" cy="-1" rx="2" ry="1" fill="#bae6fd" opacity="0.7" />
              </g>
            ` : ''}

            <!-- Flow Rate Badge -->
            <rect x="122" y="14" width="46" height="14" rx="3" fill="#0f172a" stroke="#0284c7" stroke-width="0.8" />
            <text x="145" y="24" font-family="monospace" font-size="7" font-weight="bold" fill="${isRunning ? '#38bdf8' : '#64748b'}" text-anchor="middle">
              ${isRunning ? `${displayFlowRate} L/h` : 'OFF'}
            </text>
          </g>
        </svg>
      </div>
    `;
  }
}
