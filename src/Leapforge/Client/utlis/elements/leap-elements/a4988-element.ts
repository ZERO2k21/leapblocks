import { html, LitElement, css } from 'lit';
import { property } from 'lit/decorators.js';
import { ElementPin } from '.';
import { safeDefine } from './utils/safe-define';

/**
 * A4988 Stepper Motor Driver Module
 *
 * Visual matches the reference SVG (src/Leapforge/Client/Assets/A4988.svg):
 *   - 15.2mm × 20.3mm Pololu green PCB
 *   - A4988 IC with black heatsink + fins
 *   - Blue VREF trim-pot
 *   - Electrolytic + ceramic capacitors
 *   - 8 pin-holes per side (2.54mm pitch)
 *   - Silkscreen labels
 *
 * Reactive overlays (not in the static SVG):
 *   - Power LED  : green glow when driver is active (ENABLE=LOW, RESET=HIGH, SLEEP=HIGH)
 *   - Step LED   : blue pulse on STEP rising edge
 *   - DIR bar    : CW / CCW indicator
 *   - µStep badge: FULL / 1/2 / 1/4 / 1/8 / 1/16
 *   - Board dims when SLEEP is asserted
 *   - RST label turns red when RESET is LOW
 *
 * Pin behaviour (Wokwi / A4988 datasheet):
 *   ENABLE  – active-low, default pulled-down  (LOW = enabled)
 *   RESET   – active-low, floating             (HIGH = not in reset)
 *   SLEEP   – active-low, default pulled-up    (HIGH = awake)
 *   MS1/2/3 – microstepping select
 *   STEP    – rising edge = one step
 *   DIR     – HIGH = CW, LOW = CCW
 */
export class A4988Element extends LitElement {
  /** ENABLE pin state (raw HIGH/LOW; element inverts: LOW = driver enabled) */
  @property({ type: Boolean }) enabled = false;
  @property({ type: Boolean }) stepHigh = false;
  @property({ type: Boolean }) dirHigh = false;
  @property({ type: Boolean }) ms1 = false;
  @property({ type: Boolean }) ms2 = false;
  @property({ type: Boolean }) ms3 = false;
  /** RESET pin (active-low: HIGH = not in reset) */
  @property({ type: Boolean }) resetHigh = true;
  /** SLEEP pin (active-low: HIGH = awake) */
  @property({ type: Boolean }) sleepHigh = true;

  static styles = css`
    :host { display: inline-block; }
    .led-glow { transition: opacity 50ms ease, fill 50ms ease; }
    .step-led { transition: opacity 30ms ease; }
  `;

  // ── Pin layout ─────────────────────────────────────────────────────────────
  // The SVG viewBox is 15.2 × 20.3 (mm).
  // Pin holes sit at x=1.27 (left) and x=13.93 (right), y = 1.27 + n*2.54.
  get pinInfo(): ElementPin[] {
    const lx = 1.27;
    const rx = 13.93;
    const y0 = 1.27;
    const dy = 2.54;
    return [
      { name: 'ENABLE', x: lx, y: y0 + dy * 0, number: 1, signals: [] },
      { name: 'MS1', x: lx, y: y0 + dy * 1, number: 2, signals: [] },
      { name: 'MS2', x: lx, y: y0 + dy * 2, number: 3, signals: [] },
      { name: 'MS3', x: lx, y: y0 + dy * 3, number: 4, signals: [] },
      { name: 'RESET', x: lx, y: y0 + dy * 4, number: 5, signals: [] },
      { name: 'SLEEP', x: lx, y: y0 + dy * 5, number: 6, signals: [] },
      { name: 'STEP', x: lx, y: y0 + dy * 6, number: 7, signals: [] },
      { name: 'DIR', x: lx, y: y0 + dy * 7, number: 8, signals: [] },
      { name: 'VMOT', x: rx, y: y0 + dy * 0, number: 9, signals: [] },
      { name: 'GND', x: rx, y: y0 + dy * 1, number: 10, signals: [] },
      { name: '2B', x: rx, y: y0 + dy * 2, number: 11, signals: [] },
      { name: '2A', x: rx, y: y0 + dy * 3, number: 12, signals: [] },
      { name: '1A', x: rx, y: y0 + dy * 4, number: 13, signals: [] },
      { name: '1B', x: rx, y: y0 + dy * 5, number: 14, signals: [] },
      { name: 'VDD', x: rx, y: y0 + dy * 6, number: 15, signals: [] },
      { name: 'GND2', x: rx, y: y0 + dy * 7, number: 16, signals: [] },
    ];
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  private getMicrosteppingMode(): string {
    if (!this.ms1 && !this.ms2 && !this.ms3) return 'FULL';
    if (this.ms1 && !this.ms2 && !this.ms3) return '1/2';
    if (!this.ms1 && this.ms2 && !this.ms3) return '1/4';
    if (this.ms1 && this.ms2 && !this.ms3) return '1/8';
    if (this.ms1 && this.ms2 && this.ms3) return '1/16';
    return 'FULL';
  }

  /** Driver is active when ENABLE=LOW, RESET=HIGH, SLEEP=HIGH */
  private get driverActive(): boolean {
    return !this.enabled && this.resetHigh && this.sleepHigh;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  render() {
    const active = this.driverActive;
    const stepping = this.stepHigh && active;
    const boardOpacity = this.sleepHigh ? 1 : 0.65;

    // LED colours
    const pwrFill = active ? '#22c55e' : '#166534';
    const pwrOp = active ? 1 : 0.3;
    const stepFill = stepping ? '#3b82f6' : '#1e3a8a';
    const stepOp = stepping ? 1 : 0.3;

    // Direction bar
    const dirFill = active ? (this.dirHigh ? '#f59e0b' : '#3b82f6') : '#374151';
    const dirLabel = active ? (this.dirHigh ? 'CW ▶' : '◀ CCW') : '— —';

    // RST label colour
    const rstColor = this.resetHigh ? '#f0fdf4' : '#ef4444';
    // SLP label colour
    const slpColor = this.sleepHigh ? '#f0fdf4' : '#94a3b8';

    const microstepMode = this.getMicrosteppingMode();

    return html`
      <svg
        width="15.2mm"
        height="20.3mm"
        viewBox="0 0 15.2 20.3"
        xmlns="http://www.w3.org/2000/svg"
        opacity="${boardOpacity}"
        style="transition:opacity 200ms ease"
      >
        <defs>
          <g id="pin-hole">
            <circle r=".7"  cy="1.27" fill="#ffe680"/>
            <circle r=".45" cy="1.27" fill="#fff"/>
          </g>

          <linearGradient id="pcb-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   style="stop-color:#16a34a;stop-opacity:1"/>
            <stop offset="100%" style="stop-color:#15803d;stop-opacity:1"/>
          </linearGradient>

          <linearGradient id="ic-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   style="stop-color:#4b5563;stop-opacity:1"/>
            <stop offset="100%" style="stop-color:#1f2937;stop-opacity:1"/>
          </linearGradient>

          <filter id="led-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="0.25" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <!-- ── PCB board ── -->
        <rect width="15.2" height="20.3" fill="url(#pcb-grad)" rx="0.4"/>
        <rect width="15.2" height="20.3" fill="none" stroke="#14532d" stroke-width="0.12"/>

        <!-- ── A4988 IC + heatsink ── -->
        <rect x="4.5" y="7.5"  width="6.2" height="6.2" fill="#0f172a" stroke="#000" stroke-width="0.08"/>
        <rect x="4.8" y="7.8"  width="5.6" height="5.6" fill="url(#ic-grad)" stroke="#374151" stroke-width="0.06"/>
        <!-- heatsink fins -->
        <line x1="4.8" y1="8.6"  x2="10.4" y2="8.6"  stroke="#6b7280" stroke-width="0.05" opacity="0.6"/>
        <line x1="4.8" y1="9.4"  x2="10.4" y2="9.4"  stroke="#6b7280" stroke-width="0.05" opacity="0.6"/>
        <line x1="4.8" y1="10.2" x2="10.4" y2="10.2" stroke="#6b7280" stroke-width="0.05" opacity="0.6"/>
        <line x1="4.8" y1="11.0" x2="10.4" y2="11.0" stroke="#6b7280" stroke-width="0.05" opacity="0.6"/>
        <line x1="4.8" y1="11.8" x2="10.4" y2="11.8" stroke="#6b7280" stroke-width="0.05" opacity="0.6"/>
        <line x1="4.8" y1="12.6" x2="10.4" y2="12.6" stroke="#6b7280" stroke-width="0.05" opacity="0.6"/>
        <!-- heatsink centre screw -->
        <circle cx="7.6" cy="10.6" r="0.4" fill="#374151" stroke="#1f2937" stroke-width="0.04"/>
        <circle cx="7.6" cy="10.6" r="0.2" fill="#1f2937"/>
        <!-- IC label -->
        <text x="7.6" y="14.6" font-family="Arial,sans-serif" font-size="0.65"
          fill="#9ca3af" text-anchor="middle">A4988</text>

        <!-- ── VREF trim-pot ── -->
        <circle cx="11.5" cy="3.2" r="1.1" fill="#3b82f6" stroke="#1e40af" stroke-width="0.08"/>
        <circle cx="11.5" cy="3.2" r="0.85" fill="#60a5fa"/>
        <line x1="11.5" y1="3.2" x2="11.85" y2="2.85" stroke="#1e40af" stroke-width="0.12" stroke-linecap="round"/>
        <text x="11.5" y="4.8" font-family="Arial,sans-serif" font-size="0.5"
          fill="#f0fdf4" text-anchor="middle">VREF</text>

        <!-- ── Electrolytic capacitor ── -->
        <ellipse cx="3.2" cy="4.5" rx="0.75" ry="1.1" fill="#1f2937" stroke="#6b7280" stroke-width="0.05"/>
        <rect x="2.7" y="3.4" width="1.0" height="0.18" fill="#9ca3af"/>

        <!-- ── Ceramic capacitors ── -->
        <rect x="3.0" y="16.2" width="0.55" height="0.9" rx="0.05" fill="#fbbf24" stroke="#f59e0b" stroke-width="0.03"/>
        <rect x="3.0" y="17.4" width="0.55" height="0.9" rx="0.05" fill="#fbbf24" stroke="#f59e0b" stroke-width="0.03"/>

        <!-- ── Left pin holes: ENABLE MS1 MS2 MS3 RESET SLEEP STEP DIR ── -->
        <use href="#pin-hole" x="1.27" y="0"/>
        <use href="#pin-hole" x="1.27" y="2.54"/>
        <use href="#pin-hole" x="1.27" y="5.08"/>
        <use href="#pin-hole" x="1.27" y="7.62"/>
        <use href="#pin-hole" x="1.27" y="10.16"/>
        <use href="#pin-hole" x="1.27" y="12.7"/>
        <use href="#pin-hole" x="1.27" y="15.24"/>
        <use href="#pin-hole" x="1.27" y="17.78"/>

        <!-- ── Right pin holes: VMOT GND 2B 2A 1A 1B VDD GND ── -->
        <use href="#pin-hole" x="13.93" y="0"/>
        <use href="#pin-hole" x="13.93" y="2.54"/>
        <use href="#pin-hole" x="13.93" y="5.08"/>
        <use href="#pin-hole" x="13.93" y="7.62"/>
        <use href="#pin-hole" x="13.93" y="10.16"/>
        <use href="#pin-hole" x="13.93" y="12.7"/>
        <use href="#pin-hole" x="13.93" y="15.24"/>
        <use href="#pin-hole" x="13.93" y="17.78"/>

        <!-- ── Silkscreen labels – left ── -->
        <g font-family="Arial,sans-serif" font-size="0.58" fill="#f0fdf4">
          <text x="2.6" y="1.6">EN</text>
          <text x="2.6" y="4.1">MS1</text>
          <text x="2.6" y="6.6">MS2</text>
          <text x="2.6" y="9.1">MS3</text>
          <text x="2.6" y="11.6" fill="${rstColor}" style="transition:fill 150ms ease">RST</text>
          <text x="2.6" y="14.1" fill="${slpColor}">SLP</text>
          <text x="2.6" y="16.6">STP</text>
          <text x="2.6" y="19.1">DIR</text>
        </g>

        <!-- ── Silkscreen labels – right ── -->
        <g font-family="Arial,sans-serif" font-size="0.58" fill="#f0fdf4" text-anchor="end">
          <text x="12.6" y="1.6">VMOT</text>
          <text x="12.6" y="4.1">GND</text>
          <text x="12.6" y="6.6">2B</text>
          <text x="12.6" y="9.1">2A</text>
          <text x="12.6" y="11.6">1A</text>
          <text x="12.6" y="14.1">1B</text>
          <text x="12.6" y="16.6">VDD</text>
          <text x="12.6" y="19.1">GND</text>
        </g>

        <!-- ── Board title ── -->
        <text x="7.6" y="3.0" font-family="Arial,sans-serif" font-size="1.1"
          font-weight="bold" text-anchor="middle" fill="#f0fdf4">A4988</text>

        <!-- ── Pololu branding ── -->
        <text x="7.6" y="6.8" font-family="Arial,sans-serif" font-size="0.55"
          text-anchor="middle" fill="#f0fdf4" opacity="0.55">POLOLU</text>

        <!-- ══════════════════════════════════════════════════════════════════
             Reactive overlays — drawn on top of the static PCB artwork
             ══════════════════════════════════════════════════════════════════ -->

        <!-- Power LED (bottom-left corner, above DIR pin) -->
        <circle cx="5.5" cy="19.0" r="0.45"
          fill="${pwrFill}" opacity="${pwrOp}"
          class="led-glow"
          filter="${active ? 'url(#led-glow)' : 'none'}"/>

        <!-- Step LED (next to power LED) -->
        <circle cx="7.0" cy="19.0" r="0.45"
          fill="${stepFill}" opacity="${stepOp}"
          class="step-led"
          filter="${stepping ? 'url(#led-glow)' : 'none'}"/>

        <!-- Direction indicator (small pill above the DIR pin hole) -->
        <rect x="4.2" y="17.95" width="3.6" height="0.85" rx="0.2"
          fill="${dirFill}" opacity="0.9"
          style="transition:fill 100ms ease"/>
        <text x="6.0" y="18.65" font-family="Arial,sans-serif" font-size="0.55"
          font-weight="bold" fill="#fff" text-anchor="middle">${dirLabel}</text>

        <!-- Microstepping badge (small rect near IC label) -->
        <rect x="5.5" y="14.9" width="4.2" height="1.1" rx="0.2"
          fill="#0f172a" stroke="#4b5563" stroke-width="0.06"/>
        <text x="7.6" y="15.75" font-family="Arial,sans-serif" font-size="0.7"
          font-weight="bold" fill="#BEF264" text-anchor="middle">${microstepMode}</text>

        <!-- Sleep overlay: faint "ZZZ" badge when SLEEP is asserted -->
        ${!this.sleepHigh ? html`
          <rect x="5.8" y="5.5" width="3.6" height="1.2" rx="0.2"
            fill="#1e293b" opacity="0.85"/>
          <text x="7.6" y="6.45" font-family="Arial,sans-serif" font-size="0.75"
            fill="#94a3b8" text-anchor="middle" font-weight="bold">ZZZ</text>
        ` : ''}
      </svg>
    `;
  }
}

safeDefine('leap-a4988', A4988Element);
