import { html } from 'lit';
import { fontA02 } from './lcd1602-font-a02';
import './lcd2004-element';

export default {
  title: 'LCD2004',
  component: 'leap-lcd2004',
};

export const Lcd2004 = () => html`<leap-lcd2004 text="Hello World! LCD2004"></leap-lcd2004>`;
Lcd2004.storyName = 'Hello World';

export const BlueBackground = () =>
  html`<leap-lcd2004
    background="blue"
    color="white"
    text="Line 1              Line 2              Line 3              Line 4"
  ></leap-lcd2004>`;

export const I2cPins = () =>
  html`<leap-lcd2004 pins="i2c" text="I²C Pins" .font=${fontA02}></leap-lcd2004>`;
I2cPins.storyName = 'I2C Pins';

export const ScreenOnly = () =>
  html`<leap-lcd2004 .screenOnly=${true} text="Screen Only"></leap-lcd2004>`;
