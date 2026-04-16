/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { useForgeStore } from '../store/useForgeStore';
import { simulationRunner, PinState } from './SimulationRunner';
import { HD44780 } from './HD44780';
import { I2CBusManager } from './I2CBusManager';
import { PCF8574 } from './PCF8574';
import { DHT } from './DHT';
import { NeoPixelEmulator } from './NeoPixelEmulator';
import { StepperEmulator } from './StepperEmulator';
import { SSD1306I2CSlave } from './SSD1306I2CSlave';
import { ILI9341SPISlave } from './ILI9341SPISlave';
import { MPU6050I2CSlave } from './MPU6050I2CSlave';

/**
 * CircuitEngine
 * Bridges the abstract ReactFlow graph (nodes/edges) with the low-level AVR SimulationRunner.
 * Handles signal propagation across wires.
 */
class CircuitEngine {
  private activeSubscriptions = new Map<string, () => void>();
  private lcdEmulators = new Map<string, HD44780>();
  private peripheralPinBuffers = new Map<string, Record<string, boolean>>();
  private i2cBusManager = new I2CBusManager();
  private dhtEmulators = new Map<string, DHT>();
  private neoPixelEmulators = new Map<string, NeoPixelEmulator>();
  private stepperEmulators = new Map<string, StepperEmulator>();
  private ili9341Slaves = new Map<string, ILI9341SPISlave>();
  private mpu6050Slaves = new Map<string, MPU6050I2CSlave>();
  private isInitialized = false;

  /**
   * Traces an electrical net from a starting point (board pin) and returns all 
   * reachable endpoints (LEDs, Buzzers, etc.) along with the total resistance in the path.
   */
  private traceNet(startNodeId: string, startPin: string): { nodeId: string, pinName: string, resistance: number, type: string }[] {
    const { nodes, edges } = useForgeStore.getState();
    const targets: { nodeId: string, pinName: string, resistance: number, type: string }[] = [];
    const queue = [{ id: startNodeId, pin: startPin, resistance: 0 }];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.id}-${current.pin}`;
      if (visited.has(key)) continue;
      visited.add(key);

      const node = nodes.find(n => n.id === current.id);
      if (!node) continue;

      const nodeType = node.data?.type;

      if (['led', 'buzzer', 'rgb-led', 'neopixel', 'neopixel-matrix', 'led-ring'].includes(nodeType)) {
        targets.push({ nodeId: current.id, pinName: current.pin, resistance: current.resistance, type: nodeType });
      } else if (nodeType === 'ks2e-m-dc5') {
        // Relay contact traversal: signal enters on a pole pin (P1/P2) and exits via the active contact
        const relayNode = nodes.find(n => n.id === current.id);
        const energized = relayNode?.data?.relayEnergized ?? false;

        // Map pole → active contact based on relay state
        const contactMap: Record<string, string> = energized
          ? { 'P1': 'NO1', 'P2': 'NO2' }
          : { 'P1': 'NC1', 'P2': 'NC2' };

        const exitPin = contactMap[current.pin];
        if (exitPin) {
          const downstreamEdges = edges.filter(e =>
            (e.source === current.id && e.sourceHandle === exitPin) ||
            (e.target === current.id && e.targetHandle === exitPin)
          );
          for (const edge of downstreamEdges) {
            const nextId = edge.source === current.id ? edge.target : edge.source;
            const nextPin = (edge.source === current.id ? edge.targetHandle : edge.sourceHandle) || '';
            queue.push({ id: nextId, pin: nextPin, resistance: current.resistance });
          }
        }
      } else if (nodeType === 'resistor') {
        const rValue = Number(node.data?.sensorValues?.value ?? 0);
        console.log(`[FORGE CIRCUIT] Net trace through resistor (${current.id}): +${rValue} ohms`);

        // Find the other pin of the resistor
        let exitPin = '';
        if (current.pin === '1' || current.pin === 'pin_1' || current.pin === 'IN') {
          exitPin = node.data?.pinOUT ? 'OUT' : '2';
        } else {
          exitPin = node.data?.pinIN ? 'IN' : '1';
        }

        // Robust fallback: if we don't know the pins, check if they are 'IN'/'OUT'
        if (current.pin === 'IN') exitPin = 'OUT';
        else if (current.pin === 'OUT') exitPin = 'IN';
        else if (current.pin === '1' || current.pin === 'pin_1') exitPin = '2';
        else if (current.pin === '2' || current.pin === 'pin_2') exitPin = '1';

        const downstreamEdges = edges.filter(e =>
          (e.source === current.id && e.sourceHandle === exitPin) ||
          (e.target === current.id && e.targetHandle === exitPin)
        );

        for (const edge of downstreamEdges) {
          const nextId = edge.source === current.id ? edge.target : edge.source;
          const nextPin = (edge.source === current.id ? edge.targetHandle : edge.sourceHandle) || '';
          queue.push({ id: nextId, pin: nextPin, resistance: current.resistance + rValue });
        }
      }
    }
    return targets;
  }

  constructor() { }

  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    console.log('[FORGE CIRCUIT] Engine connected (Version: Ideal Mode - Indestructible)');

    // Listen to changes in the visual circuit board
    let previousEdgesCount = -1;
    let previousIsSimulating = false;
    useForgeStore.subscribe((state) => {
      // Re-sync only when edges change while already simulating (not on the start transition)
      const edgesChanged = state.edges.length !== previousEdgesCount;
      const wasAlreadySimulating = previousIsSimulating && state.isSimulating;
      previousEdgesCount = state.edges.length;
      previousIsSimulating = state.isSimulating;
      if (edgesChanged && wasAlreadySimulating) {
        this.syncCircuitGraph();
      }
    });
  }

  /**
   * Called whenever wires are drawn/removed. Rebuilds the routing table.
   */
  public syncCircuitGraph() {
    console.log('[FORGE CIRCUIT] syncCircuitGraph triggered. Re-evaluating electrical routing table...');
    // 1. Clear all old AVR listeners hooked by the circuit engine
    this.activeSubscriptions.forEach((unsubscribe) => unsubscribe());
    this.activeSubscriptions.clear();
    this.lcdEmulators.clear();
    this.peripheralPinBuffers.clear();
    this.i2cBusManager.clear();
    this.dhtEmulators.clear();
    this.neoPixelEmulators.clear();
    this.stepperEmulators.forEach(e => e.destroy());
    this.stepperEmulators.clear();
    this.ili9341Slaves.forEach(s => s.detach());
    this.ili9341Slaves.clear();
    this.mpu6050Slaves.clear();

    const { nodes, edges, updateNodeData } = useForgeStore.getState();
    const currentStateStore = useForgeStore.getState();

    // 2.1 Register I2C Slaves and Reset States
    nodes.forEach(node => {
      // Reset damaged/visual states on sync (e.g. simulation start)
      if (node.data?.damaged || node.data?.pinStates) {
        updateNodeData(node.id, { damaged: false, pinStates: {} });
      }

      if (node.data?.type === 'lcd1602' || node.data?.type === 'lcd2004' ||
          node.data?.type === 'lcd1602-i2c' || node.data?.type === 'lcd2004-i2c') {
        // Create an emulator for the display
        const isWide = node.data?.type === 'lcd2004' || node.data?.type === 'lcd2004-i2c';
        const cols = isWide ? 20 : 16;
        const rows = isWide ? 4 : 2;
        const emulator = new HD44780(cols, rows);
        this.lcdEmulators.set(node.id, emulator);

        // I2C variants always use the PCF8574 backpack at 0x27
        const isI2C = node.data?.type === 'lcd1602-i2c' || node.data?.type === 'lcd2004-i2c';
        const i2cAddr = isI2C ? (node.data?.i2cAddress ?? 0x27) : node.data?.i2cAddress;
        if (i2cAddr) {
          const backpack = new PCF8574(i2cAddr, emulator, (state) => {
            updateNodeData(node.id, { lcdState: state });
          });
          this.i2cBusManager.registerSlave(backpack);
        }
      }

      // Register SSD1306 OLED as I2C slave (default address 0x3C)
      if (node.data?.type === 'ssd1306') {
        const i2cAddr = node.data?.i2cAddress ?? 0x3C;
        const slave = new SSD1306I2CSlave(i2cAddr, (pixels, displayOn) => {
          // Convert the page-addressed pixel buffer to RGBA ImageData
          const imageData = new ImageData(128, 64);
          for (let page = 0; page < 8; page++) {
            for (let col = 0; col < 128; col++) {
              const byte = pixels[page * 128 + col];
              for (let bit = 0; bit < 8; bit++) {
                const row = page * 8 + bit;
                const idx = (row * 128 + col) * 4;
                const on = displayOn && ((byte >> bit) & 1) === 1;
                imageData.data[idx]     = on ? 0   : 0;    // R
                imageData.data[idx + 1] = on ? 255 : 0;    // G  (white-on-black)
                imageData.data[idx + 2] = on ? 255 : 0;    // B
                imageData.data[idx + 3] = 255;              // A
              }
            }
          }
          updateNodeData(node.id, { oledImageData: imageData });
        });
        this.i2cBusManager.registerSlave(slave);
      }

      // Register ILI9341 TFT as SPI peripheral
      // The slave is created here; pin listeners (D/C, CS) are wired in the edge-scan loop below.
      if (node.data?.type === 'ili9341') {
        const nodeId = node.id;
        const spi = simulationRunner.SPI;
        if (spi) {
          const slave = new ILI9341SPISlave(spi, (pixels, displayOn) => {
            // Build an ImageData from the RGBA pixel buffer and push to the node
            const imageData = new ImageData(new Uint8ClampedArray(pixels), 240, 320);
            updateNodeData(nodeId, { tftImageData: imageData, tftDisplayOn: displayOn });
          });
          slave.attach();
          this.ili9341Slaves.set(nodeId, slave);
          console.log(`[FORGE CIRCUIT] ILI9341 (${nodeId}) registered on SPI bus`);
        } else {
          console.warn(`[FORGE CIRCUIT] ILI9341 (${nodeId}): SPI bus not available on this board`);
        }
      }

      // Register MPU6050 as I2C slave (default address 0x68, AD0=LOW)
      if (node.data?.type === 'mpu6050') {
        const nodeId = node.id;
        const i2cAddr = node.data?.i2cAddress ?? 0x68;
        const slave = new MPU6050I2CSlave(i2cAddr);

        // Push current sensor values from store into the emulator immediately
        const sv = node.data?.sensorValues;
        if (sv) {
          slave.setSensorValues({
            accelX: sv.accelX ?? 0,
            accelY: sv.accelY ?? 0,
            accelZ: sv.accelZ ?? 1,
            gyroX:  sv.gyroX  ?? 0,
            gyroY:  sv.gyroY  ?? 0,
            gyroZ:  sv.gyroZ  ?? 0,
            temp:   sv.temp   ?? 25,
          });
        }

        this.i2cBusManager.registerSlave(slave);
        this.mpu6050Slaves.set(nodeId, slave);
        console.log(`[FORGE CIRCUIT] MPU6050 (${nodeId}) registered at I2C 0x${i2cAddr.toString(16)}`);
      }
    });

    // 2.2 Attach Bus Manager to Master
    if (simulationRunner.TWI) {
      simulationRunner.TWI.eventHandler = this.i2cBusManager;
    }

    // 2. Map board nodes (Arduino) and their connected peripherals
    const boardNodes = nodes.filter(n => n.data?.type === 'arduino-uno' || n.data?.type === 'arduino-nano' || n.data?.type === 'boards');

    boardNodes.forEach(board => {
      // Find all wires connected to this Arduino
      const connectedEdges = edges.filter(e => e.source === board.id || e.target === board.id);

      connectedEdges.forEach(edge => {
        // Determine the flow direction (Assuming Board -> Peripheral for now, Phase 3 propagation)
        // If the Arduino is the source of the edge (e.g., standard digital output)
        const isOutput = edge.source === board.id;
        const arduinoPinName = isOutput ? edge.sourceHandle : edge.targetHandle;
        const peripheralId = isOutput ? edge.target : edge.source;
        const peripheralPinName = isOutput ? edge.targetHandle : edge.sourceHandle;

        if (!arduinoPinName || !peripheralPinName) return;

        // Convert Arduino pin (e.g., "13") to AVR pin (e.g., "PB5")
        const mapping = simulationRunner.convertArduinoPin(arduinoPinName);
        if (!mapping) return;
        const avrPin = mapping.avrPin;

        console.log(`[FORGE CIRCUIT] Wired Logic Route: Board[${arduinoPinName}] <==> ${avrPin} <==> Peripheral[${peripheralPinName}]`);

        // --- Custom Peripheral Emulation ---
        let trigStartCycles = 0;
        let pwmStartCycles = 0;

        // Ensure buffers exist for this peripheral
        if (!this.peripheralPinBuffers.has(peripheralId)) {
          this.peripheralPinBuffers.set(peripheralId, {});
        }

        // Create a dedicated listener that pushes the HIGH/LOW state across the wire to the target node
        const listener = (state: PinState) => {
          const isHigh = state === 'HIGH';
          const currentStateStore = useForgeStore.getState();

          // Identify peripheral type once
          const pType = currentStateStore.nodes.find(n => n.id === peripheralId)?.data?.type;
          const isComplexPeripheral = ['stepper-motor', 'a4988', 'biaxial-stepper', 'dht22', 'dht11', 'servo', 'hc-sr04',
            'lcd1602', 'lcd2004', 'lcd1602-i2c', 'lcd2004-i2c', 'neopixel', 'neopixel-matrix', 'led-ring', 'ks2e-m-dc5',
            '7segment', 'ili9341', 'pir-motion-sensor'].includes(pType);

          // 1. Trace the electrical network — only for simple output peripherals
          if (!isComplexPeripheral) {
            const reachableTargets = this.traceNet(peripheralId, peripheralPinName);
            reachableTargets.forEach(target => {
              const targetNode = currentStateStore.nodes.find(n => n.id === target.nodeId);
              if (!targetNode) return;

              const currentPinStates = targetNode.data?.pinStates || {};
              const pinKey = `pin_${target.pinName}`;

              if (currentPinStates[pinKey] !== isHigh) {
                const updates: any = {
                  pinStates: { ...currentPinStates, [pinKey]: isHigh }
                };

                const intensity = isHigh ? 1.0 : 0.0;

                if (target.type === 'led') updates.brightness = intensity;
                else if (target.type === 'rgb-led') updates[`intensity_${target.pinName}`] = intensity;
                else if (target.type === 'buzzer') {
                  updates.intensity = intensity;
                  updates.hasSignal = isHigh;
                }

                updates.damaged = false;
                updateNodeData(target.nodeId, updates);
              }
            });
          }

          // 2. Specialized Peripheral Emulation (Servo, LCD, etc. - keep original logic for these)
          const peripheralNode = currentStateStore.nodes.find(n => n.id === peripheralId);

          if (peripheralNode) {
            // ... (rest of the specialized logic for HC-SR04, Servo, LCD, DHT)
            // Note: We only keep the physics simulation here. 
            // The pin state update for these complex peripherals is handled below.

            // Emulate HC-SR04 Hardware Physics
            if (peripheralNode.data?.type === 'hc-sr04' && peripheralPinName === 'TRIG') {
              if (isHigh) {
                trigStartCycles = simulationRunner.getCycles();
              } else {
                const pulseCycles = simulationRunner.getCycles() - trigStartCycles;
                const durationUs = pulseCycles / 16;
                if (durationUs >= 2) {
                  const distStr = peripheralNode.data?.sensorValues?.distance;
                  const distParam = distStr !== undefined ? parseFloat(distStr) : 100;
                  const echoPulseUs = distParam * 58;
                  const echoPulseCycles = Math.floor(echoPulseUs * 16);
                  const echoWire = currentStateStore.edges.find(e => (e.source === peripheralId && e.sourceHandle === 'ECHO') || (e.target === peripheralId && e.targetHandle === 'ECHO'));
                  if (echoWire) {
                    const _boardPinName = echoWire.source === peripheralId ? echoWire.targetHandle : echoWire.sourceHandle;
                    // @ts-ignore
                    const _echoMapping = simulationRunner.convertArduinoPin(_boardPinName);
                    if (_echoMapping) {
                      simulationRunner.scheduleEvent(500, () => {
                        simulationRunner.setVirtualInput(_echoMapping.avrPin, true);
                        simulationRunner.scheduleEvent(echoPulseCycles, () => {
                          simulationRunner.setVirtualInput(_echoMapping.avrPin, false);
                        });
                      });
                    }
                  }
                }
              }
            }

            // Emulate Servo PWM Physics
            if (peripheralNode.data?.type === 'servo' && peripheralPinName === 'PWM') {
              if (isHigh) {
                pwmStartCycles = simulationRunner.getCycles();
              } else {
                const pulseCycles = simulationRunner.getCycles() - pwmStartCycles;
                const durationUs = pulseCycles / 16;
                if (durationUs >= 400 && durationUs <= 2600) {
                  const angle = Math.max(0, Math.min(180, ((durationUs - 1000) / 1000) * 180));
                  const currentAngle = peripheralNode.data?.angle ?? 0;
                  if (Math.abs(currentAngle - angle) >= 0.5) {
                    updateNodeData(peripheralId, { angle });
                  }
                }
              }
            }

            // --- LCD Display Emulation (parallel mode only) ---
            if ((peripheralNode.data?.type === 'lcd1602' || peripheralNode.data?.type === 'lcd2004') &&
                peripheralNode.data?.type !== 'lcd1602-i2c' && peripheralNode.data?.type !== 'lcd2004-i2c') {
              const buffer = this.peripheralPinBuffers.get(peripheralId)!;
              const prevE = buffer['E'];
              buffer[peripheralPinName] = isHigh;
              if (prevE === true && isHigh === false && peripheralPinName === 'E') {
                const emulator = this.lcdEmulators.get(peripheralId)!;
                const rs = !!buffer['RS'];
                let data = 0;
                if (buffer['D4']) data |= 0x10;
                if (buffer['D5']) data |= 0x20;
                if (buffer['D6']) data |= 0x40;
                if (buffer['D7']) data |= 0x80;
                emulator.processPulse(rs, data);
                updateNodeData(peripheralId, { lcdState: emulator.getState() });
              }
            }

            // --- 7-Segment Display Emulation ---
            // Segment order in values[]: A=0, B=1, C=2, D=3, E=4, F=5, G=6, DP=7
            // Common-cathode: segment is ON when pin is HIGH.
            if (peripheralNode.data?.type === '7segment') {
              const buffer = this.peripheralPinBuffers.get(peripheralId)!;
              buffer[peripheralPinName] = isHigh;

              const segOrder = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'DP'];
              const values = segOrder.map(seg => (buffer[seg] ? 1 : 0));
              const currentValues = peripheralNode.data?.segValues;
              // Only update if something changed
              if (!currentValues || values.some((v, i) => v !== currentValues[i])) {
                updateNodeData(peripheralId, { segValues: values });
              }
            }

            // --- DHT Sensor Emulation ---
            if (peripheralNode.data?.type === 'dht22' || peripheralNode.data?.type === 'dht11') {
              if (peripheralPinName === 'SDA' || peripheralPinName === 'DATA') {
                if (!this.dhtEmulators.has(peripheralId)) {
                  // Pass nodeId so the emulator reads from the correct node's sensorValues
                  this.dhtEmulators.set(peripheralId, new DHT(avrPin, peripheralNode.data.type, peripheralId));
                }
                const emulator = this.dhtEmulators.get(peripheralId)!;
                emulator.processSignal(state);
              }
            }

            // --- ILI9341 TFT SPI Display Emulation ---
            // D/C pin controls command vs data mode; CS pin enables/disables the chip.
            if (peripheralNode.data?.type === 'ili9341') {
              const slave = this.ili9341Slaves.get(peripheralId);
              if (slave) {
                if (peripheralPinName === 'D/C') {
                  slave.setDC(isHigh);
                } else if (peripheralPinName === 'CS') {
                  // CS is active-LOW: chip is selected when the pin is LOW
                  slave.setCS(!isHigh);
                }
                // MOSI/SCK are handled by the SPI bus hardware (simulationRunner.SPI.onByte)
              }
            }

            // --- PIR Motion Sensor Emulation ---
            // PIR is a pure INPUT sensor — signal flows from sensor → Arduino, never the reverse.
            // The listener here fires when the AVR writes to Port D (output direction).
            // We must NOT call setVirtualInput here — that would fight against user-injected signals.
            // Initial state injection is handled below, outside this listener, after registration.

            // --- Relay Emulation (KS2E-M-DC5 DPDT) ---
            // COIL1 = signal pin (HIGH = energized), COIL2 = GND reference.
            // When energized: P1↔NO1, P2↔NO2 are closed; P1↔NC1, P2↔NC2 open.
            // When de-energized: P1↔NC1, P2↔NC2 are closed; P1↔NO1, P2↔NO2 open.
            if (peripheralNode.data?.type === 'ks2e-m-dc5') {
              const buf = this.peripheralPinBuffers.get(peripheralId)!;
              buf[peripheralPinName] = isHigh;

              // Coil is energized when COIL1 is HIGH (COIL2 is GND)
              const coil1High = !!buf['COIL1'];
              const wasEnergized = peripheralNode.data?.relayEnergized ?? false;

              if (coil1High !== wasEnergized) {
                console.log(`[RELAY] Node ${peripheralId} — coil ${coil1High ? 'ENERGIZED' : 'DE-ENERGIZED'}`);
                updateNodeData(peripheralId, { relayEnergized: coil1High });

                // Re-propagate signals through the relay contacts
                // Find what is connected to P1 and P2 and route to the active contact
                const relayEdges = currentStateStore.edges.filter(e =>
                  e.source === peripheralId || e.target === peripheralId
                );

                // For each pole (P1, P2), find the signal on P and push it to the active contact
                for (const pole of ['P1', 'P2'] as const) {
                  const suffix = pole === 'P1' ? '1' : '2';
                  const activeContact = coil1High ? `NO${suffix}` : `NC${suffix}`;
                  const inactiveContact = coil1High ? `NC${suffix}` : `NO${suffix}`;

                  // Find the signal level on the pole pin
                  const poleEdge = relayEdges.find(e =>
                    (e.source === peripheralId && e.sourceHandle === pole) ||
                    (e.target === peripheralId && e.targetHandle === pole)
                  );

                  if (poleEdge) {
                    // Trace what's downstream of the active contact
                    const activeTargets = this.traceNet(peripheralId, activeContact);
                    const inactiveTargets = this.traceNet(peripheralId, inactiveContact);

                    // Get the current signal level on the pole from the board
                    const poleSignal = buf[pole] ?? false;

                    // Push signal to newly-active contact targets
                    activeTargets.forEach(target => {
                      const targetNode = currentStateStore.nodes.find(n => n.id === target.nodeId);
                      if (!targetNode) return;
                      const pinStates = { ...(targetNode.data?.pinStates || {}), [`pin_${target.pinName}`]: poleSignal };
                      updateNodeData(target.nodeId, { pinStates, damaged: false });
                    });

                    // Cut signal to newly-inactive contact targets
                    inactiveTargets.forEach(target => {
                      const targetNode = currentStateStore.nodes.find(n => n.id === target.nodeId);
                      if (!targetNode) return;
                      const pinStates = { ...(targetNode.data?.pinStates || {}), [`pin_${target.pinName}`]: false };
                      updateNodeData(target.nodeId, { pinStates, damaged: false });
                    });
                  }
                }
              }
            }

            // --- Stepper Motor Emulation ---
            // Supports both wiring modes:
            //   4-wire (A+, B+, A-, B-) — Arduino Stepper.h / ULN2003
            //   STEP+DIR (A4988 / DRV8825)
            if (peripheralNode.data?.type === 'stepper-motor') {
              if (!this.stepperEmulators.has(peripheralId)) {
                console.log(`[STEPPER] Wiring 4-wire emulator for node ${peripheralId} — pin ${peripheralPinName} ← AVR ${avrPin}`);
                let pendingUpdate: { angle: number; stepCount: number; energized: boolean } | null = null;
                let rafScheduled = false;
                this.stepperEmulators.set(peripheralId, new StepperEmulator(({ angle, stepCount, energized }) => {
                  pendingUpdate = { angle, stepCount, energized };
                  if (!rafScheduled) {
                    rafScheduled = true;
                    requestAnimationFrame(() => {
                      rafScheduled = false;
                      if (pendingUpdate) {
                        const { angle: a, stepCount: s, energized: e } = pendingUpdate;
                        pendingUpdate = null;
                        updateNodeData(peripheralId, {
                          angle: a,
                          value: `${a.toFixed(1)}°`,
                          units: `${s > 0 ? '+' : ''}${s} steps`,
                          arrow: e ? '#BEF264' : '',
                        });
                      }
                    });
                  }
                }, { stepsPerRev: 200 }, peripheralId));
              }
              const stepper = this.stepperEmulators.get(peripheralId)!;
              const buf = this.peripheralPinBuffers.get(peripheralId)!;
              buf[peripheralPinName] = isHigh;

              if (peripheralPinName === 'STEP') {
                stepper.processStep(isHigh);
              } else if (peripheralPinName === 'DIR') {
                stepper.setDirection(isHigh);
              } else {
                // 4-wire mode — order must match Stepper.h: processCoils(A+, B+, A-, B-)
                stepper.processCoils(
                  !!buf['A+'],
                  !!buf['B+'],
                  !!buf['A-'],
                  !!buf['B-'],
                );
              }
            }

            // --- Biaxial Stepper Emulation ---
            // Two independent 4-wire steppers in one body.
            // Outer shaft: A1+, A1-, B1+, B1-
            // Inner shaft: A2+, A2-, B2+, B2-
            if (peripheralNode.data?.type === 'biaxial-stepper') {
              const buf = this.peripheralPinBuffers.get(peripheralId)!;
              buf[peripheralPinName] = isHigh;

              const outerKey = `${peripheralId}__outer`;
              const innerKey = `${peripheralId}__inner`;

              // Create outer emulator (motor 1)
              if (!this.stepperEmulators.has(outerKey)) {
                console.log(`[BIAXIAL] Wiring outer emulator for node ${peripheralId}`);
                let pending: { angle: number; energized: boolean } | null = null;
                let rafPending = false;
                this.stepperEmulators.set(outerKey, new StepperEmulator(({ angle, energized }) => {
                  pending = { angle, energized };
                  if (!rafPending) {
                    rafPending = true;
                    requestAnimationFrame(() => {
                      rafPending = false;
                      if (pending) {
                        const { angle: a, energized: e } = pending;
                        pending = null;
                        updateNodeData(peripheralId, { outerHandAngle: a, outerEnergized: e });
                      }
                    });
                  }
                }, { stepsPerRev: 200 }, `${peripheralId}-outer`));
              }

              // Create inner emulator (motor 2)
              if (!this.stepperEmulators.has(innerKey)) {
                console.log(`[BIAXIAL] Wiring inner emulator for node ${peripheralId}`);
                let pending: { angle: number; energized: boolean } | null = null;
                let rafPending = false;
                this.stepperEmulators.set(innerKey, new StepperEmulator(({ angle, energized }) => {
                  pending = { angle, energized };
                  if (!rafPending) {
                    rafPending = true;
                    requestAnimationFrame(() => {
                      rafPending = false;
                      if (pending) {
                        const { angle: a, energized: e } = pending;
                        pending = null;
                        updateNodeData(peripheralId, { innerHandAngle: a, innerEnergized: e });
                      }
                    });
                  }
                }, { stepsPerRev: 200 }, `${peripheralId}-inner`));
              }

              const outerStepper = this.stepperEmulators.get(outerKey)!;
              const innerStepper = this.stepperEmulators.get(innerKey)!;

              // Route pins to the correct emulator
              // Outer motor coils: A1+, A1-, B1+, B1-
              if (['A1+', 'A1-', 'B1+', 'B1-'].includes(peripheralPinName)) {
                outerStepper.processCoils(
                  !!buf['A1+'],
                  !!buf['B1+'],
                  !!buf['A1-'],
                  !!buf['B1-'],
                );
              }
              // Inner motor coils: A2+, A2-, B2+, B2-
              if (['A2+', 'A2-', 'B2+', 'B2-'].includes(peripheralPinName)) {
                innerStepper.processCoils(
                  !!buf['A2+'],
                  !!buf['B2+'],
                  !!buf['A2-'],
                  !!buf['B2-'],
                );
              }
            }

            // --- NeoPixel Emulation (WS2812B protocol) ---
            // Handled via addRawListener above — every edge is captured without deduplication.

            // --- A4988 Stepper Driver Emulation ---
            // Bridges STEP/DIR from Arduino to the stepper motor connected on 1A/1B/2A/2B
            if (peripheralNode.data?.type === 'a4988') {
              if (peripheralPinName === 'STEP' || peripheralPinName === 'DIR') {
                const buf = this.peripheralPinBuffers.get(peripheralId)!;
                buf[peripheralPinName] = isHigh;

                // Find the stepper motor connected to this A4988's motor pins
                const motorEdges = currentStateStore.edges.filter(e =>
                  (e.source === peripheralId && ['1A','1B','2A','2B'].includes(e.sourceHandle || '')) ||
                  (e.target === peripheralId && ['1A','1B','2A','2B'].includes(e.targetHandle || ''))
                );

                const motorNodeId = motorEdges.length > 0
                  ? (motorEdges[0].source === peripheralId ? motorEdges[0].target : motorEdges[0].source)
                  : null;

                if (motorNodeId) {
                  const motorNode = currentStateStore.nodes.find(n => n.id === motorNodeId);
                  const isBiaxial = motorNode?.data?.type === 'biaxial-stepper';

                  if (isBiaxial) {
                    // Determine which shaft this A4988 drives by inspecting which biaxial pins are wired
                    const biaxialEdges = currentStateStore.edges.filter(e =>
                      (e.source === peripheralId && motorEdges.some(me => me === e)) ||
                      (e.target === peripheralId && motorEdges.some(me => me === e))
                    );
                    const connectedBiaxialPins = biaxialEdges.map(e =>
                      e.source === motorNodeId ? e.sourceHandle : e.targetHandle
                    );
                    const isInner = connectedBiaxialPins.some(p => p && ['A2+','A2-','B2+','B2-'].includes(p));
                    const shaftKey = isInner ? `${motorNodeId}__inner` : `${motorNodeId}__outer`;
                    const shaftLabel = isInner ? 'inner' : 'outer';

                    if (!this.stepperEmulators.has(shaftKey)) {
                      console.log(`[BIAXIAL] Wiring A4988 STEP/DIR emulator for ${shaftLabel} shaft of node ${motorNodeId}`);
                      let pending: { angle: number; energized: boolean } | null = null;
                      let rafPending = false;
                      this.stepperEmulators.set(shaftKey, new StepperEmulator(({ angle, energized }) => {
                        pending = { angle, energized };
                        if (!rafPending) {
                          rafPending = true;
                          requestAnimationFrame(() => {
                            rafPending = false;
                            if (pending) {
                              const { angle: a, energized: e } = pending;
                              pending = null;
                              const prop = isInner ? 'innerHandAngle' : 'outerHandAngle';
                              const energizedProp = isInner ? 'innerEnergized' : 'outerEnergized';
                              updateNodeData(motorNodeId, { [prop]: a, [energizedProp]: e });
                            }
                          });
                        }
                      }, { stepsPerRev: 200 }, `${motorNodeId}-${shaftLabel}`));
                    }
                    const stepper = this.stepperEmulators.get(shaftKey)!;
                    if (peripheralPinName === 'DIR') {
                      stepper.setDirection(isHigh);
                    } else if (peripheralPinName === 'STEP') {
                      stepper.processStep(isHigh);
                    }
                  } else {
                    // Standard single stepper motor
                    if (!this.stepperEmulators.has(motorNodeId)) {
                      console.log(`[STEPPER] Wiring A4988 STEP/DIR emulator for motor node ${motorNodeId}`);
                      let pendingUpdate: { angle: number; stepCount: number; energized: boolean } | null = null;
                      let rafScheduled = false;
                      this.stepperEmulators.set(motorNodeId, new StepperEmulator(({ angle, stepCount, energized }) => {
                        pendingUpdate = { angle, stepCount, energized };
                        if (!rafScheduled) {
                          rafScheduled = true;
                          requestAnimationFrame(() => {
                            rafScheduled = false;
                            if (pendingUpdate) {
                              const { angle: a, stepCount: s, energized: e } = pendingUpdate;
                              pendingUpdate = null;
                              updateNodeData(motorNodeId, {
                                angle: a,
                                value: `${a.toFixed(1)}°`,
                                units: `${s > 0 ? '+' : ''}${s} steps`,
                                arrow: e ? '#BEF264' : '',
                              });
                            }
                          });
                        }
                      }, { stepsPerRev: 200 }, motorNodeId));
                    }
                    const stepper = this.stepperEmulators.get(motorNodeId)!;
                    if (peripheralPinName === 'DIR') {
                      stepper.setDirection(isHigh);
                    } else if (peripheralPinName === 'STEP') {
                      stepper.processStep(isHigh);
                    }
                  }
                }
              }
            }

            // Update the target peripheral's UI state so standard Leap Elements react
            // Skip for complex peripherals that manage their own state
            if (!isComplexPeripheral) {
              const currentPinStates = peripheralNode.data?.pinStates || {};
              if (currentPinStates[`pin_${peripheralPinName}`] !== isHigh) {
                updateNodeData(peripheralId, {
                  pinStates: {
                    ...currentPinStates,
                    [`pin_${peripheralPinName}`]: isHigh
                  }
                });
              }
            }
          }
        };

        // Attach to the simulation runner
        simulationRunner.addListener(avrPin, listener);

        // For NeoPixel DIN pins: also attach a RAW listener that fires on every edge
        // (WS2812B protocol requires every HIGH/LOW transition, dedup breaks it)
        let neoRawListener: ((portLetter: string, bit: number, isHigh: boolean, cycles: number) => void) | null = null;
        const peripheralNodeForNeo = nodes.find(n => n.id === peripheralId);
        if (
          peripheralNodeForNeo &&
          ['neopixel', 'neopixel-matrix', 'led-ring'].includes(peripheralNodeForNeo.data?.type) &&
          peripheralPinName === 'DIN'
        ) {
          const neoType = peripheralNodeForNeo.data.type;
          const numPixels = neoType === 'neopixel' ? 1
            : neoType === 'led-ring' ? (peripheralNodeForNeo.data?.pixels ?? 16)
            : (peripheralNodeForNeo.data?.rows ?? 8) * (peripheralNodeForNeo.data?.cols ?? 8);

          const emitter = new NeoPixelEmulator(numPixels, 16, (pixels) => {
            if (neoType === 'neopixel' && pixels.length > 0) {
              updateNodeData(peripheralId, {
                neopixelR: pixels[0].r / 255,
                neopixelG: pixels[0].g / 255,
                neopixelB: pixels[0].b / 255,
              });
            } else {
              updateNodeData(peripheralId, { neopixelPixels: pixels });
            }
          });
          this.neoPixelEmulators.set(peripheralId, emitter);

          neoRawListener = (_portLetter, _bit, isHigh, cycles) => {
            emitter.processSignal(isHigh, cycles);
          };
          simulationRunner.addRawListener(avrPin, neoRawListener);
        }

        // Store the unsubscribe thunk to clean up if the wire is deleted
        this.activeSubscriptions.set(edge.id, () => {
          simulationRunner.removeListener(avrPin, listener);
          if (neoRawListener) simulationRunner.removeRawListener(avrPin, neoRawListener);
        });

        // PIR: inject the initial pin state once after the AVR has had a chance to
        // run setup() and configure DDR. We defer by one event-loop turn so the
        // AVR tick loop starts first and the sketch's pinMode() runs before we set
        // the external pin value.
        const peripheralNodeForPIR = nodes.find(n => n.id === peripheralId);
        if (
          peripheralNodeForPIR?.data?.type === 'pir-motion-sensor' &&
          peripheralPinName === 'OUT'
        ) {
          const initialMotion = peripheralNodeForPIR.data?.sensorValues?.motionDetected ?? false;
          // Delay 200ms — enough for setup() to run and configure pinMode
          setTimeout(() => {
            simulationRunner.setVirtualInput(avrPin, initialMotion);
            console.log(`[FORGE CIRCUIT] PIR (${peripheralId}) initial state injected: ${initialMotion ? 'HIGH' : 'LOW'} on ${avrPin}`);
          }, 200);
        }
      });
    });
  }

  /**
   * Push live MPU6050 sensor values from the SensorOverlay sliders into the I2C emulator.
   * Called whenever any slider changes.
   */
  public pushMPU6050Values(nodeId: string, values: {
    accelX: number; accelY: number; accelZ: number;
    gyroX: number;  gyroY: number;  gyroZ: number;
    temp: number;
  }) {
    const slave = this.mpu6050Slaves.get(nodeId);
    if (slave) {
      slave.setSensorValues(values);
    }
  }

  /**
   * Called by interactive UI nodes (e.g. Buttons, PIR sensors) to push signals backwards into the board.
   * Finds the wire connected to the given peripheral pin and injects the signal into the AVR.
   */
  public pushInputSignal(nodeId: string, pinName: string, isHigh: boolean) {
    console.log(`[FORGE CIRCUIT] Peripheral Node ${nodeId} requesting inject on pin ${pinName} to ${isHigh ? 'HIGH' : 'LOW'}`);
    const { edges, nodes } = useForgeStore.getState();

    // Find the wire attached to this input peripheral pin.
    // LeapNode renders two handles per pin:
    //   source handle id = pinName          (e.g. "OUT")
    //   target handle id = pinName__target  (e.g. "OUT__target")
    // ReactFlow stores whichever handle the user connected from/to.
    // We must match both variants.
    const wire = edges.find(e => {
      const srcMatch = e.source === nodeId &&
        (e.sourceHandle === pinName || e.sourceHandle === `${pinName}__target`);
      const tgtMatch = e.target === nodeId &&
        (e.targetHandle === pinName || e.targetHandle === `${pinName}__target`);
      return srcMatch || tgtMatch;
    });

    if (!wire) {
      console.warn(`[FORGE CIRCUIT] PIR/Input: no wire found for node ${nodeId} pin ${pinName}`);
      return;
    }

    // The board is the OTHER end of the wire
    const boardNodeId = wire.source === nodeId ? wire.target : wire.source;
    const boardPinName = wire.source === nodeId ? wire.targetHandle : wire.sourceHandle;

    if (!boardPinName) return;
    const boardNode = nodes.find(n => n.id === boardNodeId);
    if (!boardNode) return;

    // Strip the __target suffix if present — convertArduinoPin expects the bare pin number
    const cleanBoardPin = boardPinName.replace(/__target$/, '');

    // Convert back to AVR mapping
    const mapping = simulationRunner.convertArduinoPin(cleanBoardPin);
    if (mapping) {
      if (mapping.adcChannel !== undefined) {
        // --- Analog Mapping ---
        const peripheralNode = nodes.find(n => n.id === nodeId);
        const sensorValue = peripheralNode?.data?.sensorValues?.value ?? 0;
        const voltage = sensorValue > 5 ? (sensorValue / 1023) * 5.0 : sensorValue;
        simulationRunner.setAnalogInput(mapping.adcChannel, voltage);
        console.log(`[FORGE CIRCUIT] Analog Signal: Peripheral[${nodeId}] pin ${pinName} -> ${voltage.toFixed(2)}V on channel ${mapping.adcChannel}`);
      } else {
        // --- Digital Mapping ---
        simulationRunner.setVirtualInput(mapping.avrPin, isHigh);
        console.log(`[FORGE CIRCUIT] Digital Signal: Peripheral[${nodeId}] pin ${pinName} -> ${isHigh ? 'HIGH' : 'LOW'} on AVR ${mapping.avrPin}`);
      }
    } else {
      console.warn(`[FORGE CIRCUIT] pushInputSignal: could not map board pin '${cleanBoardPin}' to AVR pin`);
    }
  }
}

export const circuitEngine = new CircuitEngine();
