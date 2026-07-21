interface PaletteComponent {
  type: string;
  label: string;
  icon: string;
  category: string;
  visible: boolean;
  description: string;
}

export const PALETTE_ENHANCED: PaletteComponent[] = [
  {
    type: 'Button',
    label: 'Button',
    icon: '🔲',
    category: 'User Interface',
    visible: true,
    description: 'A button that users can tap to trigger actions'
  },
  {
    type: 'CheckBox',
    label: 'CheckBox',
    icon: '☑️',
    category: 'User Interface',
    visible: true,
    description: 'A checkbox for boolean input'
  },
  {
    type: 'DatePicker',
    label: 'DatePicker',
    icon: '📅',
    category: 'User Interface',
    visible: true,
    description: 'A button that opens a date picker dialog'
  },
  {
    type: 'Image',
    label: 'Image',
    icon: '🖼️',
    category: 'User Interface',
    visible: true,
    description: 'Displays an image from a file or URL'
  },
  {
    type: 'Label',
    label: 'Label',
    icon: '📝',
    category: 'User Interface',
    visible: true,
    description: 'Displays text that cannot be edited by the user'
  },
  {
    type: 'ListPicker',
    label: 'ListPicker',
    icon: '📋',
    category: 'User Interface',
    visible: true,
    description: 'A button that opens a list of items to choose from'
  },
  {
    type: 'ListView',
    label: 'ListView',
    icon: '📄',
    category: 'User Interface',
    visible: true,
    description: 'Displays a scrollable list of items'
  },
  {
    type: 'Notifier',
    label: 'Notifier',
    icon: '🔔',
    category: 'User Interface',
    visible: false,
    description: 'Shows alerts, messages, and dialogs to the user'
  },
  {
    type: 'PasswordTextBox',
    label: 'PasswordTextBox',
    icon: '🔒',
    category: 'User Interface',
    visible: true,
    description: 'A text box that hides the characters typed'
  },
  {
    type: 'Slider',
    label: 'Slider',
    icon: '🎚️',
    category: 'User Interface',
    visible: true,
    description: 'A slider for selecting a numeric value'
  },
  {
    type: 'Spinner',
    label: 'Spinner',
    icon: '🔽',
    category: 'User Interface',
    visible: true,
    description: 'A dropdown list for selecting from options'
  },
  {
    type: 'Switch',
    label: 'Switch',
    icon: '🔛',
    category: 'User Interface',
    visible: true,
    description: 'A toggle switch for on/off states'
  },
  {
    type: 'TextBox',
    label: 'TextBox',
    icon: '⌨️',
    category: 'User Interface',
    visible: true,
    description: 'A box for users to enter text'
  },
  {
    type: 'TimePicker',
    label: 'TimePicker',
    icon: '🕒',
    category: 'User Interface',
    visible: true,
    description: 'A button that opens a time picker dialog'
  },
  {
    type: 'WebViewer',
    label: 'WebViewer',
    icon: '🌐',
    category: 'User Interface',
    visible: true,
    description: 'Displays web pages within the app'
  },
  {
    type: 'CircularProgress',
    label: 'CircularProgress',
    icon: '🔄',
    category: 'User Interface',
    visible: true,
    description: 'A circular progress indicator'
  },
  {
    type: 'LinearProgress',
    label: 'LinearProgress',
    icon: '📊',
    category: 'User Interface',
    visible: true,
    description: 'A linear progress bar indicator'
  },
  {
    type: 'HorizontalArrangement',
    label: 'HorizontalArrangement',
    icon: '↔️',
    category: 'Layout',
    visible: true,
    description: 'Arranges components horizontally in a row'
  },
  {
    type: 'HorizontalScrollArrangement',
    label: 'HorizontalScrollArrangement',
    icon: '↔️📜',
    category: 'Layout',
    visible: true,
    description: 'Horizontal arrangement with scrolling'
  },
  {
    type: 'TableArrangement',
    label: 'TableArrangement',
    icon: '📊',
    category: 'Layout',
    visible: true,
    description: 'Arranges components in rows and columns'
  },
  {
    type: 'VerticalArrangement',
    label: 'VerticalArrangement',
    icon: '↕️',
    category: 'Layout',
    visible: true,
    description: 'Arranges components vertically in a column'
  },
  {
    type: 'VerticalScrollArrangement',
    label: 'VerticalScrollArrangement',
    icon: '↕️📜',
    category: 'Layout',
    visible: true,
    description: 'Vertical arrangement with scrolling'
  },
  {
    type: 'AbsoluteArrangement',
    label: 'AbsoluteArrangement',
    icon: '🔲',
    category: 'Layout',
    visible: true,
    description: 'Arranges components at exact positions using X and Y coordinates'
  },
  {
    type: 'Camera',
    label: 'Camera',
    icon: '📷',
    category: 'Media',
    visible: false,
    description: 'Takes pictures using the device camera'
  },
  {
    type: 'Camcorder',
    label: 'Camcorder',
    icon: '🎥',
    category: 'Media',
    visible: false,
    description: 'Records videos using the device camera'
  },
  {
    type: 'ImagePicker',
    label: 'ImagePicker',
    icon: '📂',
    category: 'Media',
    visible: true,
    description: 'Lets users select an image from the device'
  },
  {
    type: 'Player',
    label: 'Player',
    icon: '▶️',
    category: 'Media',
    visible: false,
    description: 'Plays audio files'
  },
  {
    type: 'Sound',
    label: 'Sound',
    icon: '🔊',
    category: 'Media',
    visible: false,
    description: 'Plays short sound effects'
  },
  {
    type: 'SoundRecorder',
    label: 'SoundRecorder',
    icon: '🎙️',
    category: 'Media',
    visible: false,
    description: 'Records audio from the device microphone'
  },
  {
    type: 'SpeechRecognizer',
    label: 'SpeechRecognizer',
    icon: '🎤',
    category: 'Media',
    visible: false,
    description: 'Converts speech to text'
  },
  {
    type: 'TextToSpeech',
    label: 'TextToSpeech',
    icon: '🗣️',
    category: 'Media',
    visible: false,
    description: 'Converts text to spoken words'
  },
  {
    type: 'VideoPlayer',
    label: 'VideoPlayer',
    icon: '🎬',
    category: 'Media',
    visible: true,
    description: 'Plays video files'
  },
  {
    type: 'YandexTranslate',
    label: 'YandexTranslate',
    icon: '🌍',
    category: 'Media',
    visible: false,
    description: 'Translates text between languages'
  },
  {
    type: 'Translator',
    label: 'Translator',
    icon: '🌐',
    category: 'Media',
    visible: false,
    description: 'Translates text between languages using modern translation services'
  },
  {
    type: 'MediaStore',
    label: 'MediaStore',
    icon: '💿',
    category: 'Media',
    visible: false,
    description: 'Saves media files to the device'
  },
  {
    type: 'Ball',
    label: 'Ball',
    icon: '⚽',
    category: 'Drawing and Animation',
    visible: true,
    description: 'A round sprite that can move and bounce'
  },
  {
    type: 'Canvas',
    label: 'Canvas',
    icon: '🎨',
    category: 'Drawing and Animation',
    visible: true,
    description: 'A surface for drawing and animation'
  },
  {
    type: 'ImageSprite',
    label: 'ImageSprite',
    icon: '👾',
    category: 'Drawing and Animation',
    visible: true,
    description: 'A movable image on a canvas'
  },
  {
    type: 'Map',
    label: 'Map',
    icon: '🗺️',
    category: 'Maps',
    visible: true,
    description: 'Displays an interactive map'
  },
  {
    type: 'Circle',
    label: 'Circle',
    icon: '⭕',
    category: 'Maps',
    visible: true,
    description: 'A circular region on a map'
  },
  {
    type: 'FeatureCollection',
    label: 'FeatureCollection',
    icon: '📍',
    category: 'Maps',
    visible: true,
    description: 'A collection of map features'
  },
  {
    type: 'LineString',
    label: 'LineString',
    icon: '📏',
    category: 'Maps',
    visible: true,
    description: 'A line or path on a map'
  },
  {
    type: 'Marker',
    label: 'Marker',
    icon: '📌',
    category: 'Maps',
    visible: true,
    description: 'A point marker on a map'
  },
  {
    type: 'Polygon',
    label: 'Polygon',
    icon: '⬡',
    category: 'Maps',
    visible: true,
    description: 'A polygonal region on a map'
  },
  {
    type: 'Rectangle',
    label: 'Rectangle',
    icon: '▭',
    category: 'Maps',
    visible: true,
    description: 'A rectangular region on a map'
  },
  {
    type: 'Navigation',
    label: 'Navigation',
    icon: '🧭',
    category: 'Maps',
    visible: false,
    description: 'Provides directions between two locations'
  },
  {
    type: 'AccelerometerSensor',
    label: 'AccelerometerSensor',
    icon: '📱',
    category: 'Sensors',
    visible: false,
    description: 'Detects device acceleration and shaking'
  },
  {
    type: 'BarcodeScanner',
    label: 'BarcodeScanner',
    icon: '📷',
    category: 'Sensors',
    visible: false,
    description: 'Scans barcodes and QR codes'
  },
  {
    type: 'Clock',
    label: 'Clock',
    icon: '⏰',
    category: 'Sensors',
    visible: false,
    description: 'Provides time and date functions'
  },
  {
    type: 'GyroscopeSensor',
    label: 'GyroscopeSensor',
    icon: '🔄',
    category: 'Sensors',
    visible: false,
    description: 'Detects device rotation'
  },
  {
    type: 'Hygrometer',
    label: 'Hygrometer',
    icon: '💧',
    category: 'Sensors',
    visible: false,
    description: 'Measures humidity'
  },
  {
    type: 'LightSensor',
    label: 'LightSensor',
    icon: '💡',
    category: 'Sensors',
    visible: false,
    description: 'Measures ambient light'
  },
  {
    type: 'LocationSensor',
    label: 'LocationSensor',
    icon: '📍',
    category: 'Sensors',
    visible: false,
    description: 'Provides GPS location information'
  },
  {
    type: 'MagneticFieldSensor',
    label: 'MagneticFieldSensor',
    icon: '🧲',
    category: 'Sensors',
    visible: false,
    description: 'Detects magnetic fields'
  },
  {
    type: 'NearField',
    label: 'NearField',
    icon: '📡',
    category: 'Sensors',
    visible: false,
    description: 'Reads NFC tags'
  },
  {
    type: 'OrientationSensor',
    label: 'OrientationSensor',
    icon: '🧭',
    category: 'Sensors',
    visible: false,
    description: 'Detects device orientation'
  },
  {
    type: 'Pedometer',
    label: 'Pedometer',
    icon: '👟',
    category: 'Sensors',
    visible: false,
    description: 'Counts steps and distance walked'
  },
  {
    type: 'ProximitySensor',
    label: 'ProximitySensor',
    icon: '👋',
    category: 'Sensors',
    visible: false,
    description: 'Detects nearby objects'
  },
  {
    type: 'Thermometer',
    label: 'Thermometer',
    icon: '🌡️',
    category: 'Sensors',
    visible: false,
    description: 'Measures temperature'
  },
  {
    type: 'Barometer',
    label: 'Barometer',
    icon: '🌡️',
    category: 'Sensors',
    visible: false,
    description: 'Measures atmospheric air pressure'
  },
  {
    type: 'ContactPicker',
    label: 'ContactPicker',
    icon: '👤',
    category: 'Social',
    visible: true,
    description: 'Lets users select a contact'
  },
  {
    type: 'EmailPicker',
    label: 'EmailPicker',
    icon: '📧',
    category: 'Social',
    visible: true,
    description: 'Lets users select an email address'
  },
  {
    type: 'PhoneCall',
    label: 'PhoneCall',
    icon: '📞',
    category: 'Social',
    visible: false,
    description: 'Makes phone calls'
  },
  {
    type: 'PhoneNumberPicker',
    label: 'PhoneNumberPicker',
    icon: '☎️',
    category: 'Social',
    visible: true,
    description: 'Lets users select a phone number'
  },
  {
    type: 'Sharing',
    label: 'Sharing',
    icon: '📤',
    category: 'Social',
    visible: false,
    description: 'Shares content with other apps'
  },
  {
    type: 'Texting',
    label: 'Texting',
    icon: '💬',
    category: 'Social',
    visible: false,
    description: 'Sends and receives SMS messages'
  },
  {
    type: 'Twitter',
    label: 'Twitter',
    icon: '🐦',
    category: 'Social',
    visible: false,
    description: 'Interacts with Twitter'
  },
  {
    type: 'CloudDB',
    label: 'CloudDB',
    icon: '☁️',
    category: 'Storage',
    visible: false,
    description: 'Stores data in the cloud'
  },
  {
    type: 'DataFile',
    label: 'DataFile',
    icon: '📊',
    category: 'Storage',
    visible: false,
    description: 'Reads and writes data files'
  },
  {
    type: 'File',
    label: 'File',
    icon: '📁',
    category: 'Storage',
    visible: false,
    description: 'Manages files on the device'
  },
  {
    type: 'FirebaseDB',
    label: 'FirebaseDB',
    icon: '🔥',
    category: 'Storage',
    visible: false,
    description: 'Stores data in Firebase'
  },
  {
    type: 'TinyDB',
    label: 'TinyDB',
    icon: '💾',
    category: 'Storage',
    visible: false,
    description: 'Stores data locally on the device'
  },
  {
    type: 'TinyWebDB',
    label: 'TinyWebDB',
    icon: '🌐',
    category: 'Storage',
    visible: false,
    description: 'Stores data on a web server'
  },
  {
    type: 'Spreadsheet',
    label: 'Spreadsheet',
    icon: '📊',
    category: 'Storage',
    visible: false,
    description: 'Reads and writes data from Google Sheets'
  },
  {
    type: 'FilePicker',
    label: 'FilePicker',
    icon: '📎',
    category: 'Storage',
    visible: true,
    description: 'Lets users pick a file from the device'
  },
  {
    type: 'ActivityStarter',
    label: 'ActivityStarter',
    icon: '🚀',
    category: 'Connectivity',
    visible: false,
    description: 'Starts other apps and activities'
  },
  {
    type: 'BluetoothClient',
    label: 'BluetoothClient',
    icon: '🦷',
    category: 'Connectivity',
    visible: false,
    description: 'Connects to Bluetooth devices'
  },
  {
    type: 'BluetoothServer',
    label: 'BluetoothServer',
    icon: '📡',
    category: 'Connectivity',
    visible: false,
    description: 'Accepts Bluetooth connections'
  },
  {
    type: 'Serial',
    label: 'Serial',
    icon: '🔌',
    category: 'Connectivity',
    visible: false,
    description: 'Communicates via serial port'
  },
  {
    type: 'Web',
    label: 'Web',
    icon: '🌐',
    category: 'Connectivity',
    visible: false,
    description: 'Makes HTTP requests to web services'
  },
  {
    type: 'Ev3Motors',
    label: 'Ev3Motors',
    icon: '⚙️',
    category: 'LEGO MINDSTORMS',
    visible: false,
    description: 'Controls EV3 motors'
  },
  {
    type: 'Ev3ColorSensor',
    label: 'Ev3ColorSensor',
    icon: '🎨',
    category: 'LEGO MINDSTORMS',
    visible: false,
    description: 'Reads EV3 color sensor'
  },
  {
    type: 'Ev3GyroSensor',
    label: 'Ev3GyroSensor',
    icon: '🔄',
    category: 'LEGO MINDSTORMS',
    visible: false,
    description: 'Reads EV3 gyro sensor'
  },
  {
    type: 'Ev3TouchSensor',
    label: 'Ev3TouchSensor',
    icon: '👆',
    category: 'LEGO MINDSTORMS',
    visible: false,
    description: 'Reads EV3 touch sensor'
  },
  {
    type: 'Ev3UltrasonicSensor',
    label: 'Ev3UltrasonicSensor',
    icon: '📡',
    category: 'LEGO MINDSTORMS',
    visible: false,
    description: 'Reads EV3 ultrasonic sensor'
  },
  {
    type: 'Ev3Sound',
    label: 'Ev3Sound',
    icon: '🔊',
    category: 'LEGO MINDSTORMS',
    visible: false,
    description: 'Plays sounds on EV3'
  },
  {
    type: 'Ev3UI',
    label: 'Ev3UI',
    icon: '📺',
    category: 'LEGO MINDSTORMS',
    visible: false,
    description: 'Controls EV3 display'
  },
  {
    type: 'Ev3Commands',
    label: 'Ev3Commands',
    icon: '🎮',
    category: 'LEGO MINDSTORMS',
    visible: false,
    description: 'Sends commands to EV3'
  },
  {
    type: 'NxtDrive',
    label: 'NxtDrive',
    icon: '🚗',
    category: 'LEGO MINDSTORMS',
    visible: false,
    description: 'Controls NXT robot driving'
  },
  {
    type: 'NxtColorSensor',
    label: 'NxtColorSensor',
    icon: '🎨',
    category: 'LEGO MINDSTORMS',
    visible: false,
    description: 'Reads NXT color sensor'
  },
  {
    type: 'NxtLightSensor',
    label: 'NxtLightSensor',
    icon: '💡',
    category: 'LEGO MINDSTORMS',
    visible: false,
    description: 'Reads NXT light sensor'
  },
  {
    type: 'NxtSoundSensor',
    label: 'NxtSoundSensor',
    icon: '🔊',
    category: 'LEGO MINDSTORMS',
    visible: false,
    description: 'Reads NXT sound sensor'
  },
  {
    type: 'NxtTouchSensor',
    label: 'NxtTouchSensor',
    icon: '👆',
    category: 'LEGO MINDSTORMS',
    visible: false,
    description: 'Reads NXT touch sensor'
  },
  {
    type: 'NxtUltrasonicSensor',
    label: 'NxtUltrasonicSensor',
    icon: '📡',
    category: 'LEGO MINDSTORMS',
    visible: false,
    description: 'Reads NXT ultrasonic sensor'
  },
  {
    type: 'NxtDirectCommands',
    label: 'NxtDirectCommands',
    icon: '🎮',
    category: 'LEGO MINDSTORMS',
    visible: false,
    description: 'Sends direct commands to NXT'
  },
  {
    type: 'ChromeWebView',
    label: 'ChromeWebView',
    icon: '🌐',
    category: 'Experimental',
    visible: true,
    description: 'Advanced web viewer using Chrome'
  },
  {
    type: 'Chart',
    label: 'Chart',
    icon: '📊',
    category: 'Charts',
    visible: true,
    description: 'Displays data in chart form (line, bar, pie, scatter, area)'
  },
  {
    type: 'ChartData2D',
    label: 'ChartData2D',
    icon: '📈',
    category: 'Charts',
    visible: false,
    description: 'Provides 2D data series for a Chart component'
  },
  {
    type: 'DataCollection',
    label: 'DataCollection',
    icon: '📋',
    category: 'Data Science',
    visible: false,
    description: 'Collects and manages datasets for analysis'
  },
  {
    type: 'Regression',
    label: 'Regression',
    icon: '📉',
    category: 'Data Science',
    visible: false,
    description: 'Performs regression analysis on data'
  },
  {
    type: 'Trendline',
    label: 'Trendline',
    icon: '📐',
    category: 'Data Science',
    visible: false,
    description: 'Adds trendlines to chart data'
  },
  {
    type: 'AnomalyDetection',
    label: 'AnomalyDetection',
    icon: '🔍',
    category: 'Data Science',
    visible: false,
    description: 'Detects anomalies in datasets'
  },
];

export const CATEGORIES: string[] = [
  'User Interface',
  'Layout',
  'Media',
  'Drawing and Animation',
  'Maps',
  'Charts',
  'Data Science',
  'Sensors',
  'Social',
  'Storage',
  'Connectivity',
  'LEGO MINDSTORMS',
  'Experimental'
];

export const COMPONENT_COUNT: number = PALETTE_ENHANCED.length;
