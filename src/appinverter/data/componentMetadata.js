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
            { name: 'AlignHorizontal', type: 'Number' },
            { name: 'AlignVertical', type: 'Number' },
            { name: 'AppName', type: 'String' },
            { name: 'BackgroundColor', type: 'Color' },
            { name: 'BackgroundImage', type: 'String' },
            { name: 'Title', type: 'String' }
        ]
    },
    'Button': {
        events: [
            { name: 'Click', description: 'User tapped and released the button' },
            { name: 'LongClick', description: 'User held the button down' },
            { name: 'TouchDown', description: 'User touched the button' },
            { name: 'TouchUp', description: 'User released the button' },
            { name: 'GotFocus', description: 'Button gained focus' },
            { name: 'LostFocus', description: 'Button lost focus' }
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
            { name: 'Click', description: 'User tapped the label' }
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
            { name: 'HideKeyboard', description: 'Hide the software keyboard' },
            { name: 'RequestFocus', description: 'Set focus to this text box' }
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
    }
};
