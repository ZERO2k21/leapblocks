/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { css, html, LitElement, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ElementPin } from '.';
import { analog, GND, VCC } from './pin';

/**
 * Red PCB Water Depth / Liquid Level Sensor Module
 * 3-Pin: S (Signal / AO) · + (VCC) · - (GND)
 *
 * Properties:
 *   value     - Water submersion depth level (0% = Dry, 100% = Fully Submerged)
 *   threshold - Digital OUT threshold (default 50%)
 *   ledPower  - Power LED status (ON when VCC connected)
 *   ledSignal - Signal active status
 */
@customElement('leap-water-level-float-sensor')
export class WaterLevelFloatSensorElement extends LitElement {
  /** Water depth submersion percentage (0 = Dry, 100 = Fully Submerged) */
  @property({ type: Number }) value = 0;

  /** Digital OUT activation threshold level percentage (default 50%) */
  @property({ type: Number }) threshold = 50;

  /** Power LED status */
  @property({ type: Boolean }) ledPower = false;

  /** Signal indicator status */
  @property({ type: Boolean }) ledSignal = false;

  /** Float switch contact state (ON/OFF) */
  @property({ type: Boolean }) state = false;

  // Header Pins at top: S (x:75, y:10), + (x:100, y:10), - (x:125, y:10)
  readonly pinInfo: ElementPin[] = [
    { name: 'S',   x: 75,  y: 10, signals: [analog(0)], description: 'Signal Output (0V - 5V Analog)' },
    { name: 'OUT', x: 75,  y: 10, signals: [], description: 'Signal Output (Alias S)' },
    { name: 'AO',  x: 75,  y: 10, signals: [analog(0)], description: 'Analog Depth Output' },
    { name: 'VCC', x: 100, y: 10, signals: [VCC()], description: 'Power Input (+5V / 3.3V)' },
    { name: '+',   x: 100, y: 10, signals: [VCC()], description: 'Power Input (+)' },
    { name: 'GND', x: 125, y: 10, signals: [GND()], description: 'Ground (0V)' },
    { name: '-',   x: 125, y: 10, signals: [GND()], description: 'Ground (-)' },
  ];

  static get styles() {
    return css`
      :host {
        display: inline-block;
        user-select: none;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .wrap {
        position: relative;
        display: inline-block;
        line-height: 0;
      }
      .range-slider {
        -webkit-appearance: none;
        width: 110px;
        height: 5px;
        border-radius: 3px;
        background: #1e293b;
        outline: none;
        cursor: pointer;
      }
      .range-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #38bdf8;
        border: 2px solid #ffffff;
        cursor: pointer;
        box-shadow: 0 0 6px #38bdf8;
        transition: transform 0.15s ease;
      }
      .range-slider::-webkit-slider-thumb:hover {
        transform: scale(1.2);
      }
      .water-glow {
        filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.7));
      }
    `;
  }

  private _onSliderInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const newLevel = Number(target.value);
    this.value = newLevel;

    const isTriggered = this.value >= (this.threshold ?? 50);
    this.state = isTriggered;

    this.dispatchEvent(new CustomEvent('pinStateChange', {
      detail: { pinName: 'S', state: isTriggered, value: this.value },
      bubbles: true,
      composed: true,
    }));
    this.requestUpdate();
  }

  render() {
    const level = Math.max(0, Math.min(100, Number(this.value) || 0));
    const thresh = Math.max(0, Math.min(100, Number(this.threshold) || 50));
    const isTriggered = level >= thresh || this.state;

    const showPower = this.ledPower;

    // Submersion height along conductive trace area (y=96 down to y=285, total height = 189px)
    const submersionHeight = (level / 100) * 189;
    const waterY = 285 - submersionHeight;

    return html`
      <div class="wrap">
        <svg
          width="180"
          height="270"
          viewBox="0 0 200 300"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <!-- Red PCB Solder Mask Gradient (Exact match for user image) -->
            <linearGradient id="redPcbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#dc2626;stop-opacity:1" />
              <stop offset="50%" style="stop-color:#b91c1c;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#991b1b;stop-opacity:1" />
            </linearGradient>

            <!-- Gold/Silver Conductive Trace Gradient -->
            <linearGradient id="traceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#fef08a;stop-opacity:1" />
              <stop offset="50%" style="stop-color:#eab308;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#ca8a04;stop-opacity:1" />
            </linearGradient>

            <!-- Submersion Liquid Gradient -->
            <linearGradient id="waterFillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#38bdf8;stop-opacity:0.75" />
              <stop offset="100%" style="stop-color:#0284c7;stop-opacity:0.85" />
            </linearGradient>

            <!-- Metallic Pins Gradient -->
            <linearGradient id="pinMetalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:#94a3b8;stop-opacity:1" />
              <stop offset="50%" style="stop-color:#f8fafc;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#64748b;stop-opacity:1" />
            </linearGradient>
          </defs>

          <!-- ── 3 METALLIC HEADER PINS (S at x=75, + at x=100, - at x=125, tip y=10) ── -->
          <!-- Black Header Block (x=62 to 138, y=28 to 44) -->
          <rect x="62" y="28" width="76" height="16" rx="2" fill="#0f172a" stroke="#000000" stroke-width="0.8" />

          <!-- Extended Male Header Pins -->
          <rect x="73" y="8" width="4" height="22" rx="1" fill="url(#pinMetalGrad)" stroke="#475569" stroke-width="0.5" />
          <rect x="98" y="8" width="4" height="22" rx="1" fill="url(#pinMetalGrad)" stroke="#475569" stroke-width="0.5" />
          <rect x="123" y="8" width="4" height="22" rx="1" fill="url(#pinMetalGrad)" stroke="#475569" stroke-width="0.5" />

          <!-- ── RED PCB BOARD CONTOUR ── -->
          <path
            d="
              M 55,44 
              L 145,44 
              A 8,8 0 0,1 153,52 
              L 153,64 
              A 6,6 0 0,1 147,70 
              L 140,78 
              L 140,285 
              A 8,8 0 0,1 132,293 
              L 68,293 
              A 8,8 0 0,1 60,285 
              L 60,78 
              L 53,70 
              A 6,6 0 0,1 47,64 
              L 47,52 
              A 8,8 0 0,1 55,44 
              Z
            "
            fill="url(#redPcbGrad)"
            stroke="#7f1d1d"
            stroke-width="1.5"
          />

          <!-- Mounting Holes at Top Corners -->
          <circle cx="58" cy="56" r="4" fill="#1e293b" stroke="#7f1d1d" stroke-width="1" />
          <circle cx="142" cy="56" r="4" fill="#1e293b" stroke="#7f1d1d" stroke-width="1" />

          <!-- White Silkscreen Labels (S, +, -) -->
          <rect x="70" y="48" width="10" height="10" rx="1" fill="#ffffff" />
          <text x="75" y="56" font-size="8" font-family="sans-serif" font-weight="bold" fill="#000000" text-anchor="middle">S</text>

          <rect x="95" y="48" width="10" height="10" rx="1" fill="#ffffff" />
          <text x="100" y="56" font-size="8" font-family="sans-serif" font-weight="bold" fill="#000000" text-anchor="middle">+</text>

          <rect x="120" y="48" width="10" height="10" rx="1" fill="#ffffff" />
          <text x="125" y="56" font-size="8" font-family="sans-serif" font-weight="bold" fill="#000000" text-anchor="middle">-</text>

          <!-- SMD Transistor & Resistors -->
          <rect x="94" y="64" width="12" height="7" rx="1" fill="#1e293b" stroke="#000000" stroke-width="0.5" />
          <rect x="80" y="70" width="8" height="4" rx="0.5" fill="#334155" />
          <rect x="112" y="70" width="8" height="4" rx="0.5" fill="#334155" />

          <!-- Power LED & Label -->
          <circle cx="100" cy="78" r="2.5" fill="${showPower ? '#ef4444' : '#475569'}" />
          ${showPower ? svg`<circle cx="100" cy="78" r="5" fill="#ef4444" opacity="0.5" />` : ''}
          <text x="100" y="86" font-size="5.5" font-family="sans-serif" fill="#ffffff" font-weight="bold" text-anchor="middle">Power</text>

          <!-- ── 10 CONDUCTIVE PARALLEL SENSING TRACES ── -->
          ${[65, 71, 77, 83, 89, 95, 101, 107, 113, 119, 125, 131, 135].map((xPos) => svg`
            <circle cx="${xPos}" cy="96" r="2" fill="url(#traceGrad)" stroke="#78350f" stroke-width="0.5" />
            <line x1="${xPos}" y1="98" x2="${xPos}" y2="285" stroke="url(#traceGrad)" stroke-width="2.5" stroke-linecap="round" />
          `)}

          <!-- ── DYNAMIC SUBMERSION WATER OVERLAY ── -->
          ${submersionHeight > 0 ? svg`
            <rect
              x="58"
              y="${waterY}"
              width="84"
              height="${submersionHeight}"
              rx="3"
              fill="url(#waterFillGrad)"
              class="water-glow"
            />
            <!-- Animated Water Waves Line -->
            <path
              d="M 58 ${waterY} Q 79 ${waterY - 3}, 100 ${waterY} T 142 ${waterY}"
              fill="none"
              stroke="#7dd3fc"
              stroke-width="2"
            >
              <animate attributeName="d" values="
                M 58 ${waterY} Q 79 ${waterY - 3}, 100 ${waterY} T 142 ${waterY};
                M 58 ${waterY} Q 79 ${waterY + 3}, 100 ${waterY} T 142 ${waterY};
                M 58 ${waterY} Q 79 ${waterY - 3}, 100 ${waterY} T 142 ${waterY}
              " dur="1.8s" repeatCount="indefinite" />
            </path>
          ` : ''}

          <!-- ── EMBEDDED WATER LEVEL SLIDER OVERLAY (ForeignObject) ── -->
          <foreignObject x="35" y="115" width="130" height="70">
            <div style="
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 3px;
              background: rgba(15, 23, 42, 0.92);
              backdrop-filter: blur(6px);
              border: 1px solid rgba(56, 189, 248, 0.5);
              border-radius: 6px;
              padding: 5px 8px;
              box-shadow: 0 4px 10px rgba(0,0,0,0.6);
            " @mousedown="${(e: MouseEvent) => e.stopPropagation()}">
              <div style="font-size: 9px; font-weight: 800; color: #38bdf8; letter-spacing: 0.5px; text-transform: uppercase;">
                💧 WATER DEPTH
              </div>
              <div style="font-size: 11px; font-weight: 800; color: #ffffff;">
                ${level}% ${isTriggered ? 'FULL' : 'DRY'}
              </div>
              <input
                type="range"
                min="0"
                max="100"
                .value="${level}"
                class="range-slider"
                @input="${this._onSliderInput}"
              />
            </div>
          </foreignObject>
        </svg>
      </div>
    `;
  }
}
