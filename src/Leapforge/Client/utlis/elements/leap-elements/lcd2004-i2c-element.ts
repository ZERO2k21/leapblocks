
import { LCD2004Element } from './lcd2004-element';
import { safeDefine } from './utils/safe-define';

/**
 * LCD 20x4 with I2C backpack variant.
 * Renders the same as lcd2004 but defaults to i2c pin layout.
 */
export class LCD2004I2CElement extends LCD2004Element {
  pins: 'full' | 'i2c' | 'none' = 'i2c';
}

safeDefine('leap-lcd2004-i2c', LCD2004I2CElement);
