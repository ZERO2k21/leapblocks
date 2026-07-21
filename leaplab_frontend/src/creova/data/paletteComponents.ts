interface PaletteItem {
  type: string;
  label: string;
  icon: string;
  category: string;
}

export const PALETTE: PaletteItem[] = [
  { type: 'Button', label: 'Button', icon: '🔲', category: 'User Interface' },
  { type: 'Label', label: 'Label', icon: '📝', category: 'User Interface' },
  { type: 'TextBox', label: 'TextBox', icon: '⌨️', category: 'User Interface' },
  { type: 'Image', label: 'Image', icon: '🖼️', category: 'User Interface' },
  { type: 'CheckBox', label: 'CheckBox', icon: '☑️', category: 'User Interface' },
  { type: 'Slider', label: 'Slider', icon: '🎚️', category: 'User Interface' },
  { type: 'Switch', label: 'Switch', icon: '🔛', category: 'User Interface' },
  { type: 'DatePicker', label: 'DatePicker', icon: '📅', category: 'User Interface' },
  { type: 'TimePicker', label: 'TimePicker', icon: '🕒', category: 'User Interface' },
  { type: 'ListView', label: 'ListView', icon: '📄', category: 'User Interface' },
  { type: 'Spinner', label: 'Spinner', icon: '🔽', category: 'User Interface' },

  { type: 'HorizontalArrangement', label: 'Horizontal', icon: '↔️', category: 'Layout' },
  { type: 'VerticalArrangement', label: 'Vertical', icon: '↕️', category: 'Layout' },
  { type: 'TableArrangement', label: 'Table', icon: '🔠', category: 'Layout' },

  { type: 'Sound', label: 'Sound', icon: '🔊', category: 'Media' },
  { type: 'Camera', label: 'Camera', icon: '📷', category: 'Media' },
  { type: 'VideoPlayer', label: 'VideoPlayer', icon: '🎬', category: 'Media' },
  { type: 'ImagePicker', label: 'ImagePicker', icon: '📂', category: 'Media' },

  { type: 'Canvas', label: 'Canvas', icon: '🎨', category: 'Drawing & Animation' },
  { type: 'Ball', label: 'Ball', icon: '🎾', category: 'Drawing & Animation' },
  { type: 'ImageSprite', label: 'ImageSprite', icon: '👾', category: 'Drawing & Animation' },

  { type: 'AccelerometerSensor', label: 'Accelerometer', icon: '📱', category: 'Sensors' },
  { type: 'LocationSensor', label: 'Location', icon: '📍', category: 'Sensors' },
  { type: 'GyroscopeSensor', label: 'Gyroscope', icon: '🔄', category: 'Sensors' },

  { type: 'TinyDB', label: 'TinyDB', icon: '💾', category: 'Storage' },
  { type: 'File', label: 'File', icon: '📁', category: 'Storage' },

  { type: 'Web', label: 'Web', icon: '🌐', category: 'Connectivity' },
  { type: 'BluetoothClient', label: 'Bluetooth', icon: '🦷', category: 'Connectivity' },
];
