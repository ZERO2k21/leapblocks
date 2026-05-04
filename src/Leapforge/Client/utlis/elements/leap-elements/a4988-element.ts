import { html, LitElement, css } from 'lit';
import { property } from 'lit/decorators.js';
import { ElementPin } from '.';
import { safeDefine } from './utils/safe-define';

/**
 * A4988 Stepper Motor Driver Module
 * 
 * Accurate representation of the Pololu A4988 stepper driver board based on Wokwi reference:
 * - Green PCB (standard Pololu color)
 * - 16 pins (8 per side) with 2.54mm (0.1") spacing
 * - A4988 IC with black heatsink
 * - Potentiometer for current adjustment (VREF)
 * - Status indicators for ENABLE, SLEEP, RESET states
 * 
 * Pin behavior (per Wokwi wokwi-a4988 reference):
 *   ENABLE  - active-low, default pulled-down (LOW = enabled)
 *   RESET   - active-low, floating (must be HIGH to operate)
 *   SLEEP   - active-low, default pulled-up (HIGH = awake)
 *   MS1/2/3 - microstepping select (000=full, 100=half, 010=1/4, 110=1/8, 111=1/16)
 *   STEP    - rising edge = one step/microstep
 *   DIR     - HIGH=CW, LOW=CCW
 * 
 * Board dimensions: 20.5mm x 15.5mm (actual Pololu A4988 carrier size)
 */
export class A4988Element extends LitElement {
  /** ENABLE pin state (active-low: LOW = driver enabled) */
  @property({ type: Boolean }) enabled = false;
  /** STEP pin state */
  @property({ type: Boolean }) stepHigh = false;
  /** DIR pin state (HIGH = CW) */
  @property({ type: Boolean }) dirHigh = false;
  /** MS1 pin state */
  @property({ type: Boolean }) ms1 = false;
  /** MS2 pin state */
  @property({ type: Boolean }) ms2 = false;
  /** MS3 pin state */
  @property({ type: Boolean }) ms3 = false;
  /** RESET pin state (active-low: must be HIGH to operate) */
  @property({ type: Boolean }) resetHigh = true;
  /** SLEEP pin state (active-low: HIGH = awake, default pulled-up) */
  @property({ type: Boolean }) sleepHigh = true;

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
    // SVG viewBox: 0 0 113.39 325.04
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

  /** Returns the microstepping mode label based on MS1/MS2/MS3 pin states */
  private getMicrosteppingMode(): string {
    // Per Wokwi / A4988 datasheet truth table:
    // MS1  MS2  MS3  → Mode
    //  0    0    0   → Full step
    //  1    0    0   → Half step
    //  0    1    0   → 1/4 step
    //  1    1    0   → 1/8 step
    //  1    1    1   → 1/16 step
    if (!this.ms1 && !this.ms2 && !this.ms3) return 'FULL';
    if (this.ms1 && !this.ms2 && !this.ms3) return '1/2';
    if (!this.ms1 && this.ms2 && !this.ms3) return '1/4';
    if (this.ms1 && this.ms2 && !this.ms3) return '1/8';
    if (this.ms1 && this.ms2 && this.ms3) return '1/16';
    return 'FULL';
  }

  /** Returns true when the driver is active (ENABLE=LOW, RESET=HIGH, SLEEP=HIGH) */
  private get driverActive(): boolean {
    return !this.enabled && this.resetHigh && this.sleepHigh;
  }

  render() {
    const active = this.driverActive;

    // Power LED: green when driver is active (ENABLE low, RESET high, SLEEP high)
    const powerLedColor = active ? '#22c55e' : '#166534';
    const powerLedOpacity = active ? 1 : 0.3;

    // Step LED: blue pulse on STEP high
    const stepLedColor = (this.stepHigh && active) ? '#3b82f6' : '#1e3a8a';
    const stepLedOpacity = (this.stepHigh && active) ? 1 : 0.3;

    // Direction indicator
    const dirColor = this.dirHigh ? '#f59e0b' : '#3b82f6';

    // SLEEP indicator: dim the whole board when sleeping
    const boardOpacity = this.sleepHigh ? 1 : 0.65;

    // RESET indicator: red tint on RST label when reset is asserted (LOW)
    const rstLabelColor = this.resetHigh ? '#f0fdf4' : '#ef4444';

    const microstepMode = this.getMicrosteppingMode();

    return html`
      <svg
        width="113.39"
        height="325.04"
        viewBox="0 0 113.39 325.04"
        xmlns="http://www.w3.org/2000/svg"
        opacity="${boardOpacity}"
        style="transition: opacity 200ms ease"
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
          x="0" y="0"
          width="113.39" height="325.04"
          rx="4" ry="4"
          fill="url(#pcb-gradient)"
          stroke="#14532d"
          stroke-width="1.5"
        />

        <!-- Pin headers (left side) -->
        <g id="left-pins">
          ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => html`
            <rect x="2" y="${27 + i * 35.63}" width="8" height="8" rx="1"
              fill="#1f2937" stroke="#9ca3af" stroke-width="0.5"/>
            <circle cx="6" cy="${31 + i * 35.63}" r="2.5" fill="#6b7280"/>
          `)}
        </g>

        <!-- Pin headers (right side) -->
        <g id="right-pins">
          ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => html`
            <rect x="103.39" y="${27 + i * 35.63}" width="8" height="8" rx="1"
              fill="#1f2937" stroke="#9ca3af" stroke-width="0.5"/>
            <circle cx="107.39" cy="${31 + i * 35.63}" r="2.5" fill="#6b7280"/>
          `)}
        </g>

        <!-- A4988 IC with heatsink -->
        <g id="ic-heatsink">
          <!-- IC body (black) -->
          <rect x="32" y="115" width="50" height="50" fill="#0f172a" stroke="#000" stroke-width="0.5"/>
          <!-- Heatsink (black anodized aluminum) -->
          <rect x="35" y="118" width="44" height="44"
            fill="url(#heatsink-gradient)" stroke="#374151" stroke-width="0.8"/>
          <!-- Heatsink fins -->
          ${[0, 1, 2, 3, 4, 5, 6].map(i => html`
            <line x1="35" y1="${124 + i * 6}" x2="79" y2="${124 + i * 6}"
              stroke="#6b7280" stroke-width="0.4" opacity="0.5"/>
          `)}
          <!-- Heatsink center screw -->
          <circle cx="57" cy="140" r="3" fill="#374151" stroke="#1f2937" stroke-width="0.5"/>
          <circle cx="57" cy="140" r="1.5" fill="#1f2937"/>
          <!-- IC label -->
          <text x="57" y="172" font-family="Arial, sans-serif" font-size="7"
            font-weight="bold" fill="#9ca3af" text-anchor="middle">A4988</text>
        </g>

        <!-- Potentiometer (VREF current adjust - blue trim pot) -->
        <g id="potentiometer">
          <circle cx="85" cy="45" r="9" fill="#3b82f6" stroke="#1e40af" stroke-width="0.8"/>
          <circle cx="85" cy="45" r="7" fill="#60a5fa"/>
          <line x1="85" y1="45" x2="88" y2="42" stroke="#1e40af" stroke-width="1.2" stroke-linecap="round"/>
          <text x="85" y="65" font-family="Arial, sans-serif" font-size="6" fill="#f0fdf4" text-anchor="middle">VREF</text>
        </g>

        <!-- Capacitors -->
        <g id="capacitors">
          <!-- Large electrolytic capacitor (100µF) -->
          <ellipse cx="25" cy="75" rx="7" ry="11" fill="#1f2937" stroke="#6b7280" stroke-width="0.5"/>
          <rect x="21" y="64" width="8" height="2" fill="#9ca3af"/>
          <line x1="25" y1="66" x2="25" y2="68" stroke="#dc2626" stroke-width="0.5"/>
          <!-- Small ceramic capacitors (yellow) -->
          <rect x="23" y="180" width="5" height="9" rx="0.5" fill="#fbbf24" stroke="#f59e0b" stroke-width="0.3"/>
          <rect x="23" y="200" width="5" height="9" rx="0.5" fill="#fbbf24" stroke="#f59e0b" stroke-width="0.3"/>
        </g>

        <!-- Power LED (green when driver is active) -->
        <g id="power-led">
          <circle cx="28" cy="245" r="4.5"
            fill="${powerLedColor}" opacity="${powerLedOpacity}"
            class="led-glow"
            filter="${active ? 'url(#led-glow)' : 'none'}"/>
          <circle cx="28" cy="245" r="2.5"
            fill="${active ? '#86efac' : '#166534'}"
            opacity="${active ? 0.9 : 0.3}"/>
          <text x="28" y="260" font-family="Arial, sans-serif" font-size="7"
            font-weight="bold" fill="#f0fdf4" text-anchor="middle">PWR</text>
        </g>

        <!-- Step LED (blue when stepping and driver is active) -->
        <g id="step-led">
          <circle cx="56.7" cy="245" r="4.5"
            fill="${stepLedColor}" opacity="${stepLedOpacity}"
            class="step-led"
            filter="${(this.stepHigh && active) ? 'url(#led-glow)' : 'none'}"/>
          <circle cx="56.7" cy="245" r="2.5"
            fill="${(this.stepHigh && active) ? '#93c5fd' : '#1e3a8a'}"
            opacity="${(this.stepHigh && active) ? 0.9 : 0.3}"/>
          <text x="56.7" y="260" font-family="Arial, sans-serif" font-size="7"
            font-weight="bold" fill="#f0fdf4" text-anchor="middle">STEP</text>
        </g>

        <!-- Direction indicator bar -->
        <g id="direction-indicator">
          <rect x="18" y="280" width="77" height="14" rx="3"
            fill="${active ? dirColor : '#374151'}" opacity="0.85"
            stroke="#1f2937" stroke-width="0.5"
            style="transition: fill 100ms ease"/>
          <text x="56.7" y="291" font-family="Arial, sans-serif" font-size="10"
            font-weight="bold" fill="#ffffff" text-anchor="middle">
            ${active ? (this.dirHigh ? 'CW ▶' : '◀ CCW') : '— —'}
          </text>
        </g>

        <!-- Microstepping mode display -->
        <g id="microstep-display">
          <rect x="18" y="302" width="77" height="18" rx="3"
            fill="#0f172a" stroke="#4b5563" stroke-width="0.8"/>
          <text x="56.7" y="315" font-family="Arial, sans-serif" font-size="11"
            font-weight="bold" fill="#BEF264" text-anchor="middle">${microstepMode}</text>
        </g>

        <!-- Silkscreen labels (left side) -->
        <g id="left-labels" font-family="Arial, sans-serif" font-size="7" font-weight="600">
          <text x="15" y="33"    fill="#f0fdf4">EN</text>
          <text x="15" y="68.63" fill="#f0fdf4">MS1</text>
          <text x="15" y="104.26" fill="#f0fdf4">MS2</text>
          <text x="15" y="139.89" fill="#f0fdf4">MS3</text>
          <text x="15" y="175.52" fill="${rstLabelColor}" style="transition: fill 150ms ease">RST</text>
          <text x="15" y="211.15" fill="${this.sleepHigh ? '#f0fdf4' : '#94a3b8'}">SLP</text>
          <text x="15" y="246.78" fill="#f0fdf4">STP</text>
          <text x="15" y="282.41" fill="#f0fdf4">DIR</text>
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

        <!-- Board title -->
        <text x="56.7" y="15" font-family="Arial, sans-serif" font-size="12"
          font-weight="bold" fill="#f0fdf4" text-anchor="middle">A4988</text>
        
        <!-- Pololu branding -->
        <text x="56.7" y="225" font-family="Arial, sans-serif" font-size="8"
          fill="#f0fdf4" opacity="0.6" text-anchor="middle">POLOLU</text>

        <!-- SLEEP indicator dot (dims when sleeping) -->
        ${!this.sleepHigh ? html`
          <circle cx="56.7" cy="90" r="5" fill="#94a3b8" opacity="0.7"/>
          <text x="56.7" y="94" font-family="Arial, sans-serif" font-size="6"
            fill="#0f172a" text-anchor="middle" font-weight="bold">ZZZ</text>
        ` : ''}
      </svg>
    `;
  }
}

safeDefine('leap-a4988', A4988Element);
