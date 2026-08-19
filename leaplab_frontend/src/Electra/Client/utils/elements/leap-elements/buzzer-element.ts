import { css, html, LitElement, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ElementPin } from './pin';

/**
 * Renders a piezo electric buzzer.
 */
@customElement('leap-buzzer')
export class BuzzerElement extends LitElement {
  /**
   * Boolean representing if an electric signal is coming in the buzzer
   * If true a music note will be displayed on top of the buzzer
   */
  @property() hasSignal = false;
  @property() intensity = 1.0;
  @property() damaged = false;
  @property() mode: 'smooth' | 'accurate' = 'smooth';
  @property() volume = 1.0;

  readonly pinInfo: ElementPin[] = [
    { name: '1', x: 27, y: 84, signals: [], description: 'Negative(Black) pin' },
    { name: '2', x: 37, y: 84, signals: [], description: 'Positive(Red) pin' },
  ];

  static get styles() {
    return css`
      :host {
        display: inline-block;
      }

      .buzzer-container {
        display: flex;
        flex-direction: column;
        width: 75px;
      }

      .music-note {
        position: relative;
        left: 28px;
        width: 18px;
        height: 18px;
        z-index: 100;
        pointer-events: none;
        animation-duration: 1.5s;
        animation-name: animate-note;
        animation-iteration-count: infinite;
        animation-timing-function: linear;
        offset-path: path(
          'm0 0c-0.9-0.92-1.8-1.8-2.4-2.8-0.56-0.92-0.78-1.8-0.58-2.8 0.2-0.92 0.82-1.8 1.6-2.8'
        );
        offset-rotate: 0deg;
      }

      @keyframes animate-note {
        0% {
          offset-distance: 0%;
          opacity: 0;
        }
        10% {
          offset-distance: 10%;
          opacity: 1;
        }
        75% {
          offset-distance: 75%;
          opacity: 1;
        }
        100% {
          offset-distance: 100%;
          opacity: 0;
        }
      }
    `;
  }

  renderSVG() {
    const grayscaleFilter = this.damaged ? 'grayscale(100%) opacity(0.5)' : '';
    return html`<svg
      width="17mm"
      height="20mm"
      version="1.1"
      viewBox="0 0 17 20"
      xmlns="http://www.w3.org/2000/svg"
      style="filter: ${grayscaleFilter}"
    >
      <path d="m7.23 16.5v3.5" fill="none" stroke="#000" stroke-width=".5" />
      <path d="m9.77 16.5v3.5" fill="#f00" stroke="#f00" stroke-width=".5" />
      <g stroke="#000">
        <g>
          <ellipse cx="8.5" cy="8.5" rx="8.15" ry="8.15" fill="#1a1a1a" stroke-width=".7" />
          <circle
            cx="8.5"
            cy="8.5"
            r="6.3472"
            fill="none"
            stroke-width=".3"
            style="paint-order:normal"
          />
          <circle
            cx="8.5"
            cy="8.5"
            r="4.3488"
            fill="none"
            stroke-width=".3"
            style="paint-order:normal"
          />
        </g>
        <circle cx="8.5" cy="8.5" r="1.3744" fill="#ccc" stroke-width=".25" />
      </g>
    </svg>`;
  }

  private audioFile: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;

  updated(changedProperties: Map<string, any>) {
    if (
      changedProperties.has('hasSignal') ||
      changedProperties.has('damaged') ||
      changedProperties.has('volume') ||
      changedProperties.has('intensity')
    ) {
      this.syncAudio();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopAudio();
  }

  private syncAudio() {
    const buzzerOn = this.hasSignal && !this.damaged;
    if (buzzerOn) {
      const vol = Math.min(1.0, Math.max(0.05, (this.volume || 1.0) * (this.intensity || 1.0)));
      if (!this.audioFile) {
        const audioUrl = new URL('/assets/electronic_buzzer_continuous.wav', window.location.origin).href;
        this.audioFile = new Audio(audioUrl);
        this.audioFile.loop = true;
      }
      this.audioFile.volume = vol;

      if (this.audioFile.paused) {
        const playPromise = this.audioFile.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('[leap-buzzer] Audio file play delayed/blocked, activating synth fallback:', err);
            this.startWebAudioSynth(vol);

            const unlock = () => {
              if (this.hasSignal && !this.damaged && this.audioFile) {
                this.stopWebAudioSynth();
                this.audioFile.play().catch(() => this.startWebAudioSynth(vol));
              }
              window.removeEventListener('pointerdown', unlock);
              window.removeEventListener('keydown', unlock);
            };
            window.addEventListener('pointerdown', unlock, { once: true });
            window.addEventListener('keydown', unlock, { once: true });
          });
        }
      }
    } else {
      this.stopAudio();
    }
  }

  private startWebAudioSynth(volume: number) {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      if (!this.oscillator) {
        this.oscillator = this.audioCtx.createOscillator();
        this.gainNode = this.audioCtx.createGain();
        this.oscillator.type = 'square';
        this.oscillator.frequency.value = 2400;
        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.audioCtx.destination);
        this.oscillator.start();
      }
      if (this.gainNode) {
        this.gainNode.gain.setValueAtTime(volume * 0.15, this.audioCtx.currentTime);
      }
    } catch (e) {
      console.warn('[leap-buzzer] Web Audio synth error:', e);
    }
  }

  private stopWebAudioSynth() {
    if (this.oscillator) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
      } catch {}
      this.oscillator = null;
    }
    this.gainNode = null;
  }

  private stopAudio() {
    if (this.audioFile) {
      this.audioFile.pause();
      this.audioFile.currentTime = 0;
    }
    this.stopWebAudioSynth();
  }

  render() {
    const buzzerOn = this.hasSignal && !this.damaged;
    // Animation speed scales with intensity AND user-defined volume
    const effectiveIntensity = Math.max(0.1, this.intensity * (this.volume || 1.0));
    // Cap duration so it doesn't get too slow
    const animationDuration = this.hasSignal ? Math.min(5, (1.5 / effectiveIntensity)) : 1.5;

    return html`
      <div class="buzzer-container">
        <svg
          class="music-note"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          style="visibility: ${buzzerOn ? '' : 'hidden'}; animation-duration: ${animationDuration}s; opacity: ${0.7 + effectiveIntensity * 0.3}"
        >
          <path
            d="M9 18V5l12-2v13"
            fill="none"
            stroke="#7c3aed"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <circle cx="6" cy="18" r="3" fill="#7c3aed" />
          <circle cx="18" cy="16" r="3" fill="#7c3aed" />
        </svg>
        ${this.renderSVG()}
      </div>
    `;
  }
}
