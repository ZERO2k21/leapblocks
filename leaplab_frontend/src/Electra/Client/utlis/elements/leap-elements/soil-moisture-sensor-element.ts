/**
 * Soil Moisture Sensor Module
 * 4-pin: VCC · GND · DO (digital) · AO (analog)
 *
 * Simulation properties:
 *   value     — moisture level (0 … 100, 0 = dry, 100 = wet)
 *   threshold — DO goes LOW when moisture > threshold (0 … 100, default 50)
 *   ledPower  — power LED on (always true when VCC connected)
 *   ledDO     — DO LED on when DO is LOW (moisture detected)
 *
 * Voltage mapping:
 *   V_ao = VCC × moistureLevel / 100
 *   wet = low resistance = high voltage
 */
import { css, html, LitElement, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ElementPin } from '.';
import { analog, GND, VCC } from './pin';

@customElement('leap-soil-moisture-sensor')
export class SoilMoistureSensorElement extends LitElement {
  /** Simulated moisture level (0 = dry, 100 = wet) */
  @property({ type: Number }) value = 0;

  /** DO threshold: DO pin goes LOW when moisture > threshold */
  @property({ type: Number }) threshold = 50;

  /** Power LED state */
  @property({ type: Boolean }) ledPower = false;

  /** DO LED state (mirrors DO pin — ON when moisture detected) */
  @property({ type: Boolean }) ledDO = false;

  readonly pinInfo: ElementPin[] = [
    { name: 'VCC', x: 88,  y: 445, signals: [VCC()] },
    { name: 'GND', x: 108, y: 445, signals: [GND()] },
    { name: 'DO',  x: 128, y: 445, signals: [] },
    { name: 'AO',  x: 148, y: 445, signals: [analog(0)] },
  ];

  static get styles() {
    return css`
      :host { display: inline-block; }
      .wrap { position: relative; display: inline-block; line-height: 0; }
    `;
  }

  render() {
    const moisture  = Number(this.value) || 0;
    const threshold = Number(this.threshold) || 50;
    const doLow     = moisture > threshold;     // DO is active-LOW
    const voltage   = 5.0 * moisture / 100;
    const adcRaw    = Math.round((voltage / 5.0) * 1023);

    const showPower = this.ledPower;
    const showDO    = this.ledDO || doLow;

    // Moisture visual: wet height on probe prongs
    const probeWetY = 455 - (moisture / 100) * 210;

    return html`
      <div class="wrap">
        <svg
          width="120mm"
          height="120mm"
          version="1.1"
          viewBox="0 0 480 480"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <defs>
            <!-- Blue PCB Gradients -->
            <linearGradient id="bluePcbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0062d6" />
              <stop offset="50%" stop-color="#004fb4" />
              <stop offset="100%" stop-color="#003780" />
            </linearGradient>

            <!-- Green PCB Gradients -->
            <linearGradient id="greenPcbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#16a34a" />
              <stop offset="60%" stop-color="#15803d" />
              <stop offset="100%" stop-color="#0f5127" />
            </linearGradient>

            <!-- FR4 Gold/Yellow Base Gradient -->
            <linearGradient id="fr4Grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#b8860b" />
              <stop offset="30%" stop-color="#d4af37" />
              <stop offset="70%" stop-color="#e5be53" />
              <stop offset="100%" stop-color="#a67c00" />
            </linearGradient>

            <!-- Silver Metallic Pad Gradient -->
            <linearGradient id="silverPadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#94a3b8" />
              <stop offset="25%" stop-color="#cbd5e1" />
              <stop offset="50%" stop-color="#f8fafc" />
              <stop offset="75%" stop-color="#cbd5e1" />
              <stop offset="100%" stop-color="#64748b" />
            </linearGradient>

            <!-- Metal Dial Gradient -->
            <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#f1f5f9" />
              <stop offset="50%" stop-color="#94a3b8" />
              <stop offset="100%" stop-color="#475569" />
            </linearGradient>

            <!-- Wire Metallic Gradients -->
            <linearGradient id="greenWireGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#22c55e" />
              <stop offset="50%" stop-color="#10b981" />
              <stop offset="100%" stop-color="#047857" />
            </linearGradient>

            <linearGradient id="blueWireGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#3b82f6" />
              <stop offset="50%" stop-color="#1d4ed8" />
              <stop offset="100%" stop-color="#1e40af" />
            </linearGradient>

            <!-- LED Glow Filter -->
            <filter id="ledGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <!-- ============================================================ -->
          <!-- 1. CONNECTING JUMPER WIRES (Top Arched Loops)                -->
          <!-- ============================================================ -->
          <!-- Green Wire Loop (Outer Loop) -->
          <path
            d="M 111 156 C 85 -30, 240 -20, 308 132"
            fill="none"
            stroke="url(#greenWireGrad)"
            stroke-width="7"
            stroke-linecap="round"
          />
          <path
            d="M 111 156 C 85 -30, 240 -20, 308 132"
            fill="none"
            stroke="#4ade80"
            stroke-width="1.8"
            stroke-linecap="round"
            opacity="0.6"
          />

          <!-- Blue Wire Loop (Inner Loop) -->
          <path
            d="M 125 156 C 110 5, 255 15, 322 132"
            fill="none"
            stroke="url(#blueWireGrad)"
            stroke-width="7"
            stroke-linecap="round"
          />
          <path
            d="M 125 156 C 110 5, 255 15, 322 132"
            fill="none"
            stroke="#60a5fa"
            stroke-width="1.8"
            stroke-linecap="round"
            opacity="0.6"
          />

          <!-- Female Connector Boots at Wire Ends -->
          <!-- On Blue Board (Top) -->
          <rect x="105" y="142" width="12" height="18" rx="2" fill="#111827" stroke="#374151" stroke-width="1" />
          <rect x="119" y="142" width="12" height="18" rx="2" fill="#111827" stroke="#374151" stroke-width="1" />
          <!-- On Green Board (Top) -->
          <rect x="302" y="118" width="12" height="18" rx="2" fill="#111827" stroke="#374151" stroke-width="1" />
          <rect x="316" y="118" width="12" height="18" rx="2" fill="#111827" stroke="#374151" stroke-width="1" />

          <!-- ============================================================ -->
          <!-- 2. CONTROL MODULE BOARD (LEFT SIDE - BLUE PCB)               -->
          <!-- ============================================================ -->
          <!-- Main Blue Board Base -->
          <rect x="65" y="185" width="106" height="215" rx="6" fill="url(#bluePcbGrad)" stroke="#002d69" stroke-width="1.5" />
          <rect x="67" y="187" width="102" height="211" rx="4" fill="none" stroke="#60a5fa" stroke-width="0.7" opacity="0.3" />

          <!-- Corner Mounting Holes -->
          <g fill="#0f172a" stroke="#d4af37" stroke-width="1.2">
            <circle cx="74" cy="194" r="3.5" />
            <circle cx="162" cy="194" r="3.5" />
            <circle cx="74" cy="391" r="3.5" />
            <circle cx="162" cy="391" r="3.5" />
          </g>

          <!-- Top 2-Pin Male Connector Block on Blue Board -->
          <rect x="103" y="158" width="30" height="28" rx="2" fill="#1e293b" stroke="#0f172a" stroke-width="1" />
          <rect x="108" y="162" width="6" height="6" fill="#fbbf24" stroke="#78350f" stroke-width="0.5" />
          <rect x="122" y="162" width="6" height="6" fill="#fbbf24" stroke="#78350f" stroke-width="0.5" />

          <!-- LM393 IC Chip (8-pin SOIC) -->
          <g>
            <!-- IC Body -->
            <rect x="74" y="270" width="24" height="36" rx="2" fill="#1e1e24" stroke="#333" stroke-width="1" />
            <circle cx="79" cy="276" r="1.5" fill="#666" />
            <text x="86" y="291" fill="#94a3b8" font-family="sans-serif" font-size="5.5" font-weight="bold" transform="rotate(-90 86 291)" text-anchor="middle">LM393</text>
            <!-- IC Pin Leads -->
            <path d="M 70 276 h 4 M 70 284 h 4 M 70 292 h 4 M 70 300 h 4" stroke="#cbd5e1" stroke-width="1.8" stroke-linecap="round" />
            <path d="M 98 276 h 4 M 98 284 h 4 M 98 292 h 4 M 98 300 h 4" stroke="#cbd5e1" stroke-width="1.8" stroke-linecap="round" />
          </g>

          <!-- Blue Trimmer Potentiometer -->
          <g>
            <rect x="110" y="265" width="46" height="46" rx="3" fill="#0284c7" stroke="#0369a1" stroke-width="1.5" />
            <rect x="113" y="268" width="40" height="40" rx="2" fill="#0369a1" opacity="0.4" />
            <circle cx="133" cy="288" r="15" fill="url(#metalGrad)" stroke="#475569" stroke-width="1" />
            <circle cx="133" cy="288" r="11" fill="#cbd5e1" stroke="#64748b" stroke-width="0.8" />
            <line x1="124" y1="288" x2="142" y2="288" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" />
            <line x1="133" y1="279" x2="133" y2="297" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" />
          </g>

          <!-- SMD Resistors / Capacitors -->
          <g fill="#334155" stroke="#94a3b8" stroke-width="0.8">
            <rect x="76" y="215" width="12" height="7" rx="1" />
            <rect x="94" y="215" width="12" height="7" rx="1" />
            <rect x="112" y="215" width="12" height="7" rx="1" />
            <rect x="130" y="215" width="12" height="7" rx="1" />
            <rect x="76" y="235" width="12" height="7" rx="1" />
            <rect x="130" y="235" width="12" height="7" rx="1" />
          </g>

          <!-- Power LED (PWR-LED) -->
          <g>
            <rect x="142" y="336" width="16" height="10" rx="1.5" fill="#1e293b" stroke="#475569" stroke-width="1" />
            <rect x="145" y="338" width="10" height="6" rx="1" fill="${showPower ? '#4ade80' : '#166534'}" />
            ${showPower ? svg`
              <circle cx="150" cy="341" r="7" fill="#22c55e" filter="url(#ledGlow)" />
              <circle cx="150" cy="341" r="15" fill="#22c55e" opacity="0.35" />
            ` : ''}
            <text x="150" y="356" fill="#ffffff" font-family="sans-serif" font-size="5" font-weight="bold" text-anchor="middle">PWR-LED</text>
          </g>

          <!-- DO LED (DO-LED) -->
          <g>
            <rect x="76" y="336" width="16" height="10" rx="1.5" fill="#1e293b" stroke="#475569" stroke-width="1" />
            <rect x="79" y="338" width="10" height="6" rx="1" fill="${showDO ? '#f87171' : '#991b1b'}" />
            ${showDO ? svg`
              <circle cx="84" cy="341" r="7" fill="#ef4444" filter="url(#ledGlow)" />
              <circle cx="84" cy="341" r="15" fill="#ef4444" opacity="0.35" />
            ` : ''}
            <text x="84" y="356" fill="#ffffff" font-family="sans-serif" font-size="5" font-weight="bold" text-anchor="middle">DO-LED</text>
          </g>

          <!-- Silk Screen Pin Labels near Bottom -->
          <g fill="#ffffff" font-family="sans-serif" font-size="6.5" font-weight="bold" text-anchor="middle">
            <text x="88"  y="383">VCC</text>
            <text x="108" y="383">GND</text>
            <text x="128" y="383">DO</text>
            <text x="148" y="383">AO</text>
          </g>

          <!-- Bottom 4-Pin Header Block & Pins -->
          <rect x="78" y="388" width="79" height="16" rx="2" fill="#1e293b" stroke="#0f172a" stroke-width="1" />

          <!-- 4 Male Pins (VCC, GND, DO, AO) -->
          <g fill="url(#silverPadGrad)" stroke="#475569" stroke-width="0.8">
            <!-- VCC Pin (x=88) -->
            <rect x="85.5" y="404" width="5" height="42" rx="1" />
            <path d="M 85.5 442 L 88 448 L 90.5 442 Z" fill="#cbd5e1" />

            <!-- GND Pin (x=108) -->
            <rect x="105.5" y="404" width="5" height="42" rx="1" />
            <path d="M 105.5 442 L 108 448 L 110.5 442 Z" fill="#cbd5e1" />

            <!-- DO Pin (x=128) -->
            <rect x="125.5" y="404" width="5" height="42" rx="1" />
            <path d="M 125.5 442 L 128 448 L 130.5 442 Z" fill="#cbd5e1" />

            <!-- AO Pin (x=148) -->
            <rect x="145.5" y="404" width="5" height="42" rx="1" />
            <path d="M 145.5 442 L 148 448 L 150.5 442 Z" fill="#cbd5e1" />
          </g>

          <!-- ============================================================ -->
          <!-- 3. SOIL MOISTURE PROBE FORK (RIGHT SIDE)                    -->
          <!-- ============================================================ -->
          <g>
            <!-- Probe Yellow/Gold FR4 Base (Prongs + U-Cutout) -->
            <path
              d="M 250 220 
                 H 380 
                 V 445 A 14 14 0 0 1 366 459 
                 H 338 A 14 14 0 0 1 324 445 
                 V 235 A 10 10 0 0 0 314 225 
                 A 10 10 0 0 0 304 235
                 V 445 A 14 14 0 0 1 290 459 
                 H 264 A 14 14 0 0 1 250 445 
                 Z"
              fill="url(#fr4Grad)"
              stroke="#92400e"
              stroke-width="1.5"
            />

            <!-- Top Green PCB Header Section -->
            <path
              d="M 256 160 H 374 A 8 8 0 0 1 382 168 V 222 H 248 V 168 A 8 8 0 0 1 256 160 Z"
              fill="url(#greenPcbGrad)"
              stroke="#0f5127"
              stroke-width="1.5"
            />

            <!-- Green Header Top Mounting Holes -->
            <g fill="#0f172a" stroke="#d4af37" stroke-width="1.5">
              <circle cx="264" cy="176" r="5" />
              <circle cx="366" cy="176" r="5" />
            </g>

            <!-- Top 2-Pin Connector Block on Probe Header -->
            <rect x="300" y="132" width="30" height="28" rx="2" fill="#1e293b" stroke="#0f172a" stroke-width="1" />
            <rect x="305" y="136" width="6" height="6" fill="#fbbf24" stroke="#78350f" stroke-width="0.5" />
            <rect x="319" y="136" width="6" height="6" fill="#fbbf24" stroke="#78350f" stroke-width="0.5" />

            <!-- Logo on Green Section (Shield / Tree Circuit Icon) -->
            <g transform="translate(315, 194)">
              <!-- Shield icon outline -->
              <path d="M -11 -10 L 11 -10 L 11 0 C 11 8, 0 13, 0 13 C 0 13, -11 8, -11 0 Z" fill="#047857" stroke="#ffffff" stroke-width="1.2" />
              <!-- Stylized Tree / Circuit Traces inside shield -->
              <path d="M 0 8 V -6 M -5 -2 L 0 -6 L 5 -2 M -7 3 L 0 -2 L 7 3" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
              <!-- Text under logo -->
              <text x="0" y="20" fill="#ffffff" font-family="sans-serif" font-size="6" font-weight="bold" text-anchor="middle" letter-spacing="1">adiy</text>
            </g>

            <!-- Silver Conductive Pads & Vias on Left Prong -->
            <g>
              <!-- Trace 1 (Outer Left) -->
              <rect x="256" y="225" width="18" height="215" rx="3" fill="url(#silverPadGrad)" stroke="#64748b" stroke-width="0.8" />
              <!-- Trace 2 (Inner Left) -->
              <rect x="278" y="225" width="18" height="215" rx="3" fill="url(#silverPadGrad)" stroke="#64748b" stroke-width="0.8" />

              <!-- Vias on Left Prong -->
              <g fill="#0f172a" stroke="#d4af37" stroke-width="1">
                ${[240, 260, 280, 300, 320, 340, 360, 380, 400, 420].map(y => svg`
                  <circle cx="265" cy="${y}" r="2.8" />
                  <circle cx="287" cy="${y}" r="2.8" />
                `)}
              </g>
            </g>

            <!-- Silver Conductive Pads & Vias on Right Prong -->
            <g>
              <!-- Trace 1 (Inner Right) -->
              <rect x="334" y="225" width="18" height="215" rx="3" fill="url(#silverPadGrad)" stroke="#64748b" stroke-width="0.8" />
              <!-- Trace 2 (Outer Right) -->
              <rect x="356" y="225" width="18" height="215" rx="3" fill="url(#silverPadGrad)" stroke="#64748b" stroke-width="0.8" />

              <!-- Vias on Right Prong -->
              <g fill="#0f172a" stroke="#d4af37" stroke-width="1">
                ${[240, 260, 280, 300, 320, 340, 360, 380, 400, 420].map(y => svg`
                  <circle cx="343" cy="${y}" r="2.8" />
                  <circle cx="365" cy="${y}" r="2.8" />
                `)}
              </g>
            </g>

            <!-- Wet Soil / Moisture Visual Overlay on Prongs (Dynamic) -->
            ${moisture > 0 ? svg`
              <g opacity="${Math.min(0.9, 0.2 + (moisture / 100) * 0.75)}">
                <!-- Wet Soil Gradient on Left Prong -->
                <rect x="252" y="${probeWetY}" width="46" height="${455 - probeWetY}" rx="3" fill="url(#greenWireGrad)" opacity="0.4" />
                <!-- Wet Soil Gradient on Right Prong -->
                <rect x="332" y="${probeWetY}" width="46" height="${455 - probeWetY}" rx="3" fill="url(#greenWireGrad)" opacity="0.4" />

                <!-- Droplets on Prongs when wet -->
                ${moisture > 15 ? svg`
                  <circle cx="265" cy="${Math.max(240, probeWetY + 15)}" r="3" fill="#38bdf8" opacity="0.8" />
                  <circle cx="287" cy="${Math.max(240, probeWetY + 35)}" r="2.5" fill="#38bdf8" opacity="0.8" />
                  <circle cx="343" cy="${Math.max(240, probeWetY + 25)}" r="3" fill="#38bdf8" opacity="0.8" />
                  <circle cx="365" cy="${Math.max(240, probeWetY + 45)}" r="2.5" fill="#38bdf8" opacity="0.8" />
                ` : ''}
              </g>
            ` : ''}
          </g>

          <!-- ============================================================ -->
          <!-- 4. LIVE READOUT BADGE OVERLAY                                 -->
          <!-- ============================================================ -->
          <g transform="translate(195, 300)">
            <rect x="0" y="0" width="138" height="52" rx="8" fill="#0f172a" stroke="#334155" stroke-width="1.8" opacity="0.92" />
            <text font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">
              <tspan x="69" y="22" fill="${doLow ? '#4ade80' : '#fbbf24'}">${moisture}% SOIL</tspan>
              <tspan x="69" y="40" fill="#a3e635">${voltage.toFixed(2)}V / ${adcRaw}</tspan>
            </text>
          </g>
        </svg>
      </div>
    `;
  }
}

