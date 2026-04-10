---
to: src/<%= name %>-element.stories.ts
---
import { html } from 'lit';
import './<%= name %>-element';

export default {
  title: '<%= h.changeCase.title(h.className(name)) %>',
  component: 'leap-<%= name %>',
  argTypes: {
    value: { control: { type: 'number', min: 1, max: 10, step: 1 } },
  },
  args: {
    value: 5,
  },
};

const Template = ({ value }) => html`<leap-<%= name %> value=${value}></leap-<%= name %>>`;

export const Default = Template.bind({});
Default.args = { value: 5 };

export const Large = Template.bind({});
Large.args = { value: 10 };
