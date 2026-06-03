import { Extension, ExtensionInfo } from '../core/Extension';
import { PhysicsEngineRuntime } from './runtime';

export class PhysicsEngineExtension extends Extension {
    private runtime: PhysicsEngineRuntime;

    constructor(runtime?: PhysicsEngineRuntime) {
        super(runtime);
        this.runtime = runtime || new PhysicsEngineRuntime();
    }

    getInfo(): ExtensionInfo {
        return {
            id: 'physics_engine',
            name: 'Physics Engine',
            color1: '#E65100',
            blocks: [
                { opcode: 'physics_start', blockType: 'command', text: 'start physics' },
                { opcode: 'physics_stop', blockType: 'command', text: 'stop physics' },
                { opcode: 'physics_set_gravity', blockType: 'command', text: 'set gravity x [GX] y [GY]', arguments: { GX: { type: 'number', defaultValue: 0 }, GY: { type: 'number', defaultValue: 1 } } },
                { opcode: 'physics_add_body', blockType: 'command', text: 'add physics to sprite [SPRITE]', arguments: { SPRITE: { type: 'string', defaultValue: '' } } },
                { opcode: 'physics_add_force', blockType: 'command', text: 'apply force x [FX] y [FY] to sprite [SPRITE]', arguments: { FX: { type: 'number', defaultValue: 0 }, FY: { type: 'number', defaultValue: -0.01 }, SPRITE: { type: 'string', defaultValue: '' } } },
                { opcode: 'physics_set_bounce', blockType: 'command', text: 'set bounce to [VALUE]', arguments: { VALUE: { type: 'number', defaultValue: 0.5 } } },
                { opcode: 'physics_set_mass', blockType: 'command', text: 'set mass to [VALUE]', arguments: { VALUE: { type: 'number', defaultValue: 1 } } },
                { opcode: 'physics_set_static', blockType: 'command', text: 'set sprite [SPRITE] static [VALUE]', arguments: { SPRITE: { type: 'string', defaultValue: '' }, VALUE: { type: 'dropdown', defaultValue: 'yes', menu: [['yes', 'yes'], ['no', 'no']] } } },
                { opcode: 'physics_get_velocity_x', blockType: 'reporter', text: 'velocity x of sprite [SPRITE]', arguments: { SPRITE: { type: 'string', defaultValue: '' } } },
                { opcode: 'physics_get_velocity_y', blockType: 'reporter', text: 'velocity y of sprite [SPRITE]', arguments: { SPRITE: { type: 'string', defaultValue: '' } } },
                { opcode: 'physics_on_collision', blockType: 'hat', text: 'when sprite [SPRITE1] collides with [SPRITE2]', arguments: { SPRITE1: { type: 'string', defaultValue: '' }, SPRITE2: { type: 'string', defaultValue: '' } } },
            ]
        };
    }

    physics_start() { this.runtime.start(); }
    physics_stop() { this.runtime.stop(); }
    physics_set_gravity(gx: number, gy: number) { this.runtime.setGravity(gx, gy); }
    physics_add_body(sprite: string) { this.runtime.addBody(sprite); }
    physics_add_force(fx: number, fy: number, sprite: string) { this.runtime.addForce(sprite, fx, fy); }
    physics_set_bounce(value: number) {
        const spr = (window as any).__activeSpriteId || '';
        this.runtime.setBounce(spr, value);
    }
    physics_set_mass(value: number) {
        const spr = (window as any).__activeSpriteId || '';
        this.runtime.setMass(spr, value);
    }
    physics_set_static(sprite: string, value: string) { this.runtime.setStatic(sprite, value === 'yes'); }
    physics_get_velocity_x(sprite: string) { return this.runtime.getVelocityX(sprite); }
    physics_get_velocity_y(sprite: string) { return this.runtime.getVelocityY(sprite); }
    physics_on_collision() {}
}

export const physicsEngineExtension = new PhysicsEngineExtension();
export { PhysicsEngineRuntime } from './runtime';
