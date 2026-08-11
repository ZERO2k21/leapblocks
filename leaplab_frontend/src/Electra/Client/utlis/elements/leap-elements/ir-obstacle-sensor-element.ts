/**
 * IR Obstacle Avoidance Sensor Module (FC-51 / MH-B style)
 * 3-pin: OUT · GND · VCC
 *
 * Output signal logic:
 *   Active LOW: OUT pin goes LOW (0V) when obstacle detected, HIGH (5V/3.3V) when path clear.
 */
import { css, html, LitElement, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ElementPin, GND, VCC } from './pin';
import irSensorImage from '/src/Electra/Client/Assets/ir-sensor-cropped.png';

@customElement('leap-ir-obstacle-sensor')
export class IRObstacleSensorElement extends LitElement {

  /** When true, obstacle is detected in front of IR sensors (OUT = LOW) */
  @property({ type: Boolean }) obstacleDetected = false;

  /** Power LED status */
  @property({ type: Boolean }) ledPower = false;

  /** Output Signal LED status */
  @property({ type: Boolean }) ledSignal = false;

  readonly pinInfo: ElementPin[] = [
    { name: 'OUT', x: 198, y: 17.5, number: 1, signals: [] },
    { name: 'GND', x: 198, y: 35.0, number: 2, signals: [GND()] },
    { name: 'VCC', x: 198, y: 52.5, number: 3, signals: [VCC()] },
  ];

  static get styles() {
    return css`
      :host { display: inline-block; position: relative; }

      .wrap {
        position: relative;
        display: inline-block;
        line-height: 0;
      }

      /* Glow effect when obstacle is detected */
      .obstacle-glow {
        position: absolute;
        left: -5px;
        top: 50%;
        transform: translateY(-50%);
        width: 35px;
        height: 50px;
        border-radius: 50%;
        pointer-events: none;
        transition: opacity 0.25s ease, box-shadow 0.25s ease;
        opacity: 0;
      }

      :host([obstacledetected]) .obstacle-glow,
      .obstacle-glow.active {
        opacity: 1;
        box-shadow:
          0 0 16px 8px rgba(239, 68, 68, 0.7),
          0 0 30px 15px rgba(239, 68, 68, 0.4);
      }
    `;
  }

  render() {
    const active = this.obstacleDetected;
    const showPower = this.ledPower;
    const showSignal = this.ledSignal || active;

    return html`
      <div class="wrap">
        <svg
          width="55mm"
          height="17.5mm"
          version="1.1"
          viewBox="0 0 220 70"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <!-- Base Cropped IR Sensor Image Asset -->
          <image href="${irSensorImage}" x="0" y="0" width="200" height="70" preserveAspectRatio="xMidYMid meet" />

          <!-- Dynamic Active Beam Waves Animation on Transmitter & Receiver -->
          ${active ? svg`
            <g>
              <circle cx="20" cy="22" r="10" fill="none" stroke="#ef4444" stroke-width="1.5" opacity="0.8">
                <animate attributeName="r" values="8;18;24" dur="0.8s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.9;0.4;0" dur="0.8s" repeatCount="indefinite"/>
              </circle>
              <circle cx="20" cy="48" r="10" fill="none" stroke="#38bdf8" stroke-width="1.5" opacity="0.8">
                <animate attributeName="r" values="8;18;24" dur="0.8s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.9;0.4;0" dur="0.8s" repeatCount="indefinite"/>
              </circle>
            </g>
          ` : ''}

          <!-- Power LED Glow Overlay (PWR LED at x=148, y=18) -->
          ${showPower ? svg`
            <circle cx="148" cy="18" r="3.5" fill="#ef4444" />
            <circle cx="148" cy="18" r="8" fill="#ef4444" opacity="0.45" />
          ` : ''}

          <!-- Signal LED Glow Overlay (OUT LED at x=148, y=52) -->
          ${showSignal ? svg`
            <circle cx="148" cy="52" r="3.5" fill="#22c55e" />
            <circle cx="148" cy="52" r="8" fill="#22c55e" opacity="0.45" />
          ` : ''}
        </svg>

        <!-- Obstacle Glow Overlay -->
        <div class="obstacle-glow ${active ? 'active' : ''}"></div>
      </div>
    `;
  }
}

