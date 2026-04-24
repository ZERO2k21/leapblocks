import { html } from 'lit';
import './flame-sensor-element';

export default {
  title: 'Flame Sensor',
  component: 'leap-flame-sensor',
  argTypes: {
    ledPower: { control: { type: 'boolean' } },
    ledSignal: { control: { type: 'boolean' } },
  },
  args: {
    ledPower: true,
    ledSignal: false,
  },
};

const Template = ({ ledPower, ledSignal }) =>
  html` <leap-flame-sensor .ledPower=${ledPower} .ledSignal=${ledSignal}></leap-flame-sensor>`;

export const Default = Template.bind({});
