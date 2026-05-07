import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ElementPin } from '.';
import { mmToPix } from './utils/units';

/**
 * NemaSpec describes a NEMA Stepper specification (for the purpose of visualisation)
 *
 */
export interface NEMASpec {
  id: number; // Nema common number representing the size shorthand (Nema11 Nema 17 etc)
  frameSize: number; // the frame size in mm. Since Nema Steppers are square, only one side needed
  holeRadius: number; // Fastening hole size
  shaftRadius: number; // Motor shaft radius
  cornerRadius: number; // Frame corner radius
  cornerOffset: number; // Offset from corner to center of hole
  bodyRadius: number; // the round motor body size
  textSize: number; // Text size showing units etc
  /**  Y position of value text */
  valueYPosition: number;
  /**  Y position of units text */
  unitsYPosition: number;
}

const defaultSize = 23;

@customElement('leap-stepper-motor')
export class StepperMotorElement extends LitElement {
  /**
   * Display angle 0–360° (modulo). We convert this to a cumulative angle
   * internally so CSS transition always takes the short arc.
   */
  @property({ type: Number }) angle = 0;
  @property() arrow = '';
  @property() value = '';
  @property() units = '';
  @property() size: 8 | 11 | 14 | 17 | 23 | 34 = defaultSize;

  /** Cumulative angle (unbounded) used for CSS transform — avoids wrap-around flips */
  private _cumulativeAngle = 0;
  /** Last modulo angle received so we can compute the shortest-arc delta */
  private _lastModAngle = 0;

  get pinInfo(): ElementPin[] {
    const spec = this.nemaSpecMap[this.size] ?? this.nemaSpecMap[defaultSize];

    // these offsets match the transform in renderFace
    const xOff = (spec.frameSize / 2 - 3.75) * mmToPix + 1;
    const yOff = (spec.frameSize + 5) * mmToPix;

    const pi = [
      { name: 'A-', y: yOff, x: xOff, number: 1, signals: [] },
      { name: 'A+', y: yOff, x: xOff + 2.54 * mmToPix, number: 2, signals: [] },
      { name: 'B+', y: yOff, x: xOff + 5.08 * mmToPix, number: 3, signals: [] },
      { name: 'B-', y: yOff, x: xOff + 7.62 * mmToPix, number: 4, signals: [] },
    ];

    return pi;
  }

  readonly nemaSpecMap: { [key: string]: NEMASpec } = {
    '8': {
      id: 8,
      frameSize: 20.4,
      holeRadius: 0.5,
      shaftRadius: 3.5,
      cornerRadius: 2.5,
      cornerOffset: 2.5,
      bodyRadius: 7.7,
      textSize: 10,
      valueYPosition: 16.5,
      unitsYPosition: 19.7,
    },
    '11': {
      id: 11,
      frameSize: 28.2,
      holeRadius: 1.25,
      shaftRadius: 5,
      cornerRadius: 2.5,
      cornerOffset: 2.5,
      bodyRadius: 11,
      textSize: 12,
      valueYPosition: 21.5,
      unitsYPosition: 24,
    },
    '14': {
      id: 14,
      frameSize: 35.2,
      holeRadius: 1.5,
      shaftRadius: 5,
      cornerRadius: 4.5,
      cornerOffset: 4.5,
      bodyRadius: 11,
      textSize: 14,
      valueYPosition: 26,
      unitsYPosition: 32,
    },
    '17': {
      id: 17,
      frameSize: 42.3,
      holeRadius: 1.5,
      shaftRadius: 5,
      cornerRadius: 5,
      cornerOffset: 5.5,
      bodyRadius: 14,
      textSize: 16,
      valueYPosition: 30.5,
      unitsYPosition: 33.7,
    },
    '23': {
      id: 23,
      frameSize: 57.3,
      holeRadius: 2.5,
      shaftRadius: 6.35,
      cornerRadius: 5,
      cornerOffset: 5.5,
      bodyRadius: 19.5,
      textSize: 24,
      valueYPosition: 41,
      unitsYPosition: 46,
    },
    '34': {
      id: 34,
      frameSize: 86,
      holeRadius: 3.25,
      shaftRadius: 14,
      cornerRadius: 3.25,
      cornerOffset: 8.4,
      bodyRadius: 36.5,
      textSize: 32,
      valueYPosition: 68,
      unitsYPosition: 75,
    },
  };

  update(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('size')) {
      this.dispatchEvent(new CustomEvent('pininfo-change'));
    }
    // We now receive a perfectly unbounded cumulative angle from the emulator.
    // No delta calculation needed.
    if (changedProperties.has('angle')) {
      this._cumulativeAngle = this.angle;
    }
    super.update(changedProperties);
  }

  render() {
    const spec = this.nemaSpecMap[this.size] ?? this.nemaSpecMap[defaultSize];

    const cornerRadius = spec.cornerRadius;
    const holeRadius = spec.holeRadius;
    const shaftRadius = spec.shaftRadius;
    const frameSize = spec.frameSize;
    const cornerOffset = spec.cornerOffset;
    const bodyRadius = spec.bodyRadius;

    const halfShaft = shaftRadius / 2;
    const halfFrame = frameSize / 2;

    const innerHoleRadius = holeRadius * 0.9;
    const outerHoleRadius = holeRadius * 1.1;

    // shaft radius offset, needed for transform
    const rOff = Math.sqrt(0.75 * Math.pow(shaftRadius, 2));

    const energized = !!this.arrow;
    const glowColor = energized ? '#BEF264' : 'none';
    const glowFilter = energized ? 'drop-shadow(0 0 3px #BEF264)' : 'none';

    // The shaft center in SVG user-space (mm units, inside the scale group)
    // After translate(1,1) + scale(mmToPix), the shaft center in CSS px is:
    const shaftCenterPx_X = (1 + halfFrame) * mmToPix;
    const shaftCenterPx_Y = (1 + halfFrame) * mmToPix;

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
        <linearGradient
          id="frame-gradient"
          x1="-${frameSize * 0.2}"
          x2="${frameSize * 2}"
          y1="${frameSize}"
          y2="${frameSize}"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#666" offset="0" />
          <stop stop-color="#fff" offset="1" />
        </linearGradient>
        <linearGradient
          id="shaft-gradient"
          x1="0"
          x2="0"
          y1="-5"
          y2="5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#9d9d9d" offset="0" />
          <stop stop-color="#9d9d9d" stop-opacity="0" offset="1" />
        </linearGradient>
        <linearGradient
          id="body-gradient"
          x1="${frameSize * 0.1}"
          x2="${frameSize * 0.7}"
          y1="${frameSize}"
          y2="${frameSize}"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#9d9d9d" offset="0" />
          <stop stop-color="#fdfafa" offset=".29501" />
          <stop offset="1" stop-color="#2a2a2a" />
        </linearGradient>
      </defs>
      <!-- Body -->
      <g transform="translate(1,1)">
        <g transform="scale(${mmToPix})">
          <!-- Pins -->
          <path
            id="pin"
            transform="translate(${halfFrame - 3.75} ${frameSize})"
            fill="#9f9f9f"
            d="m 0 0 c .5 0 .5 0 .5 .5 v 4.55 c -.5 .5 -.5 .5 -1 0 v -4.5 c 0 -.5 0 -.5 .5 -.5"
          />
          <use xlink:href="#pin" x="2.54" />
          <use xlink:href="#pin" x="5.08" />
          <use xlink:href="#pin" x="7.62" />

          <g stroke-linecap="round" stroke-linejoin="round">
            <rect
              width="${frameSize}"
              height="${frameSize}"
              rx="${cornerRadius}"
              ry="${cornerRadius}"
              fill="url(#frame-gradient)"
              stroke="#000"
              stroke-width=".3245"
            />
            <circle cx="${cornerOffset}" cy="${cornerOffset}" r="${outerHoleRadius}" fill="#666" />
            <circle cx="${cornerOffset}" cy="${cornerOffset}" r="${innerHoleRadius}" fill="#e6e6e6" />
            <circle cx="${frameSize - cornerOffset}" cy="${cornerOffset}" r="${outerHoleRadius}" fill="#666" />
            <circle cx="${frameSize - cornerOffset}" cy="${cornerOffset}" r="${innerHoleRadius}" fill="#e6e6e6" />
            <circle cx="${cornerOffset}" cy="${frameSize - cornerOffset}" r="${outerHoleRadius}" fill="#666" />
            <circle cx="${cornerOffset}" cy="${frameSize - cornerOffset}" r="${innerHoleRadius}" fill="#e6e6e6" />
            <circle cx="${frameSize - cornerOffset}" cy="${frameSize - cornerOffset}" r="${outerHoleRadius}" fill="#666" />
            <circle cx="${frameSize - cornerOffset}" cy="${frameSize - cornerOffset}" r="${innerHoleRadius}" fill="#e6e6e6" />
          </g>

          <!-- motor body with energization glow -->
          <circle
            cx="${halfFrame}"
            cy="${halfFrame}"
            r="${bodyRadius}"
            fill="#868686"
            fill-opacity=".89602"
            opacity=".73"
            stroke="url(#body-gradient)"
            stroke-width="1.41429"
            style="filter: ${glowFilter}; transition: filter 80ms ease"
          />

          <!-- Energization ring — lights up when coils are active -->
          <circle
            cx="${halfFrame}"
            cy="${halfFrame}"
            r="${bodyRadius - 1}"
            fill="none"
            stroke="${glowColor}"
            stroke-width="0.8"
            stroke-opacity="${energized ? '0.6' : '0'}"
            style="transition: stroke-opacity 80ms ease, stroke 80ms ease"
          />
        </g>
      </g>

      <!-- Rotator group — shaft rotates in place at its center -->
      <g
        id="rotator"
        style="transform: rotate(${this._cumulativeAngle}deg); transform-origin: ${shaftCenterPx_X}px ${shaftCenterPx_Y}px; transition: transform 100ms linear;"
      >
        <g transform="translate(1,1)">
          <g transform="scale(${mmToPix})">
            <!-- Direction arrow -->
            <path
              transform="translate(${halfFrame} ${halfFrame})"
              fill="${this.arrow || 'rgba(255,255,255,0.15)'}"
              d="m 0 0 l -${shaftRadius} 0 l ${shaftRadius} -${halfFrame - 3} l ${shaftRadius} ${halfFrame - 3} z"
            />
            <!-- D-cut shaft -->
            <path
              transform="translate(${halfFrame}, ${halfFrame})"
              d="m -${halfShaft} -${rOff} a ${shaftRadius} ${shaftRadius} 0 1 0 ${shaftRadius} 0 z"
              fill="#4d4d4d"
              stroke="url(#shaft-gradient)"
              stroke-width=".57968"
            />
          </g>
        </g>
      </g>

      <!-- Text overlay (outside rotator so it stays upright) -->
      <g transform="translate(1,1)">
        <g transform="scale(${mmToPix})">
          <text font-family="arial" font-size="14.667px" text-align="center" text-anchor="middle">
            <tspan
              x="${halfFrame}"
              y="${spec.valueYPosition}"
              font-size="${spec.textSize / mmToPix}px"
            >
              ${this.value}
            </tspan>
            <tspan
              x="${halfFrame}"
              y="${spec.unitsYPosition}"
              font-size="${(0.7 * spec.textSize) / mmToPix}px"
            >
              ${this.units}
            </tspan>
          </text>
        </g>
      </g>
    </svg>`;
  }
}
