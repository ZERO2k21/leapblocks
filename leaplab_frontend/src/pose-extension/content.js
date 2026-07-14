function injectPoseOverlay() {
  if (document.getElementById('poseblocks-iframe')) return;
  const iframe = document.createElement('iframe');
  iframe.id = 'poseblocks-iframe';
  iframe.src = chrome.runtime.getURL('pose-extension.html');
  iframe.style.cssText = `
    position: fixed; bottom: 20px; right: 20px;
    width: 380px; height: 500px;
    border: none; border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.35);
    z-index: 2147483647;
  `;
  document.body.appendChild(iframe);
}

injectPoseOverlay();
