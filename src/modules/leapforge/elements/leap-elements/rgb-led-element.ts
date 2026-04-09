import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ElementPin } from '.';

@customElement('leap-rgb-led')
export class RGBLedElement extends LitElement {
  @property({ type: Number }) ledRed = 0;
  @property({ type: Number }) ledGreen = 0;
  @property({ type: Number }) ledBlue = 0;
  @property({ type: Boolean }) damaged = false;

  readonly pinInfo: ElementPin[] = [
    { name: 'R', x: 8.5, y: 44, signals: [] },
    { name: 'COM', x: 18, y: 54, signals: [] },
    { name: 'G', x: 26.4, y: 44, signals: [] },
    { name: 'B', x: 35.7, y: 44, signals: [] },
  ];

  render() {
    const { ledRed, ledGreen, ledBlue, damaged } = this;
    const brightness = Math.max(ledRed, ledGreen, ledBlue);
    const opacity = brightness ? 0.4 + brightness * 0.6 : 0;
    const grayscaleFilter = damaged ? 'grayscale(100%) opacity(0.5)' : '';

    // Color Mixing
    const r = Math.round(ledRed * 255);
    const g = Math.round(ledGreen * 255);
    const b = Math.round(ledBlue * 255);
    const mainColor = `rgb(${r},${g},${b})`;

    return html`
      <svg
        width="42.129"
        height="72.582"
        version="1.2"
        viewBox="-17 -10 37.3425 57.5115"
        xmlns="http://www.w3.org/2000/svg"
        style="filter: ${grayscaleFilter}; overflow: visible;"
      >
        <defs>
          <filter id="light1" x="-1" y="-1" height="3" width="3">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
          <filter id="light2" x="-1" y="-1" height="3" width="3">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter id="auraFilter" x="-1" y="-1" height="3" width="3">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        <!-- LED Legs -->
        <g fill="none" stroke="#9D9999" stroke-linecap="round" stroke-width="1.5px">
          <path d="m4.1 15.334 3.0611 9.971" />
          <path d="m8 14.4 5.9987 4.0518 1.1777 6.5679" stroke-linejoin="round" />
          <path d="m-4.3 14.184-5.0755 5.6592-0.10206 6.1694" stroke-linejoin="round" />
          <path d="m-1.1 15.607-0.33725 18.4" />
        </g>

        <!-- Layer 1: Outer Aura (Wokwi Ambient light) -->
        <circle
          cx="1.5"
          cy="4"
          r="16"
          fill="${mainColor}"
          filter="url(#auraFilter)"
          opacity="${opacity * 0.4}"
        />

        <!-- LED Body Paths (Colored by internal light) -->
        <path
          d="m8.3435 5.65v-5.9126c0-3.9132-3.168-7.0884-7.0855-7.0884-3.9125 0-7.0877 3.1694-7.0877 7.0884v13.649c1.4738 1.651 4.0968 2.7526 7.0877 2.7526 4.6195 0 8.3686-2.6179 8.3686-5.8594v-1.5235c-7.4e-4 -1.1426-0.47444-2.2039-1.283-3.1061z"
          fill="${brightness > 0 ? mainColor : '#fff'}"
          opacity="${brightness > 0 ? 0.4 : 0.2}"
        />

        <!-- Layer 2: Main Bulb Halo -->
        <circle
          cx="1.5"
          cy="4"
          r="9"
          fill="${mainColor}"
          filter="url(#light2)"
          opacity="${opacity}"
        />

        <!-- Layer 3: The Core Bulb (Bright Hot Center) -->
        <circle
          cx="1.5"
          cy="4"
          r="3"
          fill="white"
          filter="url(#light1)"
          opacity="${opacity}"
        />

        <!-- Specular Glass Shading -->
        <path
          d="m8.3435 5.65v-5.9126c0-3.9132-3.168-7.0884-7.0855-7.0884-3.9125 0-7.0877 3.1694-7.0877 7.0884v13.649c1.4738 1.651 4.0968 2.7526 7.0877 2.7526 4.6195 0 8.3686-2.6179 8.3686-5.8594v-1.5235c-7.4e-4 -1.1426-0.47444-2.2039-1.283-3.1061z"
          fill="white"
          opacity="${brightness > 0 ? 0.4 : 0.65}"
        />
      </svg>
    `;
  }
}
