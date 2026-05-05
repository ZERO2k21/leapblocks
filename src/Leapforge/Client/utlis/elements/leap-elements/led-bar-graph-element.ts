import { html, LitElement, svg } from 'lit';
import { property } from 'lit/decorators.js';
import { ElementPin } from './pin';
import { mmToPix } from './utils/units';
import { safeDefine } from './utils/safe-define';

const segments = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const mm = mmToPix;
const anodeX = 1.27 * mm;
const cathodeX = 8.83 * mm;

const green = '#9eff3c';
const blue = '#2c95fa';
const cyan = '#6cf9dc';
const yellow = '#f1d73c';
const red = '#dc012d';

const colorPalettes: Record<string, string[]> = {
  GYR: [green, green, green, green, green, yellow, yellow, yellow, red, red],
  BCYR: [blue, cyan, cyan, cyan, cyan, yellow, yellow, yellow, red, red],
};

export class LedBarGraphElement extends LitElement {
  /** The color of a lit segment. Either HTML color or the special values GYR / BCYR */
  @property() color = 'red';

  /** The color of an unlit segment */
  @property() offColor = '#444';

  readonly pinInfo: ElementPin[] = [
    { name: 'A1', x: 1.27, y: 1.27, number: 1, description: 'Anode 1', signals: [] },
    { name: 'A2', x: 1.27, y: 3.81, number: 2, description: 'Anode 2', signals: [] },
    { name: 'A3', x: 1.27, y: 6.35, number: 3, description: 'Anode 3', signals: [] },
    { name: 'A4', x: 1.27, y: 8.89, number: 4, description: 'Anode 4', signals: [] },
    { name: 'A5', x: 1.27, y: 11.43, number: 5, description: 'Anode 5', signals: [] },
    { name: 'A6', x: 1.27, y: 13.97, number: 6, description: 'Anode 6', signals: [] },
    { name: 'A7', x: 1.27, y: 16.51, number: 7, description: 'Anode 7', signals: [] },
    { name: 'A8', x: 1.27, y: 19.05, number: 8, description: 'Anode 8', signals: [] },
    { name: 'A9', x: 1.27, y: 21.59, number: 9, description: 'Anode 9', signals: [] },
    { name: 'A10', x: 1.27, y: 24.13, number: 10, description: 'Anode 10', signals: [] },
    { name: 'C1', x: 8.83, y: 1.27, number: 20, description: 'Cathode 1', signals: [] },
    { name: 'C2', x: 8.83, y: 3.81, number: 19, description: 'Cathode 2', signals: [] },
    { name: 'C3', x: 8.83, y: 6.35, number: 18, description: 'Cathode 3', signals: [] },
    { name: 'C4', x: 8.83, y: 8.89, number: 17, description: 'Cathode 4', signals: [] },
    { name: 'C5', x: 8.83, y: 11.43, number: 16, description: 'Cathode 5', signals: [] },
    { name: 'C6', x: 8.83, y: 13.97, number: 15, description: 'Cathode 6', signals: [] },
    { name: 'C7', x: 8.83, y: 16.51, number: 14, description: 'Cathode 7', signals: [] },
    { name: 'C8', x: 8.83, y: 19.05, number: 13, description: 'Cathode 8', signals: [] },
    { name: 'C9', x: 8.83, y: 21.59, number: 12, description: 'Cathode 9', signals: [] },
    { name: 'C10', x: 8.83, y: 24.13, number: 11, description: 'Cathode 10', signals: [] },
  ];

  /**
   * The values for the individual segments: 1 for a lit segment, and 0 for
   * an unlit segment.
   */
  @property({ type: Array }) values: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  render() {
    const { values, color, offColor } = this;
    const palette = colorPalettes[color];
    return html`
      <svg
        width="10.1mm"
        height="25.5mm"
        version="1.1"
        viewBox="0 0 10.1 25.5"
        xmlns="http://www.w3.org/2000/svg"
      >
        <pattern id="pin-pattern" height="2.54" width="10.1" patternUnits="userSpaceOnUse">
          <circle cx="1.27" cy="1.27" r="0.5" fill="#aaa" />
          <circle cx="8.83" cy="1.27" r="0.5" fill="#aaa" />
        </pattern>
        <path d="m1.4 0h8.75v25.5h-10.1v-24.2z" />
        <rect width="10.1" height="25.4" fill="url(#pin-pattern)" />
        ${segments.map(
          (index) =>
            svg`<rect x="2.5" y="${0.4 + index * 2.54}" width="5" height="1.74" fill="${
              values[index] ? (palette?.[index] ?? color) : offColor
            }"/>`,
        )}
      </svg>
    `;
  }
}

safeDefine('leap-led-bar-graph', LedBarGraphElement);
