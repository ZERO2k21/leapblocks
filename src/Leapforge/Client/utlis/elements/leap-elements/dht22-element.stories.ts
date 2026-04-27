import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './dht22-element';

const meta: Meta = {
  title: 'DHT22',
  component: 'leap-dht22',
  parameters: {
    docs: {
      description: {
        component: 'A DHT22 temperature and humidity sensor component',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => html`<leap-dht22></leap-dht22>`,
};
