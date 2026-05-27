/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { memo, useRef, useEffect, useMemo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { getComponentPins } from '../../lib/PinMap';
import { useForgeStore } from '../../../utlis/store/useForgeStore';
import { SensorOverlay } from './SensorOverlay';
import { StepperMotorNode } from './StepperMotorNode';

// This is a generic wrapper for our internalized Leap elements (rebranded Leap)
export const LeapNode = memo(({ id, data, selected }: NodeProps) => {
  if (data.type === 'stepperMotor') {
    return <StepperMotorNode nodeId={id} data={data} selected={selected} />;
  }

  const selectedNodeId = useForgeStore((state) => state.selectedNodeId);
  const edges = useForgeStore((state) => state.edges);
  const isSimulating = useForgeStore((state) => state.isSimulating);
  const isSelected = selected || selectedNodeId === id;

  // Build a Set of pin names on this node that have at least one wire connected.
  // This powers the Wokwi-style green glow on wired pins.
  const connectedPinNames = useMemo(() => {
    const set = new Set<string>();
    for (const edge of edges) {
      if (edge.source === id && edge.sourceHandle) {
        set.add(edge.sourceHandle.replace(/__target$/, ''));
      }
      if (edge.target === id && edge.targetHandle) {
        set.add(edge.targetHandle.replace(/__target$/, ''));
      }
    }
    return set;
  }, [edges, id]);

  // I2C variants map to the same element as their parallel counterpart
  const elementType = data.type === 'lcd1602-i2c' ? 'lcd1602'
    : data.type === 'lcd2004-i2c' ? 'lcd2004'
      : data.type;
  const Tag = `leap-${elementType}` as any;
  const pins = getComponentPins(data.type);

  // Custom styling for the node container
  const nodeStyle: React.CSSProperties = {
    padding: 0,
    borderRadius: '4px',
    background: 'transparent',
    border: `1px solid ${isSelected ? '#BEF264' : 'transparent'}`,
    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), border 0.2s ease-out',
    transform: `rotate(${data.rotation || 0}deg) scale(0.75)`,
    transformOrigin: 'center',
    position: 'relative',
    boxSizing: 'border-box'
  };

  // ── Hardware Property Mapper ──
  // Translating electrical logic (HIGH/LOW on pins) directly into Leap's visual attributes!
  const mappedProps: any = { ...data };

  if (data.type === 'led') {
    // Hardware pins are "Anode" and "Cathode". Using pin_Anode for state.
    mappedProps.value = data.pinStates?.pin_Anode === true || data.pinStates?.pin_A === true;
    mappedProps.brightness = data.brightness ?? (mappedProps.value ? 1.0 : 0.0);
    mappedProps.damaged = false;
  } else if (data.type === 'rgb-led') {
    // RGB LED uses Red, Green, and Blue channels relative to Common pin (COM)
    // We expect intensity per channel if provided by CircuitEngine, otherwise fallback to digital
    mappedProps.ledRed = data.pinStates?.pin_R === true ? (data.intensity_R ?? 1.0) : 0;
    mappedProps.ledGreen = data.pinStates?.pin_G === true ? (data.intensity_G ?? 1.0) : 0;
    mappedProps.ledBlue = data.pinStates?.pin_B === true ? (data.intensity_B ?? 1.0) : 0;
    mappedProps.damaged = false;
  } else if (data.type === 'buzzer') {
    // Buzzers use Pin 2 as Positive (Red) signal pin as per spec
    if (data.pinStates?.pin_PIEZO === true || data.pinStates?.pin_1 === true || data.pinStates?.pin_2 === true || data.pinStates?.pin_SIG === true) {
      mappedProps.hasSignal = true;
      mappedProps.intensity = data.intensity ?? 1.0;
      mappedProps.damaged = false;
      mappedProps.mode = data.mode ?? 'smooth';
      mappedProps.volume = data.volume ?? 1.0;
    } else {
      mappedProps.hasSignal = false;
      mappedProps.mode = data.mode ?? 'smooth';
      mappedProps.volume = data.volume ?? 1.0;
    }
  } else if (data.type === 'servo') {
    // Servos use the 'angle' property calculated in CircuitEngine
    mappedProps.angle = data.angle ?? 0;
  } else if (data.type === 'dc-motor') {
    // DC Motor: speed and direction from CircuitEngine
    mappedProps.speed = data.speed ?? 0;
    mappedProps.direction = data.direction ?? 'cw';
  } else if (data.type === 'stepper-motor') {
    mappedProps.angle = data.angle ?? 0;
    mappedProps.value = data.value ?? '';
    mappedProps.units = data.units ?? '';
    mappedProps.arrow = data.arrow ?? '';
    mappedProps.display = data.display ?? 'steps';
    mappedProps.gearRatio = data.gearRatio ?? '1:1';
    mappedProps.energized = data.energized ?? false;
    mappedProps.stepCount = data.stepCount ?? 0;
  } else if (data.type === 'ks2e-m-dc5') {
    // Relay: energized when COIL1 is HIGH (COIL2 is typically GND)
    mappedProps.energized = data.relayEnergized ?? false;
  } else if (data.type === 'relay-module') {
    // Relay Module: energized when IN pin is HIGH
    mappedProps.energized = data.relayEnergized ?? false;
    mappedProps.led = data.relayEnergized ?? false;
  } else if (data.type === 'biaxial-stepper') {
    mappedProps.outerHandAngle = data.outerHandAngle ?? 0;
    mappedProps.innerHandAngle = data.innerHandAngle ?? 0;
    mappedProps.outerHandColor = data.outerHandColor ?? 'gold';
    mappedProps.innerHandColor = data.innerHandColor ?? 'silver';
    mappedProps.outerHandShape = data.outerHandShape ?? 'plain';
    mappedProps.innerHandShape = data.innerHandShape ?? 'plain';
    mappedProps.outerHandLength = data.outerHandLength ?? 30;
    mappedProps.innerHandLength = data.innerHandLength ?? 30;
  } else if (['potentiometer', 'slide-potentiometer', 'ntc-temperature-sensor', 'mq2', 'resistor'].includes(data.type)) {
    // Analog sensors (and resistors) use the 'value' from sensorValues
    mappedProps.value = data.sensorValues?.value ?? (data.type === 'ntc-temperature-sensor' ? 25 : 0);
  } else if (data.type === 'photoresistor-sensor') {
    // Photoresistor: pass lux value, threshold, and LED states
    const sv = data.sensorValues ?? {};
    const lux = Number(sv.value ?? 500);
    const threshold = Number(sv.threshold ?? 500);
    mappedProps.value = lux;
    mappedProps.threshold = threshold;
    mappedProps.ledPower = true;                  // always on when placed
    mappedProps.ledDO = lux < threshold;       // DO LED mirrors comparator output
  } else if (data.type === 'flame-sensor') {
    // Flame sensor: pass intensity, threshold, and LED states
    const sv = data.sensorValues ?? {};
    const intensity = Number(sv.value ?? 0);
    const threshold = Number(sv.threshold ?? 50);
    const flameOn = intensity > threshold;
    mappedProps.value = intensity;
    mappedProps.threshold = threshold;
    mappedProps.ledPower = true;                  // always on when placed
    mappedProps.ledSignal = flameOn;               // signal LED on when flame detected
  } else if (data.type === 'gas-sensor') {
    // Gas sensor: pass concentration, threshold, and LED states
    const sv = data.sensorValues ?? {};
    const concentration = Number(sv.value ?? 0);
    const threshold = Number(sv.threshold ?? 50);
    const gasDetected = concentration > threshold;
    mappedProps.value = concentration;
    mappedProps.threshold = threshold;
    mappedProps.ledPower = true;
    mappedProps.ledD0 = gasDetected;
  } else if (data.type === 'heart-beat-sensor') {
    // Heart rate sensor: pass BPM, current beat phase, and live ADC value
    mappedProps.bpm = data.sensorValues?.bpm ?? 72;
    mappedProps.beatPhase = data.sensorValues?.beatPhase ?? 0;
    mappedProps.adcValue = data.sensorValues?.adcValue ?? 512;
  } else if (data.type === 'big-sound-sensor' || data.type === 'small-sound-sensor') {
    // Sound sensors: pass level, threshold, and LED states
    const sv = data.sensorValues ?? {};
    const level = Number(sv.value ?? 0);
    const threshold = Number(sv.threshold ?? 50);
    const soundOn = level > threshold;
    mappedProps.value = level;
    mappedProps.threshold = threshold;
    if (data.type === 'big-sound-sensor') {
      mappedProps.led1 = true;      // power LED
      mappedProps.led2 = soundOn;   // signal LED
    } else {
      mappedProps.ledPower = true;
      mappedProps.ledSignal = soundOn;
    }
  } else if (data.type === 'hx711') {
    // HX711 load cell amplifier: pass weight and max capacity
    mappedProps.weight = data.sensorValues?.weight ?? 0;
    mappedProps.maxWeight = data.sensorValues?.maxWeight ?? 5000;
  } else if (data.type === 'lcd1602' || data.type === 'lcd2004' || data.type === 'lcd1602-i2c' || data.type === 'lcd2004-i2c') {
    // LCD Displays map the internal emulator state to visual properties
    const state = data.lcdState;
    // I2C variants render with i2c pins, parallel variants with full pins
    mappedProps.pins = (data.type === 'lcd1602-i2c' || data.type === 'lcd2004-i2c') ? 'i2c' : 'full';
    if (state) {
      mappedProps.characters = new Uint8Array(state.characters);
      mappedProps.cursorX = state.cursorX;
      mappedProps.cursorY = state.cursorY;
      mappedProps.cursor = state.cursor;
      mappedProps.blink = state.blink;
      mappedProps.backlight = state.backlight;
    }
  } else if (data.type === 'led-bar-graph') {
    // LED Bar Graph has 10 segments controlled by pins A1 to A10
    const values = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 10; i++) {
      values[i] = data.pinStates?.[`pin_A${i + 1}`] === true ? 1 : 0;
    }
    mappedProps.values = values;
  } else if (data.type === '7segment') {
    // 7-segment: map segValues [A,B,C,D,E,F,G,DP] written by CircuitEngine
    // Falls back to all-off if no simulation data yet
    const segValues = data.segValues ?? [0, 0, 0, 0, 0, 0, 0, 0];
    console.log(`[LEAP NODE 7SEG] Rendering 7-segment with values:`, segValues);
    mappedProps.values = segValues;
  } else if (data.type === 'ssd1306') {
    // SSD1306 OLED: pass ImageData decoded by CircuitEngine from the I2C pixel buffer
    if (data.oledImageData) {
      mappedProps.imageData = data.oledImageData;
    }
  } else if (data.type === 'ili9341') {
    // ILI9341 TFT: pass RGBA ImageData decoded by CircuitEngine from the SPI pixel stream
    if (data.tftImageData) {
      mappedProps.imageData = data.tftImageData;
    }
  } else if (data.type === 'pir-motion-sensor') {
    // PIR: reflect the simulated motion state onto the visual element
    mappedProps.motionDetected = data.sensorValues?.motionDetected ?? false;
  } else if (data.type === 'mpu6050') {
    // MPU6050: pass all 7 sensor values to the visual element
    const sv = data.sensorValues ?? {};
    mappedProps.accelX = sv.accelX ?? 0;
    mappedProps.accelY = sv.accelY ?? 0;
    mappedProps.accelZ = sv.accelZ ?? 1;
    mappedProps.gyroX = sv.gyroX ?? 0;
    mappedProps.gyroY = sv.gyroY ?? 0;
    mappedProps.gyroZ = sv.gyroZ ?? 0;
    mappedProps.temp = sv.temp ?? 25;
  } else if (data.type === 'neopixel') {
    // Single NeoPixel: map decoded WS2812B RGB values (0-1 range)
    mappedProps.r = data.neopixelR ?? 0;
    mappedProps.g = data.neopixelG ?? 0;
    mappedProps.b = data.neopixelB ?? 0;
  } else if (data.type === 'neopixel-matrix' || data.type === 'led-ring') {
    // NeoPixel Matrix / LED Ring: pass through configuration
    if (data.type === 'neopixel-matrix') {
      mappedProps.rows = data.rows ?? 8;
      mappedProps.cols = data.cols ?? 8;
    } else {
      mappedProps.pixels = Array.isArray(data.pixels) ? (data.numPixels ?? data.pixels.length) : (data.pixels ?? 16);
    }
    mappedProps.neopixelPixels = data.neopixelPixels ?? [];
  }

  // ── Ref for NeoPixel DOM access (setPixel requires DOM methods) ──
  const elementRef = useRef<any>(null);

  // Push ImageData to ILI9341 / SSD1306 canvas elements via DOM property assignment
  // (React JSX spread doesn't reliably set complex object properties on Web Components)
  useEffect(() => {
    if (!elementRef.current) return;
    if (data.type === 'ili9341' && data.tftImageData) {
      elementRef.current.imageData = data.tftImageData;
    } else if (data.type === 'ssd1306' && data.oledImageData) {
      console.log(`[LEAP NODE OLED] useEffect: setting imageData on element. ref=${!!elementRef.current}, imageData=${data.oledImageData?.width}×${data.oledImageData?.height}`);
      elementRef.current.imageData = data.oledImageData;
      console.log(`[LEAP NODE OLED] imageData set ✓`);
    }
  }, [data.tftImageData, data.oledImageData, data.type]);

  // Imperatively set LCD characters as DOM property.
  // Uint8Array / array props must be set directly — JSX spread stringifies them.
  useEffect(() => {
    const isLcd = data.type === 'lcd1602' || data.type === 'lcd2004' ||
      data.type === 'lcd1602-i2c' || data.type === 'lcd2004-i2c';
    if (!elementRef.current || !isLcd || !data.lcdState) return;
    const el = elementRef.current;
    const state = data.lcdState;
    el.characters = new Uint8Array(state.characters);
    el.cursorX = state.cursorX ?? 0;
    el.cursorY = state.cursorY ?? 0;
    el.cursor = state.cursor ?? false;
    el.blink = state.blink ?? false;
    el.backlight = state.backlight ?? true;
  }, [data.type, data.lcdState]);

  // Imperatively set LED value/brightness as DOM properties.
  // React JSX sets boolean/number props as string attributes on Web Components,
  // which breaks Lit's @property() binding. Direct assignment bypasses this.
  useEffect(() => {
    if (!elementRef.current || data.type !== 'led') return;
    const el = elementRef.current;
    const isOn = data.pinStates?.pin_Anode === true || data.pinStates?.pin_A === true;
    el.value = isOn;
    el.brightness = isOn ? (data.brightness ?? 1.0) : 0.0;
  }, [data.type, data.pinStates, data.brightness]);

  // Imperatively set RGB LED channel values as DOM properties.
  useEffect(() => {
    if (!elementRef.current || data.type !== 'rgb-led') return;
    const el = elementRef.current;
    el.ledRed = data.pinStates?.pin_R === true ? (data.intensity_R ?? 1.0) : 0;
    el.ledGreen = data.pinStates?.pin_G === true ? (data.intensity_G ?? 1.0) : 0;
    el.ledBlue = data.pinStates?.pin_B === true ? (data.intensity_B ?? 1.0) : 0;
  }, [data.type, data.pinStates, data.intensity_R, data.intensity_G, data.intensity_B]);

  // Imperatively set single NeoPixel r/g/b as DOM properties.
  useEffect(() => {
    if (!elementRef.current || data.type !== 'neopixel') return;
    const el = elementRef.current;
    el.r = data.neopixelR ?? 0;
    el.g = data.neopixelG ?? 0;
    el.b = data.neopixelB ?? 0;
  }, [data.type, data.neopixelR, data.neopixelG, data.neopixelB]);

  // Imperatively set NeoPixel Matrix / LED Ring pixels as DOM properties.
  useEffect(() => {
    if (!elementRef.current || !['neopixel-matrix', 'led-ring'].includes(data.type)) return;
    const el = elementRef.current;
    const pixels = data.neopixelPixels ?? [];
    if (el.setPixel) {
      pixels.forEach((p: any, i: number) => {
        // Normalize 0-255 to 0-1 as expected by the Lit elements
        const rgb = {
          r: (p.r ?? 0) / 255,
          g: (p.g ?? 0) / 255,
          b: (p.b ?? 0) / 255
        };

        if (data.type === 'neopixel-matrix') {
          const cols = (el as any).cols || 8;
          const row = Math.floor(i / cols);
          const col = i % cols;
          el.setPixel(row, col, rgb);
        } else {
          // 1D elements like LED Ring or simple NeoPixel strips
          el.setPixel(i, rgb);
        }
      });
    }
  }, [data.type, data.neopixelPixels]);

  // Imperatively set servo angle as DOM property.
  // React JSX sets number props as string attributes on Web Components.
  useEffect(() => {
    if (!elementRef.current || data.type !== 'servo') return;
    const el = elementRef.current;
    const angle = data.angle ?? 0;
    el.angle = angle;
  }, [data.type, data.angle]);

  // Imperatively set dc-motor speed and direction as DOM properties.
  useEffect(() => {
    if (!elementRef.current || data.type !== 'dc-motor') return;
    const el = elementRef.current;
    el.speed = data.speed ?? 0;
    el.direction = data.direction ?? 'cw';
  }, [data.type, data.speed, data.direction]);

  // Imperatively set stepper-motor angle as DOM property.
  // Same issue as servo — Lit @property({ type: Number }) needs a real number, not a string attribute.
  useEffect(() => {
    if (!elementRef.current || data.type !== 'stepper-motor') return;
    const el = elementRef.current;
    el.angle = data.angle ?? 0;
    el.arrow = data.arrow ?? '';
    el.display = data.display ?? 'steps';
    el.gearRatio = data.gearRatio ?? '1:1';
    el.energized = data.energized ?? false;
    el.stepCount = data.stepCount ?? 0;
  }, [data.type, data.angle, data.arrow, data.display, data.gearRatio, data.energized, data.stepCount]);

  // Imperatively set biaxial-stepper hand angles as DOM properties.
  useEffect(() => {
    if (!elementRef.current || data.type !== 'biaxial-stepper') return;
    const el = elementRef.current;
    el.outerHandAngle = data.outerHandAngle ?? 0;
    el.innerHandAngle = data.innerHandAngle ?? 0;
  }, [data.type, data.outerHandAngle, data.innerHandAngle]);

  // Push pixel data to matrix/ring elements via DOM setPixel() method
  useEffect(() => {
    if (!elementRef.current || !data.neopixelPixels) return;
    const el = elementRef.current;
    const pixels = data.neopixelPixels;

    if (data.type === 'neopixel-matrix' && typeof el.setPixel === 'function') {
      const cols = data.cols ?? 8;
      for (let i = 0; i < pixels.length; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        el.setPixel(row, col, {
          r: pixels[i].r / 255,
          g: pixels[i].g / 255,
          b: pixels[i].b / 255,
        });
      }
      // Trigger re-render after all pixels are set
      if (typeof el.requestUpdate === 'function') el.requestUpdate();
    } else if (data.type === 'led-ring' && typeof el.setPixel === 'function') {
      for (let i = 0; i < pixels.length; i++) {
        el.setPixel(i, {
          r: pixels[i].r / 255,
          g: pixels[i].g / 255,
          b: pixels[i].b / 255,
        });
      }
      // Trigger re-render if the element has a render method
      if (typeof el.requestUpdate === 'function') el.requestUpdate();
    }
  }, [data.neopixelPixels, data.type, data.cols]);

  // Wire membrane-keypad DOM button-press/release events into the circuit engine
  useEffect(() => {
    const el = elementRef.current;
    if (!el || data.type !== 'membrane-keypad') return;

    const handlePress = (e: Event) => {
      const key = (e as CustomEvent).detail?.key ?? null;
      import('../../engine/Arduino/CircuitEngine').then(({ circuitEngine }) => {
        circuitEngine.pushKeypadKey(id, key);
      });
    };
    const handleRelease = () => {
      import('../../engine/Arduino/CircuitEngine').then(({ circuitEngine }) => {
        circuitEngine.pushKeypadKey(id, null);
      });
    };

    el.addEventListener('button-press', handlePress);
    el.addEventListener('button-release', handleRelease);
    return () => {
      el.removeEventListener('button-press', handlePress);
      el.removeEventListener('button-release', handleRelease);
    };
  }, [data.type, id]);

  // Wire rotary-dialer DOM dial-start events into the circuit engine
  useEffect(() => {
    const el = elementRef.current;
    if (!el || data.type !== 'rotary-dialer') return;

    const handleDialStart = (e: Event) => {
      const digit = (e as CustomEvent).detail?.digit ?? 0;
      import('../../engine/Arduino/CircuitEngine').then(({ circuitEngine }) => {
        circuitEngine.pushRotaryDialerDigit(id, digit);
      });
    };

    el.addEventListener('dial-start', handleDialStart);
    return () => {
      el.removeEventListener('dial-start', handleDialStart);
    };
  }, [data.type, id]);

  // Wire tilt-switch DOM tilt-toggle events into the circuit engine
  useEffect(() => {
    const el = elementRef.current;
    if (!el || data.type !== 'tilt-switch') return;

    const handleTiltToggle = (e: Event) => {
      const tilted = (e as CustomEvent).detail?.tilted ?? false;
      import('../../engine/Arduino/CircuitEngine').then(({ circuitEngine }) => {
        circuitEngine.pushTiltSwitchState(id, tilted);
      });
    };

    el.addEventListener('tilt-toggle', handleTiltToggle);

    // Set initial state on mount
    const initialTilted = data.sensorValues?.tilted ?? false;
    import('../../engine/Arduino/CircuitEngine').then(({ circuitEngine }) => {
      circuitEngine.pushTiltSwitchState(id, initialTilted);
    });

    return () => {
      el.removeEventListener('tilt-toggle', handleTiltToggle);
    };
  }, [data.type, id]);

  // Wire slide-switch DOM input events into the circuit engine
  useEffect(() => {
    const el = elementRef.current;
    if (!el || data.type !== 'slide-switch') return;

    const handleInput = (e: Event) => {
      const value = (e as CustomEvent).detail ?? (el as any).value ?? 0;
      import('../../engine/Arduino/CircuitEngine').then(({ circuitEngine }) => {
        circuitEngine.pushSlideSwitchState(id, value);
      });
    };

    el.addEventListener('input', handleInput);

    // Set initial state on mount
    const initialValue = data.value ?? 0;
    import('../../engine/Arduino/CircuitEngine').then(({ circuitEngine }) => {
      circuitEngine.pushSlideSwitchState(id, initialValue);
    });

    return () => {
      el.removeEventListener('input', handleInput);
    };
  }, [data.type, id, data.value]);

  // Wire KY-040 rotary encoder DOM events into the circuit engine
  useEffect(() => {
    const el = elementRef.current;
    if (!el || data.type !== 'ky-040') return;

    const handleRotateCW = () => {
      import('../../engine/Arduino/CircuitEngine').then(({ circuitEngine }) => {
        circuitEngine.pushRotaryEncoderCW(id);
      });
    };

    const handleRotateCCW = () => {
      import('../../engine/Arduino/CircuitEngine').then(({ circuitEngine }) => {
        circuitEngine.pushRotaryEncoderCCW(id);
      });
    };

    // SW button is handled by standard button-press/button-release events
    const handlePress = () => {
      import('../../engine/Arduino/CircuitEngine').then(({ circuitEngine }) => {
        circuitEngine.pushInputSignal(id, 'SW', false); // Active LOW
      });
    };

    const handleRelease = () => {
      import('../../engine/Arduino/CircuitEngine').then(({ circuitEngine }) => {
        circuitEngine.pushInputSignal(id, 'SW', true); // Pull-up HIGH
      });
    };

    el.addEventListener('rotate-cw', handleRotateCW);
    el.addEventListener('rotate-ccw', handleRotateCCW);
    el.addEventListener('button-press', handlePress);
    el.addEventListener('button-release', handleRelease);

    // Set initial state (idle: CLK and DT HIGH with pull-ups, SW HIGH)
    // Use setTimeout to ensure this happens after component is fully mounted
    const initTimer = setTimeout(() => {
      import('../../engine/Arduino/CircuitEngine').then(({ circuitEngine }) => {
        circuitEngine.pushInputSignal(id, 'CLK', true);
        circuitEngine.pushInputSignal(id, 'DT', true);
        circuitEngine.pushInputSignal(id, 'SW', true);  // SW must start HIGH (pull-up)
        console.log(`[KY-040] Initial state set: CLK=HIGH, DT=HIGH, SW=HIGH for node ${id}`);
      });
    }, 100);

    return () => {
      clearTimeout(initTimer);
      el.removeEventListener('rotate-cw', handleRotateCW);
      el.removeEventListener('rotate-ccw', handleRotateCCW);
      el.removeEventListener('button-press', handlePress);
      el.removeEventListener('button-release', handleRelease);
    };
  }, [data.type, id]);

  // Wire IR remote DOM button-press/release events into the circuit engine
  useEffect(() => {
    const el = elementRef.current;
    if (!el || data.type !== 'ir-remote') return;

    const handlePress = (e: Event) => {
      const irCode = (e as CustomEvent).detail?.irCode ?? 0;
      import('../../engine/Arduino/CircuitEngine').then(({ circuitEngine }) => {
        circuitEngine.pushIRRemoteButton(id, irCode, true);
      });
    };

    const handleRelease = (e: Event) => {
      const irCode = (e as CustomEvent).detail?.irCode ?? 0;
      import('../../engine/Arduino/CircuitEngine').then(({ circuitEngine }) => {
        circuitEngine.pushIRRemoteButton(id, irCode, false);
      });
    };

    el.addEventListener('button-press', handlePress);
    el.addEventListener('button-release', handleRelease);

    return () => {
      el.removeEventListener('button-press', handlePress);
      el.removeEventListener('button-release', handleRelease);
    };
  }, [data.type, id]);

  // Wire analog-joystick DOM events into the circuit engine
  useEffect(() => {
    const el = elementRef.current;
    if (!el || data.type !== 'analog-joystick') return;

    const handleInput = () => {
      const x = el.xValue ?? 0;
      const y = el.yValue ?? 0;
      import('../../engine/Arduino/CircuitEngine').then(({ circuitEngine }) => {
        circuitEngine.pushJoystickAnalog(id, x, y);
      });
    };

    // Joystick SEL button is typically pulled HIGH externally/internally, goes LOW on press
    const handlePress = () => {
      import('../../engine/Arduino/CircuitEngine').then(({ circuitEngine }) => {
        circuitEngine.pushInputSignal(id, 'SEL', false);
      });
    };
    const handleRelease = () => {
      import('../../engine/Arduino/CircuitEngine').then(({ circuitEngine }) => {
        circuitEngine.pushInputSignal(id, 'SEL', true);
      });
    };

    el.addEventListener('input', handleInput);
    el.addEventListener('button-press', handlePress);
    el.addEventListener('button-release', handleRelease);

    // Inject the center resting state immediately on mount
    handleInput();
    handleRelease();

    return () => {
      el.removeEventListener('input', handleInput);
      el.removeEventListener('button-press', handlePress);
      el.removeEventListener('button-release', handleRelease);
    };
  }, [data.type, id]);

  // Optional: Fallback for generic elements that listen to 'value'
  if (mappedProps.value === undefined && data.value !== undefined) {
    mappedProps.value = data.value;
  }

  return (
    <div style={nodeStyle} className="leap-node-wrapper">
      {/* ── COMPONENT & HANDLES CONTAINER ── */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {/* Dynamic Leap Element */}
        <Tag
          ref={elementRef}
          {...mappedProps}
          onPinStateChange={(pinName: string, state: boolean) => {
            console.log(`[LEAP NODE] Interaction event fired on Node ${data.id}, pin ${pinName} = ${state}`);
            // Lazy load to prevent circular dependencies in React mapping
            import('../../engine/Arduino/CircuitEngine').then(({ circuitEngine }) => {
              circuitEngine.pushInputSignal(data.id || '', pinName, state);
            });
          }}
        />

        {/* ── DYNAMIC PIN HANDLES — Wokwi-style connection indicators with power glow ── */}
        {pins.map((pin, idx) => {
          const pinPosition = pin.y < 50 ? Position.Top : Position.Bottom;
          const isConnected = connectedPinNames.has(pin.name);
          const isPinHigh = data.pinStates?.[`pin_${pin.name}`] === true;

          // Check if this is a power/ground pin
          const isPowerPin = ['VCC', '5V', '3V3', '3.3V', 'VIN', 'POWER', 'V+'].includes(pin.name);
          const isGroundPin = ['GND', 'GROUND', 'V-', 'VSS'].includes(pin.name);

          // Enhanced pin color logic with power visualization:
          //   Power pins (VCC/5V) connected → bright red glow (always powered)
          //   Ground pins (GND) connected → blue glow (ground reference)
          //   Signal pins HIGH → red glow
          //   Signal pins connected but LOW → green
          //   Unconnected → dim gray
          let pinColor = '#475569';
          let pinOpacity = isSelected ? 0.5 : 0.1;
          let pinGlow = 'none';

          if (isConnected) {
            if (isPowerPin) {
              // VCC/5V pins glow bright red when connected (always powered)
              pinColor = '#ef4444';
              pinOpacity = 1.0;
              pinGlow = '0 0 8px #ef4444, 0 0 12px #ef4444';
            } else if (isGroundPin) {
              // GND pins glow blue when connected (ground reference)
              pinColor = '#3b82f6';
              pinOpacity = 0.9;
              pinGlow = '0 0 6px #3b82f6';
            } else if (isSimulating && isPinHigh) {
              // Signal pins glow red when HIGH
              pinColor = '#ef4444';
              pinOpacity = 1.0;
              pinGlow = '0 0 8px #ef4444, 0 0 12px #ef4444';
            } else {
              // Signal pins connected but LOW → green
              pinColor = '#22c55e';
              pinOpacity = 0.9;
            }
          }

          const handleStyle: React.CSSProperties = {
            left: `${pin.x}%`,
            top: `${pin.y}%`,
            width: isConnected ? '5px' : '3px',
            height: isConnected ? '5px' : '3px',
            zIndex: 10,
            pointerEvents: 'all',
            transition: 'all 0.25s ease',
          };

          return (
            <React.Fragment key={`${pin.name}-${idx}`}>
              {/* Hidden handle (target) — renders first, underneath */}
              <Handle
                id={`${pin.name}__target`}
                type="target"
                position={pinPosition}
                style={{
                  ...handleStyle,
                  background: 'transparent',
                  border: 'none',
                  opacity: 0,
                }}
              />
              {/* Visible handle (source) - Enhanced with power glow */}
              <Handle
                id={`${pin.name}`}
                type="source"
                position={pinPosition}
                style={{
                  ...handleStyle,
                  background: pinColor,
                  border: `1px solid ${isConnected ? pinColor : '#334155'}`,
                  borderRadius: '50%',
                  opacity: pinOpacity,
                  boxShadow: pinGlow,
                }}
                title={`${pin.name}${isConnected ? ' ✓' : ''}${isPowerPin ? ' (POWER)' : ''}${isGroundPin ? ' (GND)' : ''}`}
              />
            </React.Fragment>
          );
        })}
      </div>


      {/* ── SENSOR OVERLAY (sliders shown below the node) ── */}
      <SensorOverlay
        nodeId={id}
        type={data.type}
        currentValues={data.sensorValues}
      />
    </div>
  );
});

LeapNode.displayName = 'LeapNode';
