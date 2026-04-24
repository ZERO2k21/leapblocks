import { html } from 'lit';
import './small-sound-sensor-element';

export default {
  title: 'Small Sound Sensor',
  component: 'leap-small-sound-sensor',
  argTypes: {
    ledPower: { control: { type: 'boolean' } },
    ledSignal: { control: { type: 'boolean' } },
  },
  args: {
    ledPower: false,
    ledSignal: false,
  },
};

const Template = ({ ledPower, ledSignal }) =>
  html`<leap-small-sound-sensor
    .ledPower=${ledPower}
    .ledSignal=${ledSignal}
  ></leap-small-sound-sensor>`;

export const Default = Template.bind({});
