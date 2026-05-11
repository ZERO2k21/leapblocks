/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
const baseProps = {
  Width: 'Fill parent',
  Height: 'Automatic',
  Visible: true
};

const withLegacyAliases = (props) => ({
  ...props,
  width: props.Width,
  height: props.Height,
  visible: props.Visible
});

export function defaultPropsFor(type) {
  switch (type) {
    case 'Button':
      return withLegacyAliases({
        ...baseProps,
        Text: 'Button',
        BackgroundColor: '#3B82F6',
        TextColor: '#ffffff',
        FontSize: 14,
        FontBold: false,
        Enabled: true,
        Shape: 'default'
      });
    case 'Label':
      return withLegacyAliases({
        ...baseProps,
        Text: 'Label',
        TextColor: '#000000',
        FontSize: 14,
        TextAlignment: 'left'
      });
    case 'TextBox':
    case 'PasswordTextBox':
      return withLegacyAliases({
        ...baseProps,
        Text: '',
        Hint: 'Enter text...',
        FontSize: 14,
        Enabled: true,
        MultiLine: false
      });
    case 'Image':
      return withLegacyAliases({
        ...baseProps,
        Picture: '',
        Width: 100,
        Height: 100,
        ScalePictureToFit: true
      });
    case 'CheckBox':
      return withLegacyAliases({
        ...baseProps,
        Text: 'CheckBox',
        Checked: false
      });
    case 'Slider':
      return withLegacyAliases({
        ...baseProps,
        MinValue: 0,
        MaxValue: 100,
        ThumbPosition: 50
      });
    case 'Switch':
      return withLegacyAliases({
        ...baseProps,
        Text: 'Switch',
        On: false,
        Enabled: true
      });
    case 'ListView':
      return withLegacyAliases({
        ...baseProps,
        Elements: ['Item 1', 'Item 2', 'Item 3'],
        TextColor: '#000000',
        FontSize: 14
      });
    case 'Spinner':
    case 'ListPicker':
      return withLegacyAliases({
        ...baseProps,
        Elements: ['Option 1', 'Option 2'],
        Selection: 'Option 1'
      });
    case 'Canvas':
      return withLegacyAliases({
        ...baseProps,
        BackgroundColor: '#ffffff',
        Width: 300,
        Height: 300
      });
    case 'VideoPlayer':
      return withLegacyAliases({
        ...baseProps,
        Source: '',
        Width: 320,
        Height: 240
      });
    default:
      return withLegacyAliases(baseProps);
  }
}
