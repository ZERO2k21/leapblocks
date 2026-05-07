import { html } from 'lit';
import { action } from 'storybook/actions';
import './ir-remote-element';

export default {
  title: 'IR Remote',
  component: 'leap-ir-remote',
};

export const Default = () =>
  html`<leap-ir-remote
    @button-press=${action('button-press')}
    @button-release=${action('button-release')}
  ></leap-ir-remote>`;
