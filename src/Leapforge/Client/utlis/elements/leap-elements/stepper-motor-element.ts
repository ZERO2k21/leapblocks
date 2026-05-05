import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { ElementPin } from '.';
import { mmToPix } from './utils/units';
import { safeDefine } from './utils/safe-define';

export interface NEMASpec {
  id: number;
  frameSize: number;
  holeRadius: number;
  shaftRadius: number;
  cornerRadius: number;
  cornerOffset: number;
  bodyRadius: number;
  textSize: number;
  valueYPosition: number;
  unitsYPosition: number;
}

const defaultSize = 23;

export class StepperMotorElement extends LitElement {
  /**
   * Cumulative (unbounded) angle in degrees.
   * Positive = CW, negative = CCW.
   * CircuitEngine passes (stepCount / stepsPerRev * 360) directly —
   * no modulo, no wrapping. This is the only correct way to drive rotation.
   */
  @property({ type: Number }) angle = 0;
  @property() arrow = '';
  @property() value = '';
  @property() units = '';
  @property() size: 8 | 11 | 14 | 17 | 23 | 34 = defaultSize;

  get pinInfo(): ElementPin[] {
    const spec = this.nemaSpecMap[this.size] ?? this.nemaSpecMap[defaultSize];
    const xOff = (spec.frameSize / 2 - 3.75) * mmToPix + 1;
    const yOff = (spec.frameSize + 5) * mmToPix;
    return [
      { name: 'A-', y: yOff, x: xOff, number: 1, signals: [] },
      { name: 'A+', y: yOff, x: xOff + 2.54 * mmToPix, number: 2, signals: [] },
      { name: 'B+', y: yOff, x: xOff + 5.08 * mmToPix, number: 3, signals: [] },
      { name: 'B-', y: yOff, x: xOff + 7.62 * mmToPix, number: 4, signals: [] },
    ];
  }

  readonly nemaSpecMap: { [key: string]: NEMASpec } = {
    '8': { id: 8, frameSize: 20.4, holeRadius: 0.5, shaftRadius: 3.5, cornerRadius: 2.5, cornerOffset: 2.5, bodyRadius: 7.7, textSize: 10, valueYPosition: 16.5, unitsYPosition: 19.7 },
    '11': { id: 11, frameSize: 28.2, holeRadius: 1.25, shaftRadius: 5, cornerRadius: 2.5, cornerOffset: 2.5, bodyRadius: 11, textSize: 12, valueYPosition: 21.5, unitsYPosition: 24 },
    '14': { id: 14, frameSize: 35.2, holeRadius: 1.5, shaftRadius: 5, cornerRadius: 4.5, cornerOffset: 4.5, bodyRadius: 11, textSize: 14, valueYPosition: 26, unitsYPosition: 32 },
    '17': { id: 17, frameSize: 42.3, holeRadius: 1.5, shaftRadius: 5, cornerRadius: 5, cornerOffset: 5.5, bodyRadius: 14, textSize: 16, valueYPosition: 30.5, unitsYPosition: 33.7 },
    '23': { id: 23, frameSize: 57.3, holeRadius: 2.5, shaftRadius: 6.35, cornerRadius: 5, cornerOffset: 5.5, bodyRadius: 19.5, textSize: 24, valueYPosition: 41, unitsYPosition: 46 },
    '34': { id: 34, frameSize: 86, holeRadius: 3.25, shaftRadius: 14, cornerRadius: 3.25, cornerOffset: 8.4, bodyRadius: 36.5, textSize: 32, valueYPosition: 68, unitsYPosition: 75 },
  };

  update(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('size')) {
      this.dispatchEvent(new CustomEvent('pininfo-change'));
    }
    super.update(changedProperties);
  }

  render() {
    const spec = this.nemaSpecMap[this.size] ?? this.nemaSpecMap[defaultSize];
    const { cornerRadius, holeRadius, shaftRadius, frameSize, cornerOffset, bodyRadius } = spec;
    const halfFrame = frameSize / 2;
    const halfShaft = shaftRadius / 2;
    const innerHoleRadius = holeRadius * 0.9;
    const outerHoleRadius = holeRadius * 1.1;

    // Wokwi's exact D-cut shaft geometry
    const rOff = Math.sqrt(0.75 * Math.pow(shaftRadius, 2));

    const energized = !!this.arrow;
    const glowFilter = energized ? 'drop-shadow(0 0 3px #BEF264)' : 'none';
    const glowColor = energized ? '#BEF264' : 'none';

    // this.angle is already the cumulative unbounded angle from CircuitEngine.
    // Positive = CW, negative = CCW. Use directly — no delta math needed.
    const a = this.angle;

    return html`
      <svg
        width="${frameSize + 1}mm"
        height="${frameSize + 5}mm"
        version="1.1"
        viewBox="0 0 ${(1 + frameSize) * mmToPix} ${(5 + frameSize) * mmToPix}"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
      >
        <defs>
          <linearGradient id="frame-gradient"
            x1="-${frameSize * 0.2}" x2="${frameSize * 2}"
            y1="${frameSize}" y2="${frameSize}" gradientUnits="userSpaceOnUse">
            <stop stop-color="#666" offset="0" />
            <stop stop-color="#fff" offset="1" />
          </linearGradient>
          <linearGradient id="shaft-gradient"
            x1="0" x2="0" y1="-5" y2="5" gradientUnits="userSpaceOnUse">
            <stop stop-color="#9d9d9d" offset="0" />
            <stop stop-color="#9d9d9d" stop-opacity="0" offset="1" />
          </linearGradient>
          <linearGradient id="body-gradient"
            x1="${frameSize * 0.1}" x2="${frameSize * 0.7}"
            y1="${frameSize}" y2="${frameSize}" gradientUnits="userSpaceOnUse">
            <stop stop-color="#9d9d9d" offset="0" />
            <stop stop-color="#fdfafa" offset=".29501" />
            <stop stop-color="#2a2a2a" offset="1" />
          </linearGradient>
        </defs>

        <g transform="translate(1,1)">
          <g transform="scale(${mmToPix})">

            <!-- Wire pins -->
            <path id="pin"
              transform="translate(${halfFrame - 3.75} ${frameSize})"
              fill="#9f9f9f"
              d="m 0 0 c .5 0 .5 0 .5 .5 v 4.55 c -.5 .5 -.5 .5 -1 0 v -4.5 c 0 -.5 0 -.5 .5 -.5"
            />
            <use xlink:href="#pin" x="2.54" />
            <use xlink:href="#pin" x="5.08" />
            <use xlink:href="#pin" x="7.62" />

            <!-- NEMA frame -->
            <g stroke-linecap="round" stroke-linejoin="round">
              <rect width="${frameSize}" height="${frameSize}"
                rx="${cornerRadius}" ry="${cornerRadius}"
                fill="url(#frame-gradient)" stroke="#000" stroke-width=".3245"
              />
              <circle cx="${cornerOffset}"             cy="${cornerOffset}"             r="${outerHoleRadius}" fill="#666" />
              <circle cx="${cornerOffset}"             cy="${cornerOffset}"             r="${innerHoleRadius}" fill="#e6e6e6" />
              <circle cx="${frameSize - cornerOffset}" cy="${cornerOffset}"             r="${outerHoleRadius}" fill="#666" />
              <circle cx="${frameSize - cornerOffset}" cy="${cornerOffset}"             r="${innerHoleRadius}" fill="#e6e6e6" />
              <circle cx="${cornerOffset}"             cy="${frameSize - cornerOffset}" r="${outerHoleRadius}" fill="#666" />
              <circle cx="${cornerOffset}"             cy="${frameSize - cornerOffset}" r="${innerHoleRadius}" fill="#e6e6e6" />
              <circle cx="${frameSize - cornerOffset}" cy="${frameSize - cornerOffset}" r="${outerHoleRadius}" fill="#666" />
              <circle cx="${frameSize - cornerOffset}" cy="${frameSize - cornerOffset}" r="${innerHoleRadius}" fill="#e6e6e6" />
            </g>

            <!-- Motor body -->
            <circle cx="${halfFrame}" cy="${halfFrame}" r="${bodyRadius}"
              fill="#868686" fill-opacity=".89602" opacity=".73"
              stroke="url(#body-gradient)" stroke-width="1.41429"
              style="filter:${glowFilter}; transition:filter 80ms ease"
            />

            <!-- Energization ring -->
            <circle cx="${halfFrame}" cy="${halfFrame}" r="${bodyRadius - 1}"
              fill="none" stroke="${glowColor}" stroke-width="0.8"
              stroke-opacity="${energized ? '0.6' : '0'}"
              style="transition:stroke-opacity 80ms ease"
            />

            <!--
              SHAFT + ARROW — Wokwi's exact pattern:
              translate(cx, cy) then rotate(angle) rotates around shaft center.
              'a' is the cumulative unbounded angle — negative for CCW, positive for CW.
              SVG handles negative rotate() correctly (CCW rotation).
            -->

            <!-- Direction arrow (behind shaft) -->
            <path
              transform="rotate(${a}, ${halfFrame}, ${halfFrame}) translate(${halfFrame} ${halfFrame})"
              fill="${this.arrow || 'transparent'}"
              d="m 0 0 l -${shaftRadius} 0 l ${shaftRadius} -${halfFrame - 3} l ${shaftRadius} ${halfFrame - 3} z"
            />

            <!-- D-cut shaft (Wokwi's exact path + rotation) -->
            <path
              transform="translate(${halfFrame}, ${halfFrame}) rotate(${a})"
              d="m -${halfShaft} -${rOff} a ${shaftRadius} ${shaftRadius} 0 1 0 ${shaftRadius} 0 z"
              fill="#4d4d4d"
              stroke="url(#shaft-gradient)"
              stroke-width=".57968"
            />

            <!-- Text -->
            <text font-family="arial" font-size="14.667px" text-align="center" text-anchor="middle">
              <tspan x="${halfFrame}" y="${spec.valueYPosition}" font-size="${spec.textSize / mmToPix}px">
                ${this.value}
              </tspan>
              <tspan x="${halfFrame}" y="${spec.unitsYPosition}" font-size="${(0.7 * spec.textSize) / mmToPix}px">
                ${this.units}
              </tspan>
            </text>

          </g>
        </g>
      </svg>`;
  }
}

safeDefine('leap-stepper-motor', StepperMotorElement);
