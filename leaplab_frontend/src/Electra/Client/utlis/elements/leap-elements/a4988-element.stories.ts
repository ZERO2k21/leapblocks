import { html } from 'lit';
import './a4988-element';

export default {
    title: 'A4988 Stepper Driver',
    component: 'leap-a4988',
    argTypes: {
        enable: { control: 'boolean' },
        ms1: { control: 'boolean' },
        ms2: { control: 'boolean' },
        ms3: { control: 'boolean' },
        reset: { control: 'boolean' },
        sleep: { control: 'boolean' },
        step: { control: 'boolean' },
        dir: { control: 'boolean' },
    },
    args: {
        enable: false,
        ms1: false,
        ms2: false,
        ms3: false,
        reset: true,
        sleep: true,
        step: false,
        dir: false,
    },
};

export const Default = (args: any) => html`
  <leap-a4988
    ?enable=${args.enable}
    ?ms1=${args.ms1}
    ?ms2=${args.ms2}
    ?ms3=${args.ms3}
    ?reset=${args.reset}
    ?sleep=${args.sleep}
    ?step=${args.step}
    ?dir=${args.dir}
  ></leap-a4988>
`;

export const Enabled = () => html`
  <leap-a4988 enable sleep reset></leap-a4988>
`;

export const Stepping = () => html`
  <leap-a4988 step sleep reset></leap-a4988>
`;

export const FullStep = () => html`
  <leap-a4988 sleep reset></leap-a4988>
`;

export const HalfStep = () => html`
  <leap-a4988 ms1 sleep reset></leap-a4988>
`;

export const QuarterStep = () => html`
  <leap-a4988 ms2 sleep reset></leap-a4988>
`;

export const EighthStep = () => html`
  <leap-a4988 ms1 ms2 sleep reset></leap-a4988>
`;

export const SixteenthStep = () => html`
  <leap-a4988 ms1 ms2 ms3 sleep reset></leap-a4988>
`;

export const DirectionCW = () => html`
  <leap-a4988 dir sleep reset></leap-a4988>
`;

export const Disabled = () => html`
  <leap-a4988 enable></leap-a4988>
`;

export const Sleeping = () => html`
  <leap-a4988 reset></leap-a4988>
`;
