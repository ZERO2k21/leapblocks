import { RiscVCore } from './cpu/RiscVCore';
import { ESP32C3GPIO } from './peripherals/GPIO';
import { ESP32C3UART } from './peripherals/UART';
import { ESP32C3ADC } from './peripherals/ADC';
import { ESP32C3SysTimer } from './peripherals/SysTimer';
import { FirmwareLoader } from './compiler/FirmwareLoader';

// Web Worker context
const ctx: Worker = self as any;

let core: any = null;
let gpio: any = null;
let uart0: any = null;
let uart1: any = null;
let adc: any = null;
let sysTimer: any = null;
let running = false;
let executionInterval: any = null;
let cyclesPerBatch = 266666; // Cycles to run in each batch
let timerIntervalMs = 16; // Loop tick interval (60 FPS target)

// Abstract WASM Emulator reference if loaded
let wasmInstance: any = null;
let usingWasm = false;

// ── Batched message buffers (avoids per-event postMessage overhead) ──
let gpioBatch: { pin: number; value: number; isAnalog: boolean }[] = [];
let uartBatch: { uart: number; line: string }[] = [];
let batchTimer: ReturnType<typeof setTimeout> | null = null;

function flushBatches(): void {
  batchTimer = null;
  if (gpioBatch.length > 0) {
    const batch = gpioBatch;
    gpioBatch = [];
    ctx.postMessage({ type: 'gpioBatch', events: batch });
  }
  if (uartBatch.length > 0) {
    const batch = uartBatch;
    uartBatch = [];
    ctx.postMessage({ type: 'uartBatch', events: batch });
  }
}

function scheduleFlush(): void {
  if (batchTimer === null) {
    batchTimer = setTimeout(flushBatches, 0);
  }
}

function initJSEmulator(firmware: Uint8Array) {
  // Clear any existing state
  cleanup();

  core = new RiscVCore({
    onIllegal: (c, insn) => {
      console.error(`[ESP32 Worker] Illegal instruction 0x${insn.toString(16)} @ PC=0x${c.pc.toString(16)}`);
      ctx.postMessage({ type: 'error', message: `Illegal instruction 0x${insn.toString(16)} at PC=0x${c.pc.toString(16)}` });
      c.halted = true;
      stopLoop();
    }
  });

  gpio = new ESP32C3GPIO();
  uart0 = new ESP32C3UART(0);
  uart1 = new ESP32C3UART(1);
  adc = new ESP32C3ADC();
  sysTimer = new ESP32C3SysTimer();

  // Register MMIO peripherals
  core.mmio.register(gpio);
  core.mmio.register(uart0);
  core.mmio.register(uart1);
  core.mmio.register(adc);
  core.mmio.register(sysTimer);

  // Wire interrupts
  const irqCtrl = core.irqCtrl;
  const raiseIRQ = (n: number) => irqCtrl.raise(n);
  uart0.onInterrupt(raiseIRQ);
  uart1.onInterrupt(raiseIRQ);
  sysTimer.onInterrupt(raiseIRQ);

  // Load firmware
  const loader = new FirmwareLoader(core);
  const result = loader.load(firmware);

  core.reset(result.entryPoint);
  sysTimer.cpuCycles = 0;

  // Listen to GPIO output changes — batch for efficient postMessage
  gpio.onPinChange((gpioPin: number, value: number, isAnalog: boolean) => {
    gpioBatch.push({ pin: gpioPin, value, isAnalog });
    scheduleFlush();
  });

  // Listen to UART serial output — batch for efficient postMessage
  uart0.onSerialOutput((line: string) => {
    uartBatch.push({ uart: 0, line });
    scheduleFlush();
  });
  uart1.onSerialOutput((line: string) => {
    uartBatch.push({ uart: 1, line });
    scheduleFlush();
  });

  ctx.postMessage({
    type: 'initialized',
    engine: 'JS_RISCV',
    entryPoint: result.entryPoint,
    size: result.totalBytes
  });
}

async function initWasmEmulator(firmware: Uint8Array, wasmBytes: ArrayBuffer) {
  try {
    const importObject = {
      env: {
        gpioChangeCallback: (pin: number, value: number, isAnalog: number) => {
          ctx.postMessage({ type: 'gpioChange', pin, value, isAnalog: !!isAnalog });
        },
        uartTxCallback: (uart: number, charCode: number) => {
          const char = String.fromCharCode(charCode);
          ctx.postMessage({ type: 'uartTx', uart, line: char });
        },
        debugLog: (msgPtr: number, len: number) => {
          // Stub for logging debug strings from WASM memory
        }
      }
    };

    const module = await WebAssembly.compile(wasmBytes);
    wasmInstance = await WebAssembly.instantiate(module, importObject);
    usingWasm = true;

    // Load firmware bytes into WASM memory and call init
    // Assume exports: init_emulator(entryPoint), load_firmware(ptr, size), step(cycles)
    const firmwareSize = firmware.length;
    const wasmMem = new Uint8Array(wasmInstance.exports.memory.buffer);
    
    // Allocate space or write to pre-allocated buffer
    const bufferPtr = wasmInstance.exports.get_firmware_buffer_ptr();
    wasmMem.set(firmware, bufferPtr);
    
    const entryPoint = wasmInstance.exports.init_emulator(firmwareSize);

    ctx.postMessage({
      type: 'initialized',
      engine: 'WASM_XTENSA',
      entryPoint,
      size: firmwareSize
    });
  } catch (e: any) {
    console.warn(`[ESP32 Worker] WASM initialization failed, falling back to JS RISC-V:`, e.message);
    usingWasm = false;
    initJSEmulator(firmware);
  }
}

function startLoop() {
  if (running) return;
  running = true;

  executionInterval = setInterval(() => {
    if (!running) return;

    if (usingWasm && wasmInstance) {
      try {
        const halted = wasmInstance.exports.step(cyclesPerBatch);
        if (halted) {
          stopLoop();
          ctx.postMessage({ type: 'halted' });
        }
      } catch (e: any) {
        ctx.postMessage({ type: 'error', message: `WASM Execution error: ${e.message}` });
        stopLoop();
      }
    } else if (core) {
      try {
        const cyclesExecuted = core.runCycles(cyclesPerBatch);
        sysTimer.cpuCycles += cyclesExecuted;
        sysTimer.tick();

        if (core.halted) {
          stopLoop();
          ctx.postMessage({ type: 'halted' });
        }
      } catch (e: any) {
        ctx.postMessage({ type: 'error', message: `JS Execution error: ${e.message}` });
        stopLoop();
      }
    }
  }, timerIntervalMs);

  ctx.postMessage({ type: 'started' });
}

function stopLoop() {
  running = false;
  if (executionInterval) {
    clearInterval(executionInterval);
    executionInterval = null;
  }
  ctx.postMessage({ type: 'stopped' });
}

function cleanup() {
  stopLoop();
  if (batchTimer) { clearTimeout(batchTimer); batchTimer = null; }
  gpioBatch = [];
  uartBatch = [];
  core = null;
  gpio = null;
  uart0 = null;
  uart1 = null;
  adc = null;
  sysTimer = null;
  wasmInstance = null;
  usingWasm = false;
}

ctx.onmessage = async (e: MessageEvent) => {
  const msg = e.data;
  switch (msg.type) {
    case 'init':
      if (msg.wasmBytes) {
        await initWasmEmulator(msg.firmware, msg.wasmBytes);
      } else {
        initJSEmulator(msg.firmware);
      }
      break;

    case 'start':
      startLoop();
      break;

    case 'stop':
      stopLoop();
      break;

    case 'reset':
      if (usingWasm && wasmInstance) {
        wasmInstance.exports.reset_emulator();
      } else if (core) {
        core.reset();
        sysTimer.cpuCycles = 0;
      }
      ctx.postMessage({ type: 'reset' });
      break;

    case 'gpioWrite':
      const { pin, value, isAnalog } = msg;
      if (usingWasm && wasmInstance) {
        wasmInstance.exports.write_gpio(pin, typeof value === 'boolean' ? (value ? 1 : 0) : value, !!isAnalog);
      } else if (gpio) {
        if (isAnalog) {
          const val12 = typeof value === 'number' ? value : (value ? 4095 : 0);
          gpio.setAnalog(pin, val12);
          if (adc) adc.setChannelValue(pin, val12);
        } else {
          gpio.setInput(pin, !!value);
        }
      }
      break;

    case 'uartRx':
      const { uart, data } = msg;
      if (usingWasm && wasmInstance) {
        // write to WASM UART RX buffer character by character
        for (let i = 0; i < data.length; i++) {
          wasmInstance.exports.uart_rx_inject(uart, data.charCodeAt(i));
        }
      } else {
        const targetUart = uart === 0 ? uart0 : uart1;
        if (targetUart) {
          targetUart.injectRx(data);
        }
      }
      break;
  }
};
