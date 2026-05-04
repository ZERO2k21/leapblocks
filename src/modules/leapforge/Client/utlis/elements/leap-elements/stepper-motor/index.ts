/**
 * index.ts - Stepper Motor Component Exports
 * 
 * Export all stepper motor component parts:
 * - StepperMotor React component
 * - StepperMotorSimulator physics engine
 * - Type definitions
 */

export { default as StepperMotor } from './StepperMotor';
export type { StepperMotorProps } from './StepperMotor';

export {
  default as StepperMotorSimulator,
  StepperMotorSimulator as default,
} from './StepperMotorSim';
export type { StepperPinName, CoilPattern } from './StepperMotorSim';

import { StepperEmulator } from '../../../../Src/engine/Arduino/StepperEmulator';
// Import component definition for registry
import componentDef from './component.json';
export const componentDefinition = componentDef;

/**
 * Register stepper motor with component system
 */
export function registerStepperMotor(registry: any): void {
  registry.register('leaplab-stepper-motor', {
    component: require('./StepperMotor').default,
    definition: componentDef,
    simulator: StepperEmulator,
  });
}
