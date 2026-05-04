import { html } from 'lit';
import './led-element';

export default {
  title: 'LED',
  component: 'leap-led',
  argTypes: {
    value: { control: 'boolean' },
    brightness: { control: { type: 'range', min: 0, max: 1.0, step: 0.05 } },
    color: { control: { type: 'color' } },
    lightColor: { control: { type: 'color' } },
    label: 'string',
    flip: { control: 'boolean' },
  },
  args: {
    brightness: 1.0,
    flip: false,
    value: false,
  },
};

const Template = ({ color, flip, label, lightColor, value, brightness }) =>
  html`<leap-led
    color=${color}
    .flip=${flip}
    .brightness=${brightness}
    label=${label}
    lightColor=${lightColor}
    .value=${value}
  ></leap-led>`;

export const Red = Template.bind({});
Red.args = { color: 'red' };

export const RedWithLabel = Template.bind({});
RedWithLabel.args = { color: 'red', label: '12' };

export const Flipped = Template.bind({});
Flipped.args = { color: 'red', flip: true };

export const Green = Template.bind({});
Green.args = { color: 'green' };

export const Yellow = Template.bind({});
Yellow.args = { color: 'yellow' };

export const Blue = Template.bind({});
Blue.args = { color: 'blue' };

export const Orange = Template.bind({});
Orange.args = { color: 'orange' };

export const White = Template.bind({});
White.args = { color: 'white' };

export const BrightnessLevels = () => html`
  <leap-led color="red" label="0" .value=${true} brightness="0"></leap-led>
  <leap-led color="red" label="1%" .value=${true} brightness="0.01"></leap-led>
  <leap-led color="red" label="10%" .value=${true} brightness="0.1"></leap-led>
  <leap-led color="red" label="25%" .value=${true} brightness="0.25"></leap-led>
  <leap-led color="red" label="50%" .value=${true} brightness="0.5"></leap-led>
  <leap-led color="red" label="75%" .value=${true} brightness="0.75"></leap-led>
  <leap-led color="red" label="100%" .value=${true}></leap-led>
`;
