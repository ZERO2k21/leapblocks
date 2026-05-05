
import { LCD1602Element } from './lcd1602-element';
import { safeDefine } from './utils/safe-define';

/**
 * LCD 16x2 with I2C backpack variant.
 * Renders the same as lcd1602 but defaults to i2c pin layout.
 */
export class LCD1602I2CElement extends LCD1602Element {
  pins: 'full' | 'i2c' | 'none' = 'i2c';
}

safeDefine('leap-lcd1602-i2c', LCD1602I2CElement);
