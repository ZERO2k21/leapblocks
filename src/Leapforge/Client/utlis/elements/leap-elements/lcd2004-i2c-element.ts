import { customElement } from 'lit/decorators.js';
import { LCD2004Element } from './lcd2004-element';

/**
 * LCD 20x4 with I2C backpack variant.
 * Renders the same as lcd2004 but defaults to i2c pin layout.
 */
@customElement('leap-lcd2004-i2c')
export class LCD2004I2CElement extends LCD2004Element {
  pins: 'full' | 'i2c' | 'none' = 'i2c';
}
