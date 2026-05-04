import { html } from 'lit';
import './a4988-element';

export default {
  title: 'A4988 Stepper Driver',
  component: 'leap-a4988',
  argTypes: {
    enabled: { control: 'boolean' },
    stepHigh: { control: 'boolean' },
    dirHigh: { control: 'boolean' },
    ms1: { control: 'boolean' },
    ms2: { control: 'boolean' },
    ms3: { control: 'boolean' },
  },
  args: {
    enabled: true,
    stepHigh: false,
    dirHigh: false,
    ms1: false,
    ms2: false,
    ms3: false,
  },
};

const Template = ({ enabled, stepHigh, dirHigh, ms1, ms2, ms3 }: any) => html`
  <leap-a4988
    .enabled=${enabled}
    .stepHigh=${stepHigh}
    .dirHigh=${dirHigh}
    .ms1=${ms1}
    .ms2=${ms2}
    .ms3=${ms3}
  ></leap-a4988>
`;

export const Disabled = Template.bind({});
Disabled.args = {
  enabled: false,
  stepHigh: false,
  dirHigh: false,
  ms1: false,
  ms2: false,
  ms3: false,
};

export const Enabled = Template.bind({});
Enabled.args = {
  enabled: true,
  stepHigh: false,
  dirHigh: false,
  ms1: false,
  ms2: false,
  ms3: false,
};

export const Stepping = Template.bind({});
Stepping.args = {
  enabled: true,
  stepHigh: true,
  dirHigh: false,
  ms1: false,
  ms2: false,
  ms3: false,
};

export const ClockwiseDirection = Template.bind({});
ClockwiseDirection.args = {
  enabled: true,
  stepHigh: false,
  dirHigh: true,
  ms1: false,
  ms2: false,
  ms3: false,
};

export const HalfStep = Template.bind({});
HalfStep.args = {
  enabled: true,
  stepHigh: false,
  dirHigh: false,
  ms1: true,
  ms2: false,
  ms3: false,
};

export const QuarterStep = Template.bind({});
QuarterStep.args = {
  enabled: true,
  stepHigh: false,
  dirHigh: false,
  ms1: false,
  ms2: true,
  ms3: false,
};

export const EighthStep = Template.bind({});
EighthStep.args = {
  enabled: true,
  stepHigh: false,
  dirHigh: false,
  ms1: true,
  ms2: true,
  ms3: false,
};

export const SixteenthStep = Template.bind({});
SixteenthStep.args = {
  enabled: true,
  stepHigh: true,
  dirHigh: true,
  ms1: true,
  ms2: true,
  ms3: true,
};

export const ActiveStepping = Template.bind({});
ActiveStepping.args = {
  enabled: true,
  stepHigh: true,
  dirHigh: true,
  ms1: true,
  ms2: true,
  ms3: true,
};
