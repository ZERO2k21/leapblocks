/**
 * ILI9341 2.8" SPI TFT Display — 240×320 color (RGB565)
 * Simulation element for LeapForge.
 *
 * SVG board: 46.5mm × 77.6mm
 * Screen area (SVG units): x≈1.62 y≈6.79 w≈43.3 h≈61.9
 * Pins (bottom row, SVG units): y≈75, x starts at ≈11.8 with 2.54mm pitch
 */
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { ElementPin, spi } from './pin';
import { safeDefine } from './utils/safe-define';

// SVG viewBox dimensions (mm)
const SVG_W = 46.5;
const SVG_H = 77.6;

// Scale factor: render at ~3× for a crisp on-screen size
const SCALE = 3;
const PX_W = Math.round(SVG_W * SCALE); // ~140 px
const PX_H = Math.round(SVG_H * SCALE); // ~233 px

// Screen rect in SVG units: x=1.62 y=6.79 w=43.3 h=61.9
// Scaled to CSS pixels for the canvas overlay
const SCREEN_X = Math.round(1.62  * SCALE); //  ~5 px
const SCREEN_Y = Math.round(6.79  * SCALE); // ~20 px
const SCREEN_W = Math.round(43.3  * SCALE); // ~130 px
const SCREEN_H = Math.round(61.9  * SCALE); // ~186 px

// Native pixel resolution of the ILI9341
const NATIVE_W = 240;
const NATIVE_H = 320;

type CanvasCtx = CanvasRenderingContext2D | null | undefined;

export class ILI9341Element extends LitElement {
  /** Native screen width (pixels) */
  readonly screenWidth  = NATIVE_W;
  /** Native screen height (pixels) */
  readonly screenHeight = NATIVE_H;

  /**
   * RGBA pixel buffer (240×320×4 bytes).
   * Set this property and call redraw() to update the display.
   * Alternatively, assign a new ImageData reference to trigger an automatic redraw.
   */
  @property({ attribute: false, hasChanged: () => true }) imageData: ImageData | null = null;

  @property({ type: Boolean }) flipHorizontal = false;
  @property({ type: Boolean }) flipVertical    = false;

  /** Rendered element width in CSS pixels */
  readonly width  = PX_W;
  /** Rendered element height in CSS pixels */
  readonly height = PX_H;

  private _canvas: HTMLCanvasElement | null | undefined = undefined;
  private _ctx: CanvasCtx = null;

  // SPI pin layout — 9 pins at the bottom of the board (2.54mm pitch)
  // SVG coordinates match the pin circles in renderSVG()
  readonly pinInfo: ElementPin[] = [
    { name: 'VCC',  x: Math.round(11.8  * SCALE), y: Math.round(75.5 * SCALE), signals: [{ type: 'power', signal: 'VCC' }] },
    { name: 'GND',  x: Math.round(14.34 * SCALE), y: Math.round(75.5 * SCALE), signals: [{ type: 'power', signal: 'GND' }] },
    { name: 'CS',   x: Math.round(16.88 * SCALE), y: Math.round(75.5 * SCALE), signals: [spi('SS')] },
    { name: 'RST',  x: Math.round(19.42 * SCALE), y: Math.round(75.5 * SCALE), signals: [] },
    { name: 'D/C',  x: Math.round(21.96 * SCALE), y: Math.round(75.5 * SCALE), signals: [] },
    { name: 'MOSI', x: Math.round(24.5  * SCALE), y: Math.round(75.5 * SCALE), signals: [spi('MOSI')] },
    { name: 'SCK',  x: Math.round(27.04 * SCALE), y: Math.round(75.5 * SCALE), signals: [spi('SCK')] },
    { name: 'LED',  x: Math.round(29.58 * SCALE), y: Math.round(75.5 * SCALE), signals: [] },
    { name: 'MISO', x: Math.round(32.12 * SCALE), y: Math.round(75.5 * SCALE), signals: [spi('MISO')] },
  ];

  static get styles() {
    return css`
      :host { display: inline-block; }

      .tft-wrap {
        position: relative;
        display: inline-block;
        line-height: 0;
      }

      .tft-wrap svg {
        display: block;
        width:  ${PX_W}px;
        height: ${PX_H}px;
      }

      .tft-wrap canvas {
        position: absolute;
        left:   ${SCREEN_X}px;
        top:    ${SCREEN_Y}px;
        width:  ${SCREEN_W}px;
        height: ${SCREEN_H}px;
        image-rendering: crisp-edges;
        image-rendering: pixelated;
        background: #000;
      }
    `;
  }

  constructor() {
    super();
    // Default blank (black) frame
    this.imageData = new ImageData(NATIVE_W, NATIVE_H);
    // Fill alpha channel so the canvas isn't transparent
    for (let i = 3; i < this.imageData.data.length; i += 4) {
      this.imageData.data[i] = 255;
    }
  }

  /** Push the current imageData to the canvas. */
  public redraw(): void {
    if (this._ctx && this.imageData) {
      this._ctx.putImageData(this.imageData, 0, 0);
    }
  }

  private _initContext(): void {
    this._canvas = this.shadowRoot?.querySelector('canvas') ?? null;
    this._ctx    = this._canvas?.getContext('2d') ?? null;
  }

  override firstUpdated(): void {
    this._initContext();
    this.redraw();
    // Notify external code (e.g. CircuitEngine) that the canvas is ready
    this.dispatchEvent(new CustomEvent('canvas-ready', { bubbles: true, composed: true }));
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('imageData') && this.imageData) {
      if (!this._ctx) this._initContext();
      this.redraw();
    }
    if (changed.has('flipHorizontal') || changed.has('flipVertical')) {
      this._applyFlip();
    }
  }

  private _applyFlip(): void {
    if (!this._canvas) return;
    const sx = this.flipHorizontal ? -1 : 1;
    const sy = this.flipVertical   ? -1 : 1;
    this._canvas.style.transform = (sx !== 1 || sy !== 1) ? `scale(${sx}, ${sy})` : '';
  }

  private renderSVG() {
    return html`<svg
      width="${PX_W}"
      height="${PX_H}"
      viewBox="0 0 46.5 77.6"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      <!-- PCB board -->
      <path
        d="m8.8e-7 3.37e-6v77.6h46.5v-77.6zm43.1 1.78a1.8 1.8 0 0 1 1.8 1.8 1.8 1.8 0 0 1-1.8 1.8 1.8 1.8 0 0 1-1.8-1.8 1.8 1.8 0 0 1 1.8-1.8zm-39.4 0.0946a1.8 1.8 0 0 1 1.8 1.8 1.8 1.8 0 0 1-1.8 1.8 1.8 1.8 0 0 1-1.8-1.8 1.8 1.8 0 0 1 1.8-1.8zm0 70.7a1.8 1.8 0 0 1 1.8 1.8 1.8 1.8 0 0 1-1.8 1.8 1.8 1.8 0 0 1-1.8-1.8 1.8 1.8 0 0 1 1.8-1.8zm39.4 0.0946a1.8 1.8 0 0 1 1.8 1.8 1.8 1.8 0 0 1-1.8 1.8 1.8 1.8 0 0 1-1.8-1.8 1.8 1.8 0 0 1 1.8-1.8zm-31 2.68h1.41v1.34h-1.41zm2.53 0h1.41v1.34h-1.41zm2.56 0h1.41v1.34h-1.41zm2.54 0h1.41v1.34h-1.41zm12.7 0h1.41v1.34h-1.41zm-10.1 0.0119h1.41v1.34h-1.41zm2.54 0.0119h1.41v1.34h-1.41zm5.08 0h1.41v1.34h-1.41zm-2.53 0.0114h1.41v1.34h-1.41z"
        fill="#931917"
        stroke-width="0"
      />

      <!-- LCD panel background -->
      <path d="m0.17 5.65v64.6h46.1v-64.6zm6.46 62.9h34.7v1.7h-34.7z" fill="#f6e1f1" />

      <!-- Backlight strip -->
      <rect x="11.2" y="66.7" width="24.2" height="6.24" rx="1" ry="1" fill="#bdab16" opacity=".4" />

      <!-- Active screen area (black — canvas overlays this) -->
      <rect x="1.62" y="6.79" width="43.3" height="61.9" fill="#000" />

      <!-- Pin header outline -->
      <rect x="10.8" y="74.6" width="24.2" height="2.83" fill="none" stroke="#fff" stroke-width=".27" />

      <!-- Pin circles -->
      <g fill="#ccc">
        <path d="m11.8 75v1.99h1.98v-1.99zm0.988 0.397a0.6 0.6 0 0 1 0.0041 0 0.6 0.6 0 0 1 0.6 0.6 0.6 0.6 0 0 1-0.6 0.6 0.6 0.6 0 0 1-0.6-0.6 0.6 0.6 0 0 1 0.596-0.6z" />
        <path
          id="ili-pin"
          d="m15.3 75a1 1 0 0 0-0.987 1 1 1 0 0 0 1 1 1 1 0 0 0 1-1 1 1 0 0 0-1-1 1 1 0 0 0-0.0134 0zm0.0093 0.4a0.6 0.6 0 0 1 0.0041 0 0.6 0.6 0 0 1 0.6 0.6 0.6 0.6 0 0 1-0.6 0.6 0.6 0.6 0 0 1-0.6-0.6 0.6 0.6 0 0 1 0.596-0.6z"
        />
        <use xlink:href="#ili-pin" x="2.54" />
        <use xlink:href="#ili-pin" x="5.08" />
        <use xlink:href="#ili-pin" x="7.62" />
        <use xlink:href="#ili-pin" x="10.16" />
        <use xlink:href="#ili-pin" x="12.7" />
        <use xlink:href="#ili-pin" x="15.24" />
        <use xlink:href="#ili-pin" x="17.78" />
      </g>

      <!-- Labels -->
      <text font-family="monospace" font-size="3.5px" fill="#fff">
        <tspan x="8.2"  y="76.9">1</tspan>
        <tspan x="35.6" y="76.9">9</tspan>
        <tspan x="14.2" y="4.3" font-size="4.6px">ILI9341</tspan>
      </text>
    </svg>`;
  }

  override render() {
    return html`
      <div class="tft-wrap">
        ${this.renderSVG()}
        <canvas
          width="${NATIVE_W}"
          height="${NATIVE_H}"
        ></canvas>
      </div>
    `;
  }
}

safeDefine('leap-ili9341', ILI9341Element);
