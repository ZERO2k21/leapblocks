import { 
  CPU, 
  avrInstruction, 
  AVRTimer, 
  timer0Config, 
  timer1Config, 
  timer2Config,
  AVRUSART,
  usart0Config
} from 'avr8js';

export class LeapSimulator {
  private cpu: CPU | null = null;
  private timer0: AVRTimer | null = null;
  private timer1: AVRTimer | null = null;
  private timer2: AVRTimer | null = null;
  private usart: AVRUSART | null = null;
  
  private running = false;
  private channel: MessageChannel;
  public onSerialData: (byte: number) => void = () => {};

  constructor(program: Uint16Array) {
    this.cpu = new CPU(program);
    this.timer0 = new AVRTimer(this.cpu, timer0Config);
    this.timer1 = new AVRTimer(this.cpu, timer1Config);
    this.timer2 = new AVRTimer(this.cpu, timer2Config);
    
    // Serial Support (USART0)
    this.usart = new AVRUSART(this.cpu, usart0Config);
    this.usart.onByteTransmit = (value) => this.onSerialData(value);
    
    // High-performance scheduler
    this.channel = new MessageChannel();
    this.channel.port1.onmessage = () => this.executeChunk();
  }

  public start() {
    if (this.running) return;
    this.running = true;
    this.scheduleExecution();
  }

  public stop() {
    this.running = false;
  }

  private scheduleExecution() {
    if (this.running) {
        this.channel.port2.postMessage(null);
    }
  }

  private executeChunk() {
    if (!this.cpu || !this.running) return;

    // Execute in bursts of 100,000 cycles for maximum throughput
    // This is significantly faster than requestAnimationFrame
    for (let i = 0; i < 100000; i++) {
        const cycles = avrInstruction(this.cpu);
        // Advance peripherals by elapsed cycles
        (this.timer0 as any).tick(cycles);
        (this.timer1 as any).tick(cycles);
        (this.timer2 as any).tick(cycles);
        (this.usart as any).tick(cycles);
    }

    // Sync bridge (State mapping to UI)
    (window as any).leapBridge?.sync();

    // Schedule next chunk immediately
    this.scheduleExecution();
  }

  public getCpu() {
    return this.cpu;
  }
}

