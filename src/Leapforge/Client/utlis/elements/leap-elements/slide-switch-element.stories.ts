import { html } from 'lit';
import { action } from 'storybook/actions';
import './slide-switch-element';

export default {
  title: 'Slide Switch',
  component: 'leap-slide-switch',
};

export const SlideSwitch = () =>
  html`<leap-slide-switch @input=${action('input')}></leap-slide-switch>`;
