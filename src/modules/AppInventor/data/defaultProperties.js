const baseProps = {
  width: "fill_parent",
  height: "automatic",
  visible: true
};

export function defaultPropsFor(type) {
  const props = { ...baseProps };
  
  switch(type) {
    case 'Button':
      return { ...props, text: "Button", backgroundColor: "#6c63ff", textColor: "#ffffff", fontSize: 14, bold: false };
    case 'Label':
      return { ...props, text: "Label text", textColor: "#000000", fontSize: 14 };
    case 'TextBox':
      return { ...props, hint: "Enter text...", fontSize: 14, multiLine: false };
    case 'Image':
      return { ...props, picture: "", width: 100, height: 100, scalePicture: true };
    case 'CheckBox':
      return { ...props, text: "CheckBox", checked: false };
    case 'Slider':
      return { ...props, minValue: 0, maxValue: 100, thumbPosition: 50 };
    case 'Switch':
      return { ...props, on: false, thumbColor: "#6c63ff" };
    case 'ListView':
      return { ...props, elements: [], textColor: "#000000", fontSize: 14 };
    case 'Canvas':
      return { ...props, backgroundColor: "#ffffff", width: 300, height: 300 };
    case 'TinyDB':
      return { ...props, namespace: "TinyDB1" };
    case 'Web':
      return { ...props, url: "", allowCookies: false };
    default:
      return props;
  }
}
