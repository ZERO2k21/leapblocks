import { html } from 'lit';
import './esp32-c3-element';

export default {
  title: 'ESP32-C3',
  component: 'leap-esp32-c3',
  argTypes: {
    led1: { control: { type: 'boolean' } },
    ledPower: { control: { type: 'boolean' } },
  },
  args: {
    led1: false,
    ledPower: false,
  },
};

const Template = ({ led1, ledPower }: { led1: boolean; ledPower: boolean }) =>
  html`<leap-esp32-c3 .led1=${led1} .ledPower=${ledPower}></leap-esp32-c3>`;

export const Default = Template.bind({});

export const LEDsOn = Template.bind({});
LEDsOn.args = { led1: true, ledPower: true };
