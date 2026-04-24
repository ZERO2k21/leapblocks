import { html } from 'lit';
import './ntc-temperature-sensor-element';

export default {
  title: 'NTC Temperature Sensor',
  component: 'leap-ntc-temperature-sensor',
};

const Template = () => html` <leap-ntc-temperature-sensor></leap-ntc-temperature-sensor> `;

export const Default = Template.bind({});
