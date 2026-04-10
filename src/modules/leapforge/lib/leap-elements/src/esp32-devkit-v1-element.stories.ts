import { html } from 'lit';
import './esp32-devkit-v1-element';

export default {
  title: 'ESP32 Devkit V1',
  component: 'leap-esp32-devkit-v1',
  argTypes: {
    led1: { control: { type: 'boolean' } },
    ledPower: { control: { type: 'boolean' } },
  },
  args: {
    led1: false,
    ledPower: false,
  },
};

const Template = ({ led1, ledPower }) =>
  html`<leap-esp32-devkit-v1 .led1=${led1} .ledPower=${ledPower}></leap-esp32-devkit-v1>`;

export const Default = Template.bind({});

export const LEDsOn = Template.bind({});
LEDsOn.storyName = 'LEDs On';
LEDsOn.args = { led1: true, ledPower: true };
