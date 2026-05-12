/**
 * MIT App Inventor Component Metadata
 * Defines events, methods, and properties for all components
 */

export const COMPONENT_METADATA = {
    'Screen': {
        events: [
            { name: 'Initialize', description: 'Screen started', parameters: [] },
            { name: 'BackPressed', description: 'User pressed back button', parameters: [] },
            { name: 'ErrorOccurred', description: 'Error occurred', parameters: [
                { name: 'component', type: 'Component' },
                { name: 'functionName', type: 'String' },
                { name: 'errorNumber', type: 'Number' },
                { name: 'message', type: 'String' }
            ]},
            { name: 'ScreenOrientationChanged', description: 'Orientation changed', parameters: [] },
            { name: 'OtherScreenClosed', description: 'Returned from another screen', parameters: [
                { name: 'otherScreenName', type: 'String' },
                { name: 'result', type: 'Any' }
            ]}
        ],
        methods: [],
        properties: [
            { name: 'AboutScreen', type: 'String' },
            { name: 'AlignHorizontal', type: 'Number', options: ['Left', 'Center', 'Right'] },
            { name: 'AlignVertical', type: 'Number', options: ['Top', 'Center', 'Bottom'] },
            { name: 'ScreenOrientation', type: 'String', options: ['Unspecified', 'Portrait', 'Landscape', 'Sensor', 'User', 'Behind', 'NoSensor', 'FullSensor', 'ReversePortrait', 'ReverseLandscape', 'SensorPortrait', 'SensorLandscape'] },
            { name: 'AppName', type: 'String' },
            { name: 'BackgroundColor', type: 'Color' },
            { name: 'BackgroundImage', type: 'String' },
            { name: 'Title', type: 'String' }
        ]
    },
    'Button': {
        events: [
            { name: 'Click', description: 'User tapped and released the button', parameters: [] },
            { name: 'LongClick', description: 'User held the button down', parameters: [] },
            { name: 'TouchDown', description: 'User touched the button', parameters: [] },
            { name: 'TouchUp', description: 'User released the button', parameters: [] },
            { name: 'GotFocus', description: 'Button gained focus', parameters: [] },
            { name: 'LostFocus', description: 'Button lost focus', parameters: [] }
        ],
        methods: [],
        properties: [
            { name: 'BackgroundColor', type: 'Color' },
            { name: 'Enabled', type: 'Boolean' },
            { name: 'FontBold', type: 'Boolean' },
            { name: 'FontItalic', type: 'Boolean' },
            { name: 'FontSize', type: 'Number' },
            { name: 'FontTypeface', type: 'Number' },
            { name: 'Height', type: 'Number' },
            { name: 'Image', type: 'String' },
            { name: 'Shape', type: 'Number' },
            { name: 'ShowFeedback', type: 'Boolean' },
            { name: 'Text', type: 'String' },
            { name: 'TextAlignment', type: 'Number' },
            { name: 'TextColor', type: 'Color' },
            { name: 'Visible', type: 'Boolean' },
            { name: 'Width', type: 'Number' }
        ]
    },
    'Label': {
        events: [
            { name: 'Click', description: 'User tapped the label', parameters: [] }
        ],
        methods: [],
        properties: [
            { name: 'BackgroundColor', type: 'Color' },
            { name: 'FontBold', type: 'Boolean' },
            { name: 'FontItalic', type: 'Boolean' },
            { name: 'FontSize', type: 'Number' },
            { name: 'FontTypeface', type: 'Number' },
            { name: 'HasMargins', type: 'Boolean' },
            { name: 'Height', type: 'Number' },
            { name: 'HTMLFormat', type: 'Boolean' },
            { name: 'Text', type: 'String' },
            { name: 'TextAlignment', type: 'Number' },
            { name: 'TextColor', type: 'Color' },
            { name: 'Visible', type: 'Boolean' },
            { name: 'Width', type: 'Number' }
        ]
    },
    'TextBox': {
        events: [
            { name: 'GotFocus', description: 'User tapped on the text box' },
            { name: 'LostFocus', description: 'User tapped outside the text box' }
        ],
        methods: [
            { name: 'HideKeyboard', description: 'Hide the software keyboard', parameters: [] },
            { name: 'RequestFocus', description: 'Set focus to this text box', parameters: [] }
        ],
        properties: [
            { name: 'BackgroundColor', type: 'Color' },
            { name: 'Enabled', type: 'Boolean' },
            { name: 'FontBold', type: 'Boolean' },
            { name: 'FontItalic', type: 'Boolean' },
            { name: 'FontSize', type: 'Number' },
            { name: 'FontTypeface', type: 'Number' },
            { name: 'Height', type: 'Number' },
            { name: 'Hint', type: 'String' },
            { name: 'MultiLine', type: 'Boolean' },
            { name: 'NumbersOnly', type: 'Boolean' },
            { name: 'ReadOnly', type: 'Boolean' },
            { name: 'Text', type: 'String' },
            { name: 'TextAlignment', type: 'Number' },
            { name: 'TextColor', type: 'Color' },
            { name: 'Visible', type: 'Boolean' },
            { name: 'Width', type: 'Number' }
        ]
    },
    'Canvas': {
        events: [
            { name: 'Touched', description: 'User touched the canvas', parameters: [
                { name: 'x', type: 'Number' }, { name: 'y', type: 'Number' }, { name: 'touchedSprite', type: 'Boolean' }
            ]},
            { name: 'Dragged', description: 'User dragged on the canvas', parameters: [
                { name: 'startX', type: 'Number' }, { name: 'startY', type: 'Number' },
                { name: 'prevX', type: 'Number' }, { name: 'prevY', type: 'Number' },
                { name: 'currentX', type: 'Number' }, { name: 'currentY', type: 'Number' },
                { name: 'draggedSprite', type: 'Boolean' }
            ]},
            { name: 'Flung', description: 'User flung on the canvas', parameters: [
                { name: 'x', type: 'Number' }, { name: 'y', type: 'Number' },
                { name: 'speed', type: 'Number' }, { name: 'heading', type: 'Number' },
                { name: 'xvel', type: 'Number' }, { name: 'yvel', type: 'Number' },
                { name: 'flungSprite', type: 'Boolean' }
            ]},
            { name: 'TouchDown', description: 'User touched down', parameters: [{ name: 'x', type: 'Number' }, { name: 'y', type: 'Number' }] },
            { name: 'TouchUp', description: 'User released touch', parameters: [{ name: 'x', type: 'Number' }, { name: 'y', type: 'Number' }] }
        ],
        methods: [
            { name: 'Clear', description: 'Clear the canvas', parameters: [] },
            { name: 'DrawCircle', description: 'Draw a circle', parameters: [
                { name: 'centerX', type: 'Number' }, { name: 'centerY', type: 'Number' },
                { name: 'radius', type: 'Number' }, { name: 'fill', type: 'Boolean' }
            ]},
            { name: 'DrawLine', description: 'Draw a line', parameters: [
                { name: 'x1', type: 'Number' }, { name: 'y1', type: 'Number' },
                { name: 'x2', type: 'Number' }, { name: 'y2', type: 'Number' }
            ]},
            { name: 'DrawPoint', description: 'Draw a point', parameters: [{ name: 'x', type: 'Number' }, { name: 'y', type: 'Number' }] },
            { name: 'DrawText', description: 'Draw text', parameters: [
                { name: 'text', type: 'String' }, { name: 'x', type: 'Number' }, { name: 'y', type: 'Number' }
            ]},
            { name: 'DrawTextAtAngle', description: 'Draw text at an angle', parameters: [
                { name: 'text', type: 'String' }, { name: 'x', type: 'Number' }, { name: 'y', type: 'Number' }, { name: 'angle', type: 'Number' }
            ]}
        ],
        properties: [
            { name: 'BackgroundColor', type: 'Color' },
            { name: 'BackgroundImage', type: 'String' },
            { name: 'FontSize', type: 'Number' },
            { name: 'Height', type: 'Number' },
            { name: 'LineWidth', type: 'Number' },
            { name: 'PaintColor', type: 'Color' },
            { name: 'TextAlignment', type: 'Number' },
            { name: 'Visible', type: 'Boolean' },
            { name: 'Width', type: 'Number' }
        ]
    },
    'Clock': {
        events: [
            { name: 'Timer', description: 'Timer fired' }
        ],
        methods: [
            { name: 'AddDays', description: 'Add days to instant' },
            { name: 'AddDuration', description: 'Add duration to instant' },
            { name: 'AddHours', description: 'Add hours to instant' },
            { name: 'AddMinutes', description: 'Add minutes to instant' },
            { name: 'AddMonths', description: 'Add months to instant' },
            { name: 'AddSeconds', description: 'Add seconds to instant' },
            { name: 'AddWeeks', description: 'Add weeks to instant' },
            { name: 'AddYears', description: 'Add years to instant' },
            { name: 'Duration', description: 'Get duration between instants' },
            { name: 'DurationToDays', description: 'Convert duration to days' },
            { name: 'DurationToHours', description: 'Convert duration to hours' },
            { name: 'DurationToMinutes', description: 'Convert duration to minutes' },
            { name: 'DurationToSeconds', description: 'Convert duration to seconds' },
            { name: 'DurationToWeeks', description: 'Convert duration to weeks' },
            { name: 'FormatDate', description: 'Format date' },
            { name: 'FormatDateTime', description: 'Format date and time' },
            { name: 'FormatTime', description: 'Format time' },
            { name: 'GetMillis', description: 'Get milliseconds from instant' },
            { name: 'MakeInstant', description: 'Create instant' },
            { name: 'MakeInstantFromMillis', description: 'Create instant from millis' },
            { name: 'Now', description: 'Get current time' },
            { name: 'SystemTime', description: 'Get system time' }
        ],
        properties: [
            { name: 'TimerAlwaysFires', type: 'Boolean' },
            { name: 'TimerEnabled', type: 'Boolean' },
            { name: 'TimerInterval', type: 'Number' }
        ]
    },
    'TinyDB': {
        events: [],
        methods: [
            { name: 'ClearAll', description: 'Clear all data' },
            { name: 'ClearTag', description: 'Clear specific tag' },
            { name: 'GetTags', description: 'Get all tags' },
            { name: 'GetValue', description: 'Get a value' },
            { name: 'StoreValue', description: 'Store a value' }
        ],
        properties: [
            { name: 'Namespace', type: 'String' }
        ]
    },
    'Notifier': {
        events: [
            { name: 'AfterChoosing', description: 'After user chooses an option', parameters: [{ name: 'choice', type: 'String' }] },
            { name: 'AfterTextInput', description: 'After user enters text', parameters: [{ name: 'response', type: 'String' }] }
        ],
        methods: [
            { name: 'ShowAlert', description: 'Show alert', parameters: [{ name: 'notice', type: 'String' }] },
            { name: 'ShowMessageDialog', description: 'Show message', parameters: [
                { name: 'message', type: 'String' }, { name: 'title', type: 'String' }, { name: 'buttonText', type: 'String' }
            ]},
            { name: 'ShowChooseDialog', description: 'Show choice dialog', parameters: [
                { name: 'message', type: 'String' }, { name: 'title', type: 'String' },
                { name: 'button1Text', type: 'String' }, { name: 'button2Text', type: 'String' },
                { name: 'cancelable', type: 'Boolean' }
            ]},
            { name: 'ShowTextDialog', description: 'Show text dialog', parameters: [
                { name: 'message', type: 'String' }, { name: 'title', type: 'String' }, { name: 'cancelable', type: 'Boolean' }
            ]}
        ],
        properties: [
            { name: 'BackgroundColor', type: 'Color' },
            { name: 'NotifierLength', type: 'Number' },
            { name: 'TextColor', type: 'Color' }
        ]
    },
    'Image': {
        events: [
            { name: 'Click', description: 'User tapped the image', parameters: [] }
        ],
        methods: [],
        properties: [
            { name: 'AlternateText', type: 'String' },
            { name: 'Clickable', type: 'Boolean' },
            { name: 'Height', type: 'Number' },
            { name: 'Picture', type: 'String' },
            { name: 'RotationAngle', type: 'Number' },
            { name: 'ScalePictureToFit', type: 'Boolean' },
            { name: 'Visible', type: 'Boolean' },
            { name: 'Width', type: 'Number' }
        ]
    },
    'CheckBox': {
        events: [
            { name: 'Changed', description: 'Checked state changed', parameters: [] },
            { name: 'GotFocus', description: 'CheckBox gained focus', parameters: [] },
            { name: 'LostFocus', description: 'CheckBox lost focus', parameters: [] }
        ],
        methods: [],
        properties: [
            { name: 'BackgroundColor', type: 'Color' },
            { name: 'Checked', type: 'Boolean' },
            { name: 'Enabled', type: 'Boolean' },
            { name: 'FontBold', type: 'Boolean' },
            { name: 'FontItalic', type: 'Boolean' },
            { name: 'FontSize', type: 'Number' },
            { name: 'FontTypeface', type: 'Number' },
            { name: 'Height', type: 'Number' },
            { name: 'Text', type: 'String' },
            { name: 'TextColor', type: 'Color' },
            { name: 'Visible', type: 'Boolean' },
            { name: 'Width', type: 'Number' }
        ]
    },
    'ListPicker': {
        events: [
            { name: 'AfterPicking', description: 'After user picks an item', parameters: [] },
            { name: 'BeforePicking', description: 'Before picker opens', parameters: [] },
            { name: 'GotFocus', description: 'Picker gained focus', parameters: [] },
            { name: 'LostFocus', description: 'Picker lost focus', parameters: [] }
        ],
        methods: [
            { name: 'Open', description: 'Open the picker', parameters: [] }
        ],
        properties: [
            { name: 'BackgroundColor', type: 'Color' },
            { name: 'Elements', type: 'Array' },
            { name: 'ElementsFromString', type: 'String' },
            { name: 'Height', type: 'Number' },
            { name: 'Selection', type: 'String' },
            { name: 'SelectionIndex', type: 'Number' },
            { name: 'ShowFilterBar', type: 'Boolean' },
            { name: 'Text', type: 'String' },
            { name: 'Title', type: 'String' },
            { name: 'Visible', type: 'Boolean' },
            { name: 'Width', type: 'Number' }
        ]
    },
    'PasswordTextBox': {
        events: [
            { name: 'GotFocus', description: 'Gained focus', parameters: [] },
            { name: 'LostFocus', description: 'Lost focus', parameters: [] }
        ],
        methods: [
            { name: 'RequestFocus', description: 'Request focus', parameters: [] }
        ],
        properties: [
            { name: 'BackgroundColor', type: 'Color' },
            { name: 'Enabled', type: 'Boolean' },
            { name: 'FontBold', type: 'Boolean' },
            { name: 'FontSize', type: 'Number' },
            { name: 'Height', type: 'Number' },
            { name: 'Hint', type: 'String' },
            { name: 'Text', type: 'String' },
            { name: 'TextColor', type: 'Color' },
            { name: 'Visible', type: 'Boolean' },
            { name: 'Width', type: 'Number' }
        ]
    },
    'Slider': {
        events: [
            { name: 'PositionChanged', description: 'Slider moved', parameters: [{ name: 'thumbPosition', type: 'Number' }] }
        ],
        methods: [],
        properties: [
            { name: 'ColorLeft', type: 'Color' },
            { name: 'ColorRight', type: 'Color' },
            { name: 'MaxValue', type: 'Number' },
            { name: 'MinValue', type: 'Number' },
            { name: 'ThumbPosition', type: 'Number' },
            { name: 'ThumbEnabled', type: 'Boolean' },
            { name: 'Visible', type: 'Boolean' },
            { name: 'Width', type: 'Number' }
        ]
    },
    'Spinner': {
        events: [
            { name: 'AfterSelecting', description: 'After item selected', parameters: [{ name: 'selection', type: 'String' }] }
        ],
        methods: [
            { name: 'DisplayDropdown', description: 'Show the dropdown', parameters: [] }
        ],
        properties: [
            { name: 'Elements', type: 'Array' },
            { name: 'ElementsFromString', type: 'String' },
            { name: 'Prompt', type: 'String' },
            { name: 'Selection', type: 'String' },
            { name: 'SelectionIndex', type: 'Number' },
            { name: 'Visible', type: 'Boolean' },
            { name: 'Width', type: 'Number' }
        ]
    },
    'Switch': {
        events: [
            { name: 'Changed', description: 'Switch state changed', parameters: [] }
        ],
        methods: [],
        properties: [
            { name: 'On', type: 'Boolean' },
            { name: 'Enabled', type: 'Boolean' },
            { name: 'Text', type: 'String' },
            { name: 'ThumbColorActive', type: 'Color' },
            { name: 'ThumbColorInactive', type: 'Color' },
            { name: 'TrackColorActive', type: 'Color' },
            { name: 'TrackColorInactive', type: 'Color' },
            { name: 'Visible', type: 'Boolean' }
        ]
    },
    'Web': {
        events: [
            { name: 'GotText', description: 'Received text response', parameters: [
                { name: 'url', type: 'String' }, { name: 'responseCode', type: 'Number' },
                { name: 'responseType', type: 'String' }, { name: 'responseContent', type: 'String' }
            ]},
            { name: 'GotFile', description: 'Received file response', parameters: [
                { name: 'url', type: 'String' }, { name: 'responseCode', type: 'Number' },
                { name: 'responseType', type: 'String' }, { name: 'fileName', type: 'String' }
            ]}
        ],
        methods: [
            { name: 'Get', description: 'Perform GET request', parameters: [] },
            { name: 'PostText', description: 'Perform POST request', parameters: [{ name: 'text', type: 'String' }] },
            { name: 'PutText', description: 'Perform PUT request', parameters: [{ name: 'text', type: 'String' }] },
            { name: 'Delete', description: 'Perform DELETE request', parameters: [] },
            { name: 'UriEncode', description: 'Encode URI component', parameters: [{ name: 'text', type: 'String' }] }
        ],
        properties: [
            { name: 'AllowCookies', type: 'Boolean' },
            { name: 'ResponseFileName', type: 'String' },
            { name: 'SaveResponse', type: 'Boolean' },
            { name: 'Timeout', type: 'Number' },
            { name: 'Url', type: 'String' }
        ]
    },
    'ImageSprite': {
        events: [
            { name: 'CollidedWith', description: 'Collided with another sprite', parameters: [{ name: 'other', type: 'Component' }] },
            { name: 'Dragged', description: 'Sprite dragged', parameters: [
                { name: 'startX', type: 'Number' }, { name: 'startY', type: 'Number' },
                { name: 'prevX', type: 'Number' }, { name: 'prevY', type: 'Number' },
                { name: 'currentX', type: 'Number' }, { name: 'currentY', type: 'Number' }
            ]},
            { name: 'EdgeReached', description: 'Reached edge of canvas', parameters: [{ name: 'edge', type: 'Number' }] },
            { name: 'NoLongerCollidingWith', description: 'Stopped colliding', parameters: [{ name: 'other', type: 'Component' }] },
            { name: 'Touched', description: 'Sprite touched', parameters: [{ name: 'x', type: 'Number' }, { name: 'y', type: 'Number' }] },
            { name: 'Flung', description: 'Sprite flung', parameters: [
                { name: 'x', type: 'Number' }, { name: 'y', type: 'Number' },
                { name: 'speed', type: 'Number' }, { name: 'heading', type: 'Number' },
                { name: 'xvel', type: 'Number' }, { name: 'yvel', type: 'Number' }
            ]}
        ],
        methods: [
            { name: 'Bounce', description: 'Bounce off edge', parameters: [{ name: 'edge', type: 'Number' }] },
            { name: 'MoveIntoBounds', description: 'Move back into canvas', parameters: [] },
            { name: 'MoveTo', description: 'Move to position', parameters: [{ name: 'x', type: 'Number' }, { name: 'y', type: 'Number' }] },
            { name: 'PointInDirection', description: 'Point towards position', parameters: [{ name: 'x', type: 'Number' }, { name: 'y', type: 'Number' }] },
            { name: 'PointTowards', description: 'Point towards sprite', parameters: [{ name: 'target', type: 'Component' }] }
        ],
        properties: [
            { name: 'Enabled', type: 'Boolean' },
            { name: 'Heading', type: 'Number' },
            { name: 'Height', type: 'Number' },
            { name: 'Interval', type: 'Number' },
            { name: 'Picture', type: 'String' },
            { name: 'Rotates', type: 'Boolean' },
            { name: 'Speed', type: 'Number' },
            { name: 'Visible', type: 'Boolean' },
            { name: 'Width', type: 'Number' },
            { name: 'X', type: 'Number' },
            { name: 'Y', type: 'Number' },
            { name: 'Z', type: 'Number' }
        ]
    },
    'Ball': {
        events: [
            { name: 'CollidedWith', description: 'Collided with another sprite', parameters: [{ name: 'other', type: 'Component' }] },
            { name: 'Dragged', description: 'Ball dragged', parameters: [
                { name: 'startX', type: 'Number' }, { name: 'startY', type: 'Number' },
                { name: 'prevX', type: 'Number' }, { name: 'prevY', type: 'Number' },
                { name: 'currentX', type: 'Number' }, { name: 'currentY', type: 'Number' }
            ]},
            { name: 'EdgeReached', description: 'Reached edge of canvas', parameters: [{ name: 'edge', type: 'Number' }] },
            { name: 'Touched', description: 'Ball touched', parameters: [{ name: 'x', type: 'Number' }, { name: 'y', type: 'Number' }] }
        ],
        methods: [
            { name: 'Bounce', description: 'Bounce off edge', parameters: [{ name: 'edge', type: 'Number' }] },
            { name: 'MoveTo', description: 'Move to position', parameters: [{ name: 'x', type: 'Number' }, { name: 'y', type: 'Number' }] }
        ],
        properties: [
            { name: 'Color', type: 'Color' },
            { name: 'Enabled', type: 'Boolean' },
            { name: 'Heading', type: 'Number' },
            { name: 'Interval', type: 'Number' },
            { name: 'Radius', type: 'Number' },
            { name: 'Speed', type: 'Number' },
            { name: 'Visible', type: 'Boolean' },
            { name: 'X', type: 'Number' },
            { name: 'Y', type: 'Number' },
            { name: 'Z', type: 'Number' }
        ]
    },
    'Sound': {
        events: [],
        methods: [
            { name: 'Pause', description: 'Pause playback', parameters: [] },
            { name: 'Play', description: 'Play sound', parameters: [] },
            { name: 'Resume', description: 'Resume playback', parameters: [] },
            { name: 'Stop', description: 'Stop playback', parameters: [] },
            { name: 'Vibrate', description: 'Vibrate device', parameters: [{ name: 'millis', type: 'Number' }] }
        ],
        properties: [
            { name: 'MinimumInterval', type: 'Number' },
            { name: 'Source', type: 'String' }
        ]
    },
    'Player': {
        events: [
            { name: 'Completed', description: 'Playback finished', parameters: [] },
            { name: 'OtherPlayerStarted', description: 'Another player started', parameters: [] }
        ],
        methods: [
            { name: 'Pause', description: 'Pause playback', parameters: [] },
            { name: 'Play', description: 'Start playback', parameters: [] },
            { name: 'Start', description: 'Start playback', parameters: [] },
            { name: 'Stop', description: 'Stop playback', parameters: [] }
        ],
        properties: [
            { name: 'IsLooping', type: 'Boolean' },
            { name: 'PlayOnlyInForeground', type: 'Boolean' },
            { name: 'Source', type: 'String' },
            { name: 'Volume', type: 'Number' }
        ]
    },
    'TextToSpeech': {
        events: [
            { name: 'AfterSpeaking', description: 'Finished speaking', parameters: [{ name: 'result', type: 'Boolean' }] },
            { name: 'BeforeSpeaking', description: 'Started speaking', parameters: [] }
        ],
        methods: [
            { name: 'Speak', description: 'Speak text', parameters: [{ name: 'message', type: 'String' }] }
        ],
        properties: [
            { name: 'Country', type: 'String' },
            { name: 'Language', type: 'String' },
            { name: 'Pitch', type: 'Number' },
            { name: 'SpeechRate', type: 'Number' }
        ]
    },
    'LocationSensor': {
        events: [
            { name: 'LocationChanged', description: 'Location updated', parameters: [
                { name: 'latitude', type: 'Number' }, { name: 'longitude', type: 'Number' },
                { name: 'altitude', type: 'Number' }, { name: 'speed', type: 'Number' }
            ]},
            { name: 'StatusChanged', description: 'Sensor status changed', parameters: [{ name: 'provider', type: 'String' }, { name: 'status', type: 'String' }] }
        ],
        methods: [],
        properties: [
            { name: 'Accuracy', type: 'Number' },
            { name: 'Altitude', type: 'Number' },
            { name: 'DistanceInterval', type: 'Number' },
            { name: 'Enabled', type: 'Boolean' },
            { name: 'HasAltitude', type: 'Boolean' },
            { name: 'HasAccuracy', type: 'Boolean' },
            { name: 'Latitude', type: 'Number' },
            { name: 'Longitude', type: 'Number' },
            { name: 'ProviderName', type: 'String' },
            { name: 'TimeInterval', type: 'Number' }
        ]
    },
    'HorizontalArrangement': {
        events: [],
        methods: [],
        properties: [
            { name: 'AlignHorizontal', type: 'Number', options: ['Left', 'Center', 'Right'] },
            { name: 'AlignVertical', type: 'Number', options: ['Top', 'Center', 'Bottom'] },
            { name: 'BackgroundColor', type: 'Color' },
            { name: 'Height', type: 'Number' },
            { name: 'Visible', type: 'Boolean' },
            { name: 'Width', type: 'Number' }
        ]
    },
    'VerticalArrangement': {
        events: [],
        methods: [],
        properties: [
            { name: 'AlignHorizontal', type: 'Number', options: ['Left', 'Center', 'Right'] },
            { name: 'AlignVertical', type: 'Number', options: ['Top', 'Center', 'Bottom'] },
            { name: 'BackgroundColor', type: 'Color' },
            { name: 'Height', type: 'Number' },
            { name: 'Visible', type: 'Boolean' },
            { name: 'Width', type: 'Number' }
        ]
    },
    'TableArrangement': {
        events: [],
        methods: [],
        properties: [
            { name: 'Columns', type: 'Number' },
            { name: 'Rows', type: 'Number' },
            { name: 'Visible', type: 'Boolean' }
        ]
    }
};

export const ANY_COMPONENT_METADATA = {
    'Button': {
        methods: ['HideKeyboard', 'RequestFocus'],
        properties: ['BackgroundColor', 'Enabled', 'FontBold', 'FontItalic', 'FontSize', 'Text', 'TextColor', 'Visible']
    },
    'Label': {
        methods: [],
        properties: ['BackgroundColor', 'FontBold', 'FontItalic', 'FontSize', 'Text', 'TextColor', 'Visible']
    },
    'TextBox': {
        methods: ['HideKeyboard', 'RequestFocus'],
        properties: ['BackgroundColor', 'Enabled', 'FontBold', 'FontItalic', 'FontSize', 'Text', 'TextColor', 'Visible']
    },
    'Canvas': {
        methods: ['Clear', 'DrawCircle', 'DrawLine', 'DrawPoint', 'DrawText'],
        properties: ['BackgroundColor', 'PaintColor', 'LineWidth', 'Visible']
    },
    'Image': {
        methods: [],
        properties: ['Picture', 'RotationAngle', 'Visible', 'Width', 'Height']
    },
    'CheckBox': {
        methods: [],
        properties: ['Checked', 'Enabled', 'Text', 'Visible']
    },
    'ListPicker': {
        methods: ['Open'],
        properties: ['Selection', 'ElementsFromString', 'Text', 'Visible']
    },
    'ImageSprite': {
        methods: ['Bounce', 'MoveTo', 'PointInDirection'],
        properties: ['Picture', 'Enabled', 'Heading', 'Speed', 'Visible', 'X', 'Y']
    },
    'Ball': {
        methods: ['Bounce', 'MoveTo'],
        properties: ['Color', 'Enabled', 'Heading', 'Radius', 'Speed', 'Visible', 'X', 'Y']
    },
    'Player': {
        methods: ['Start', 'Pause', 'Stop'],
        properties: ['Source', 'Volume', 'IsLooping']
    },
    'TextToSpeech': {
        methods: ['Speak'],
        properties: ['Pitch', 'SpeechRate']
    },
    'Web': {
        methods: ['Get', 'PostText', 'Delete'],
        properties: ['Url', 'Timeout']
    }
};
