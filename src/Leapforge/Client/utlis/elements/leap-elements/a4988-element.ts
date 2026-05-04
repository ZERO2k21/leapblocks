import { html, LitElement, css } from 'lit';
import { property } from 'lit/decorators.js';
import { ElementPin } from '.';
import { safeDefine } from './utils/safe-define';

/**
 * A4988 Stepper Motor Driver Module
 * 
 * Accurate representation of the Pololu A4988 stepper driver board based on real hardware:
 * - Green PCB (standard Pololu color)
 * - 16 pins (8 per side) with 2.54mm (0.1") spacing
 * - A4988 IC with black heatsink
 * - Potentiometer for current adjustment
 * - Power LED and status indicators
 * - Silkscreen labels matching real board
 * 
 * Board dimensions: 20.5mm x 15.5mm (actual Pololu A4988 carrier size)
 */
export class A4988Element extends LitElement {
  @property({ type: Boolean }) enabled = false;
  @property({ type: Boolean }) stepHigh = false;
  @property({ type: Boolean }) dirHigh = false;
  @property({ type: Boolean }) ms1 = false;
  @property({ type: Boolean }) ms2 = false;
  @property({ type: Boolean }) ms3 = false;

  static styles = css`
    :host {
      display: inline-block;
    }
    .led-glow {
      transition: opacity 50ms ease, fill 50ms ease;
    }
    .step-led {
      transition: opacity 30ms ease;
    }
  `;

  get pinInfo(): ElementPin[] {
    // Pin coordinates for the A4988 module (Pololu carrier board)
    // Real board: 20.5mm x 15.5mm with 0.1" (2.54mm) pin spacing
    // Left side (top to bottom): ENABLE, MS1, MS2, MS3, RESET, SLEEP, STEP, DIR
    // Right side (top to bottom): VMOT, GND, 2B, 2A, 1A, 1B, VDD, GND
    
    const leftX = 2;
    const rightX = 111.39;
    const startY = 27;
    const pinSpacing = 35.63;

    return [
      // Left side pins
      { name: 'ENABLE', x: leftX, y: startY + pinSpacing * 0, number: 1, signals: [] },
      { name: 'MS1', x: leftX, y: startY + pinSpacing * 1, number: 2, signals: [] },
      { name: 'MS2', x: leftX, y: startY + pinSpacing * 2, number: 3, signals: [] },
      { name: 'MS3', x: leftX, y: startY + pinSpacing * 3, number: 4, signals: [] },
      { name: 'RESET', x: leftX, y: startY + pinSpacing * 4, number: 5, signals: [] },
      { name: 'SLEEP', x: leftX, y: startY + pinSpacing * 5, number: 6, signals: [] },
      { name: 'STEP', x: leftX, y: startY + pinSpacing * 6, number: 7, signals: [] },
      { name: 'DIR', x: leftX, y: startY + pinSpacing * 7, number: 8, signals: [] },
      
      // Right side pins
      { name: 'VMOT', x: rightX, y: startY + pinSpacing * 0, number: 9, signals: [] },
      { name: 'GND', x: rightX, y: startY + pinSpacing * 1, number: 10, signals: [] },
      { name: '2B', x: rightX, y: startY + pinSpacing * 2, number: 11, signals: [] },
      { name: '2A', x: rightX, y: startY + pinSpacing * 3, number: 12, signals: [] },
      { name: '1A', x: rightX, y: startY + pinSpacing * 4, number: 13, signals: [] },
      { name: '1B', x: rightX, y: startY + pinSpacing * 5, number: 14, signals: [] },
      { name: 'VDD', x: rightX, y: startY + pinSpacing * 6, number: 15, signals: [] },
      { name: 'GND2', x: rightX, y: startY + pinSpacing * 7, number: 16, signals: [] },
    ];
  }

  private getMicrosteppingMode(): string {
    if (!this.ms1 && !this.ms2 && !this.ms3) return 'FULL';
    if (this.ms1 && !this.ms2 && !this.ms3) return '1/2';
    if (!this.ms1 && this.ms2 && !this.ms3) return '1/4';
    if (this.ms1 && this.ms2 && !this.ms3) return '1/8';
    if (this.ms1 && this.ms2 && this.ms3) return '1/16';
    return 'FULL';
  }

  render() {
    const powerLedColor = this.enabled ? '#22c55e' : '#166534';
    const powerLedOpacity = this.enabled ? 1 : 0.3;
    const stepLedColor = this.stepHigh ? '#3b82f6' : '#1e3a8a';
    const stepLedOpacity = this.stepHigh ? 1 : 0.3;
    const dirColor = this.dirHigh ? '#f59e0b' : '#3b82f6';
    const microstepMode = this.getMicrosteppingMode();

    return html`
      <svg
        width="113.39"
        height="325.04"
        viewBox="0 0 113.39 325.04"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <!-- PCB gradient (Pololu green) -->
          <linearGradient id="pcb-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#16a34a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#15803d;stop-opacity:1" />
          </linearGradient>
          
          <!-- Heatsink gradient (black anodized aluminum) -->
          <linearGradient id="heatsink-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#4b5563;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#1f2937;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#111827;stop-opacity:1" />
          </linearGradient>

          <!-- LED glow filter -->
          <filter id="led-glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <!-- PCB Board (Pololu green) -->
        <rect
          x="0"
          y="0"
          width="113.39"
          height="325.04"
          rx="4"
          ry="4"
          fill="url(#pcb-gradient)"
          stroke="#14532d"
          stroke-width="1.5"
        />

        <!-- Pin headers (left side) -->
        <g id="left-pins">
          ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => html`
            <rect
              x="2"
              y="${27 + i * 35.63}"
              width="8"
              height="8"
              rx="1"
              fill="#1f2937"
              stroke="#9ca3af"
              stroke-width="0.5"
            />
            <circle
              cx="6"
              cy="${31 + i * 35.63}"
              r="2.5"
              fill="#6b7280"
            />
          `)}
        </g>

        <!-- Pin headers (right side) -->
        <g id="right-pins">
          ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => html`
            <rect
              x="103.39"
              y="${27 + i * 35.63}"
              width="8"
              height="8"
              rx="1"
              fill="#1f2937"
              stroke="#9ca3af"
              stroke-width="0.5"
            />
            <circle
              cx="107.39"
              cy="${31 + i * 35.63}"
              r="2.5"
              fill="#6b7280"
            />
          `)}
        </g>

        <!-- A4988 IC with heatsink -->
        <g id="ic-heatsink">
          <!-- IC body (black) -->
          <rect
            x="32"
            y="115"
            width="50"
            height="50"
            fill="#0f172a"
            stroke="#000"
            stroke-width="0.5"
          />
          
          <!-- Heatsink (black anodized aluminum) -->
          <rect
            x="35"
            y="118"
            width="44"
            height="44"
            fill="url(#heatsink-gradient)"
            stroke="#374151"
            stroke-width="0.8"
          />
          
          <!-- Heatsink fins (horizontal lines) -->
          ${[0, 1, 2, 3, 4, 5, 6].map(i => html`
            <line
              x1="35"
              y1="${124 + i * 6}"
              x2="79"
              y2="${124 + i * 6}"
              stroke="#6b7280"
              stroke-width="0.4"
              opacity="0.5"
            />
          `)}
          
          <!-- Heatsink center screw -->
          <circle cx="57" cy="140" r="3" fill="#374151" stroke="#1f2937" stroke-width="0.5" />
          <circle cx="57" cy="140" r="1.5" fill="#1f2937" />
        </g>

        <!-- Potentiometer (current adjust - blue trim pot) -->
        <g id="potentiometer">
          <circle cx="85" cy="45" r="9" fill="#3b82f6" stroke="#1e40af" stroke-width="0.8" />
          <circle cx="85" cy="45" r="7" fill="#60a5fa" />
          <line x1="85" y1="45" x2="88" y2="42" stroke="#1e40af" stroke-width="1.2" stroke-linecap="round" />
          <text x="85" y="65" font-family="Arial, sans-serif" font-size="6" fill="#f0fdf4" text-anchor="middle">VREF</text>
        </g>

        <!-- Capacitors -->
        <g id="capacitors">
          <!-- Large electrolytic capacitor (100µF) -->
          <ellipse cx="25" cy="75" rx="7" ry="11" fill="#1f2937" stroke="#6b7280" stroke-width="0.5" />
          <rect x="21" y="64" width="8" height="2" fill="#9ca3af" />
          <line x1="25" y1="66" x2="25" y2="68" stroke="#dc2626" stroke-width="0.5" />
          
          <!-- Small ceramic capacitors (yellow) -->
          <rect x="23" y="180" width="5" height="9" rx="0.5" fill="#fbbf24" stroke="#f59e0b" stroke-width="0.3" />
          <rect x="23" y="200" width="5" height="9" rx="0.5" fill="#fbbf24" stroke="#f59e0b" stroke-width="0.3" />
        </g>

        <!-- Power LED (green when enabled) -->
        <g id="power-led">
          <circle
            cx="28"
            cy="245"
            r="4.5"
            fill="${powerLedColor}"
            opacity="${powerLedOpacity}"
            class="led-glow"
            filter="${this.enabled ? 'url(#led-glow)' : 'none'}"
          />
          <circle
            cx="28"
            cy="245"
            r="2.5"
            fill="${this.enabled ? '#86efac' : '#166534'}"
            opacity="${this.enabled ? 0.9 : 0.3}"
          />
          <text
            x="28"
            y="260"
            font-family="Arial, sans-serif"
            font-size="7"
            font-weight="bold"
            fill="#f0fdf4"
            text-anchor="middle"
          >PWR</text>
        </g>

        <!-- Step LED (blue when stepping) -->
        <g id="step-led">
          <circle
            cx="56.7"
            cy="245"
            r="4.5"
            fill="${stepLedColor}"
            opacity="${stepLedOpacity}"
            class="step-led"
            filter="${this.stepHigh ? 'url(#led-glow)' : 'none'}"
          />
          <circle
            cx="56.7"
            cy="245"
            r="2.5"
            fill="${this.stepHigh ? '#93c5fd' : '#1e3a8a'}"
            opacity="${this.stepHigh ? 0.9 : 0.3}"
          />
          <text
            x="56.7"
            y="260"
            font-family="Arial, sans-serif"
            font-size="7"
            font-weight="bold"
            fill="#f0fdf4"
            text-anchor="middle"
          >STEP</text>
        </g>

        <!-- Direction indicator bar -->
        <g id="direction-indicator">
          <rect
            x="18"
            y="280"
            width="77"
            height="14"
            rx="3"
            fill="${dirColor}"
            opacity="0.85"
            stroke="#1f2937"
            stroke-width="0.5"
            style="transition: fill 100ms ease"
          />
          <text
            x="56.7"
            y="291"
            font-family="Arial, sans-serif"
            font-size="10"
            font-weight="bold"
            fill="#ffffff"
            text-anchor="middle"
          >${this.dirHigh ? 'CW ▶' : '◀ CCW'}</text>
        </g>

        <!-- Microstepping mode display -->
        <g id="microstep-display">
          <rect
            x="18"
            y="302"
            width="77"
            height="18"
            rx="3"
            fill="#0f172a"
            stroke="#4b5563"
            stroke-width="0.8"
          />
          <text
            x="56.7"
            y="315"
            font-family="Arial, sans-serif"
            font-size="11"
            font-weight="bold"
            fill="#BEF264"
            text-anchor="middle"
          >${microstepMode}</text>
        </g>

        <!-- Silkscreen labels (left side) - white text on green PCB -->
        <g id="left-labels" fill="#f0fdf4" font-family="Arial, sans-serif" font-size="7" font-weight="600">
          <text x="15" y="33">EN</text>
          <text x="15" y="68.63">MS1</text>
          <text x="15" y="104.26">MS2</text>
          <text x="15" y="139.89">MS3</text>
          <text x="15" y="175.52">RST</text>
          <text x="15" y="211.15">SLP</text>
          <text x="15" y="246.78">STP</text>
          <text x="15" y="282.41">DIR</text>
        </g>

        <!-- Silkscreen labels (right side) -->
        <g id="right-labels" fill="#f0fdf4" font-family="Arial, sans-serif" font-size="7" font-weight="600" text-anchor="end">
          <text x="98" y="33">VMOT</text>
          <text x="98" y="68.63">GND</text>
          <text x="98" y="104.26">2B</text>
          <text x="98" y="139.89">2A</text>
          <text x="98" y="175.52">1A</text>
          <text x="98" y="211.15">1B</text>
          <text x="98" y="246.78">VDD</text>
          <text x="98" y="282.41">GND</text>
        </g>

        <!-- Board title (Pololu style) -->
        <text
          x="56.7"
          y="15"
          font-family="Arial, sans-serif"
          font-size="12"
          font-weight="bold"
          fill="#f0fdf4"
          text-anchor="middle"
        >A4988</text>
        
        <!-- Pololu logo placeholder -->
        <text
          x="56.7"
          y="225"
          font-family="Arial, sans-serif"
          font-size="8"
          fill="#f0fdf4"
          opacity="0.6"
          text-anchor="middle"
        >POLOLU</text>
      </svg>
    `;
  }
}

safeDefine('leap-a4988', A4988Element);
