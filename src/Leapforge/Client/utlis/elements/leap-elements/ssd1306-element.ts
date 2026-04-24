// Reference: leapblocks/src/Leapforge/Client/Assets/oled.svg
// Monochrome 128x64 OLED display with I2C interface
// Default I2C address: 0x3C (60). Some modules use 0x3D.
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ElementPin, i2c } from './pin';

type CanvasContext = CanvasRenderingContext2D | null | undefined;

// SVG viewBox is "0 0 27.7 22.6" (mm).
// We render it at 4× scale → 110.8 × 90.4 px (rounded to 111 × 91).
const SCALE      = 4;
const SVG_W      = 27.7;
const SVG_H      = 22.6;
const PX_W       = Math.round(SVG_W * SCALE); // 111
const PX_H       = Math.round(SVG_H * SCALE); // 91

// Inner screen rect in SVG units: x=1.46 y=5.27 w=24.8 h=12.4
const SCREEN_X   = Math.round(1.46  * SCALE); // 6
const SCREEN_Y   = Math.round(5.27  * SCALE); // 21
const SCREEN_W   = Math.round(24.8  * SCALE); // 99
const SCREEN_H   = Math.round(12.4  * SCALE); // 50

// Pin positions in SVG units (cy=1.71, cx = 10.1 / 12.6 / 15.1 / 17.7)
// Scaled to px for pinInfo handles
const PIN_Y_PX   = Math.round(1.71  * SCALE); // 7
const PIN_XS_PX  = [10.1, 12.6, 15.1, 17.7].map(x => Math.round(x * SCALE)); // 40,50,60,71

@customElement('leap-ssd1306')
export class SSD1306Element extends LitElement {
  /**
   * The pixel data to draw on the element's internal <canvas>.
   * Call redraw() if you mutate the underlying data without changing the reference.
   */
  @property() imageData: ImageData;

  readonly width  = PX_W;
  readonly height = PX_H;

  private screenWidth  = 128;
  private screenHeight = 64;

  private canvas: HTMLCanvasElement | null | undefined = void 0;
  private ctx: CanvasContext = null;

  // I2C pinout: GND, VCC, SCL, SDA — matches the 4 pin circles in the SVG
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
    this.imageData = new ImageData(this.screenWidth, this.screenHeight);
  }

  public redraw() {
    this.ctx?.putImageData(this.imageData, 0, 0);
  }

  private initContext() {
    this.canvas = this.shadowRoot?.querySelector('canvas');
    this.ctx = this.canvas?.getContext('2d') ?? null;
  }

  firstUpdated() {
    this.initContext();
    this.ctx?.putImageData(this.imageData, 0, 0);
  }

  updated() {
    if (this.imageData) this.redraw();
  }

  render() {
    return html`
      <div class="oled-wrap">
        <!-- The oled.svg asset rendered as an <img> at 4× scale -->
        <img
          src="/src/Leapforge/Client/Assets/oled.svg"
          alt="SSD1306 OLED"
          draggable="false"
        />
        <!-- Canvas overlaid exactly on the inner screen rect -->
        <canvas
          width="${this.screenWidth}"
          height="${this.screenHeight}"
        ></canvas>
      </div>
    `;
  }
}
