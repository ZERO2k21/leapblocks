
function escapeHtml(text: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, (c) => map[c] || c);
}

function mediaUrl(path: string): string {
  if (!path) return '';
  if (typeof path !== 'string') return '';
  path = path.trim();
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) return path;

  let cleanName = path;
  if (cleanName.startsWith('file:')) {
    cleanName = cleanName.replace(/^file:\/\/\/?/i, '');
  }
  if (cleanName.includes('/') || cleanName.includes('\\')) {
    cleanName = cleanName.split(/[/\\]/).pop() || cleanName;
  }
  try {
    cleanName = decodeURIComponent(cleanName);
  } catch (_) {}

  if (cleanName.startsWith('media/')) return cleanName;
  return 'media/' + cleanName;
}

function cssIdSelector(id: string): string {
  if (typeof CSS !== 'undefined' && CSS.escape) {
    return '#' + CSS.escape(id);
  }
  return '#' + id.replace(/([!"#$%&'()*+,./:;<=>?@[\]^`{|}~ ])/g, '\\$1');
}

function walkComponentTree(components: any[], fn: (comp: any) => void): void {
  for (const comp of components) {
    fn(comp);
    if (comp.children?.length) walkComponentTree(comp.children, fn);
  }
}

function generateComponentCss(comp: any): string {
  const { id, type, props = {} } = comp;
  if (props.Visible === false) return '';
  let css = '';
  const selector = cssIdSelector('comp-' + id);
  const styles: Record<string, string> = {};

  console.log(`[CSS] ${id} (${type}) props:`, JSON.parse(JSON.stringify(props)));

  const LENGTH_AUTO = -1;
  const LENGTH_FILL = -2;

  if (props.Width !== undefined && props.Width !== null) {
    if (props.Width === LENGTH_FILL) styles.width = '100%';
    else if (props.Width === LENGTH_AUTO) styles.width = 'auto';
    else if (typeof props.Width === 'number' && props.Width > 0) styles.width = props.Width + 'px';
    else if (props.WidthPercent != null) styles.width = props.WidthPercent + '%';
    else if (props.Width !== 'auto' && props.Width !== 0) {
      styles.width = typeof props.Width === 'number' || /^\d+$/.test(props.Width) ? (props.Width + 'px') : props.Width;
    }
  }
  if (props.Height !== undefined && props.Height !== null) {
    if (props.Height === LENGTH_FILL) styles.height = '100%';
    else if (props.Height === LENGTH_AUTO) styles.height = 'auto';
    else if (typeof props.Height === 'number' && props.Height > 0) styles.height = props.Height + 'px';
    else if (props.HeightPercent != null) styles.height = props.HeightPercent + '%';
    else if (props.Height !== 'auto' && props.Height !== 0) {
      styles.height = typeof props.Height === 'number' || /^\d+$/.test(props.Height) ? (props.Height + 'px') : props.Height;
    }
  }
  if (props.BackgroundColor && props.BackgroundColor !== 'none') styles.backgroundColor = props.BackgroundColor;
  if (props.TextColor) styles.color = props.TextColor;
  if (props.FontSize) styles.fontSize = typeof props.FontSize === 'number' ? props.FontSize + 'px' : props.FontSize;
  if (props.FontBold) styles.fontWeight = 'bold';
  if (props.FontItalic) styles.fontStyle = 'italic';
  if (props.TextAlignment || type === "Label") {
    const ta = props.TextAlignment;
    styles.textAlign = ta === 2 || ta === 'center' || ta === 'Center' ? 'center' : ta === 3 || ta === 'right' || ta === 'Right' ? 'right' : 'center';
  }
  if (props.Image || props.Picture) {
    styles.backgroundImage = `url("${encodeURI(mediaUrl(props.Image || props.Picture))}")`;
    styles.backgroundSize = '100% 100%';
  }
  if (props.Radius !== undefined) styles.borderRadius = props.Radius + 'px';

  if (Object.keys(styles).length > 0) {
    css += `${selector} {\n`;
    for (const [prop, val] of Object.entries(styles)) {
      css += `  ${camelToKebab(prop)}: ${val};\n`;
    }
    css += '}\n';
    console.log(`[CSS-OUTPUT] ${id} generated CSS:\n${css}`);
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
  font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  -webkit-text-size-adjust: 100%;
  background: #ffffff;
}

#app-root {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #ffffff;
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
  background: #ffffff;
}

.screen.active {
  display: block;
}

.screen-viewport {
  width: 100%;
  height: 100%;
  flex: 1 1 auto;
  position: relative;
  overflow: hidden;
  background: #ffffff;
  -webkit-font-smoothing: antialiased;
}

.screen-inner {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding: 8px;
  gap: 5px;
  background: #ffffff;
}

.comp-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 8px 12px;
  background: #E0E0E0;
  color: #000000;
  border: 1px solid #BDBDBD;
  border-radius: 12px;
  font-size: 14px;
  font-weight: normal;
  font-family: sans-serif;
  cursor: pointer;
  outline: none;
  -webkit-appearance: none;
  touch-action: manipulation;
  user-select: none;
  text-align: center;
  white-space: nowrap;
}

.comp-button:active {
  opacity: 0.85;
  transform: scale(0.98);
}

.comp-label {
  display: block;
  color: #1f2937;
  padding: 2px 0;
  word-wrap: break-word;
}

.comp-textbox {
  display: block;
  width: 100%;
  min-height: 32px;
  padding: 6px 8px;
  border: 1px solid #cbd5e1;
  font-size: 14px;
  color: #1f2937;
  background: #FFFFFF;
  outline: none;
  -webkit-appearance: none;
  font-family: sans-serif;
}

.comp-textbox:focus {
  border-color: #4285f4;
}

.comp-image {
  display: block;
  max-width: 100%;
  height: auto;
  object-fit: cover;
}
.comp-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  color: #999;
  font-size: 24px;
}

.comp-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: var(--comp-fs, 14px);
  color: var(--comp-clr, #1f2937);
  padding: 2px 4px;
}

.comp-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.comp-slider {
  display: block;
  width: 100%;
  cursor: pointer;
}

.comp-switch {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--comp-fs, 14px);
  color: var(--comp-clr, #1f2937);
  padding: 2px 4px;
  cursor: pointer;
}

.comp-switch-track {
  width: 40px;
  height: 20px;
  border-radius: 10px;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.comp-switch-track.on { background-color: var(--track-on, #2563eb); }
.comp-switch-track.off { background-color: var(--track-off, #cbd5e1); }

.comp-switch-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ffffff;
  transition: transform 0.2s ease;
}

.comp-switch-track.on .comp-switch-thumb { transform: translateX(20px); }
.comp-switch-track.off .comp-switch-thumb { transform: translateX(2px); }

.comp-listview {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  border: 1px solid #cbd5e1;
  min-height: 100px;
}

.comp-listview-item {
  padding: 8px 12px;
  border-bottom: 1px solid #e2e8f0;
  font-size: var(--comp-fs, 14px);
  color: var(--comp-clr, #1f2937);
  cursor: pointer;
}

.comp-listview-item:last-child { border-bottom: none; }

.comp-spinner {
  display: block;
  width: 100%;
  min-height: 32px;
  padding: 6px 8px;
  border: 1px solid #cbd5e1;
  font-size: var(--comp-fs, 14px);
  outline: none;
  background: #ffffff;
  cursor: pointer;
  font-family: sans-serif;
}

.comp-datepicker, .comp-timepicker {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 36px;
  padding: 8px 12px;
  border: 1px solid #BDBDBD;
  border-radius: 12px;
  background: #E0E0E0;
  font-size: 14px;
  cursor: pointer;
  font-family: sans-serif;
}

.comp-webviewer { border: 1px solid #cbd5e1; display: block; min-height: 180px; }
.comp-canvas { display: block; touch-action: none; }
.comp-videoplayer { display: block; max-width: 100%; }
.comp-map { display: block; }

.arrangement-horizontal { display: flex; flex-direction: row; flex-wrap: nowrap; gap: 5px; align-items: stretch; min-height: 60px; padding: 4px; }
.arrangement-vertical { display: flex; flex-direction: column; gap: 5px; min-height: 60px; padding: 4px; }
.arrangement-horizontal-scroll { display: flex; flex-direction: row; overflow-x: auto; flex-wrap: nowrap; gap: 5px; min-height: 60px; padding: 4px; }
.arrangement-vertical-scroll { display: flex; flex-direction: column; overflow-y: auto; gap: 5px; min-height: 60px; padding: 4px; }
.arrangement-table { display: grid; gap: 5px; }
.arrangement-absolute { position: relative; min-height: 60px; padding: 4px; }

.toast-notification {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30,30,30,0.92);
  color: white;
  padding: 14px 28px;
  border-radius: 28px;
  font-size: 14px;
  font-weight: 500;
  z-index: 9999;
  animation: toast-in 0.3s ease, toast-out 0.3s ease 2.7s;
  pointer-events: none;
  box-shadow: 0 4px 16px rgba(0,0,0,0.25);
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
    if (bgImage) screenCss += ` background-image: url("${encodeURI(mediaUrl(bgImage))}"); background-size: 100% 100%;`;
    screenCss += ' }\n';
    css += screenCss;

    const allComponents = [...(screen.components || []), ...(screen.nonVisibleComponents || [])];
    walkComponentTree(allComponents, comp => {
      css += generateComponentCss(comp);
    });
  }

  console.log('[CSS-FINAL] Generated CSS length:', css.length);
  console.log('[CSS-FINAL] CSS preview (first 3000 chars):', css.substring(0, 3000));

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

  console.log(`[GENERATE] ${id} (${type}) parent=${parentVar} parentType=${parentType || 'none'}`);
  console.log(`[GENERATE] ${id} props:`, JSON.parse(JSON.stringify(props)));

  const tagMap: Record<string, string> = {
    Button: 'button', Label: 'span', TextBox: 'input', PasswordTextBox: 'input',
    Image: 'img', ListView: 'div', CheckBox: 'div', Switch: 'div', Slider: 'input',
    Spinner: 'select', DatePicker: 'button', TimePicker: 'button', Canvas: 'canvas',
    WebViewer: 'iframe', VideoPlayer: 'video', Map: 'div', Marker: 'div',
    ListPicker: 'button', ContactPicker: 'button', PhoneNumberPicker: 'button',
    EmailPicker: 'button', FilePicker: 'button', ImagePicker: 'button',
    HorizontalArrangement: 'div', HorizontalScrollArrangement: 'div',
    VerticalArrangement: 'div', VerticalScrollArrangement: 'div',
    TableArrangement: 'div'
  };

  const tag = (type === 'TextBox' && props.MultiLine) ? 'textarea' : (tagMap[type] || 'div');
  const compClassMap: Record<string, string> = {
    Button: 'comp-button', Label: 'comp-label', TextBox: 'comp-textbox',
    PasswordTextBox: 'comp-textbox', Image: 'comp-image', ListView: 'comp-listview',
    CheckBox: 'comp-checkbox', Switch: 'comp-switch', Slider: 'comp-slider',
    Spinner: 'comp-spinner', DatePicker: 'comp-datepicker', TimePicker: 'comp-timepicker',
    Canvas: 'comp-canvas', WebViewer: 'comp-webviewer', VideoPlayer: 'comp-videoplayer',
    Map: 'comp-map', ListPicker: 'comp-button', ContactPicker: 'comp-button',
    PhoneNumberPicker: 'comp-button', EmailPicker: 'comp-button',
    FilePicker: 'comp-button', ImagePicker: 'comp-button'
  };
  let js = `  // Create: ${id} (${type})\n`;
  js += `  var ${id}_el = document.createElement('${tag}');\n`;
  js += `  ${id}_el.id = 'comp-${id}';\n`;
  const cssClass = compClassMap[type];
  if (cssClass) {
    js += `  ${id}_el.className = '${cssClass}';\n`;
  }

  if (props.Width !== undefined && props.Width !== null && type !== 'Canvas') {
    const LENGTH_AUTO = -1;
    const LENGTH_FILL = -2;
    let w;
    if (props.Width === LENGTH_FILL) w = '100%';
    else if (props.Width === LENGTH_AUTO) w = 'auto';
    else if (typeof props.Width === 'number' && props.Width > 0) w = props.Width + 'px';
    else if (props.WidthPercent != null) w = props.WidthPercent + '%';
    console.log(`[WIDTH] ${id} raw=${JSON.stringify(props.Width)} computed=${w || 'none'}`);
    if (w) js += `  ${id}_el.style.width = '${w}';\n`;
  }
  if (props.Height !== undefined && props.Height !== null && type !== 'Canvas') {
    const LENGTH_AUTO = -1;
    const LENGTH_FILL = -2;
    let h;
    if (props.Height === LENGTH_FILL) h = '100%';
    else if (props.Height === LENGTH_AUTO) h = 'auto';
    else if (typeof props.Height === 'number' && props.Height > 0) h = props.Height + 'px';
    else if (props.HeightPercent != null) h = props.HeightPercent + '%';
    if (h) js += `  ${id}_el.style.height = '${h}';\n`;
  }
  if (props.Visible === false) {
    js += `  ${id}_el.style.display = 'none';\n`;
  }

  if (parentType === 'arrangement-table') {
    const col = props.Column || 0;
    const row = props.Row || 0;
    js += `  ${id}_el.style.gridColumn = '${Number(col) + 1}';\n`;
    js += `  ${id}_el.style.gridRow = '${Number(row) + 1}';\n`;
  }

  if (type === 'TextBox') {
    if (!props.MultiLine) {
      js += `  ${id}_el.type = 'text';\n`;
      if (props.NumbersOnly) {
        js += `  ${id}_el.inputMode = 'numeric';\n`;
        js += `  ${id}_el.pattern = '[0-9]*';\n`;
      }
    } else {
      js += `  ${id}_el.rows = 3;\n`;
    }
  } else if (type === 'PasswordTextBox') {
    js += `  ${id}_el.type = 'password';\n`;
  } else if (type === 'Slider') {
    js += `  ${id}_el.type = 'range';\n`;
    if (props.MinValue !== undefined) js += `  ${id}_el.min = '${props.MinValue}';\n`;
    if (props.MaxValue !== undefined) js += `  ${id}_el.max = '${props.MaxValue}';\n`;
    if (props.ThumbPosition !== undefined) js += `  ${id}_el.value = '${props.ThumbPosition}';\n`;
    if (props.ThumbEnabled === false) js += `  ${id}_el.style.pointerEvents = 'none';\n`;
    if (props.ColorLeft || props.ColorRight) {
      const cl = props.ColorLeft || '#FFC107';
      const cr = props.ColorRight || '#888888';
      js += `  ${id}_el.style.background = 'linear-gradient(to right, ${cl} 0%, ${cl} 50%, ${cr} 50%, ${cr} 100%)';\n`;
      js += `  ${id}_el.style.accentColor = '${cl}';\n`;
    }
  } else if (type === 'Spinner') {
    if (props.Prompt) {
      js += `  var ${id}_prompt = document.createElement('option');\n`;
      js += `  ${id}_prompt.textContent = '${escapeHtml(props.Prompt)}';\n`;
      js += `  ${id}_prompt.value = '';\n`;
      js += `  ${id}_prompt.selected = true;\n`;
      js += `  ${id}_prompt.disabled = true;\n`;
      js += `  ${id}_el.appendChild(${id}_prompt);\n`;
    }
    if (props.ElementsFromString) {
      js += `  (${JSON.stringify(props.ElementsFromString)}).split(',').forEach(function(item) {\n`;
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
    if (props.SelectionIndex !== undefined) {
      js += `  ${id}_el.selectedIndex = ${props.SelectionIndex};\n`;
    } else if (props.Selection) {
      js += `  for (var i = 0; i < ${id}_el.options.length; i++) { if (${id}_el.options[i].textContent === '${escapeHtml(props.Selection)}') { ${id}_el.selectedIndex = i; break; } }\n`;
    }
    js += `  ${id}_el.addEventListener('change', function() { state['${id}'] = state['${id}'] || {}; state['${id}']['Selection'] = this.value; if (typeof window['${id}_AfterPicking'] === 'function') window['${id}_AfterPicking'](); });\n`;
  } else if (type === 'Canvas') {
    js += `  ${id}_el.width = ${props.Width || 320};\n`;
    js += `  ${id}_el.height = ${props.Height || 320};\n`;
  } else if (type === 'Map') {
    js += `  ${id}_el.style.width = '${(props.Width || 320)}px';\n`;
    js += `  ${id}_el.style.height = '${(props.Height || 320)}px';\n`;
  } else if (type === 'ListView') {
    if (props.ShowFilterBar) {
      js += `  var ${id}_filter = document.createElement('input');\n`;
      js += `  ${id}_filter.type = 'text';\n`;
      js += `  ${id}_filter.placeholder = 'Search...';\n`;
      js += `  ${id}_filter.style.cssText = 'width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:4px;margin-bottom:4px;box-sizing:border-box;font-size:14px;';\n`;
      js += `  ${id}_filter.addEventListener('input', function() {\n`;
      js += `    var q = this.value.toLowerCase();\n`;
      js += `    var items = ${id}_el.querySelectorAll('.comp-listview-item');\n`;
      js += `    for (var i = 0; i < items.length; i++) { items[i].style.display = items[i].textContent.toLowerCase().indexOf(q) !== -1 ? '' : 'none'; }\n`;
      js += `  });\n`;
      js += `  ${id}_el.insertBefore(${id}_filter, ${id}_el.firstChild);\n`;
    }
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
    const isOn = props.On ? 'on' : 'off';
    js += `  var ${id}_track = document.createElement('div');\n`;
    js += `  ${id}_track.className = 'comp-switch-track ${isOn}';\n`;
    if (props.TrackColorActive) js += `  ${id}_track.style.setProperty('--track-on', '${props.TrackColorActive}');\n`;
    if (props.TrackColorInactive) js += `  ${id}_track.style.setProperty('--track-off', '${props.TrackColorInactive}');\n`;
    js += `  var ${id}_thumb = document.createElement('div');\n`;
    js += `  ${id}_thumb.className = 'comp-switch-thumb';\n`;
    if (props.ThumbColorActive || props.ThumbColorInactive) {
      js += `  ${id}_thumb.style.background = (this._state && this._state.on) ? '${props.ThumbColorActive || '#ffffff'}' : '${props.ThumbColorInactive || '#ffffff'}';\n`;
    }
    js += `  ${id}_track.appendChild(${id}_thumb);\n`;
    js += `  var ${id}_label = document.createElement('span');\n`;
    js += `  ${id}_label.textContent = '${escapeHtml(props.Text || '')}';\n`;
    js += `  ${id}_el.appendChild(${id}_track);\n`;
    js += `  ${id}_el.appendChild(${id}_label);\n`;
    js += `  ${id}_el._state = { on: ${props.On ? 'true' : 'false'} };\n`;
    js += `  ${id}_el.addEventListener('click', function() {\n`;
    js += `    this._state.on = !this._state.on;\n`;
    js += `    ${id}_track.className = 'comp-switch-track ' + (this._state.on ? 'on' : 'off');\n`;
    js += `    if (typeof window['${id}_Changed'] === 'function') window['${id}_Changed']();\n`;
    js += `  });\n`;
    if (props.Enabled === false) {
      js += `  ${id}_el.style.opacity = '0.5';\n`;
      js += `  ${id}_el.style.pointerEvents = 'none';\n`;
    }
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
  if (props.Enabled === false) {
    js += `  ${id}_el.disabled = true;\n`;
  }

  if (type === 'Image') {
    const imgBg = props.BackgroundColor || '#f0f0f0';
    if (props.Picture || props.Image) {
      const pic = String(props.Picture || props.Image);
      js += `  ${id}_el.src = '${escapeHtml(mediaUrl(pic))}';\n`;
      js += `  ${id}_el.onerror = function() { this.style.background='${imgBg}'; this.alt=''; };\n`;
    } else {
      js += `  ${id}_el.removeAttribute('src');\n`;
      js += `  ${id}_el.alt = '';\n`;
      js += `  ${id}_el.style.background = '${imgBg}';\n`;
    }
    if (props.ScalePictureToFit) {
      js += `  ${id}_el.style.objectFit = 'contain';\n`;
    }
    if (props.RotationAngle) {
      js += `  ${id}_el.style.transform = 'rotate(${props.RotationAngle}deg)';\n`;
    }
  }
  if (type === 'VideoPlayer' && (props.Source || props.source)) {
    const src = String(props.Source || props.source);
    js += `  ${id}_el.src = '${escapeHtml(mediaUrl(src))}';\n`;
  }

  if (type === 'Button' || type === 'ListPicker' || type === 'ContactPicker' ||
      type === 'PhoneNumberPicker' || type === 'EmailPicker' || type === 'FilePicker' ||
      type === 'ImagePicker' || type === 'DatePicker' || type === 'TimePicker') {
    const text = props.Text || props.ElementsFromString || '';
    js += `  ${id}_el.textContent = '${escapeHtml(text)}';\n`;
  }

  if (type === 'Label') {
    const text = props.Text || '';
    js += `  ${id}_el.textContent = '${escapeHtml(text)}';\n`;
    js += `  ${id}_el.style.display = 'inline';\n`;
    console.log(`[LABEL] ${id} Text="${text}" TextAlignment=${JSON.stringify(props.TextAlignment)} display=inline`);
  }

  if (props.FontSize) {
    const fs = typeof props.FontSize === 'number' ? props.FontSize + 'px' : props.FontSize;
    js += `  ${id}_el.style.fontSize = '${fs}';\n`;
    js += `  ${id}_el.style.setProperty('--comp-fs', '${fs}');\n`;
  }
  if (props.TextColor) {
    js += `  ${id}_el.style.color = '${props.TextColor}';\n`;
    js += `  ${id}_el.style.setProperty('--comp-clr', '${props.TextColor}');\n`;
  }
  if (props.BackgroundColor && props.BackgroundColor !== 'none') {
    js += `  ${id}_el.style.backgroundColor = '${props.BackgroundColor}';\n`;
  }
  if (props.FontBold) {
    js += `  ${id}_el.style.fontWeight = 'bold';\n`;
  }
  if (props.FontItalic) {
    js += `  ${id}_el.style.fontStyle = 'italic';\n`;
  }
  if (props.FontTypeface !== undefined && props.FontTypeface !== null && props.FontTypeface !== 0) {
    const typefaceMap: Record<number, string> = { 1: 'serif', 2: 'monospace', 3: 'cursive' };
    const tf = typefaceMap[Number(props.FontTypeface)];
    if (tf) js += `  ${id}_el.style.fontFamily = '${tf}';\n`;
  }
  if (props.TextAlignment || type === "Label") {
    const ta = props.TextAlignment;
    const align = ta === 2 || ta === 'center' || ta === 'Center' ? 'center' : ta === 3 || ta === 'right' || ta === 'Right' ? 'right' : 'center';
    console.log(`[TEXT-ALIGN] ${id} raw=${JSON.stringify(ta)} resolved=${align}`);
    js += `  ${id}_el.style.textAlign = '${align}';\n`;
    if (type === 'Button' || type === 'ListPicker' || type === 'ContactPicker' || type === 'PhoneNumberPicker' || type === 'EmailPicker' || type === 'FilePicker' || type === 'ImagePicker' || type === 'DatePicker' || type === 'TimePicker') {
      js += `  ${id}_el.style.justifyContent = ${align === 'center' ? "'center'" : align === 'right' ? "'flex-end'" : "'flex-start'"};\n`;
    }
  }
  if (props.Radius !== undefined) {
    js += `  ${id}_el.style.borderRadius = '${props.Radius}px';\n`;
  }
  if (props.Shape && ['Button', 'ListPicker', 'ContactPicker', 'PhoneNumberPicker', 'EmailPicker', 'FilePicker', 'ImagePicker', 'DatePicker', 'TimePicker'].includes(type)) {
    const shape = props.Shape;
    const br = shape === 'rounded' ? '9999px' : shape === 'rectangular' ? '0px' : shape === 'oval' ? '50%' : '12px';
    js += `  ${id}_el.style.borderRadius = '${br}';\n`;
  }
  if (props.Enabled === false) {
    js += `  ${id}_el.disabled = true;\n`;
  }
  if (type === 'CheckBox' && props.Text) {
    js += `  ${id}_el.querySelector('span').textContent = '${escapeHtml(props.Text)}';\n`;
  }

  const clickTypes = ['Button', 'ListPicker', 'ContactPicker', 'PhoneNumberPicker', 'EmailPicker', 'FilePicker', 'ImagePicker', 'DatePicker', 'TimePicker'];
  if (clickTypes.includes(type)) {
    js += `  ${id}_el.addEventListener('click', function() { if (typeof window['${id}_Click'] === 'function') window['${id}_Click'](); });\n`;
  }
  if (type === 'TextBox' || type === 'PasswordTextBox') {
    js += `  ${id}_el.addEventListener('input', function() { state['${id}'] = state['${id}'] || {}; state['${id}']['Text'] = this.value; if (typeof window['${id}_TextChanged'] === 'function') window['${id}_TextChanged'](); });\n`;
    if (props.Text) {
      js += `  ${id}_el.value = '${escapeHtml(String(props.Text))}';\n`;
      js += `  state['${id}'] = state['${id}'] || {}; state['${id}']['Text'] = '${escapeHtml(String(props.Text))}';\n`;
    }
  }
  if (type === 'CheckBox') {
    js += `  ${id}_el.querySelector('input').addEventListener('change', function() { if (typeof window['${id}_Changed'] === 'function') window['${id}_Changed'](); });\n`;
  }
  if (type === 'Slider') {
    js += `  ${id}_el.addEventListener('input', function() { if (typeof window['${id}_PositionChanged'] === 'function') window['${id}_PositionChanged'](Number(this.value)); });\n`;
  }
  if (type === 'ListView') {
    js += `  ${id}_el.addEventListener('click', function(e) { var item = e.target.closest('.comp-listview-item'); if (item) { if (typeof window['${id}_AfterPicking'] === 'function') window['${id}_AfterPicking'](); } });\n`;
  }

  for (const child of (comp.children || [])) {
    js += generateComponentCreation(child, `${id}_el`, type);
  }

  const typeArrangementMap: Record<string, string> = {
    'HorizontalArrangement': 'arrangement-horizontal',
    'HorizontalScrollArrangement': 'arrangement-horizontal-scroll',
    'VerticalArrangement': 'arrangement-vertical',
    'VerticalScrollArrangement': 'arrangement-vertical-scroll',
    'TableArrangement': 'arrangement-table',
  };
  let arrangementClass = typeArrangementMap[type] || '';
  if (!arrangementClass) {
    arrangementClass = getArrangementClass(props.Arrangement);
  }
  if (arrangementClass) {
    js += `  ${id}_el.classList.add('${arrangementClass}');\n`;
  }

  if (arrangementClass && arrangementClass.startsWith('arrangement-')) {
    const getAlign = (name: string) => {
      if (props[name] !== undefined) return props[name];
      const lower = name.toLowerCase();
      const found = Object.keys(props).find(k => k.toLowerCase() === lower);
      return found ? props[found] : undefined;
    };
    const hAlign = getAlign('AlignHorizontal');
    const vAlign = getAlign('AlignVertical');

    console.log(`[ARRANGEMENT] ${id} (${arrangementClass}) hAlign=${JSON.stringify(hAlign)} vAlign=${JSON.stringify(vAlign)}`);
    console.log(`[ARRANGEMENT] ${id} all prop keys:`, Object.keys(props));
    console.log(`[ARRANGEMENT] ${id} AlignHorizontal raw:`, props['AlignHorizontal'], 'AlignVertical raw:', props['AlignVertical']);
    console.log(`[ARRANGEMENT] ${id} alignHorizontal raw:`, props['alignHorizontal'], 'alignVertical raw:', props['alignVertical']);

    if (hAlign !== undefined || vAlign !== undefined) {
      js += `  ${id}_el.style.display = 'flex';\n`;
    }
    const arrangementMinHeight = arrangementClass === 'arrangement-table' ? '100px' : arrangementClass === 'arrangement-absolute' ? '80px' : '60px';
    if (props.Height !== undefined && props.Height !== null) {
      if (props.Height === -1) {
        js += `  ${id}_el.style.minHeight = '0';\n`;
      } else if (props.Height === -2) {
        js += `  ${id}_el.style.minHeight = '0';\n`;
      } else if (typeof props.Height === 'number' && props.Height > 0) {
        js += `  ${id}_el.style.minHeight = '${props.Height}px';\n`;
      }
    } else {
      js += `  ${id}_el.style.minHeight = '${arrangementMinHeight}';\n`;
    }
    if (arrangementClass === 'arrangement-horizontal' || arrangementClass === 'arrangement-horizontal-scroll') {
      const hCenter = hAlign === 2 || hAlign === 'Center' || hAlign === 'center';
      const hEnd = hAlign === 3 || hAlign === 'Right' || hAlign === 'right';
      js += `  ${id}_el.style.justifyContent = ${hCenter ? "'center'" : hEnd ? "'flex-end'" : "'flex-start'"};\n`;
      const vCenter = vAlign === 2 || vAlign === 'Center' || vAlign === 'center';
      const vEnd = vAlign === 3 || vAlign === 'Bottom' || vAlign === 'bottom';
      js += `  ${id}_el.style.alignItems = ${vCenter ? "'center'" : vEnd ? "'flex-end'" : "'flex-start'"};\n`;
    } else if (arrangementClass === 'arrangement-vertical' || arrangementClass === 'arrangement-vertical-scroll') {
      const hCenter2 = hAlign === 2 || hAlign === 'Center' || hAlign === 'center';
      const hEnd2 = hAlign === 3 || hAlign === 'Right' || hAlign === 'right';
      console.log(`[VERT-ARR] ${id} hAlign=${JSON.stringify(hAlign)} hCenter2=${hCenter2} hEnd2=${hEnd2}`);
      console.log(`[VERT-ARR] ${id} alignItems will be: ${hCenter2 ? "'center'" : hEnd2 ? "'flex-end'" : "'flex-start'"}`);
      js += `  ${id}_el.style.alignItems = ${hCenter2 ? "'center'" : hEnd2 ? "'flex-end'" : "'flex-start'"};\n`;
      const vCenter2 = vAlign === 2 || vAlign === 'Center' || vAlign === 'center';
      const vEnd2 = vAlign === 3 || vAlign === 'Bottom' || vAlign === 'bottom';
      js += `  ${id}_el.style.justifyContent = ${vCenter2 ? "'center'" : vEnd2 ? "'flex-end'" : "'flex-start'"};\n`;
    } else if (arrangementClass === 'arrangement-table') {
      const numCols = props.Columns || 2;
      const numRows = props.Rows || 2;
      js += `  ${id}_el.style.gridTemplateColumns = 'repeat(${Number(numCols)}, 1fr)';\n`;
      js += `  ${id}_el.style.gridTemplateRows = 'repeat(${Number(numRows)}, auto)';\n`;
    }
  }

  js += `  ${parentVar}.appendChild(${id}_el);\n`;
  console.log(`[GENERATE-END] ${id} (${type}) final JS:\n${js}`);
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
  const result = map[arrangement.toLowerCase()] || '';
  console.log(`[ARR-CLASS] arrangement="${arrangement}" resolved="${result}"`);
  return result;
}

function generateComponentProxy(comp: any): string {
  const { id, type, props = {} } = comp;

  console.log(`[PROXY] ${id} (${type}) props for proxy:`, JSON.parse(JSON.stringify(props)));

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
  var screenHistory = [];
  var components = {};
  var DESIGN_WIDTH = ${designViewport.width};
  var DESIGN_HEIGHT = ${designViewport.height};

  function formatMediaUrl(val) {
    if (!val) return '';
    var str = String(val).trim();
    if (str.indexOf('http://') === 0 || str.indexOf('https://') === 0 || str.indexOf('data:') === 0 || str.indexOf('blob:') === 0) return str;
    if (str.indexOf('file:') === 0) {
      str = str.replace(/^file:\\/\\/\\/?/i, '');
    }
    var parts = str.split(/[\\\\/]/);
    var filename = parts[parts.length - 1];
    try { filename = decodeURIComponent(filename); } catch(e) {}
    if (filename.indexOf('media/') === 0) return filename;
    return 'media/' + encodeURI(filename);
  }

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
    this._source = formatMediaUrl(src);
    this._volume = props.Volume !== undefined ? Number(props.Volume) : 1.0;
    this._isLooping = !!props.IsLooping;
    this._audio = null;
  }
  SoundShim.prototype = {
    get Source() { return this._source; }, set Source(v) { this._source = formatMediaUrl(v); if (this._audio) this._audio.src = this._source; },
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
      console.log('[LeapApp] TTS.Speak called — message:', JSON.stringify(message), 'type:', typeof message);
      if (message === undefined || message === null) { console.log('[LeapApp] TTS.Speak — message is', message); message = ''; }
      if (window.AndroidSpeech && typeof window.AndroidSpeech.speak === 'function') { window.AndroidSpeech.speak(message); return; }
      if (!window.speechSynthesis) { console.log('[LeapApp] TTS.Speak — speechSynthesis not available'); return; }
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
    this._source = formatMediaUrl(src);
    this._volume = props.Volume !== undefined ? Number(props.Volume) : 50;
    this._fullScreen = !!props.FullScreen;
    var el = this._getEl();
    if (el && this._source && !el.src) { el.src = this._source; }
  }
  VideoPlayerShim.prototype = {
    _getEl: function() { return document.getElementById('comp-' + this.id); },
    get Source() { return this._source; }, set Source(v) { this._source = formatMediaUrl(v); var el = this._getEl(); if (el) el.src = this._source; },
    get Volume() { return this._volume; }, set Volume(v) { this._volume = Number(v); var el = this._getEl(); if (el) el.volume = Math.max(0, Math.min(1, this._volume / 100)); },
    get FullScreen() { return this._fullScreen; }, set FullScreen(v) { this._fullScreen = !!v; var el = this._getEl(); if (el && v && el.requestFullscreen) el.requestFullscreen(); },
    Start: function() { var el = this._getEl(); if (el) { if (!el.src && this._source) el.src = this._source; el.volume = Math.max(0, Math.min(1, this._volume / 100)); el.play().catch(function(e){}); } },
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
        var options = { method: method || 'GET', body: body, headers: {} };
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

  function getComponentValue(id, prop) { try { var v = (state[id] || {})[prop]; if (v === undefined) { console.log('[LeapApp] getComponentValue("' + id + '", "' + prop + '") — state missing, state keys:', Object.keys(state)); } return v; } catch(e) { console.log('[LeapApp] getComponentValue error:', e); return undefined; } }
  function setComponentProperty(id, prop, value) {
    console.log('[LeapApp] setComponentProperty("' + id + '", "' + prop + '",', value, ')');
    try { if (!state[id]) state[id] = {}; state[id][prop] = value; applyComponentProperty(id, prop, value); } catch(e) {}
  }
  function applyComponentProperty(id, prop, value) {
    var el = document.getElementById('comp-' + id);
    console.log('[LeapApp] applyComponentProperty("' + id + '", "' + prop + '",', value, ') el exists:', !!el);
    if (!el) return;
    if (prop === 'Text') { if (el.tagName === 'INPUT' || el.tagName === 'SELECT') { el.value = String(value || ''); } else { el.textContent = String(value || ''); } }
    else if (prop === 'BackgroundColor') el.style.backgroundColor = value || '';
    else if (prop === 'TextColor') el.style.color = value || '';
    else if (prop === 'Visible') el.style.display = value ? '' : 'none';
    else if (prop === 'Enabled') { el.disabled = !value; el.style.opacity = value ? '1' : '0.5'; }
    else if (prop === 'FontTypeface') {
      var tfMap = { 1: 'serif', 2: 'monospace', 3: 'cursive' };
      el.style.fontFamily = tfMap[Number(value)] || '';
    }
    else if (prop === 'TextAlignment') {
      var a = value === 2 || value === 'center' || value === 'Center' ? 'center' : value === 3 || value === 'right' || value === 'Right' ? 'right' : 'left';
      console.log('[LeapApp] TextAlignment: raw=' + JSON.stringify(value) + ' resolved=' + a + ' tagName=' + el.tagName);
      el.style.textAlign = a;
      if (el.tagName === 'BUTTON') el.style.justifyContent = a === 'center' ? 'center' : a === 'right' ? 'flex-end' : 'flex-start';
    }
    else if (prop === 'NumbersOnly') { el.inputMode = value ? 'numeric' : 'text'; }
    else if (prop === 'ReadOnly') { el.readOnly = !!value; }
    else if (prop === 'Width') {
      console.log('[LeapApp] Width: raw=' + JSON.stringify(value) + ' computed=' + (typeof value === 'number' ? value + 'px' : value));
      el.style.width = typeof value === 'number' ? value + 'px' : value;
    }
    else if (prop === 'Height') el.style.height = typeof value === 'number' ? value + 'px' : value;
    else if (prop === 'FontSize') el.style.fontSize = typeof value === 'number' ? value + 'px' : value;
    else if (prop === 'FontBold') el.style.fontWeight = value ? 'bold' : '';
    else if (prop === 'FontItalic') el.style.fontStyle = value ? 'italic' : '';
    else if (prop === 'Picture' || prop === 'Image' || prop === 'Source') {
      var picValue = formatMediaUrl(value);
      if (el.tagName === 'IMG' || el.tagName === 'VIDEO' || el.tagName === 'AUDIO') { el.src = picValue; }
      else { el.style.backgroundImage = picValue ? 'url("' + encodeURI(picValue) + '")' : ''; el.style.backgroundSize = '100% 100%'; }
    }
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
    if (currentScreen && currentScreen !== screenId) {
      screenHistory.push(currentScreen);
    }
    currentScreen = screenId;
    if (typeof window['__ScreenChanged'] === 'function') window['__ScreenChanged'](screenId);
  }

  function closeScreen() {
    if (screenHistory.length > 0) {
      var prevScreen = screenHistory.pop();
      var allScreens = document.querySelectorAll('.screen');
      for (var i = 0; i < allScreens.length; i++) allScreens[i].classList.remove('active');
      var target = document.getElementById('screen-' + prevScreen);
      if (target) target.classList.add('active');
      currentScreen = prevScreen;
      if (typeof window['__ScreenChanged'] === 'function') window['__ScreenChanged'](prevScreen);
    }
  }

  window.addEventListener('resize', resizeScreens);
  window.addEventListener('orientationchange', function() { setTimeout(resizeScreens, 300); });

  // ── Screen generation ──────────────────
`;

  for (const screen of screens) {
    const screenId = screen.id || 'Screen1';
    const title = screen.title || screenId;

    console.log(`[SCREEN] ${screenId} alignHorizontal=${JSON.stringify(screen.alignHorizontal)} alignVertical=${JSON.stringify(screen.alignVertical)}`);
    console.log(`[SCREEN] ${screenId} all keys:`, Object.keys(screen));
    console.log(`[SCREEN] ${screenId} screens[0] =`, JSON.parse(JSON.stringify(screen)));

    js += `
  (function() {
    var screenEl = document.createElement('div');
    screenEl.id = 'screen-${screenId}';
    screenEl.className = 'screen';
    var viewport = document.createElement('div');
    viewport.className = 'screen-viewport';
    var inner = document.createElement('div');
    inner.className = 'screen-inner';
    inner.style.display = 'flex';
    inner.style.flexDirection = 'column';
`;

    const screenAlignH = screen.alignHorizontal;
    const screenAlignV = screen.alignVertical;

    console.log(`[SCREEN-ALIGN] ${screenId} screenAlignH=${JSON.stringify(screenAlignH)} screenAlignV=${JSON.stringify(screenAlignV)}`);
    console.log(`[SCREEN-ALIGN] ${screenId} hCenter=${screenAlignH === 'Center'} hEnd=${screenAlignH === 'Right'}`);

    if (screenAlignH !== undefined) {
      const hCenter = screenAlignH === 'Center' || screenAlignH === '2' || screenAlignH === 2;
      const hEnd = screenAlignH === 'Right' || screenAlignH === '3' || screenAlignH === 3;
      js += `    inner.style.alignItems = ${hCenter ? "'center'" : hEnd ? "'flex-end'" : "'flex-start'"};\n`;
    }
    if (screenAlignV !== undefined) {
      const vCenter = screenAlignV === 'Center' || screenAlignV === '2' || screenAlignV === 2;
      const vEnd = screenAlignV === 'Bottom' || screenAlignV === '3' || screenAlignV === 3;
      js += `    inner.style.justifyContent = ${vCenter ? "'center'" : vEnd ? "'flex-end'" : "'flex-start'"};\n`;
    }

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
      console.log('[LeapApp] init() called');
      console.log('[LeapApp] screens:', ${JSON.stringify(screens.map((s: any) => ({ id: s.id, alignHorizontal: s.alignHorizontal, alignVertical: s.alignVertical, components: (s.components || []).map((c: any) => ({ id: c.id, type: c.type, props: c.props })) })))});
      resizeScreens();
      navigateTo('${firstScreenId}');
      setTimeout(function() {
        if (typeof window['${firstScreenId}_Initialize'] === 'function') window['${firstScreenId}_Initialize']();
      }, 100);
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
  console.log('[WEBAPP] generateWebApp called with screens:', appState.screens?.map((s: any) => ({ id: s.id, alignHorizontal: s.alignHorizontal, alignVertical: s.alignVertical })));
  console.log('[WEBAPP] Full appState:', JSON.parse(JSON.stringify(appState)));

  // Summary log for debugging alignment
  console.log('='.repeat(80));
  console.log('=== ALIGNMENT DEBUG SUMMARY ===');
  console.log('='.repeat(80));
  for (const screen of (appState.screens || [])) {
    console.log(`SCREEN: ${screen.id} alignH=${JSON.stringify(screen.alignHorizontal)} alignV=${JSON.stringify(screen.alignVertical)}`);
    function logComp(comp: any, indent: string) {
      const p = comp.props || {};
      console.log(`${indent}${comp.id} (${comp.type}) Width=${JSON.stringify(p.Width)} TextAlignment=${JSON.stringify(p.TextAlignment)} AlignHorizontal=${JSON.stringify(p.AlignHorizontal)} AlignVertical=${JSON.stringify(p.AlignVertical)}`);
      if (comp.children) comp.children.forEach((c: any) => logComp(c, indent + '  '));
    }
    (screen.components || []).forEach((c: any) => logComp(c, '  '));
  }
  console.log('='.repeat(80));

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
