// Reference: leapblocks/src/Electra/Client/Assets/oled.svg
// Monochrome 128x64 OLED display with I2C interface
// Default I2C address: 0x3C (60). Some modules use 0x3D.
import { css, html, LitElement } from 'lit';
import { ElementPin, i2c } from './pin';
import oledSvgUrl from '/src/Electra/Client/Assets/oled.svg';

type CanvasContext = CanvasRenderingContext2D | null | undefined;

// SVG viewBox is "0 0 27.7 22.6" (mm).
// We render it at 4× scale → 110.8 × 90.4 px (rounded to 111 × 91).
const SCALE    = 4;
const SVG_W    = 27.7;
const SVG_H    = 22.6;
const PX_W     = Math.round(SVG_W * SCALE); // 111
const PX_H     = Math.round(SVG_H * SCALE); // 91

// Inner screen rect in SVG units: x=1.46 y=5.27 w=24.8 h=12.4
const SCREEN_X = Math.round(1.46 * SCALE); // 6
const SCREEN_Y = Math.round(5.27 * SCALE); // 21
const SCREEN_W = Math.round(24.8 * SCALE); // 99
const SCREEN_H = Math.round(12.4 * SCALE); // 50

// Pin positions in SVG units
const PIN_Y_PX  = Math.round(1.71 * SCALE); // 7
const PIN_XS_PX = [10.1, 12.6, 15.1, 17.7].map(x => Math.round(x * SCALE)); // 40,50,60,71

// ── No @customElement decorator — use guarded define() below to survive HMR ──
export class SSD1306Element extends LitElement {
  /**
   * The pixel data to draw on the element's internal <canvas>.
   * Setting this property directly triggers an immediate canvas redraw.
   */
  private _imageData: ImageData;

  get imageData(): ImageData { return this._imageData; }

  set imageData(data: ImageData) {
    this._imageData = data;
    console.log(`[OLED ELEMENT] imageData setter: ${data?.width}×${data?.height}, ctx=${!!this.ctx}, canvas=${!!this.canvas}`);
    this._drawImmediate(data);
  }

  readonly width  = PX_W;
  readonly height = PX_H;

  private screenWidth  = 128;
  private screenHeight = 64;

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasContext = null;

  readonly pinInfo: ElementPin[] = [
    { name: 'GND', x: PIN_XS_PX[0], y: PIN_Y_PX, number: 1, signals: [{ type: 'power', signal: 'GND' }] },
    { name: 'VCC', x: PIN_XS_PX[1], y: PIN_Y_PX, number: 2, signals: [{ type: 'power', signal: 'VCC' }] },
    { name: 'SCL', x: PIN_XS_PX[2], y: PIN_Y_PX, number: 3, signals: [i2c('SCL')] },
    { name: 'SDA', x: PIN_XS_PX[3], y: PIN_Y_PX, number: 4, signals: [i2c('SDA')] },
  ];

  static get styles() {
    return css`
      :host { display: inline-block; }
      .oled-wrap {
        position: relative;
        display: inline-block;
        line-height: 0;
      }
      .oled-wrap img {
        display: block;
        width: ${PX_W}px;
        height: ${PX_H}px;
      }
      .oled-wrap canvas {
        position: absolute;
        left: ${SCREEN_X}px;
        top:  ${SCREEN_Y}px;
        width:  ${SCREEN_W}px;
        height: ${SCREEN_H}px;
        image-rendering: crisp-edges;
        image-rendering: pixelated;
      }
    `;
  }

  constructor() {
    super();
    this._imageData = new ImageData(this.screenWidth, this.screenHeight);
  }

  public redraw() {
    this._drawImmediate(this._imageData);
  }

  /** Draw immediately — re-acquires canvas context if needed */
  private _drawImmediate(data: ImageData) {
    // Re-acquire context if lost (e.g. after HMR or shadow DOM re-render)
    if (!this.ctx || !this.canvas) {
      this.canvas = this.shadowRoot?.querySelector('canvas') ?? null;
      this.ctx    = this.canvas?.getContext('2d') ?? null;
      console.log(`[OLED ELEMENT] _drawImmediate: re-acquired ctx. canvas=${!!this.canvas}, ctx=${!!this.ctx}, shadowRoot=${!!this.shadowRoot}`);
    }
    if (!this.ctx) {
      console.error(`[OLED ELEMENT] _drawImmediate FAILED — no canvas context. shadowRoot=${!!this.shadowRoot}`);
      return;
    }
    if (!data) {
      console.warn(`[OLED ELEMENT] _drawImmediate — no ImageData`);
      return;
    }
    try {
      this.ctx.putImageData(data, 0, 0);
      console.log(`[OLED ELEMENT] ✓ putImageData(${data.width}×${data.height})`);
    } catch (e) {
      console.error(`[OLED ELEMENT] putImageData FAILED:`, e);
    }
  }

  private initContext() {
    this.canvas = this.shadowRoot?.querySelector('canvas') ?? null;
    this.ctx    = this.canvas?.getContext('2d') ?? null;
  }

  firstUpdated() {
    this.initContext();
    console.log(`[OLED ELEMENT] firstUpdated: canvas=${!!this.canvas}, ctx=${!!this.ctx}`);
    this._drawImmediate(this._imageData);
  }

  updated() {
    if (!this.ctx) {
      console.log(`[OLED ELEMENT] updated: ctx null — re-initializing`);
      this.initContext();
    }
    this._drawImmediate(this._imageData);
  }

  render() {
    return html`
      <div class="oled-wrap">
        <img
          src="${oledSvgUrl}"
          alt="SSD1306 OLED"
          draggable="false"
        />
        <canvas
          width="${this.screenWidth}"
          height="${this.screenHeight}"
        ></canvas>
      </div>
    `;
  }
}

// ── Guarded registration — safe across HMR reloads ───────────────────────────
// customElements.define() throws if the name is already registered.
// During Vite HMR the module re-executes, so we guard with a check.
if (!customElements.get('leap-ssd1306')) {
  customElements.define('leap-ssd1306', SSD1306Element);
}
