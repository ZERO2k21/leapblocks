/**
 * Rain Sensor Module
 * 4-pin: VCC · GND · DO (digital) · AO (analog)
 *
 * Simulation properties:
 *   value     — rain level (0 … 100, 0 = dry, 100 = heavy rain)
 *   threshold — DO goes LOW when rain > threshold (0 … 100, default 50)
 *   ledPower  — power LED on (always true when VCC connected)
 *   ledDO     — DO LED on when DO is LOW (rain detected)
 *
 * Voltage mapping (simple model):
 *   V_ao = VCC × rainLevel / 100
 *   wet = low resistance = high voltage
 */
import { css, html, LitElement, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ElementPin } from '.';
import { analog, GND, VCC } from './pin';
import { css, html, LitElement, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ElementPin } from '.';
import { analog, GND, VCC } from './pin';
import rainSensorPngUrl from '/src/Electra/Client/Assets/ff5246ca-4d3a-4604-b8f7-1547631b1825.png';

@customElement('leap-rain-sensor')
export class RainSensorElement extends LitElement {
  /** Simulated rain level (0 = dry, 100 = heavy rain) */
  @property({ type: Number }) value = 0;

  /** DO threshold: DO pin goes LOW when rain level > threshold */
  @property({ type: Number }) threshold = 50;

  /** Power LED state */
  @property({ type: Boolean }) ledPower = false;

  /** DO LED state (mirrors DO pin — ON when rain detected) */
  @property({ type: Boolean }) ledDO = false;

  readonly pinInfo: ElementPin[] = [
    { name: 'AO',  x: 288, y: 450, signals: [analog(0)] },
    { name: 'DO',  x: 307, y: 450, signals: [] },
    { name: 'GND', x: 326, y: 450, signals: [GND()] },
    { name: 'VCC', x: 345, y: 450, signals: [VCC()] },
  ];

  static get styles() {
    return css`
      :host { display: inline-block; }
      .wrap { position: relative; display: inline-block; line-height: 0; }
    `;
  }

  render() {
    const rain      = Number(this.value) || 0;
    const threshold = Number(this.threshold) || 50;
    const doLow     = rain > threshold;         // DO is active-LOW
    const voltage   = 5.0 * rain / 100;
    const adcRaw    = Math.round((voltage / 5.0) * 1023);

    const showPower = this.ledPower;
    const showDO    = this.ledDO || doLow;

    return html`
      <div class="wrap">
        <svg
          width="135mm"
          height="115.5mm"
          version="1.1"
          viewBox="0 0 540 462"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <!-- Base PNG Asset Image -->
          <image href="${rainSensorPngUrl}" x="0" y="0" width="540" height="462" preserveAspectRatio="xMidYMid meet" />

          <!-- Dynamic Rain Droplets Overlay on sensing plate -->
          ${rain > 0 ? svg`
            <g opacity="${Math.min(1, 0.35 + (rain / 100) * 0.65)}">
              <circle cx="110" cy="310" r="11" fill="#38bdf8" opacity="0.8" />
              <circle cx="105" cy="305" r="4" fill="#ffffff" opacity="0.9" />

              <circle cx="80" cy="260" r="14" fill="#38bdf8" opacity="0.85" />
              <circle cx="74" cy="254" r="5" fill="#ffffff" opacity="0.9" />

              <circle cx="150" cy="360" r="12" fill="#38bdf8" opacity="0.8" />
              <circle cx="144" cy="354" r="4.5" fill="#ffffff" opacity="0.9" />

              <circle cx="120" cy="220" r="9" fill="#38bdf8" opacity="0.75" />
              <circle cx="60" cy="380" r="11" fill="#38bdf8" opacity="0.8" />
              <circle cx="160" cy="270" r="15" fill="#38bdf8" opacity="0.85" />
            </g>
          ` : ''}

          <!-- Power LED Glow Overlay (PWR-LED at x=348, y=348) -->
          ${showPower ? svg`
            <circle cx="348" cy="348" r="6" fill="#22c55e" />
            <circle cx="348" cy="348" r="14" fill="#22c55e" opacity="0.4" />
          ` : ''}

          <!-- DO LED Glow Overlay (DO-LED at x=286, y=348) -->
          ${showDO ? svg`
            <circle cx="286" cy="348" r="6" fill="#ef4444" />
            <circle cx="286" cy="348" r="14" fill="#ef4444" opacity="0.4" />
          ` : ''}

          <!-- Live Rain Readout Badge Overlay -->
          <rect x="257" y="245" width="120" height="48" rx="8" fill="#0f172a" stroke="#334155" stroke-width="2" opacity="0.92" />
          <text font-family="monospace" font-size="12px" font-weight="bold" text-anchor="middle">
            <tspan x="317" y="265" fill="#38bdf8">${rain}% RAIN</tspan>
            <tspan x="317" y="283" fill="#bef264">${voltage.toFixed(2)}V / ${adcRaw}</tspan>
          </text>
        </svg>
      </div>
    `;
  }
}



