/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * MIT App Inventor-compatible default property values for all palette components.
 * Every property shown in the MIT AI2 designer Properties panel should have
 * a default value here so the LeapLab PropertiesPanel can display them.
 */

const LENGTH_AUTOMATIC = -1;
const LENGTH_FILL_PARENT = -2;

const baseVisible = {
  Width: LENGTH_AUTOMATIC,
  Height: LENGTH_AUTOMATIC,
  Visible: true,
  Enabled: true
};

const baseButton = {
  ...baseVisible,
  BackgroundColor: '#3B82F6',
  Enabled: true,
  FontBold: false,
  FontItalic: false,
  FontSize: 14,
  FontTypeface: 0,
  Image: '',
  Shape: 'default',
  ShowFeedback: true,
  Text: 'Button',
  TextAlignment: 'center',
  TextColor: '#ffffff'
};

const withLegacyAliases = (props) => ({
  ...props,
  width: props.Width,
  height: props.Height,
  visible: props.Visible
});

/**
 * Returns a complete set of default properties for the given component type.
 * These mirror the MIT App Inventor designer defaults.
 */
export function defaultPropsFor(type) {
  switch (type) {
    // ─── User Interface ───────────────────────────────────────────────

    case 'Button':
      return withLegacyAliases({ ...baseButton, Text: 'Button' });

    case 'Label':
      return withLegacyAliases({
        ...baseVisible,
        BackgroundColor: 'transparent',
        FontBold: false,
        FontItalic: false,
        FontSize: 14,
        FontTypeface: 0,
        HasMargins: true,
        HTMLFormat: false,
        Text: 'Label',
        TextAlignment: 'left',
        TextColor: '#000000'
      });

    case 'TextBox':
      return withLegacyAliases({
        ...baseVisible,
        BackgroundColor: 'transparent',
        Enabled: true,
        FontBold: false,
        FontItalic: false,
        FontSize: 14,
        FontTypeface: 0,
        Hint: 'Enter text...',
        MultiLine: false,
        NumbersOnly: false,
        ReadOnly: false,
        Text: '',
        TextAlignment: 'left',
        TextColor: '#000000'
      });

    case 'PasswordTextBox':
      return withLegacyAliases({
        ...baseVisible,
        BackgroundColor: 'transparent',
        Enabled: true,
        FontBold: false,
        FontSize: 14,
        FontTypeface: 0,
        Hint: 'Password',
        NumbersOnly: false,
        Text: '',
        TextAlignment: 'left',
        TextColor: '#000000'
      });

    case 'CheckBox':
      return withLegacyAliases({
        ...baseVisible,
        BackgroundColor: 'transparent',
        Checked: false,
        Enabled: true,
        FontBold: false,
        FontItalic: false,
        FontSize: 14,
        FontTypeface: 0,
        Text: 'CheckBox',
        TextColor: '#000000'
      });

    case 'Switch':
      return withLegacyAliases({
        ...baseVisible,
        BackgroundColor: 'transparent',
        Enabled: true,
        FontBold: false,
        FontItalic: false,
        FontSize: 14,
        FontTypeface: 0,
        On: false,
        Text: 'Switch',
        TextColor: '#000000',
        ThumbColorActive: '#ffffff',
        ThumbColorInactive: '#cccccc',
        TrackColorActive: '#4CAF50',
        TrackColorInactive: '#B0B0B0'
      });

    case 'ListPicker':
      return withLegacyAliases({
        ...baseButton,
        Text: 'ListPicker',
        BackgroundColor: '#3B82F6',
        Elements: [],
        ElementsFromString: '',
        ItemBackgroundColor: '#ffffff',
        ItemTextColor: '#000000',
        Selection: '',
        SelectionIndex: 0,
        ShowFilterBar: false,
        Title: ''
      });

    case 'Spinner':
      return withLegacyAliases({
        ...baseVisible,
        Elements: [],
        ElementsFromString: '',
        Prompt: '',
        Selection: '',
        SelectionIndex: 0
      });

    case 'Slider':
      return withLegacyAliases({
        ...baseVisible,
        ColorLeft: '#FFC107',
        ColorRight: '#888888',
        MaxValue: 100,
        MinValue: 10,
        ThumbEnabled: true,
        ThumbPosition: 50,
        Width: LENGTH_FILL_PARENT
      });

    case 'Image':
      return withLegacyAliases({
        ...baseVisible,
        AlternateText: '',
        Clickable: false,
        Picture: '',
        RotationAngle: 0,
        ScalePictureToFit: false,
        Width: 100,
        Height: 100
      });

    case 'ListView':
      return withLegacyAliases({
        ...baseVisible,
        BackgroundColor: '#000000',
        Elements: [],
        ElementsFromString: '',
        FontSize: 22,
        FontTypeface: 0,
        Selection: '',
        SelectionIndex: 0,
        ShowFilterBar: false,
        TextColor: '#ffffff',
        Height: LENGTH_FILL_PARENT,
        Width: LENGTH_FILL_PARENT
      });

    case 'DatePicker':
      return withLegacyAliases({
        ...baseButton,
        Text: 'DatePicker',
        Day: 0,
        Month: 0,
        MonthInText: '',
        Year: 0
      });

    case 'TimePicker':
      return withLegacyAliases({
        ...baseButton,
        Text: 'TimePicker',
        Hour: 0,
        Minute: 0
      });

    case 'WebViewer':
      return withLegacyAliases({
        ...baseVisible,
        FollowLinks: true,
        HomeUrl: '',
        IgnoreSslErrors: false,
        PromptForPermission: true,
        UsesLocation: false,
        WebViewString: '',
        Height: LENGTH_FILL_PARENT,
        Width: LENGTH_FILL_PARENT
      });

    case 'Notifier':
      return {
        BackgroundColor: '#444444',
        NotifierLength: 1,
        TextColor: '#ffffff'
      };

    // ─── Layout ───────────────────────────────────────────────────────

    case 'AbsoluteArrangement':
      return withLegacyAliases({
        ...baseVisible,
        BackgroundColor: 'transparent',
        Image: '',
        Width: LENGTH_FILL_PARENT
      });

    case 'HorizontalArrangement':
    case 'HorizontalScrollArrangement':
      return withLegacyAliases({
        ...baseVisible,
        AlignHorizontal: 'Left',
        AlignVertical: 'Top',
        BackgroundColor: 'transparent',
        Image: '',
        Width: LENGTH_FILL_PARENT
      });

    case 'VerticalArrangement':
    case 'VerticalScrollArrangement':
      return withLegacyAliases({
        ...baseVisible,
        AlignHorizontal: 'Left',
        AlignVertical: 'Top',
        BackgroundColor: 'transparent',
        Image: '',
        Width: LENGTH_FILL_PARENT
      });

    case 'TableArrangement':
      return withLegacyAliases({
        ...baseVisible,
        Columns: 2,
        Rows: 2,
        Width: LENGTH_FILL_PARENT
      });

    // ─── Media ────────────────────────────────────────────────────────

    case 'Camera':
      return { UseFront: false };

    case 'Camcorder':
      return {};

    case 'ImagePicker':
      return withLegacyAliases({
        ...baseButton,
        Text: 'ImagePicker',
        Selection: ''
      });

    case 'Player':
      return {
        IsLooping: false,
        PlayOnlyInForeground: false,
        Source: '',
        Volume: 50
      };

    case 'Sound':
      return {
        MinimumInterval: 500,
        Source: ''
      };

    case 'SoundRecorder':
      return { SavedRecording: '' };

    case 'SpeechRecognizer':
      return { Language: '' };

    case 'TextToSpeech':
      return {
        Country: '',
        Language: '',
        Pitch: 1.0,
        SpeechRate: 1.0
      };

    case 'VideoPlayer':
      return withLegacyAliases({
        ...baseVisible,
        FullScreen: false,
        Source: '',
        Volume: 50,
        Width: 320,
        Height: 240
      });

    case 'YandexTranslate':
    case 'Translator':
      return {};

    // ─── Drawing & Animation ──────────────────────────────────────────

    case 'Canvas':
      return withLegacyAliases({
        ...baseVisible,
        BackgroundColor: '#ffffff',
        BackgroundImage: '',
        FontSize: 14,
        LineWidth: 2,
        PaintColor: '#000000',
        TextAlignment: 'center',
        Width: 300,
        Height: 300
      });

    case 'ImageSprite':
      return {
        Enabled: true,
        Heading: 0,
        Height: LENGTH_AUTOMATIC,
        Interval: 100,
        Picture: '',
        Rotates: true,
        Speed: 0,
        Visible: true,
        Width: LENGTH_AUTOMATIC,
        X: 0,
        Y: 0,
        Z: 1
      };

    case 'Ball':
      return {
        Enabled: true,
        Heading: 0,
        Interval: 100,
        OriginAtCenter: false,
        PaintColor: '#000000',
        Radius: 5,
        Speed: 0,
        Visible: true,
        X: 0,
        Y: 0,
        Z: 1
      };

    // ─── Maps ─────────────────────────────────────────────────────────

    case 'Map':
      return withLegacyAliases({
        ...baseVisible,
        CenterFromString: '',
        EnablePan: true,
        EnableRotation: false,
        EnableZoom: true,
        Latitude: 42.359144,
        LocationSensor: '',
        Longitude: -71.093612,
        MapType: 1,
        Rotation: 0,
        ScaleUnits: 1,
        ShowCompass: false,
        ShowScale: false,
        ShowUser: false,
        ShowZoom: false,
        ZoomLevel: 13,
        Height: LENGTH_FILL_PARENT,
        Width: LENGTH_FILL_PARENT
      });

    case 'Marker':
      return {
        AnchorHorizontal: 3,
        AnchorVertical: 3,
        Description: '',
        Draggable: false,
        EnableInfobox: false,
        FillColor: '#F44336',
        FillOpacity: 1,
        ImageAsset: '',
        Latitude: 0,
        Longitude: 0,
        StrokeColor: '#000000',
        StrokeOpacity: 1,
        StrokeWidth: 1,
        Title: '',
        Visible: true,
        Width: LENGTH_AUTOMATIC,
        Height: LENGTH_AUTOMATIC
      };

    case 'Circle':
      return {
        Description: '',
        Draggable: false,
        EnableInfobox: false,
        FillColor: '#F44336',
        FillOpacity: 1,
        Latitude: 0,
        Longitude: 0,
        Radius: 0,
        StrokeColor: '#000000',
        StrokeOpacity: 1,
        StrokeWidth: 1,
        Title: '',
        Visible: true
      };

    case 'Polygon':
      return {
        Description: '',
        Draggable: false,
        EnableInfobox: false,
        FillColor: '#F44336',
        FillOpacity: 1,
        HolePointsFromString: '',
        PointsFromString: '',
        StrokeColor: '#000000',
        StrokeOpacity: 1,
        StrokeWidth: 1,
        Title: '',
        Visible: true
      };

    case 'LineString':
      return {
        Description: '',
        Draggable: false,
        EnableInfobox: false,
        PointsFromString: '',
        StrokeColor: '#000000',
        StrokeOpacity: 1,
        StrokeWidth: 1,
        Title: '',
        Visible: true
      };

    case 'Rectangle':
      return {
        Description: '',
        Draggable: false,
        EastLongitude: 0,
        EnableInfobox: false,
        FillColor: '#F44336',
        FillOpacity: 1,
        NorthLatitude: 0,
        SouthLatitude: 0,
        StrokeColor: '#000000',
        StrokeOpacity: 1,
        StrokeWidth: 1,
        Title: '',
        Visible: true,
        WestLongitude: 0
      };

    case 'FeatureCollection':
      return {
        Description: '',
        FeaturesFromGeoJSON: '',
        Source: '',
        Title: '',
        Visible: true
      };

    // ─── Sensors ──────────────────────────────────────────────────────

    case 'AccelerometerSensor':
      return {
        Enabled: true,
        LegacyMode: false,
        MinimumInterval: 400,
        Sensitivity: 2
      };

    case 'BarcodeScanner':
      return { UseExternalScanner: true };

    case 'Clock':
      return {
        TimerAlwaysFires: true,
        TimerEnabled: true,
        TimerInterval: 1000
      };

    case 'GyroscopeSensor':
      return { Enabled: true };

    case 'LocationSensor':
      return {
        DistanceInterval: 0,
        Enabled: true,
        TimeInterval: 60000
      };

    case 'NearField':
      return {};

    case 'OrientationSensor':
      return { Enabled: true };

    case 'Pedometer':
      return {};

    case 'ProximitySensor':
      return { Enabled: true, KeepRunningWhenOnPause: false };

    case 'Barometer':
    case 'Hygrometer':
    case 'LightSensor':
    case 'MagneticFieldSensor':
    case 'Thermometer':
      return { Enabled: true, RefreshTime: 1000 };

    // ─── Social ───────────────────────────────────────────────────────

    case 'ContactPicker':
      return withLegacyAliases({
        ...baseButton,
        Text: 'ContactPicker'
      });

    case 'EmailPicker':
      return withLegacyAliases({
        ...baseButton,
        Text: 'EmailPicker'
      });

    case 'PhoneCall':
      return { PhoneNumber: '' };

    case 'PhoneNumberPicker':
      return withLegacyAliases({
        ...baseButton,
        Text: 'PhoneNumberPicker'
      });

    case 'Sharing':
      return {};

    case 'Texting':
      return {
        GoogleVoiceEnabled: false,
        Message: '',
        PhoneNumber: '',
        ReceivingEnabled: 1
      };

    // ─── Storage ──────────────────────────────────────────────────────

    case 'TinyDB':
      return { Namespace: 'TinyDB1' };

    case 'TinyWebDB':
      return { ServiceURL: 'http://tinywebdb.appinventor.mit.edu' };

    case 'CloudDB':
      return {
        DefaultRedisServer: 'DEFAULT',
        ProjectID: '',
        RedisPort: 6381,
        RedisServer: 'DEFAULT',
        Token: '',
        UseSSL: true
      };

    case 'File':
      return { DefaultScope: 'App' };

    case 'DataFile':
      return { SourceFile: '' };

    case 'FirebaseDB':
      return {
        DeveloperBucket: '',
        FirebaseToken: '',
        FirebaseURL: '',
        ProjectBucket: '',
        Persist: false
      };

    case 'Spreadsheet':
      return {
        ApplicationName: '',
        CredentialsJson: '',
        SpreadsheetID: ''
      };

    case 'FilePicker':
      return withLegacyAliases({
        ...baseButton,
        Text: 'FilePicker',
        Selection: ''
      });

    // ─── Connectivity ─────────────────────────────────────────────────

    case 'ActivityStarter':
      return {
        Action: '',
        ActivityClass: '',
        ActivityPackage: '',
        DataType: '',
        DataUri: '',
        ExtraKey: '',
        ExtraValue: '',
        Result: '',
        ResultName: '',
        ResultType: '',
        ResultUri: ''
      };

    case 'BluetoothClient':
      return {
        CharacterEncoding: 'UTF-8',
        DelimiterByte: 0,
        DisconnectOnError: false,
        HighByteFirst: false,
        NoLocationNeeded: false,
        PollingRate: 0,
        Secure: true
      };

    case 'BluetoothServer':
      return {
        CharacterEncoding: 'UTF-8',
        DelimiterByte: 0,
        HighByteFirst: false,
        Secure: true
      };

    case 'Serial':
      return {
        BaudRate: 9600,
        BufferSize: 256
      };

    case 'Web':
      return {
        AllowCookies: false,
        ResponseFileName: '',
        SaveResponse: false,
        Timeout: 0,
        Url: ''
      };

    // ─── Charts ───────────────────────────────────────────────────────

    case 'Chart':
      return withLegacyAliases({
        ...baseVisible,
        BackgroundColor: '#ffffff',
        Description: '',
        GridEnabled: true,
        Height: 200,
        Labels: [],
        LabelsFromString: '',
        LegendEnabled: true,
        PieRadius: 100,
        Type: 0,
        Width: LENGTH_FILL_PARENT,
        XFromZero: false,
        YFromZero: false
      });

    case 'ChartData2D':
      return {
        Color: '#F44336',
        Colors: [],
        DataFileXColumn: '',
        DataFileYColumn: '',
        DataSourceKey: '',
        Label: '',
        LineType: 0,
        PointShape: 0,
        Source: '',
        SpreadsheetUseHeaders: false
      };

    // ─── LEGO MINDSTORMS ──────────────────────────────────────────────

    case 'Ev3Motors':
      return { BluetoothClient: '', EnableSpeedRegulation: true, MotorPorts: 'ABC', ReverseDirection: false, StopBeforeDisconnect: true, TachoCountChangedEventEnabled: false, WheelDiameter: 4.32 };

    case 'Ev3ColorSensor':
    case 'Ev3GyroSensor':
    case 'Ev3TouchSensor':
    case 'Ev3UltrasonicSensor':
      return { BluetoothClient: '', SensorPort: '1', BottomOfRange: 30, TopOfRange: 60, AboveRangeEventEnabled: false, BelowRangeEventEnabled: false, WithinRangeEventEnabled: false };

    case 'Ev3Sound':
      return { BluetoothClient: '' };

    case 'Ev3UI':
      return { BluetoothClient: '' };

    case 'Ev3Commands':
      return { BluetoothClient: '' };

    case 'NxtDrive':
      return { BluetoothClient: '', DriveMotors: 'CB', StopBeforeDisconnect: true, WheelDiameter: 4.32 };

    case 'NxtColorSensor':
    case 'NxtLightSensor':
    case 'NxtSoundSensor':
    case 'NxtTouchSensor':
    case 'NxtUltrasonicSensor':
      return { BluetoothClient: '', SensorPort: '1', BottomOfRange: 256, TopOfRange: 767, AboveRangeEventEnabled: false, BelowRangeEventEnabled: false, WithinRangeEventEnabled: false };

    case 'NxtDirectCommands':
      return { BluetoothClient: '' };

    // ─── Experimental ─────────────────────────────────────────────────

    case 'ChromeWebView':
      return withLegacyAliases({
        ...baseVisible,
        HomeUrl: '',
        Height: LENGTH_FILL_PARENT,
        Width: LENGTH_FILL_PARENT
      });

    // ─── Data Science ─────────────────────────────────────────────────
    case 'DataCollection':
    case 'Regression':
    case 'Trendline':
    case 'AnomalyDetection':
      return {};

    // ─── Progress ─────────────────────────────────────────────────────
    case 'CircularProgress':
      return withLegacyAliases({
        ...baseVisible,
        Color: '#3B82F6',
        Indeterminate: true,
        Maximum: 100,
        Minimum: 0,
        Progress: 0
      });

    case 'LinearProgress':
      return withLegacyAliases({
        ...baseVisible,
        Color: '#3B82F6',
        Indeterminate: true,
        Maximum: 100,
        Minimum: 0,
        Progress: 0,
        Width: LENGTH_FILL_PARENT
      });

    // ─── Navigation ───────────────────────────────────────────────────
    case 'Navigation':
      return {
        ApiKey: '',
        EndLatitude: 0,
        EndLongitude: 0,
        Language: 'en',
        StartLatitude: 0,
        StartLongitude: 0,
        TransportationMethod: 'foot-walking'
      };

    default:
      return withLegacyAliases(baseVisible);
  }
}
