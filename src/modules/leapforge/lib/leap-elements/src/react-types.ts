/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { SevenSegmentElement } from './7segment-element';
import { ArduinoUnoElement } from './arduino-uno-element';
import { BuzzerElement } from './buzzer-element';
import { LCD1602Element } from './lcd1602-element';
import { LEDElement } from './led-element';
import { MembraneKeypadElement } from './membrane-keypad-element';
import { NeoPixelElement } from './neopixel-element';
import { NeopixelMatrixElement } from './neopixel-matrix-element';
import { PotentiometerElement } from './potentiometer-element';
import { PushbuttonElement } from './pushbutton-element';
import { Pushbutton6mmElement } from './pushbutton-6mm-element';
import { ResistorElement } from './resistor-element';
import { RotaryDialerElement } from './rotary-dialer-element';
import { SSD1306Element } from './ssd1306-element';
import { ServoElement } from './servo-element';
import { DHT22Element } from './dht22-element';
import { ArduinoMegaElement } from './arduino-mega-element';
import { ArduinoNanoElement } from './arduino-nano-element';
import { Ds1307Element } from './ds1307-element';
import { LEDRingElement } from './led-ring-element';
import { SlideSwitchElement } from './slide-switch-element';
import { HCSR04Element } from './hc-sr04-element';
import { LCD2004Element } from './lcd2004-element';
import { AnalogJoystickElement } from './analog-joystick-element';
import { SlidePotentiometerElement } from './slide-potentiometer-element';
import { IRReceiverElement } from './ir-receiver-element';
import { IRRemoteElement } from './ir-remote-element';
import { PIRMotionSensorElement } from './pir-motion-sensor-element';
import { NTCTemperatureSensorElement } from './ntc-temperature-sensor-element';
import { HeartBeatSensorElement } from './heart-beat-sensor-element';
import { TiltSwitchElement } from './tilt-switch-element';
import { FlameSensorElement } from './flame-sensor-element';
import { GasSensorElement } from './gas-sensor-element';
import { FranzininhoElement } from './franzininho-element';
import { NanoRP2040ConnectElement } from './nano-rp2040-connect-element';
import { SmallSoundSensorElement } from './small-sound-sensor-element';
import { BigSoundSensorElement } from './big-sound-sensor-element';
import { MPU6050Element } from './mpu6050-element';
import { ESP32DevkitV1Element } from './esp32-devkit-v1-element';
import { KY040Element } from './ky-040-element';
import { PhotoresistorSensorElement } from './photoresistor-sensor-element';
import { RGBLedElement } from './rgb-led-element';
import { ILI9341Element } from './ili9341-element';
import { LedBarGraphElement } from './led-bar-graph-element';
import { MicrosdCardElement } from './microsd-card-element';
import { DipSwitch8Element } from './dip-switch-8-element';
import { StepperMotorElement } from './stepper-motor-element';
import { HX711Element } from './hx711-element';
import { KS2EMDC5Element } from './ks2e-m-dc5-element';
import { BiaxialStepperElement } from './biaxial-stepper-element';
import type React from 'react';

type leapElement<T> = Partial<T> & React.ClassAttributes<T>;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'leap-7segment': leapElement<SevenSegmentElement>;
      'leap-arduino-uno': leapElement<ArduinoUnoElement>;
      'leap-lcd1602': leapElement<LCD1602Element>;
      'leap-led': leapElement<LEDElement>;
      'leap-neopixel': leapElement<NeoPixelElement>;
      'leap-pushbutton': leapElement<PushbuttonElement>;
      'leap-pushbutton-6mm': leapElement<Pushbutton6mmElement>;
      'leap-resistor': leapElement<ResistorElement>;
      'leap-membrane-keypad': leapElement<MembraneKeypadElement>;
      'leap-potentiometer': leapElement<PotentiometerElement>;
      'leap-neopixel-matrix': leapElement<NeopixelMatrixElement>;
      'leap-ssd1306': leapElement<SSD1306Element>;
      'leap-buzzer': leapElement<BuzzerElement>;
      'leap-rotary-dialer': leapElement<RotaryDialerElement>;
      'leap-servo': leapElement<ServoElement>;
      'leap-dht22': leapElement<DHT22Element>;
      'leap-arduino-mega': leapElement<ArduinoMegaElement>;
      'leap-arduino-nano': leapElement<ArduinoNanoElement>;
      'leap-ds1307': leapElement<Ds1307Element>;
      'leap-neopixel-ring': leapElement<LEDRingElement>;
      'leap-slide-switch': leapElement<SlideSwitchElement>;
      'leap-hc-sr04': leapElement<HCSR04Element>;
      'leap-lcd2004': leapElement<LCD2004Element>;
      'leap-analog-joystick': leapElement<AnalogJoystickElement>;
      'leap-slide-potentiometer': leapElement<SlidePotentiometerElement>;
      'leap-ir-receiver': leapElement<IRReceiverElement>;
      'leap-ir-remote': leapElement<IRRemoteElement>;
      'leap-pir-motion-sensor': leapElement<PIRMotionSensorElement>;
      'leap-ntc-temperature-sensor': leapElement<NTCTemperatureSensorElement>;
      'leap-heart-beat-sensor': leapElement<HeartBeatSensorElement>;
      'leap-tilt-switch': leapElement<TiltSwitchElement>;
      'leap-flame-sensor': leapElement<FlameSensorElement>;
      'leap-gas-sensor': leapElement<GasSensorElement>;
      'leap-franzininho': leapElement<FranzininhoElement>;
      'leap-nano-rp2040-connect': leapElement<NanoRP2040ConnectElement>;
      'leap-small-sound-sensor': leapElement<SmallSoundSensorElement>;
      'leap-big-sound-sensor': leapElement<BigSoundSensorElement>;
      'leap-mpu6050': leapElement<MPU6050Element>;
      'leap-esp32-devkit-v1': leapElement<ESP32DevkitV1Element>;
      'leap-ky-040': leapElement<KY040Element>;
      'leap-photoresistor-sensor': leapElement<PhotoresistorSensorElement>;
      'leap-rgb-led': leapElement<RGBLedElement>;
      'leap-ili9341': leapElement<ILI9341Element>;
      'leap-led-bar-graph': leapElement<LedBarGraphElement>;
      'leap-microsd-card': leapElement<MicrosdCardElement>;
      'leap-dip-switch-8': leapElement<DipSwitch8Element>;
      'leap-stepper-motor': leapElement<StepperMotorElement>;
      'leap-hx711': leapElement<HX711Element>;
      'leap-ks2e-m-dc5': leapElement<KS2EMDC5Element>;
      'leap-biaxial-stepper': leapElement<BiaxialStepperElement>;
    }
  }
}
