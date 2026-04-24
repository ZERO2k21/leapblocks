import { html } from 'lit';
import './heart-beat-sensor-element';

export default {
  title: 'Heart Beat Sensor',
  component: 'leap-heart-beat-sensor',
};

const Template = () => html`<leap-heart-beat-sensor></leap-heart-beat-sensor>`;

export const Default = Template.bind({});
