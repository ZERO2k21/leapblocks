import { CPU, avrInstruction, AVRTimer, timer0Config, timer1Config, timer2Config } from 'avr8js';

export class LeapSimulator {
  private cpu: CPU | null = null;
  private timer0: AVRTimer | null = null;
  private timer1: AVRTimer | null = null;
  private timer2: AVRTimer | null = null;
  private running = false;
  private animationFrame: number | null = null;

  constructor(program: Uint16Array) {
    this.cpu = new CPU(program);
    this.timer0 = new AVRTimer(this.cpu, timer0Config);
    this.timer1 = new AVRTimer(this.cpu, timer1Config);
    this.timer2 = new AVRTimer(this.cpu, timer2Config);
  }

  public start() {
    if (this.running) return;
    this.running = true;
    this.loop();
  }

  public stop() {
    this.running = false;
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  private loop() {
    if (!this.running || !this.cpu) return;

    // Run approximately 1ms of simulation per frame (assuming 16MHz clock)
    // 16,000,000 / 60 fps ≈ 266,666 instructions per frame
    // For stability, we'll run 100,000 instructions in a tight loop.
    // Run a slice of simulation
    for (let i = 0; i < 50000; i++) {
        avrInstruction(this.cpu);
        // avr8js v2+ timers are handled via cpu cycles or internal hooks
    }

    this.animationFrame = requestAnimationFrame(() => this.loop());
  }

  public getCpu() {
    return this.cpu;
  }
}
