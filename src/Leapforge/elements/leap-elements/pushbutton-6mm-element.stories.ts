import type { StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { action } from 'storybook/actions';
import './pushbutton-6mm-element';

interface Pushbutton6mmArgs {
  color: 'red' | 'green' | 'blue' | 'white';
  label: string;
}

const meta = {
  title: 'Pushbutton 6mm',
  component: 'leap-pushbutton-6mm',
  args: {
    color: 'red',
    label: '',
  },
  argTypes: {
    color: {
      control: 'select',
      options: ['red', 'green', 'blue', 'white', 'yellow', 'black', 'purple'],
    },
    label: { control: 'text' },
  },
  render: (args: Pushbutton6mmArgs) => html`
    <leap-pushbutton-6mm
      color=${args.color}
      label=${args.label}
      @button-press=${action('button-press')}
      @button-release=${action('button-release')}
    ></leap-pushbutton-6mm>
  `,
};

export default meta;
type Story = StoryObj<Pushbutton6mmArgs>;

export const Red: Story = {
  args: {
    color: 'red',
  },
};

export const Green: Story = {
  args: {
    color: 'green',
  },
};

export const RedWithLabel: Story = {
  args: {
    color: 'red',
    label: 'Press me!',
  },
};

export const RedWithLongLabel: Story = {
  args: {
    color: 'red',
    label: 'I have a really long label...',
  },
};

export const FourButtons: Story = {
  render: () => html`
    <leap-pushbutton-6mm
      color="red"
      @button-press=${action('red button-press')}
      @button-release=${action('red button-release')}
    ></leap-pushbutton-6mm>
    <leap-pushbutton-6mm
      color="green"
      @button-press=${action('green button-press')}
      @button-release=${action('green button-release')}
    ></leap-pushbutton-6mm>
    <leap-pushbutton-6mm
      color="blue"
      @button-press=${action('blue button-press')}
      @button-release=${action('blue button-release')}
    ></leap-pushbutton-6mm>
    <leap-pushbutton-6mm
      color="white"
      @button-press=${action('white button-press')}
      @button-release=${action('white button-release')}
    ></leap-pushbutton-6mm>
  `,
};
