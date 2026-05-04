import { html } from 'lit';
import './mpu6050-element';

export default {
  title: 'MPU6050',
  component: 'leap-mpu6050',
  argTypes: {
    led1: { control: { type: 'boolean' } },
  },
  args: {
    led1: false,
  },
};

const Template = ({ led1 }) => html` <leap-mpu6050 .led1=${led1}></leap-mpu6050>`;

export const Default = Template.bind({});
