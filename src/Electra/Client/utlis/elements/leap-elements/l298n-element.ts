import { html, LitElement, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ElementPin } from '.';
import l298nImage from '../../../Assets/Screenshot_8-5-2026_16421_arduinoyard.com.jpeg';

@customElement('leap-l298n')
export class L298NElement extends LitElement {
  @property({ type: Boolean }) ena = true;
  @property({ type: Boolean }) enb = true;
  @property({ type: Boolean }) in1 = false;
  @property({ type: Boolean }) in2 = false;
  @property({ type: Boolean }) in3 = false;
  @property({ type: Boolean }) in4 = false;

  static styles = css`
    :host {
      display: inline-block;
    }
    .l298n-container {
      position: relative;
      width: 200px;
      height: 200px;
      filter: drop-shadow(0 4px 10px rgba(0,0,0,0.4));
    }
    .l298n-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  `;

  get pinInfo(): ElementPin[] {
    return [
      // Motor A (OUT1, OUT2)
      { name: 'OUT1', x: 23, y: 122, number: 1, signals: [] },
      { name: 'OUT2', x: 23, y: 153, number: 2, signals: [] },

      // Power (12V, GND, 5V)
      { name: '12V', x: 58, y: 178, number: 3, signals: [] },
      { name: 'GND', x: 85, y: 178, number: 4, signals: [] },
      { name: '5V', x: 113, y: 178, number: 5, signals: [] },

      // Motor B (OUT4, OUT3)
      { name: 'OUT4', x: 177, y: 122, number: 6, signals: [] },
      { name: 'OUT3', x: 177, y: 153, number: 7, signals: [] },

      // Control Pins (ENA, IN1, IN2, IN3, IN4, ENB)
      { name: 'ENA', x: 110, y: 178, number: 8, signals: [] },
      { name: 'IN1', x: 123, y: 178, number: 9, signals: [] },
      { name: 'IN2', x: 136, y: 178, number: 10, signals: [] },
      { name: 'IN3', x: 149, y: 178, number: 11, signals: [] },
      { name: 'IN4', x: 162, y: 178, number: 12, signals: [] },
      { name: 'ENB', x: 175, y: 178, number: 13, signals: [] },
    ];
  }

  render() {
    return html`
      <div class="l298n-container">
        <img 
          class="l298n-image" 
          src="${l298nImage}" 
          alt="L298N Motor Driver"
        />
      </div>
    `;
  }
}
