import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ElementPin } from '.';

@customElement('leap-battery-12v')
export class Battery12VElement extends LitElement {
  get pinInfo(): ElementPin[] {
    return [
      { name: 'POS', x: 19, y: 9, number: 1, signals: [] },
      { name: 'NEG', x: 79, y: 9, number: 2, signals: [] },
    ];
  }

  render() {
    return html`
      <svg
        width="100"
        height="85"
        viewBox="0 0 100 85"
        xmlns="http://www.w3.org/2000/svg"
        style="filter: drop-shadow(0 8px 16px rgba(0,0,0,0.5));"
      >
        <defs>
          <linearGradient id="battery-body-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#3f3f46;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#09090b;stop-opacity:1" />
          </linearGradient>
          
          <linearGradient id="terminal-pos-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#f87171;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#991b1b;stop-opacity:1" />
          </linearGradient>
        </defs>

        <!-- Battery Body -->
        <rect x="5" y="15" width="90" height="65" rx="6" fill="url(#battery-body-grad)" stroke="#000" stroke-width="1.5" />
        
        <!-- Top Cover Details -->
        <rect x="5" y="15" width="90" height="18" rx="3" fill="#18181b" stroke="#000" stroke-width="0.5" />
        <rect x="10" y="18" width="80" height="4" rx="1" fill="#000" opacity="0.3" />

        <!-- Terminals (Industrial Studs) -->
        <!-- Positive -->
        <g transform="translate(16, 6)">
          <rect x="0" y="0" width="20" height="20" rx="3" fill="url(#terminal-pos-grad)" stroke="#7f1d1d" stroke-width="0.5" />
          <circle cx="10" cy="10" r="7" fill="#fb7185" opacity="0.4" />
          <text x="10" y="36" font-family="'Inter', sans-serif" font-size="16" font-weight="900" fill="#f87171" text-anchor="middle" style="text-shadow: 0 0 5px rgba(248,113,113,0.5)">+</text>
        </g>

        <!-- Negative -->
        <g transform="translate(64, 6)">
          <rect x="0" y="0" width="20" height="20" rx="3" fill="#52525b" stroke="#27272a" stroke-width="0.5" />
          <circle cx="10" cy="10" r="7" fill="#94a3b8" opacity="0.2" />
          <text x="10" y="36" font-family="'Inter', sans-serif" font-size="16" font-weight="900" fill="#94a3b8" text-anchor="middle">-</text>
        </g>

        <!-- Premium Label -->
        <g transform="translate(20, 38)">
          <rect x="0" y="0" width="60" height="35" rx="3" fill="#020617" stroke="#1e293b" stroke-width="1" />
          <text x="30" y="18" font-family="'Inter', sans-serif" font-size="16" font-weight="900" fill="#f8fafc" text-anchor="middle" style="letter-spacing: 2px;">12V</text>
          <text x="30" y="28" font-family="monospace" font-size="7" font-weight="bold" fill="#3b82f6" text-anchor="middle">ULTRA-DENSE POWER</text>
        </g>
        
        <!-- Warning Markings -->
        <rect x="10" y="76" width="80" height="4" fill="#eab308" opacity="0.8" />
        <text x="50" y="79.5" font-family="sans-serif" font-size="3" font-weight="bold" fill="black" text-anchor="middle">DANGER - HIGH ENERGY - HANDLE WITH CARE</text>
      </svg>
    `;
  }
}
