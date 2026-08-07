/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { SevenSegmentElement } from './7segment-element';
import { ArduinoUnoElement } from './arduino-uno-element';
import { BuzzerElement } from './buzzer-element';
import { LCD1602Element } from './lcd1602-element';
import { LCD1602I2CElement } from './lcd1602-i2c-element';
import { LEDElement } from './led-element';
import { MembraneKeypadElement } from './membrane-keypad-element';
import { NeoPixelElement } from './neopixel-element';
import { NeopixelMatrixElement } from './neopixel-matrix-element';
import { PotentiometerElement } from './potentiometer-element';
import { ProximitySensorElement } from './proximity-sensor-element';
import { PushbuttonElement } from './pushbutton-element';
import { Pushbutton6mmElement } from './pushbutton-6mm-element';
import { ResistorElement } from './resistor-element';
import { RotaryDialerElement } from './rotary-dialer-element';
import { RelayModuleElement } from './relay-module-element';
import { SSD1306Element } from './ssd1306-element';
import { ServoElement } from './servo-element';
import { DHT22Element } from './dht22-element';
import { SoilMoistureSensorElement } from './soil-moisture-sensor-element';
// REMOVED: Only Arduino Uno and ESP32-C3 supported
// import { ArduinoMegaElement } from './arduino-mega-element';
// import { ArduinoNanoElement } from './arduino-nano-element';
import { Ds1307Element } from './ds1307-element';
import { LEDRingElement } from './led-ring-element';
import { SlideSwitchElement } from './slide-switch-element';
import { HCSR04Element } from './hc-sr04-element';
import { LCD2004Element } from './lcd2004-element';
import { LCD2004I2CElement } from './lcd2004-i2c-element';
import { AnalogJoystickElement } from './analog-joystick-element';
import { SlidePotentiometerElement } from './slide-potentiometer-element';
import { IRReceiverElement } from './ir-receiver-element';
import { IRRemoteElement } from './ir-remote-element';
import { IRObstacleSensorElement } from './ir-obstacle-sensor-element';
import { PIRMotionSensorElement } from './pir-motion-sensor-element';
import { NTCTemperatureSensorElement } from './ntc-temperature-sensor-element';
import { HeartBeatSensorElement } from './heart-beat-sensor-element';
import { TiltSwitchElement } from './tilt-switch-element';
import { FlameSensorElement } from './flame-sensor-element';
import { GasSensorElement } from './gas-sensor-element';
// import { FranzininhoElement } from './franzininho-element';
// import { NanoRP2040ConnectElement } from './nano-rp2040-connect-element';
import { SmallSoundSensorElement } from './small-sound-sensor-element';
import { BigSoundSensorElement } from './big-sound-sensor-element';
import { MPU6050Element } from './mpu6050-element';
import { ESP32C3Element } from './esp32-c3-element';
import { KY040Element } from './ky-040-element';
import { PhotoresistorSensorElement } from './photoresistor-sensor-element';
import { RGBLedElement } from './rgb-led-element';
import { ILI9341Element } from './ili9341-element';
import { ILI9341TouchElement } from './ili9341-touch-element'; // touch screen option
import { LedBarGraphElement } from './led-bar-graph-element';
import { MicrosdCardElement } from './microsd-card-element';
import { StepperMotorElement } from './stepper-motor-element';
import { HX711Element } from './hx711-element';
import { KS2EMDC5Element } from './ks2e-m-dc5-element';
import { BiaxialStepperElement } from './biaxial-stepper-element';
import type React from 'react';

type LeapElement<T> = Partial<T> & React.ClassAttributes<T>;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'leap-7segment': LeapElement<SevenSegmentElement>;
      'leap-arduino-uno': LeapElement<ArduinoUnoElement>;
      'leap-lcd1602': LeapElement<LCD1602Element>;
      'leap-lcd1602-i2c': LeapElement<LCD1602I2CElement>;
      'leap-led': LeapElement<LEDElement>;
      'leap-neopixel': LeapElement<NeoPixelElement>;
      'leap-pushbutton': LeapElement<PushbuttonElement>;
      'leap-pushbutton-6mm': LeapElement<Pushbutton6mmElement>;
      'leap-resistor': LeapElement<ResistorElement>;
      'leap-membrane-keypad': LeapElement<MembraneKeypadElement>;
      'leap-potentiometer': LeapElement<PotentiometerElement>;
      'leap-proximity-sensor': LeapElement<ProximitySensorElement>;
      'leap-neopixel-matrix': LeapElement<NeopixelMatrixElement>;
      'leap-ssd1306': LeapElement<SSD1306Element>;
      'leap-buzzer': LeapElement<BuzzerElement>;
      'leap-rotary-dialer': LeapElement<RotaryDialerElement>;
      'leap-servo': LeapElement<ServoElement>;
      'leap-dht22': LeapElement<DHT22Element>;
      // REMOVED: Only Arduino Uno and ESP32-C3 supported
      // 'leap-arduino-mega': LeapElement<ArduinoMegaElement>;
      // 'leap-arduino-nano': LeapElement<ArduinoNanoElement>;
      // 'leap-franzininho': LeapElement<FranzininhoElement>;
      // 'leap-nano-rp2040-connect': LeapElement<NanoRP2040ConnectElement>;
      'leap-ds1307': LeapElement<Ds1307Element>;
      'leap-neopixel-ring': LeapElement<LEDRingElement>;
      'leap-slide-switch': LeapElement<SlideSwitchElement>;
      'leap-soil-moisture-sensor': LeapElement<SoilMoistureSensorElement>;
      'leap-hc-sr04': LeapElement<HCSR04Element>;
      'leap-lcd2004': LeapElement<LCD2004Element>;
      'leap-lcd2004-i2c': LeapElement<LCD2004I2CElement>;
      'leap-analog-joystick': LeapElement<AnalogJoystickElement>;
      'leap-slide-potentiometer': LeapElement<SlidePotentiometerElement>;
      'leap-ir-receiver': LeapElement<IRReceiverElement>;
      'leap-ir-remote': LeapElement<IRRemoteElement>;
      'leap-ir-obstacle-sensor': LeapElement<IRObstacleSensorElement>;
      'leap-pir-motion-sensor': LeapElement<PIRMotionSensorElement>;
      'leap-ntc-temperature-sensor': LeapElement<NTCTemperatureSensorElement>;
      'leap-heart-beat-sensor': LeapElement<HeartBeatSensorElement>;
      'leap-tilt-switch': LeapElement<TiltSwitchElement>;
      'leap-flame-sensor': LeapElement<FlameSensorElement>;
      'leap-gas-sensor': LeapElement<GasSensorElement>;
      // 'leap-franzininho': LeapElement<FranzininhoElement>;
      // 'leap-nano-rp2040-connect': LeapElement<NanoRP2040ConnectElement>;
      'leap-small-sound-sensor': LeapElement<SmallSoundSensorElement>;
      'leap-big-sound-sensor': LeapElement<BigSoundSensorElement>;
      'leap-mpu6050': LeapElement<MPU6050Element>;
      'leap-esp32-c3': LeapElement<ESP32C3Element>;
      'leap-ky-040': LeapElement<KY040Element>;
      'leap-photoresistor-sensor': LeapElement<PhotoresistorSensorElement>;
      'leap-rgb-led': LeapElement<RGBLedElement>;
      'leap-ili9341': LeapElement<ILI9341Element>;
      'leap-ili9341-touch': LeapElement<ILI9341TouchElement>;
      'leap-led-bar-graph': LeapElement<LedBarGraphElement>;
      'leap-microsd-card': LeapElement<MicrosdCardElement>;
      'leap-stepper-motor': LeapElement<StepperMotorElement>;
      'leap-hx711': LeapElement<HX711Element>;
      'leap-ks2e-m-dc5': LeapElement<KS2EMDC5Element>;
      'leap-relay-module': LeapElement<RelayModuleElement>;
      'leap-biaxial-stepper': LeapElement<BiaxialStepperElement>;
    }
  }
}

