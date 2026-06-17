import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './biaxial-stepper-element';

interface BiaxialStepperArgs {
  innerHandLength: number;
  innerHandAngle: number;
  innerHandColor: string;
  innerHandShape: 'arrow' | 'plain' | 'ornate';
  outerHandLength: number;
  outerHandAngle: number;
  outerHandColor: string;
  outerHandShape: 'arrow' | 'plain' | 'ornate';
}

const meta = {
  title: 'Biaxial Stepper',
  component: 'leap-biaxial-stepper',
  argTypes: {
    innerHandLength: { control: { type: 'range', min: 20, max: 70 } },
    innerHandAngle: { control: { type: 'range', min: 0, max: 360 } },
    innerHandColor: { control: { type: 'color' } },
    innerHandShape: { options: ['arrow', 'plain', 'ornate'], control: { type: 'select' } },
    outerHandLength: { control: { type: 'range', min: 20, max: 70 } },
    outerHandAngle: { control: { type: 'range', min: 0, max: 360 } },
    outerHandColor: { control: { type: 'color' } },
    outerHandShape: { options: ['arrow', 'plain', 'ornate'], control: { type: 'select' } },
  },
  args: {
    outerHandLength: 30,
    outerHandAngle: 0,
    outerHandColor: 'black',
    outerHandShape: 'plain',
    innerHandLength: 30,
    innerHandAngle: 0,
    innerHandColor: 'gold',
    innerHandShape: 'plain',
  },
  render: (args: BiaxialStepperArgs) => html`
    <leap-biaxial-stepper
      .innerHandLength=${args.innerHandLength}
      .innerHandAngle=${args.innerHandAngle}
      .innerHandColor=${args.innerHandColor}
      .innerHandShape=${args.innerHandShape}
      .outerHandLength=${args.outerHandLength}
      .outerHandAngle=${args.outerHandAngle}
      .outerHandColor=${args.outerHandColor}
      .outerHandShape=${args.outerHandShape}
    ></leap-biaxial-stepper>`,
} satisfies Meta<BiaxialStepperArgs>;

export default meta;
type Story = StoryObj<BiaxialStepperArgs>;

export const Default: Story = {
  args: {
    innerHandLength: 70, innerHandColor: 'gold', innerHandShape: 'plain', innerHandAngle: 90,
    outerHandLength: 70, outerHandColor: 'black', outerHandShape: 'plain', outerHandAngle: 270,
  },
};

export const NineOclock: Story = {
  args: {
    innerHandLength: 70, innerHandColor: 'gold', innerHandShape: 'plain', innerHandAngle: 0,
    outerHandLength: 40, outerHandColor: 'black', outerHandShape: 'plain', outerHandAngle: 270,
  },
};

export const SixOclock: Story = {
  args: {
    innerHandLength: 70, innerHandColor: 'gold', innerHandShape: 'plain', innerHandAngle: 0,
    outerHandLength: 40, outerHandColor: 'black', outerHandShape: 'plain', outerHandAngle: 180,
  },
};

export const ThreeOclock: Story = {
  args: {
    innerHandLength: 70, innerHandColor: 'gold', innerHandShape: 'plain', innerHandAngle: 0,
    outerHandLength: 50, outerHandColor: 'black', outerHandShape: 'plain', outerHandAngle: 90,
  },
};

export const TenPastTen: Story = {
  args: {
    innerHandLength: 70, innerHandColor: 'gold', innerHandShape: 'plain', innerHandAngle: 60,
    outerHandLength: 60, outerHandColor: 'black', outerHandShape: 'plain', outerHandAngle: 300,
  },
};

export const SameLength: Story = {
  args: {
    innerHandLength: 30, innerHandColor: 'blue', innerHandShape: 'plain', innerHandAngle: 0,
    outerHandLength: 30, outerHandColor: 'green', outerHandShape: 'plain', outerHandAngle: 180,
  },
};

export const LongArrows: Story = {
  args: {
    innerHandLength: 70, innerHandColor: 'blue', innerHandShape: 'arrow', innerHandAngle: 90,
    outerHandLength: 70, outerHandColor: 'green', outerHandShape: 'arrow', outerHandAngle: 270,
  },
};

export const OrnateClock: Story = {
  args: {
    innerHandLength: 70, innerHandColor: 'gold', innerHandShape: 'ornate', innerHandAngle: 60,
    outerHandLength: 60, outerHandColor: 'black', outerHandShape: 'ornate', outerHandAngle: 300,
  },
};
