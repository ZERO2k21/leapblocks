import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ElementPin } from '.';

@customElement('leap-battery-12v')
export class Battery12VElement extends LitElement {
  get pinInfo(): ElementPin[] {
    return [
      { name: 'POS', x: 21, y: 11, number: 1, signals: [] },
      { name: 'NEG', x: 79, y: 11, number: 2, signals: [] },
    ];
  }

  render() {
    return html`
      <svg
        width="100"
        height="85"
        viewBox="0 0 100 85"
        xmlns="http://www.w3.org/2000/svg"
        style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));"
      >
        <defs>
          <linearGradient id="battery-body-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#27272a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#09090b;stop-opacity:1" />
          </linearGradient>
          
          <linearGradient id="terminal-pos-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#ef4444;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#991b1b;stop-opacity:1" />
          </linearGradient>

          <filter id="battery-glow">
            <feGaussianBlur stdDeviation="1" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <!-- Battery Body -->
        <rect x="5" y="15" width="90" height="65" rx="4" fill="url(#battery-body-grad)" stroke="#000" stroke-width="1.5" />
        
        <!-- Top Cover -->
        <rect x="5" y="15" width="90" height="15" rx="2" fill="#18181b" stroke="#000" stroke-width="0.5" />
        <rect x="5" y="15" width="90" height="2" fill="rgba(255,255,255,0.05)" />

        <!-- Terminals (Spade type) -->
        <!-- Positive -->
        <g transform="translate(15, 5)">
          <rect x="0" y="0" width="12" height="12" rx="1" fill="url(#terminal-pos-grad)" />
          <rect x="3" y="2" width="6" height="2" fill="white" opacity="0.3" rx="0.5" />
          <text x="6" y="25" font-family="'Inter', sans-serif" font-size="12" font-weight="900" fill="#ef4444" text-anchor="middle" filter="url(#battery-glow)">+</text>
        </g>

        <!-- Negative -->
        <g transform="translate(73, 5)">
          <rect x="0" y="0" width="12" height="12" rx="1" fill="#3f3f46" />
          <rect x="3" y="2" width="6" height="2" fill="white" opacity="0.1" rx="0.5" />
          <text x="6" y="25" font-family="'Inter', sans-serif" font-size="12" font-weight="900" fill="#94a3b8" text-anchor="middle" filter="url(#battery-glow)">-</text>
        </g>

        <!-- Industrial Label -->
        <rect x="20" y="40" width="60" height="30" rx="2" fill="#111827" stroke="#374151" stroke-width="0.5" />
        <text x="50" y="55" font-family="'Inter', sans-serif" font-size="14" font-weight="900" fill="white" text-anchor="middle" style="letter-spacing: 1px;">12V</text>
        <text x="50" y="65" font-family="monospace" font-size="6" fill="#60a5fa" text-anchor="middle">7.2Ah / LEAD-ACID</text>
        
        <!-- Warning text -->
        <text x="50" y="76" font-family="sans-serif" font-size="4" fill="#ef4444" text-anchor="middle" opacity="0.6">CAUTION: DO NOT SHORT CIRCUIT</text>
      </svg>
    `;
  }
}
