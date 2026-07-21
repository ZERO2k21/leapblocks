function escapeHtml(text: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, (c) => map[c] || c);
}

function mediaUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('file:') || path.startsWith('blob:')) return path;
  return 'media/' + path;
}

function cssIdSelector(id: string): string {
  return '#' + CSS.escape(id);
}

function walkComponentTree(components: any[], fn: (comp: any) => void): void {
  for (const comp of components) {
    fn(comp);
    if (comp.children?.length) walkComponentTree(comp.children, fn);
  }
}

function generateComponentCss(comp: any): string {
  const { id, type, props = {} } = comp;
  let css = '';
  const selector = cssIdSelector('comp-' + id);
  const styles: Record<string, string> = {};

  if (props.Width && props.Width !== 'auto') {
    styles.width = typeof props.Width === 'number' || /^\d+$/.test(props.Width) ? (props.Width + 'px') : props.Width;
  }
  if (props.Height && props.Height !== 'auto') {
    styles.height = typeof props.Height === 'number' || /^\d+$/.test(props.Height) ? (props.Height + 'px') : props.Height;
  }
  if (props.BackgroundColor && props.BackgroundColor !== 'none') styles.backgroundColor = props.BackgroundColor;
  if (props.TextColor) styles.color = props.TextColor;
  if (props.FontSize) styles.fontSize = typeof props.FontSize === 'number' ? props.FontSize + 'px' : props.FontSize;
  if (props.FontBold) styles.fontWeight = 'bold';
  if (props.FontItalic) styles.fontStyle = 'italic';
  if (props.Visible === false) styles.display = 'none';
  if (props.Image || props.Picture) {
    styles.backgroundImage = `url(${mediaUrl(props.Image || props.Picture)})`;
    styles.backgroundSize = '100% 100%';
  }
  if (props.Radius !== undefined) styles.borderRadius = props.Radius + 'px';

  if (Object.keys(styles).length > 0) {
    css += `${selector} {\n`;
    for (const [prop, val] of Object.entries(styles)) {
      css += `  ${camelToKebab(prop)}: ${val};\n`;
    }
    css += '}\n';
  }

  if (type === 'Canvas' && props.PaintColor) {
    css += `${selector} { stroke: ${props.PaintColor}; }\n`;
  }

  return css;
}

function camelToKebab(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

function generateIndexHtml(appState: any): string {
  const { appName, screens } = appState;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <title>${escapeHtml(appName || 'My App')}</title>
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
</head>
<body>
  <div id="app-root">
    <div class="startup-loading">Loading app...</div>
  </div>
  <script src="app.js"><\/script>
  <script>
    (function() {
      function showStartupError(message) {
        var root = document.getElementById('app-root');
        if (!root) return;
        root.innerHTML = '';
        var errorBox = document.createElement('div');
        errorBox.className = 'startup-error';
        var title = document.createElement('strong');
        title.textContent = 'App failed to start';
        var detail = document.createElement('span');
        detail.textContent = message || 'Unknown runtime error';
        errorBox.appendChild(title);
        errorBox.appendChild(detail);
        root.appendChild(errorBox);
      }

      function startLeapApp() {
        try {
          if (!window.LeapApp || typeof window.LeapApp.init !== 'function') {
            throw new Error('Generated app runtime was not loaded.');
          }
          window.LeapApp.init();
        } catch (error) {
          showStartupError(error && error.message ? error.message : String(error));
        }
      }

      window.addEventListener('unhandledrejection', function(event) {
        var reason = event.reason;
        showStartupError(reason && reason.message ? reason.message : String(reason || 'Unhandled promise rejection'));
      });

      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        startLeapApp();
      } else {
        document.addEventListener('DOMContentLoaded', startLeapApp);
      }
    })();
  </script>
</body>
</html>`;
}

const DEFAULT_DESIGN_VIEWPORT = { width: 412, height: 915 };

function firstDefined(...values: any[]): any {
  for (const value of values) {
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function positiveNumber(value: any, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getDesignViewport(appState: any): { width: number; height: number } {
  const viewport = appState?.designViewport || {};
  const firstScreen = Array.isArray(appState?.screens) ? appState.screens[0] : null;
  const orientation = String(
    firstDefined(viewport.orientation, firstScreen?.screenOrientation, firstScreen?.ScreenOrientation, '')
  ).toLowerCase();
  const fallback = orientation === 'landscape'
    ? { width: DEFAULT_DESIGN_VIEWPORT.height, height: DEFAULT_DESIGN_VIEWPORT.width }
    : DEFAULT_DESIGN_VIEWPORT;
  return {
    width: positiveNumber(firstDefined(viewport.width, appState?.designWidth, firstScreen?.designWidth), fallback.width),
    height: positiveNumber(firstDefined(viewport.height, appState?.designHeight, firstScreen?.designHeight), fallback.height)
  };
}

function generateStylesCss(appState: any): string {
  const screens = Array.isArray(appState.screens) && appState.screens.length
    ? appState.screens
    : [{ id: 'Screen1', components: [], nonVisibleComponents: [] }];
  const designViewport = getDesignViewport(appState);

  let css = `/* Auto-generated by LeapLab AppInverter */
* { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  -webkit-text-size-adjust: 100%;
}

#app-root {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
}

.startup-loading,
.startup-error {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: #1f2937;
  font: 600 16px/1.4 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.startup-error {
  flex-direction: column;
  gap: 8px;
  background: #fff7ed;
  color: #9a3412;
  text-align: center;
}

.startup-error span {
  max-width: 520px;
  color: #7c2d12;
  font-size: 13px;
  font-weight: 500;
}

.screen {
  width: 100%;
  height: 100%;
  display: none;
  position: absolute;
  inset: 0;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  background: #0f172a;
}

.screen.active {
  display: flex;
}

.screen-viewport {
  width: ${designViewport.width}px;
  height: ${designViewport.height}px;
  flex: 0 0 auto;
  position: relative;
  overflow: hidden;
  background: #ffffff;
  transform-origin: center center;
  -webkit-font-smoothing: antialiased;
}

.screen-inner {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 8px 8px 52px 8px;
  gap: 5px;
}

.comp-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  outline: none;
  -webkit-appearance: none;
  touch-action: manipulation;
  user-select: none;
  font-family: sans-serif;
}

.comp-button:active {
  opacity: 0.75;
  transform: scale(0.97);
}

.comp-label { display: inline; }

.comp-textbox {
  display: block;
  border: 1px solid #ccc;
  outline: none;
  -webkit-appearance: none;
}

.comp-textbox:focus {
  border-color: #4285f4;
  box-shadow: 0 0 0 2px rgba(66,133,244,0.2);
}

.comp-image { display: block; object-fit: contain; }

.comp-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.comp-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  accent-color: #4285f4;
}

.comp-slider {
  display: block;
  width: 100%;
  -webkit-appearance: none;
  height: 6px;
  border-radius: 3px;
  background: #ddd;
  outline: none;
}

.comp-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #4285f4;
  cursor: pointer;
}

.comp-switch {
  display: flex;
  align-items: center;
  gap: 8px;
}

.comp-listview {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
}

.comp-listview-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.comp-listview-item:active { background: #e8f0fe; }

.comp-spinner {
  display: block;
  border: 1px solid #ccc;
  outline: none;
  -webkit-appearance: none;
  background: white;
  cursor: pointer;
}

.comp-datepicker, .comp-timepicker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1px solid #ccc;
  background: white;
}

.comp-webviewer { border: none; display: block; }
.comp-canvas { display: block; touch-action: none; }

.arrangement-horizontal { display: flex; flex-direction: row; flex-wrap: nowrap; }
.arrangement-vertical { display: flex; flex-direction: column; }
.arrangement-horizontal-scroll { display: flex; flex-direction: row; overflow-x: auto; flex-wrap: nowrap; }
.arrangement-vertical-scroll { display: flex; flex-direction: column; overflow-y: auto; }
.arrangement-table { display: grid; }
.arrangement-absolute { position: relative; }

.toast-notification {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 12px 24px;
  border-radius: 24px;
  font-size: 14px;
  z-index: 9999;
  animation: toast-in 0.3s ease, toast-out 0.3s ease 2.7s;
  pointer-events: none;
}

@keyframes toast-in {
  from { opacity: 0; transform: translateX(-50%) translateY(20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

@keyframes toast-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

.app-watermark {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  text-align: center;
  padding: 12px 0;
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
  border-top: 1px solid #f1f5f9;
  z-index: 100;
  user-select: none;
  pointer-events: none;
}
`;

  for (const screen of screens) {
    const bgColor = screen.backgroundColor || '#ffffff';
    const bgImage = screen.backgroundImage || screen.BackgroundImage || '';
    let screenCss = `${cssIdSelector('screen-' + screen.id)} .screen-viewport { background-color: ${bgColor};`;
    if (bgImage) screenCss += ` background-image: url(${mediaUrl(bgImage)}); background-size: 100% 100%;`;
    screenCss += ' }\n';
    css += screenCss;

    const allComponents = [...(screen.components || []), ...(screen.nonVisibleComponents || [])];
    walkComponentTree(allComponents, comp => {
      css += generateComponentCss(comp);
    });
  }

  return css;
}

function validateComponentIdentifiers(screens: any[]): void {
  const seen = new Set<string>();
  for (const screen of screens) {
    const all = [...(screen.components || []), ...(screen.nonVisibleComponents || [])];
    walkComponentTree(all, comp => {
      if (seen.has(comp.id)) {
        console.warn(`Duplicate component ID: ${comp.id}`);
      }
      seen.add(comp.id);
    });
  }
}

function generateComponentCreation(comp: any, parentVar: string, parentType?: string): string {
  const { id, type, props = {} } = comp;
  const tagMap: Record<string, string> = {
    Button: 'button', Label: 'span', TextBox: 'input', PasswordTextBox: 'input',
    Image: 'img', ListView: 'div', CheckBox: 'div', Switch: 'div', Slider: 'input',
    Spinner: 'select', DatePicker: 'button', TimePicker: 'button', Canvas: 'canvas',
    WebViewer: 'iframe', VideoPlayer: 'video', Map: 'div', Marker: 'div',
    ListPicker: 'button', ContactPicker: 'button', PhoneNumberPicker: 'button',
    EmailPicker: 'button', FilePicker: 'button', ImagePicker: 'button'
  };

  const tag = tagMap[type] || 'div';
  let js = `  // Create: ${id} (${type})\n`;
  js += `  var ${id}_el = document.createElement('${tag}');\n`;
  js += `  ${id}_el.id = 'comp-${id}';\n`;

  if (parentType === 'arrangement-table') {
    const col = props.Column || 0;
    const row = props.Row || 0;
    js += `  ${id}_el.style.gridColumn = '${Number(col) + 1}';\n`;
    js += `  ${id}_el.style.gridRow = '${Number(row) + 1}';\n`;
  }

  if (type === 'TextBox') {
    js += `  ${id}_el.type = 'text';\n`;
  } else if (type === 'PasswordTextBox') {
    js += `  ${id}_el.type = 'password';\n`;
  } else if (type === 'Slider') {
    js += `  ${id}_el.type = 'range';\n`;
    if (props.MinValue !== undefined) js += `  ${id}_el.min = '${props.MinValue}';\n`;
    if (props.MaxValue !== undefined) js += `  ${id}_el.max = '${props.MaxValue}';\n`;
    if (props.ThumbEnabled === false) js += `  ${id}_el.style.pointerEvents = 'none';\n`;
  } else if (type === 'Spinner') {
    if (props.ElementsFromString) {
      js += `  (${props.ElementsFromString || ''}).split(',').forEach(function(item) {\n`;
      js += `    var opt = document.createElement('option');\n`;
      js += `    opt.textContent = item.trim();\n`;
      js += `    ${id}_el.appendChild(opt);\n`;
      js += `  });\n`;
    } else if (props.Elements) {
      js += `  (${JSON.stringify(props.Elements)}).forEach(function(item) {\n`;
      js += `    var opt = document.createElement('option');\n`;
      js += `    opt.textContent = item;\n`;
      js += `    ${id}_el.appendChild(opt);\n`;
      js += `  });\n`;
    }
  } else if (type === 'Canvas') {
    js += `  ${id}_el.width = ${props.Width || 320};\n`;
    js += `  ${id}_el.height = ${props.Height || 320};\n`;
  } else if (type === 'Map') {
    js += `  ${id}_el.style.width = '${(props.Width || 320)}px';\n`;
    js += `  ${id}_el.style.height = '${(props.Height || 320)}px';\n`;
  } else if (type === 'ListView') {
    if (props.ElementsFromString) {
      js += `  (${JSON.stringify(props.ElementsFromString)}).split(',').forEach(function(item) {\n`;
      js += `    var itemDiv = document.createElement('div');\n`;
      js += `    itemDiv.className = 'comp-listview-item';\n`;
      js += `    itemDiv.textContent = item.trim();\n`;
      js += `    ${id}_el.appendChild(itemDiv);\n`;
      js += `  });\n`;
    } else if (props.Elements) {
      js += `  (${JSON.stringify(props.Elements)}).forEach(function(item) {\n`;
      js += `    var itemDiv = document.createElement('div');\n`;
      js += `    itemDiv.className = 'comp-listview-item';\n`;
      js += `    itemDiv.textContent = item;\n`;
      js += `    ${id}_el.appendChild(itemDiv);\n`;
      js += `  });\n`;
    }
  } else if (type === 'CheckBox') {
    js += `  var ${id}_cb = document.createElement('input');\n`;
    js += `  ${id}_cb.type = 'checkbox';\n`;
    js += `  ${id}_cb.id = 'comp-${id}-input';\n`;
    if (props.Checked) js += `  ${id}_cb.checked = true;\n`;
    js += `  var ${id}_label = document.createElement('span');\n`;
    js += `  ${id}_label.textContent = '${escapeHtml(props.Text || '')}';\n`;
    js += `  ${id}_el.appendChild(${id}_cb);\n`;
    js += `  ${id}_el.appendChild(${id}_label);\n`;
  } else if (type === 'Switch') {
    js += `  var ${id}_cb = document.createElement('input');\n`;
    js += `  ${id}_cb.type = 'checkbox';\n`;
    js += `  ${id}_cb.id = 'comp-${id}-input';\n`;
    if (props.Checked) js += `  ${id}_cb.checked = true;\n`;
    js += `  var ${id}_label = document.createElement('span');\n`;
    js += `  ${id}_label.textContent = '${escapeHtml(props.Text || '')}';\n`;
    js += `  ${id}_el.appendChild(${id}_cb);\n`;
    js += `  ${id}_el.appendChild(${id}_label);\n`;
  }

  if (type === 'Image' || type === 'ImagePicker' || type === 'FilePicker' || type === 'ContactPicker') {
    js += `  ${id}_el.alt = '${escapeHtml(props.Text || id)}';\n`;
  }

  if (type === 'WebViewer' && props.HomeUrl) {
    js += `  ${id}_el.src = '${escapeHtml(props.HomeUrl)}';\n`;
  }

  if (props.Hint && ['TextBox', 'PasswordTextBox'].includes(type)) {
    js += `  ${id}_el.placeholder = '${escapeHtml(props.Hint)}';\n`;
  }
  if (props.ReadOnly) {
    js += `  ${id}_el.readOnly = true;\n`;
  }
  if (props.Enabled === false && tag === 'button') {
    js += `  ${id}_el.disabled = true;\n`;
  }

  for (const child of (comp.children || [])) {
    js += generateComponentCreation(child, `${id}_el`, type);
  }

  const arrangementClass = getArrangementClass(props.Arrangement);
  if (arrangementClass) {
    js += `  ${id}_el.className = '${arrangementClass}';\n`;
  }

  js += `  ${parentVar}.appendChild(${id}_el);\n`;
  return js;
}

function getArrangementClass(arrangement: string): string {
  if (!arrangement) return '';
  const map: Record<string, string> = {
    'horizontal': 'arrangement-horizontal',
    'vertical': 'arrangement-vertical',
    'horizontal-scroll': 'arrangement-horizontal-scroll',
    'vertical-scroll': 'arrangement-vertical-scroll',
    'table': 'arrangement-table',
    'absolute': 'arrangement-absolute'
  };
  return map[arrangement.toLowerCase()] || '';
}

function generateComponentProxy(comp: any): string {
  const { id, type, props = {} } = comp;

  if (type === 'Clock') {
    return `  var ${id} = new ClockShim('${id}', ${JSON.stringify(props)});\n`;
  }
  if (type === 'TinyDB') {
    return `  var ${id} = new TinyDBShim('${id}', ${JSON.stringify(props)});\n`;
  }
  if (type === 'Notifier') {
    return `  var ${id} = new NotifierShim('${id}', ${JSON.stringify(props)});\n`;
  }
  if (type === 'Sound' || type === 'Player') {
    return `  var ${id} = new SoundShim('${id}', ${JSON.stringify(props)});\n`;
  }
  if (type === 'TextToSpeech') {
    return `  var ${id} = new TextToSpeechShim('${id}', ${JSON.stringify(props)});\n`;
  }
  if (type === 'LocationSensor') {
    return `  var ${id} = new LocationSensorShim('${id}', ${JSON.stringify(props)});\n`;
  }
  if (type === 'Web') {
    return `  var ${id} = new WebShim('${id}', ${JSON.stringify(props)});\n`;
  }
  if (type === 'Sharing') {
    return `  var ${id} = new SharingShim('${id}', ${JSON.stringify(props)});\n`;
  }
  if (type === 'File') {
    return `  var ${id} = new FileShim('${id}', ${JSON.stringify(props)});\n`;
  }
  if (type === 'BluetoothClient') {
    return `  var ${id} = new BluetoothClientShim('${id}', ${JSON.stringify(props)});\n`;
  }
  if (type === 'BluetoothServer') {
    return `  var ${id} = new BluetoothServerShim('${id}', ${JSON.stringify(props)});\n`;
  }
  if (type === 'Camera') {
    return `  var ${id} = new CameraShim('${id}', ${JSON.stringify(props)});\n`;
  }
  if (type === 'ImagePicker') {
    return `  var ${id} = new ImagePickerShim('${id}', ${JSON.stringify(props)});\n`;
  }
  if (type === 'SpeechRecognizer') {
    return `  var ${id} = new SpeechRecognizerShim('${id}', ${JSON.stringify(props)});\n`;
  }
  if (type === 'VideoPlayer') {
    return `  var ${id} = new VideoPlayerShim('${id}', ${JSON.stringify(props)});\n`;
  }
  if (type === 'WebViewer') {
    let js = `  // Proxy: ${id} (WebViewer)\n`;
    js += `  var ${id} = {\n`;
    js += `    get HomeUrl() { return getComponentValue('${id}', 'HomeUrl') || ''; },\n`;
    js += `    set HomeUrl(v) {\n`;
    js += `      setComponentProperty('${id}', 'HomeUrl', v);\n`;
    js += `      var el = document.getElementById('comp-${id}');\n`;
    js += `      if (el) el.src = v;\n`;
    js += `    },\n`;
    js += `    get CurrentUrl() {\n`;
    js += `      var el = document.getElementById('comp-${id}');\n`;
    js += `      return el ? el.src : '';\n`;
    js += `    },\n`;
    js += `    get RotationAngle() { return this._rotationAngle || 0; },\n`;
    js += `    set RotationAngle(v) {\n`;
    js += `      this._rotationAngle = Number(v) || 0;\n`;
    js += `      var el = document.getElementById('comp-${id}');\n`;
    js += `      if (el) el.style.transform = 'rotate(' + this._rotationAngle + 'deg)';\n`;
    js += `    },\n`;
    js += `    GoToUrl: function(url) {\n`;
    js += `      var el = document.getElementById('comp-${id}');\n`;
    js += `      if (el) el.src = url;\n`;
    js += `    },\n`;
    js += `    Reload: function() {\n`;
    js += `      var el = document.getElementById('comp-${id}');\n`;
    js += `      if (el) {\n`;
    js += `        var currentSrc = el.src;\n`;
    js += `        el.src = '';\n`;
    js += `        el.src = currentSrc;\n`;
    js += `      }\n`;
    js += `    },\n`;
    js += `    GoHome: function() {\n`;
    js += `      var el = document.getElementById('comp-${id}');\n`;
    js += `      if (el) el.src = this.HomeUrl || 'about:blank';\n`;
    js += `    }\n`;
    js += `  };\n\n`;
    return js;
  }

  if (type === 'Map') {
    let js = `  // Proxy: ${id} (Map)\n`;
    js += `  var ${id} = {\n`;
    js += `    get Latitude() { return getComponentValue('${id}', 'Latitude') || 0; },\n`;
    js += `    set Latitude(v) {\n`;
    js += `      setComponentProperty('${id}', 'Latitude', v);\n`;
    js += `      var el = document.getElementById('comp-${id}');\n`;
    js += `      if (el && el._leafletMap) {\n`;
    js += `        var force = (window._lastButtonClickTime && (Date.now() - window._lastButtonClickTime < 600));\n`;
    js += `        if (force) { el._userInteracting = false; }\n`;
    js += `        if (!el._userInteracting) {\n`;
    js += `          var currentCenter = el._leafletMap.getCenter();\n`;
    js += `          el._leafletMap.setView([Number(v) || 0, currentCenter.lng], el._leafletMap.getZoom());\n`;
    js += `        }\n`;
    js += `        el._leafletMap.invalidateSize();\n`;
    js += `      }\n`;
    js += `    },\n`;
    js += `    get Longitude() { return getComponentValue('${id}', 'Longitude') || 0; },\n`;
    js += `    set Longitude(v) {\n`;
    js += `      setComponentProperty('${id}', 'Longitude', v);\n`;
    js += `      var el = document.getElementById('comp-${id}');\n`;
    js += `      if (el && el._leafletMap) {\n`;
    js += `        var force = (window._lastButtonClickTime && (Date.now() - window._lastButtonClickTime < 600));\n`;
    js += `        if (force) { el._userInteracting = false; }\n`;
    js += `        if (!el._userInteracting) {\n`;
    js += `          var currentCenter = el._leafletMap.getCenter();\n`;
    js += `          el._leafletMap.setView([currentCenter.lat, Number(v) || 0], el._leafletMap.getZoom());\n`;
    js += `        }\n`;
    js += `        el._leafletMap.invalidateSize();\n`;
    js += `      }\n`;
    js += `    },\n`;
    js += `    get ZoomLevel() { return getComponentValue('${id}', 'ZoomLevel') || 13; },\n`;
    js += `    set ZoomLevel(v) {\n`;
    js += `      setComponentProperty('${id}', 'ZoomLevel', v);\n`;
    js += `      var el = document.getElementById('comp-${id}');\n`;
    js += `      if (el && el._leafletMap) {\n`;
    js += `        el._leafletMap.setZoom(Number(v) || 13);\n`;
    js += `        el._leafletMap.invalidateSize();\n`;
    js += `      }\n`;
    js += `    },\n`;
    js += `    PanTo: function(latitude, longitude, zoom) {\n`;
    js += `      this.Latitude = latitude;\n`;
    js += `      this.Longitude = longitude;\n`;
    js += `      if (zoom !== undefined) this.ZoomLevel = zoom;\n`;
    js += `    }\n`;
    js += `  };\n\n`;
    return js;
  }

  if (type === 'Marker') {
    let js = `  // Proxy: ${id} (Marker)\n`;
    js += `  var ${id} = {\n`;
    js += `    get Latitude() { return getComponentValue('${id}', 'Latitude') || 0; },\n`;
    js += `    set Latitude(v) {\n`;
    js += `      setComponentProperty('${id}', 'Latitude', v);\n`;
    js += `      var dummy = document.getElementById('comp-${id}');\n`;
    js += `      if (dummy && dummy._leafletMarker) {\n`;
    js += `        var latlng = dummy._leafletMarker.getLatLng();\n`;
    js += `        dummy._leafletMarker.setLatLng([Number(v) || 0, latlng.lng]);\n`;
    js += `      }\n`;
    js += `    },\n`;
    js += `    get Longitude() { return getComponentValue('${id}', 'Longitude') || 0; },\n`;
    js += `    set Longitude(v) {\n`;
    js += `      setComponentProperty('${id}', 'Longitude', v);\n`;
    js += `      var dummy = document.getElementById('comp-${id}');\n`;
    js += `      if (dummy && dummy._leafletMarker) {\n`;
    js += `        var latlng = dummy._leafletMarker.getLatLng();\n`;
    js += `        dummy._leafletMarker.setLatLng([latlng.lat, Number(v) || 0]);\n`;
    js += `      }\n`;
    js += `    },\n`;
    js += `    SetLocation: function(latitude, longitude) {\n`;
    js += `      this.Latitude = latitude;\n`;
    js += `      this.Longitude = longitude;\n`;
    js += `    }\n`;
    js += `  };\n\n`;
    return js;
  }

  if (type === 'Navigation') {
    let js = `  // Proxy: ${id} (Navigation)\n`;
    js += `  var ${id} = {\n`;
    js += `    StartLatitude: 0,\n`;
    js += `    StartLongitude: 0,\n`;
    js += `    EndLatitude: 0,\n`;
    js += `    EndLongitude: 0,\n`;
    js += `    RequestDirections: function() {\n`;
    js += `      var url = 'https://www.google.com/maps/dir/?api=1&origin=' + this.StartLatitude + ',' + this.StartLongitude + '&destination=' + this.EndLatitude + ',' + this.EndLongitude;\n`;
    js += `      var a = document.createElement('a');\n`;
    js += `      a.href = url;\n`;
    js += `      a.target = '_blank';\n`;
    js += `      a.click();\n`;
    js += `    }\n`;
    js += `  };\n\n`;
    return js;
  }

  const propNames = Object.keys(props);
  if (propNames.length === 0 && !['Button', 'Label', 'ListPicker', 'DatePicker', 'TimePicker', 'ImagePicker', 'FilePicker', 'ContactPicker', 'PhoneNumberPicker', 'EmailPicker', 'Spinner', 'CheckBox', 'Switch', 'Slider', 'ListView', 'TextBox', 'PasswordTextBox', 'Image', 'Canvas', 'WebViewer', 'VideoPlayer'].includes(type)) return '';

  const allProps = new Set([
    'Text', 'BackgroundColor', 'TextColor', 'Visible', 'Enabled',
    'Width', 'Height', 'FontSize', 'Hint', 'Picture', 'Checked',
    'AlignHorizontal', 'AlignVertical', 'FontBold', 'FontItalic', 'FontTypeface',
    'PaintColor', 'Radius', 'X', 'Y', 'Source', 'Points',
    'Selection', 'SelectionIndex', 'Elements', 'ElementsFromString',
    ...propNames
  ]);

  let js = `  // Proxy: ${id} (${type})\n`;
  js += `  var ${id} = {\n`;

  const eventNames = ['Click', 'GotFocus', 'LostFocus', 'TouchDown', 'TouchUp', 'LongClick'];
  for (const prop of allProps) {
    if (eventNames.indexOf(prop) !== -1) continue;
    js += `    get ${prop}() { return getComponentValue('${id}', '${prop}'); },\n`;
    js += `    set ${prop}(v) { setComponentProperty('${id}', '${prop}', v); },\n`;
  }

  if (['Button', 'Label', 'Image', 'ListView', 'CheckBox'].includes(type)) {
    js += `    Click: function() {},\n`;
  }

  js += `  };\n\n`;
  return js;
}

function generateAppJs(appState: any): string {
  const { blockLogic } = appState;
  const screens = Array.isArray(appState.screens) && appState.screens.length
    ? appState.screens
    : [{ id: 'Screen1', title: 'Screen1', components: [], nonVisibleComponents: [] }];
  const designViewport = getDesignViewport(appState);
  validateComponentIdentifiers(screens);
  const firstScreenId = screens[0]?.id || 'Screen1';
  let blockCode = '';

  if (blockLogic && !blockLogic.trim().startsWith('<')) {
    blockCode = blockLogic;
  }

  let js = `/* Auto-generated by LeapLab AppInverter */
(function() {
  'use strict';

  var state = {};
  var currentScreen = ${JSON.stringify(firstScreenId)};
  var components = {};
  var DESIGN_WIDTH = ${designViewport.width};
  var DESIGN_HEIGHT = ${designViewport.height};

  function showRuntimeError(message) {
    var root = document.getElementById('app-root');
    if (!root) return;
    root.innerHTML = '';
    var box = document.createElement('div');
    box.className = 'startup-error';
    var title = document.createElement('strong');
    title.textContent = 'App failed to render';
    var detail = document.createElement('span');
    detail.textContent = message || 'Unknown runtime error';
    box.appendChild(title);
    box.appendChild(detail);
    root.appendChild(box);
  }

  var NativeBridge = {
    showAlert: function(title, message) { alert(message); },
    showToast: function(message) {
      var toast = document.createElement('div');
      toast.className = 'toast-notification';
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(function() { toast.remove(); }, 3000);
    },
    showListPickerModal: function(elements, callback) {
      var overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;flex-direction:column;';
      var modal = document.createElement('div');
      modal.style.cssText = 'background:#fff;width:80%;max-width:400px;max-height:80%;margin:auto;border-radius:8px;overflow-y:auto;box-shadow:0 4px 6px rgba(0,0,0,0.1);';
      if (!elements || elements.length === 0) {
        var emptyMsg = document.createElement('div');
        emptyMsg.textContent = 'No elements to pick';
        emptyMsg.style.padding = '16px';
        modal.appendChild(emptyMsg);
      } else {
        elements.forEach(function(item, index) {
          var itemDiv = document.createElement('div');
          itemDiv.textContent = item;
          itemDiv.style.cssText = 'padding:16px;border-bottom:1px solid #eee;cursor:pointer;';
          itemDiv.addEventListener('click', function() {
            document.body.removeChild(overlay);
            callback(index, item);
          });
          modal.appendChild(itemDiv);
        });
      }
      var closeBtn = document.createElement('div');
      closeBtn.textContent = 'Cancel';
      closeBtn.style.cssText = 'padding:16px;text-align:center;color:#4285f4;font-weight:bold;cursor:pointer;';
      closeBtn.addEventListener('click', function() { document.body.removeChild(overlay); });
      modal.appendChild(closeBtn);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
    },
    vibrate: function(ms) { if (navigator.vibrate) navigator.vibrate(ms || 200); },
    openUrl: function(url) { window.open(url, '_blank'); },
    playSound: function(src) { try { new Audio(src).play(); } catch(e) {} },
    getStorageItem: function(key) { try { return localStorage.getItem('leapapp_' + key); } catch(e) { return null; } },
    setStorageItem: function(key, value) { try { localStorage.setItem('leapapp_' + key, value); } catch(e) {} }
  };

  var navigation = {
    navigate: function(screen) { navigateTo(screen); },
    goBack: function() { closeScreen(); }
  };
  var Alert = { alert: function(msg) { NativeBridge.showAlert('Alert', msg); } };
  var Vibration = { vibrate: function(ms) { NativeBridge.vibrate(ms); } };

  function ClockShim(id, props) {
    this.id = id;
    this._timerEnabled = props.TimerEnabled !== undefined ? !!props.TimerEnabled : true;
    this._timerInterval = props.TimerInterval !== undefined ? Number(props.TimerInterval) : 1000;
    this._timerId = null;
    this.updateTimer();
  }
  ClockShim.prototype = {
    get TimerEnabled() { return this._timerEnabled; },
    set TimerEnabled(v) { this._timerEnabled = !!v; this.updateTimer(); },
    get TimerInterval() { return this._timerInterval; },
    set TimerInterval(v) { this._timerInterval = Number(v); this.updateTimer(); },
    updateTimer: function() {
      if (this._timerId) clearInterval(this._timerId);
      if (this._timerEnabled && this._timerInterval > 0) {
        var self = this;
        this._timerId = setInterval(function() {
          if (typeof window[self.id + '_Timer'] === 'function') window[self.id + '_Timer']();
        }, this._timerInterval);
      }
    },
    Now: function() { return new Date(); },
    SystemTime: function() { return Date.now(); },
    MakeInstant: function(text) { return new Date(text); },
    MakeInstantFromMillis: function(m) { return new Date(Number(m)); },
    GetMillis: function(instant) { return (instant instanceof Date ? instant : new Date(instant)).getTime(); },
    AddDays: function(instant, days) { var d = new Date(instant); d.setDate(d.getDate() + Number(days)); return d; },
    AddHours: function(instant, hours) { var d = new Date(instant); d.setHours(d.getHours() + Number(hours)); return d; },
    AddMinutes: function(instant, minutes) { var d = new Date(instant); d.setMinutes(d.getMinutes() + Number(minutes)); return d; },
    AddSeconds: function(instant, seconds) { var d = new Date(instant); d.setSeconds(d.getSeconds() + Number(seconds)); return d; },
    AddWeeks: function(instant, weeks) { var d = new Date(instant); d.setDate(d.getDate() + (Number(weeks) * 7)); return d; },
    AddMonths: function(instant, months) { var d = new Date(instant); d.setMonth(d.getMonth() + Number(months)); return d; },
    AddYears: function(instant, years) { var d = new Date(instant); d.setFullYear(d.getFullYear() + Number(years)); return d; },
    Duration: function(start, end) { return Math.abs(new Date(end).getTime() - new Date(start).getTime()); },
    DurationToDays: function(dur) { return dur / (24 * 3600 * 1000); },
    DurationToHours: function(dur) { return dur / (3600 * 1000); },
    DurationToMinutes: function(dur) { return dur / (60 * 1000); },
    DurationToSeconds: function(dur) { return dur / 1000; },
    DurationToWeeks: function(dur) { return dur / (7 * 24 * 3600 * 1000); },
    FormatDate: function(inst, pattern) { return (inst instanceof Date ? inst : new Date(inst)).toLocaleDateString(); },
    FormatDateTime: function(inst, pattern) { return (inst instanceof Date ? inst : new Date(inst)).toLocaleString(); },
    FormatTime: function(inst) { return (inst instanceof Date ? inst : new Date(inst)).toLocaleTimeString(); }
  };

  function TinyDBShim(id, props) {
    this.id = id;
    this._namespace = props.Namespace || id;
  }
  TinyDBShim.prototype = {
    get Namespace() { return this._namespace; }, set Namespace(v) { this._namespace = v; },
    _getKey: function(tag) { return 'tinydb_' + this._namespace + '_' + tag; },
    StoreValue: function(tag, val) { try { localStorage.setItem(this._getKey(tag), JSON.stringify(val)); } catch(e) {} },
    GetValue: function(tag, fallback) { try { var v = localStorage.getItem(this._getKey(tag)); return v === null ? fallback : JSON.parse(v); } catch(e) { return fallback; } },
    ClearTag: function(tag) { try { localStorage.removeItem(this._getKey(tag)); } catch(e) {} },
    ClearAll: function() { try { var prefix = 'tinydb_' + this._namespace + '_'; var keys = []; for (var i = 0; i < localStorage.length; i++) { var key = localStorage.key(i); if (key.indexOf(prefix) === 0) keys.push(key); } keys.forEach(function(k) { localStorage.removeItem(k); }); } catch(e) {} },
    GetTags: function() { var tags = []; try { var prefix = 'tinydb_' + this._namespace + '_'; for (var i = 0; i < localStorage.length; i++) { var key = localStorage.key(i); if (key.indexOf(prefix) === 0) tags.push(key.substring(prefix.length)); } } catch(e) {} return tags; }
  };

  function NotifierShim(id) { this.id = id; }
  NotifierShim.prototype = {
    ShowAlert: function(notice) { NativeBridge.showToast(notice); },
    ShowMessageDialog: function(message, title, buttonText) { var sep = String.fromCharCode(10, 10); alert((title ? title + sep : '') + message); },
    ShowChooseDialog: function(message, title, button1, button2, cancelable) {
      var sep = String.fromCharCode(10, 10);
      var res = confirm((title ? title + sep : '') + message);
      var choice = res ? button1 : button2;
      var self = this;
      setTimeout(function() { if (typeof window[self.id + '_AfterChoosing'] === 'function') window[self.id + '_AfterChoosing'](choice); }, 50);
    },
    ShowTextDialog: function(message, title, cancelable) {
      var sep = String.fromCharCode(10, 10);
      var res = prompt((title ? title + sep : '') + message);
      var self = this;
      if (res !== null) { setTimeout(function() { if (typeof window[self.id + '_AfterTextInput'] === 'function') window[self.id + '_AfterTextInput'](res); }, 50); }
    }
  };

  function SoundShim(id, props) {
    this.id = id;
    var src = props.Source || props.source || '';
    this._source = (src && !src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('file:') && !src.startsWith('blob:')) ? 'media/' + src : src;
    this._volume = props.Volume !== undefined ? Number(props.Volume) : 1.0;
    this._isLooping = !!props.IsLooping;
    this._audio = null;
  }
  SoundShim.prototype = {
    get Source() { return this._source; }, set Source(v) { this._source = v; if (this._audio) this._audio.src = v; },
    get Volume() { return this._volume; }, set Volume(v) { this._volume = Number(v); if (this._audio) this._audio.volume = this._volume; },
    get IsLooping() { return this._isLooping; }, set IsLooping(v) { this._isLooping = !!v; if (this._audio) this._audio.loop = this._isLooping; },
    _initAudio: function() { if (!this._audio && this._source) { this._audio = new Audio(this._source); this._audio.volume = this._volume; this._audio.loop = this._isLooping; var self = this; this._audio.addEventListener('ended', function() { if (typeof window[self.id + '_Completed'] === 'function') window[self.id + '_Completed'](); }); } },
    Play: function() { this._initAudio(); if (this._audio) this._audio.play().catch(function(e){}); },
    Start: function() { this.Play(); },
    Pause: function() { if (this._audio) this._audio.pause(); },
    Stop: function() { if (this._audio) { this._audio.pause(); this._audio.currentTime = 0; } },
    Resume: function() { this.Play(); },
    Vibrate: function(ms) { NativeBridge.vibrate(ms); }
  };

  function TextToSpeechShim(id) {
    this.id = id;
    this._pitch = 1.0; this._speechRate = 1.0;
  }
  TextToSpeechShim.prototype = {
    get Pitch() { return this._pitch; }, set Pitch(v) { this._pitch = Number(v); },
    get SpeechRate() { return this._speechRate; }, set SpeechRate(v) { this._speechRate = Number(v); },
    Speak: function(message) {
      if (window.AndroidSpeech && typeof window.AndroidSpeech.speak === 'function') { window.AndroidSpeech.speak(message); return; }
      if (!window.speechSynthesis) return;
      var self = this;
      if (typeof window[self.id + '_BeforeSpeaking'] === 'function') window[self.id + '_BeforeSpeaking']();
      var utterance = new SpeechSynthesisUtterance(message);
      utterance.pitch = this._pitch; utterance.rate = this._speechRate;
      utterance.onend = function() { if (typeof window[self.id + '_AfterSpeaking'] === 'function') window[self.id + '_AfterSpeaking'](true); };
      utterance.onerror = function() { if (typeof window[self.id + '_AfterSpeaking'] === 'function') window[self.id + '_AfterSpeaking'](false); };
      window.speechSynthesis.speak(utterance);
    }
  };

  function CameraShim(id, props) { this.id = id; this._useFront = !!props.UseFront; }
  CameraShim.prototype = {
    get UseFront() { return this._useFront; }, set UseFront(v) { this._useFront = !!v; },
    TakePicture: function() {
      var self = this;
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        var constraints = { video: { facingMode: self._useFront ? 'user' : 'environment' } };
        navigator.mediaDevices.getUserMedia(constraints)
          .then(function(stream) {
            var video = document.createElement('video');
            video.setAttribute('autoplay', ''); video.setAttribute('playsinline', ''); video.setAttribute('muted', '');
            video.muted = true; video.srcObject = stream;
            video.play().catch(function(e) {});
            video.addEventListener('loadedmetadata', function() { video.play().catch(function(e) {}); });
            var overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;';
            video.style.cssText = 'max-width:100%;max-height:80%;object-fit:contain;';
            overlay.appendChild(video);
            var btnRow = document.createElement('div');
            btnRow.style.cssText = 'display:flex;gap:16px;margin-top:12px;';
            var captureBtn = document.createElement('button');
            captureBtn.textContent = 'Capture';
            captureBtn.style.cssText = 'padding:12px 32px;font-size:16px;border:none;border-radius:24px;background:#4CAF50;color:#fff;cursor:pointer;';
            var cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Cancel';
            cancelBtn.style.cssText = 'padding:12px 32px;font-size:16px;border:none;border-radius:24px;background:#EF4444;color:#fff;cursor:pointer;';
            btnRow.appendChild(captureBtn); btnRow.appendChild(cancelBtn);
            overlay.appendChild(btnRow);
            document.body.appendChild(overlay);
            function cleanup() { stream.getTracks().forEach(function(t) { t.stop(); }); if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
            captureBtn.addEventListener('click', function() {
              var canvas = document.createElement('canvas');
              canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480;
              var ctx = canvas.getContext('2d');
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              var dataUrl = canvas.toDataURL('image/jpeg', 0.85);
              cleanup();
              if (typeof window[self.id + '_AfterPicture'] === 'function') window[self.id + '_AfterPicture'](dataUrl);
            });
            cancelBtn.addEventListener('click', cleanup);
          })
          .catch(function() { self._takePictureViaFileInput(); });
      } else { self._takePictureViaFileInput(); }
    },
    _takePictureViaFileInput: function() {
      var self = this;
      var input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*';
      input.setAttribute('capture', self._useFront ? 'user' : 'environment');
      input.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) { if (typeof window[self.id + '_AfterPicture'] === 'function') window[self.id + '_AfterPicture'](ev.target.result); };
        reader.readAsDataURL(file);
      });
      input.click();
    }
  };

  function ImagePickerShim(id, props) { this.id = id; this._selection = ''; }
  ImagePickerShim.prototype = {
    get Selection() { return this._selection; }, set Selection(v) { this._selection = v; },
    Open: function() {
      var self = this;
      if (typeof window[self.id + '_BeforePicking'] === 'function') window[self.id + '_BeforePicking']();
      var input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*';
      input.addEventListener('change', function(e) {
        var file = e.target.files[0]; if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) { self._selection = ev.target.result; if (typeof window[self.id + '_AfterPicking'] === 'function') window[self.id + '_AfterPicking'](); };
        reader.readAsDataURL(file);
      });
      input.click();
    }
  };

  function SpeechRecognizerShim(id, props) {
    this.id = id; this._language = props.Language || ''; this._result = ''; this._recognition = null;
  }
  SpeechRecognizerShim.prototype = {
    get Language() { return this._language; }, set Language(v) { this._language = String(v || ''); },
    get Result() { return this._result; }, set Result(v) { this._result = v; },
    GetText: function() {
      var self = this;
      if (window.AndroidSpeech && typeof window.AndroidSpeech.startSpeechRecognition === 'function') { window.AndroidSpeech.startSpeechRecognition(self.id); return; }
      var SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionAPI) { var text = prompt('Speech recognition is not available in this browser. Enter text:'); if (text !== null && text !== '') { self._result = text; if (typeof window[self.id + '_AfterGettingText'] === 'function') window[self.id + '_AfterGettingText'](text, false); } return; }
      if (typeof window[self.id + '_BeforeGettingText'] === 'function') window[self.id + '_BeforeGettingText']();
      var recognition = new SpeechRecognitionAPI();
      recognition.continuous = false; recognition.interimResults = true;
      if (self._language) recognition.lang = self._language;
      self._recognition = recognition;
      recognition.onresult = function(event) {
        var transcript = ''; var isFinal = false;
        for (var i = event.resultIndex; i < event.results.length; i++) { transcript += event.results[i][0].transcript; if (event.results[i].isFinal) isFinal = true; }
        if (isFinal) { self._result = transcript; if (typeof window[self.id + '_AfterGettingText'] === 'function') window[self.id + '_AfterGettingText'](transcript, false); }
        else { if (typeof window[self.id + '_AfterGettingText'] === 'function') window[self.id + '_AfterGettingText'](transcript, true); }
      };
      recognition.onerror = function(event) {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') { var text = prompt('Microphone access denied. Enter text:'); if (text !== null && text !== '') { self._result = text; if (typeof window[self.id + '_AfterGettingText'] === 'function') window[self.id + '_AfterGettingText'](text, false); } }
      };
      recognition.start();
    },
    Stop: function() { if (this._recognition) { try { this._recognition.stop(); } catch(e) {} this._recognition = null; } }
  };

  function VideoPlayerShim(id, props) {
    this.id = id;
    var src = props.Source || props.source || '';
    this._source = (src && !src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('file:') && !src.startsWith('blob:')) ? 'media/' + src : src;
    this._volume = props.Volume !== undefined ? Number(props.Volume) : 50;
    this._fullScreen = !!props.FullScreen;
  }
  VideoPlayerShim.prototype = {
    _getEl: function() { return document.getElementById('comp-' + this.id); },
    get Source() { return this._source; }, set Source(v) { this._source = v; var el = this._getEl(); if (el) el.src = (v && !v.startsWith('http') && !v.startsWith('data:') && !v.startsWith('file:') && !v.startsWith('blob:')) ? 'media/' + v : v; },
    get Volume() { return this._volume; }, set Volume(v) { this._volume = Number(v); var el = this._getEl(); if (el) el.volume = Math.max(0, Math.min(1, this._volume / 100)); },
    get FullScreen() { return this._fullScreen; }, set FullScreen(v) { this._fullScreen = !!v; var el = this._getEl(); if (el && v && el.requestFullscreen) el.requestFullscreen(); },
    Start: function() { var el = this._getEl(); if (el) { el.volume = Math.max(0, Math.min(1, this._volume / 100)); el.play().catch(function(e){}); } },
    Pause: function() { var el = this._getEl(); if (el) el.pause(); },
    Stop: function() { var el = this._getEl(); if (el) { el.pause(); el.currentTime = 0; } },
    SeekTo: function(ms) { var el = this._getEl(); if (el) el.currentTime = Number(ms) / 1000; },
    GetDuration: function() { var el = this._getEl(); return el ? Math.round((el.duration || 0) * 1000) : 0; }
  };

  function LocationSensorShim(id, props) {
    this.id = id;
    this._enabled = props.Enabled !== undefined ? !!props.Enabled : true;
    this._latitude = 0; this._longitude = 0; this._altitude = 0; this._accuracy = 0;
    this._watchId = null;
    this.updateWatcher();
  }
  LocationSensorShim.prototype = {
    get Enabled() { return this._enabled; }, set Enabled(v) { this._enabled = !!v; this.updateWatcher(); },
    get Latitude() { return this._latitude; }, get Longitude() { return this._longitude; },
    get Altitude() { return this._altitude; }, get Accuracy() { return this._accuracy; },
    updateWatcher: function() {
      if (this._watchId) { navigator.geolocation.clearWatch(this._watchId); this._watchId = null; }
      if (this._enabled && navigator.geolocation) {
        var self = this;
        this._watchId = navigator.geolocation.watchPosition(function(pos) {
          self._latitude = pos.coords.latitude; self._longitude = pos.coords.longitude;
          self._altitude = pos.coords.altitude || 0; self._accuracy = pos.coords.accuracy || 0;
          if (typeof window[self.id + '_LocationChanged'] === 'function') window[self.id + '_LocationChanged'](self._latitude, self._longitude, self._altitude, pos.coords.speed || 0);
        }, function(err) {}, { enableHighAccuracy: true });
      }
    }
  };

  function WebShim(id, props) {
    this.id = id;
    var rawUrl = props.Url || props.url || '';
    this._url = typeof rawUrl === 'string' ? rawUrl.trim() : rawUrl;
    this._timeout = props.Timeout !== undefined ? Number(props.Timeout) : 0;
    this._saveResponse = !!props.SaveResponse;
    this._responseFileName = props.ResponseFileName || '';
    this._allowCookies = props.AllowCookies !== undefined ? !!props.AllowCookies : true;
    this._headers = {};
  }
  WebShim.prototype = {
    get Url() { return this._url; }, set Url(v) { this._url = typeof v === 'string' ? v.trim() : v; },
    get Timeout() { return this._timeout; }, set Timeout(v) { this._timeout = Number(v) || 0; },
    get SaveResponse() { return this._saveResponse; }, set SaveResponse(v) { this._saveResponse = !!v; },
    get ResponseFileName() { return this._responseFileName; }, set ResponseFileName(v) { this._responseFileName = String(v || ''); },
    get AllowCookies() { return this._allowCookies; }, set AllowCookies(v) { this._allowCookies = !!v; },
    get RequestHeaders() { var list = []; for (var k in this._headers) { if (this._headers.hasOwnProperty(k)) list.push([k, this._headers[k]]); } return list; },
    set RequestHeaders(list) {
      this._headers = {};
      if (Array.isArray(list)) { for (var i = 0; i < list.length; i++) { var pair = list[i]; if (Array.isArray(pair) && pair.length >= 2) { this._headers[String(pair[0])] = String(pair[1]); } } }
      else if (list && typeof list === 'object') { for (var k in list) { if (list.hasOwnProperty(k)) this._headers[k] = String(list[k]); } }
    },
    _emitGotText: function(url, status, responseType, content) { if (typeof window[this.id + '_GotText'] === 'function') window[this.id + '_GotText'](url, status, responseType || '', content || ''); },
    _emitTimedOut: function(url) { if (typeof window[this.id + '_TimedOut'] === 'function') window[this.id + '_TimedOut'](url || this._url); },
    _emitGotFile: function(url, status, responseType, fileName) { if (typeof window[this.id + '_GotFile'] === 'function') window[this.id + '_GotFile'](url, status, responseType || '', fileName || ''); },
    _request: function(method, body, contentType) {
      var self = this;
      var rawUrl = self._url;
      var requestUrl = typeof rawUrl === 'string' ? rawUrl.trim() : String(rawUrl || '');
      if (window.Android && typeof window.Android.performWebRequest === 'function') {
        setTimeout(function() {
          try {
            var headersCopy = {}; for (var k in self._headers) { if (self._headers.hasOwnProperty(k)) headersCopy[k] = self._headers[k]; }
            if (contentType) headersCopy['Content-Type'] = contentType;
            var headersJson = JSON.stringify(headersCopy);
            var result = window.Android.performWebRequest(requestUrl, method || 'GET', headersJson, body || '');
            var idx1 = result.indexOf('|'); var idx2 = result.indexOf('|', idx1 + 1);
            var status = Number(result.substring(0, idx1));
            var responseType = result.substring(idx1 + 1, idx2);
            var content = result.substring(idx2 + 1);
            if (self._saveResponse) { var fileName = self._responseFileName || ('response_' + Date.now()); self._emitGotFile(requestUrl, status, responseType, fileName); }
            else { self._emitGotText(requestUrl, status, responseType, content); }
          } catch(err) { self._emitGotText(requestUrl, 0, '', err && err.message ? err.message : String(err)); }
        }, 0);
        return;
      }
      var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var timeoutId = null;
      if (controller && self._timeout > 0) { timeoutId = setTimeout(function() { controller.abort(); }, self._timeout); }
      var isLocal = false;
      var hostMatch = requestUrl.match(/^(?:https?:\\/\\/)?([^:\\/\\s]+)/);
      if (hostMatch) { var host = hostMatch[1]; if (host === 'localhost' || host === '127.0.0.1' || /^192\\.168\\./.test(host) || /^10\\./.test(host) || /^172\\.(1[6-9]|2[0-9]|3[0-1])\\./.test(host)) isLocal = true; }
      if (isLocal) {
        var relayUrl = 'http://localhost:3001/relay';
        var relayHeaders = {};
        for (var k in self._headers) { if (self._headers.hasOwnProperty(k)) relayHeaders[k] = self._headers[k]; }
        if (contentType) relayHeaders['Content-Type'] = contentType;
        fetch(relayUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: requestUrl, method: method || 'GET', headers: relayHeaders, body: body || undefined }), signal: controller ? controller.signal : undefined })
          .then(function(res) { if (timeoutId) clearTimeout(timeoutId); return res.json(); })
          .then(function(data) { if (data.success) { var responseType = (data.headers && data.headers['content-type']) || 'text/plain'; self._emitGotText(requestUrl, data.status || 200, responseType, data.body || ''); } else { self._emitGotText(requestUrl, 0, '', data.error || 'Relay request failed'); } })
          .catch(function(err) { if (timeoutId) clearTimeout(timeoutId); if (err && err.name === 'AbortError') self._emitTimedOut(requestUrl); else self._emitGotText(requestUrl, 0, '', err && err.message ? err.message : String(err)); });
      } else {
        var options: any = { method: method || 'GET', body: body, headers: {} };
        if (contentType) options.headers['Content-Type'] = contentType;
        if (controller) options.signal = controller.signal;
        var finalUrl = requestUrl;
        if (requestUrl.indexOf('http://') === 0 || requestUrl.indexOf('https://') === 0) finalUrl = 'https://corsproxy.io/?' + encodeURIComponent(requestUrl);
        fetch(finalUrl, options)
          .then(function(res) {
            if (timeoutId) clearTimeout(timeoutId);
            var responseType = res.headers.get('content-type') || '';
            if (self._saveResponse) { return res.blob().then(function(blob) { var fileName = self._responseFileName || ('response_' + Date.now()); self._emitGotFile(requestUrl, res.status, responseType, fileName); }); }
            return res.text().then(function(text) { self._emitGotText(requestUrl, res.status, responseType, text); });
          })
          .catch(function(err) { if (timeoutId) clearTimeout(timeoutId); if (err && err.name === 'AbortError') self._emitTimedOut(requestUrl); else self._emitGotText(requestUrl, 0, '', err && err.message ? err.message : String(err)); });
      }
    },
    Get: function() { this._request('GET'); },
    PostText: function(text) { this._request('POST', text, 'text/plain'); },
    PostTextWithEncoding: function(text, encoding) { this._request('POST', text, 'text/plain; charset=' + (encoding || 'utf-8')); },
    PostFile: function(path) { this._emitGotText(this._url, 0, '', 'PostFile is not available in this runtime.'); },
    PutText: function(text) { this._request('PUT', text, 'text/plain'); },
    PutTextWithEncoding: function(text, encoding) { this._request('PUT', text, 'text/plain; charset=' + (encoding || 'utf-8')); },
    PutFile: function(path) { this._emitGotText(this._url, 0, '', 'PutFile is not available in this runtime.'); },
    PatchText: function(text) { this._request('PATCH', text, 'text/plain'); },
    PatchTextWithEncoding: function(text, encoding) { this._request('PATCH', text, 'text/plain; charset=' + (encoding || 'utf-8')); },
    PatchFile: function(path) { this._emitGotText(this._url, 0, '', 'PatchFile is not available in this runtime.'); },
    Delete: function() { this._request('DELETE'); },
    ClearCookies: function() {},
    BuildRequestData: function(list) { if (!Array.isArray(list)) return ''; return list.map(function(pair) { var k = encodeURIComponent(String(pair[0] || '')); var v = encodeURIComponent(String(pair[1] || '')); return k + '=' + v; }).join('&'); },
    JsonTextDecode: function(jsonText) { return JSON.parse(jsonText); },
    JsonTextDecodeWithDictionaries: function(jsonText) { return JSON.parse(jsonText); },
    JsonObjectEncode: function(obj) { return JSON.stringify(obj); },
    HtmlTextDecode: function(htmlText) { var textarea = document.createElement('textarea'); textarea.innerHTML = String(htmlText || ''); return textarea.value; },
    UriEncode: function(text) { return encodeURIComponent(String(text || '')); },
    UriDecode: function(text) { try { return decodeURIComponent(String(text || '')); } catch (e) { return String(text || ''); } }
  };

  function SharingShim(id, props) { this.id = id; }
  SharingShim.prototype = {
    ShareMessage: function(message) { if (navigator.share) navigator.share({ text: message }).catch(function(e) {}); else alert('Sharing message: ' + message); },
    ShareFile: function(file) { alert('Sharing file: ' + file); },
    ShareFileWithMessage: function(file, message) { alert('Sharing file: ' + file + ' with message: ' + message); }
  };

  function FileShim(id, props) { this.id = id; }
  FileShim.prototype = {
    SaveFile: function(text, fileName) { localStorage.setItem(fileName, text); var self = this; setTimeout(function() { if (typeof window[self.id + '_AfterFileSaved'] === 'function') window[self.id + '_AfterFileSaved'](fileName); }, 0); },
    ReadFrom: function(fileName) { var text = localStorage.getItem(fileName) || ''; var self = this; setTimeout(function() { if (typeof window[self.id + '_GotText'] === 'function') window[self.id + '_GotText'](text); }, 0); },
    AppendToFile: function(text, fileName) { var existing = localStorage.getItem(fileName) || ''; localStorage.setItem(fileName, existing + text); },
    Delete: function(fileName) { localStorage.removeItem(fileName); }
  };

  function extractMacAddress(address) {
    if (!address) return '';
    address = String(address).trim();
    if (address.includes('\\\\n')) { var parts = address.split('\\\\n'); return parts[parts.length - 1].trim(); }
    if (address.includes(' ')) { var parts = address.split(' '); for (var i = parts.length - 1; i >= 0; i--) { var p = parts[i].trim(); if (p.includes(':') && p.length >= 12) return p; } }
    return address;
  }

  function BluetoothConnectionBaseShim(id, props) {
    this.id = id;
    this._enabled = props.Enabled !== undefined ? !!props.Enabled : true;
    this._isConnected = false;
    this._secure = props.Secure !== undefined ? !!props.Secure : false;
    this._delimiterByte = props.DelimiterByte !== undefined ? Number(props.DelimiterByte) : 10;
    this._characterEncoding = props.CharacterEncoding || 'utf-8';
    this._highByteFirst = props.HighByteFirst !== undefined ? !!props.HighByteFirst : false;
    this._buffer = [];
  }
  BluetoothConnectionBaseShim.prototype = {
    _emitError: function(functionName, message) { if (typeof window[this.id + '_BluetoothError'] === 'function') window[this.id + '_BluetoothError'](functionName, message); else alert('Bluetooth Error in ' + functionName + ': ' + message); },
    _syncBuffer: function() { if (window.Android && typeof window.Android.receiveText === 'function') { try { var nativeText = window.Android.receiveText(); if (nativeText) { for (var i = 0; i < nativeText.length; i++) this._buffer.push(nativeText.charAt(i)); } } catch(e) {} } },
    get Enabled() { return this._enabled; }, set Enabled(v) { this._enabled = !!v; },
    get IsConnected() { if (window.Android && typeof window.Android.isConnected === 'function') { try { return window.Android.isConnected(); } catch(e) {} } return this._isConnected; },
    set IsConnected(v) { this._isConnected = !!v; },
    get Available() { return (typeof navigator !== 'undefined' && !!navigator.bluetooth) || !!window.Android; },
    get Secure() { return this._secure; }, set Secure(v) { this._secure = !!v; },
    get DelimiterByte() { return this._delimiterByte; }, set DelimiterByte(v) { this._delimiterByte = Number(v) || 0; },
    get CharacterEncoding() { return this._characterEncoding; }, set CharacterEncoding(v) { this._characterEncoding = String(v || 'utf-8'); },
    get HighByteFirst() { return this._highByteFirst; }, set HighByteFirst(v) { this._highByteFirst = !!v; },
    Disconnect: function() { if (window.Android && typeof window.Android.disconnect === 'function') { try { window.Android.disconnect(); } catch(e) {} } this._isConnected = false; this._buffer = []; },
    BytesAvailableToReceive: function() { this._syncBuffer(); return this._buffer.length; },
    ReceiveText: function(numberOfBytes) {
      this._syncBuffer();
      var count = Number(numberOfBytes);
      if (count < 0) { var delimChar = String.fromCharCode(this._delimiterByte); var idx = this._buffer.indexOf(delimChar); if (idx !== -1) { var chunk = this._buffer.splice(0, idx + 1); return chunk.join(''); } return ''; }
      if (count === 0) { var result = this._buffer.join(''); this._buffer = []; return result; }
      var chunk = this._buffer.splice(0, count); return chunk.join('');
    },
    SendText: function(text) {
      if (window.Android && typeof window.Android.sendText === 'function') { try { return window.Android.sendText(String(text || '')); } catch(e) { return false; } }
      else if (navigator.bluetooth && this._isConnected) { } return false;
    },
    SendByte: function(number) { return this.SendBytes(String.fromCharCode(number)); },
    SendBytes: function(list) { if (window.Android && typeof window.Android.sendBytes === 'function') { try { var listStr = (Array.isArray(list) ? list.join(',') : String(list)); return window.Android.sendBytes(listStr); } catch(e) { return ''; } } return ''; },
    ReceiveSignedBytes: function(numberOfBytes) { return this.ReceiveText(numberOfBytes); },
    ReceiveUnsignedBytes: function(numberOfBytes) { return this.ReceiveText(numberOfBytes); },
    SendByteSigned: function(number) { return this.SendByte(number); },
    SendByteUnsigned: function(number) { return this.SendByte(number); }
  };

  function BluetoothClientShim(id, props) { BluetoothConnectionBaseShim.call(this, id, props); }
  BluetoothClientShim.prototype = Object.create(BluetoothConnectionBaseShim.prototype);
  BluetoothClientShim.prototype.constructor = BluetoothClientShim;
  BluetoothClientShim.prototype.Connect = function(address) {
    var mac = extractMacAddress(address);
    if (window.Android && typeof window.Android.connect === 'function') {
      var self = this;
      setTimeout(function() {
        try { var nativeResult = window.Android.connect(mac); self._isConnected = (nativeResult === 'SUCCESS'); if (self._isConnected && typeof window[self.id + '_Connected'] === 'function') window[self.id + '_Connected'](); else self._emitError('Connect', nativeResult); } catch(e) { self._emitError('Connect', e && e.message || String(e)); }
      }, 0);
    } else { this._isConnected = true; if (typeof window[this.id + '_Connected'] === 'function') window[this.id + '_Connected'](); }
  };
  BluetoothClientShim.prototype.IsDevicePaired = function(address) { var mac = extractMacAddress(address); if (window.Android && typeof window.Android.isDevicePaired === 'function') { try { return window.Android.isDevicePaired(mac); } catch(e) { return false; } } return false; };

  function BluetoothServerShim(id, props) { BluetoothConnectionBaseShim.call(this, id, props); }
  BluetoothServerShim.prototype = Object.create(BluetoothConnectionBaseShim.prototype);
  BluetoothServerShim.prototype.constructor = BluetoothServerShim;
  BluetoothServerShim.prototype.StartAccept = function() { if (typeof window[this.id + '_ConnectionAccepted'] === 'function') window[this.id + '_ConnectionAccepted'](); };
  BluetoothServerShim.prototype.StopAccepting = function() {};
  BluetoothServerShim.prototype.AcceptConnection = function() {};
  BluetoothServerShim.prototype.IsAccepting = function() { return false; };

  var ScreenClasses = {};

  function getComponentValue(id, prop) { try { return (state[id] || {})[prop]; } catch(e) { return undefined; } }
  function setComponentProperty(id, prop, value) { try { if (!state[id]) state[id] = {}; state[id][prop] = value; applyComponentProperty(id, prop, value); } catch(e) {} }
  function applyComponentProperty(id, prop, value) {
    var el = document.getElementById('comp-' + id);
    if (!el) return;
    if (prop === 'Text' && el.tagName !== 'INPUT' && el.tagName !== 'SELECT') { el.textContent = String(value || ''); }
    else if (prop === 'BackgroundColor') el.style.backgroundColor = value || '';
    else if (prop === 'TextColor') el.style.color = value || '';
    else if (prop === 'Visible') el.style.display = value ? '' : 'none';
    else if (prop === 'Enabled') { if (el.tagName === 'BUTTON') el.disabled = !value; }
    else if (prop === 'Width') el.style.width = typeof value === 'number' ? value + 'px' : value;
    else if (prop === 'Height') el.style.height = typeof value === 'number' ? value + 'px' : value;
    else if (prop === 'FontSize') el.style.fontSize = typeof value === 'number' ? value + 'px' : value;
    else if (prop === 'FontBold') el.style.fontWeight = value ? 'bold' : '';
    else if (prop === 'FontItalic') el.style.fontStyle = value ? 'italic' : '';
    else if (prop === 'Picture' || prop === 'Image') { if (el.tagName === 'IMG') { el.src = value || ''; } else { el.style.backgroundImage = value ? 'url(' + value + ')' : ''; el.style.backgroundSize = '100% 100%'; } }
    else if (prop === 'Hint') { if (el.placeholder !== undefined) el.placeholder = String(value || ''); }
    else if (prop === 'Checked') { var cb = document.getElementById('comp-' + id + '-input'); if (cb) cb.checked = !!value; }
    else if (prop === 'Radius') el.style.borderRadius = value + 'px';
  }

  function resizeScreens() {
    var root = document.getElementById('app-root');
    if (!root) return;
    var availableW = root.clientWidth;
    var availableH = root.clientHeight;
    if (!availableW || !availableH) return;
    var scaleX = availableW / DESIGN_WIDTH;
    var scaleY = availableH / DESIGN_HEIGHT;
    var scale = Math.min(scaleX, scaleY);
    var screens = document.querySelectorAll('.screen-viewport');
    for (var i = 0; i < screens.length; i++) {
      screens[i].style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
      screens[i].style.left = '50%';
      screens[i].style.top = '50%';
      screens[i].style.position = 'absolute';
    }
  }

  function navigateTo(screenId) {
    var allScreens = document.querySelectorAll('.screen');
    for (var i = 0; i < allScreens.length; i++) allScreens[i].classList.remove('active');
    var target = document.getElementById('screen-' + screenId);
    if (target) target.classList.add('active');
    currentScreen = screenId;
    if (typeof window['__ScreenChanged'] === 'function') window['__ScreenChanged'](screenId);
  }

  function closeScreen() {
    // Go back to first screen
    navigateTo(currentScreen);
  }

  window.addEventListener('resize', resizeScreens);
  window.addEventListener('orientationchange', function() { setTimeout(resizeScreens, 300); });

  // ── Screen generation ──────────────────
`;

  for (const screen of screens) {
    const screenId = screen.id || 'Screen1';
    const title = screen.title || screenId;
    js += `
  (function() {
    var screenEl = document.createElement('div');
    screenEl.id = 'screen-${screenId}';
    screenEl.className = 'screen';
    var viewport = document.createElement('div');
    viewport.className = 'screen-viewport';
    var inner = document.createElement('div');
    inner.className = 'screen-inner';
`;

    if (screen.backgroundColor && screen.backgroundColor !== '#ffffff') {
      js += `    viewport.style.backgroundColor = '${screen.backgroundColor}';\n`;
    }

    for (const comp of (screen.components || [])) {
      js += generateComponentCreation(comp, 'inner');
    }

    js += `    viewport.appendChild(inner);\n`;
    js += `    screenEl.appendChild(viewport);\n`;
    js += `    document.getElementById('app-root').appendChild(screenEl);\n`;
    js += `  })();\n\n`;
  }

  // ── Component proxies ──────────────────
  js += '\n  // ── Component Proxies ──\n';
  for (const screen of screens) {
    const allComponents = [...(screen.components || []), ...(screen.nonVisibleComponents || [])];
    walkComponentTree(allComponents, comp => {
      js += generateComponentProxy(comp);
    });
  }

  // ── Screen class definitions ──────────
  js += '\n  // ── Screen Classes ──\n';
  for (const screen of screens) {
    const screenName = screen.id || 'Screen1';
    js += `  ScreenClasses['${screenName}'] = function() {};\n`;
  }

  // ── Block code ────────────────────────
  if (blockCode) {
    js += `
  // ── User Block Logic ──
  ${blockCode}
`;
  }

  js += `
  // ── Init ──
  function init() {
    try {
      resizeScreens();
      navigateTo('${firstScreenId}');
    } catch (error) {
      showRuntimeError(error && error.message ? error.message : String(error));
    }
  }

  window.LeapApp = { init: init };
  setTimeout(resizeScreens, 50);
  setTimeout(resizeScreens, 300);
  })();
`;

  return js;
}

function generateWebApp(appState: any): Record<string, string> {
  return {
    'index.html': generateIndexHtml(appState),
    'styles.css': generateStylesCss(appState),
    'app.js': generateAppJs(appState)
  };
}

export {
  generateIndexHtml,
  generateStylesCss,
  generateAppJs,
  generateWebApp,
  generateComponentProxy
};
