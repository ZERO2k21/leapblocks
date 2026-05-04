import { html } from 'lit';
import { action } from 'storybook/actions';
import './analog-joystick-element';

export default {
  title: 'Analog Joystick',
  component: 'leap-analog-joystick',
  parameters: {
    docs: {
      description: {
        component: 'An analog joystick component with configurable x and y values',
      },
    },
  },
};

export const Joystick = () =>
  html`<leap-analog-joystick
    @button-press=${action('button-press')}
    @button-release=${action('button-release')}
    @input=${action('input')}
  ></leap-analog-joystick>`;
