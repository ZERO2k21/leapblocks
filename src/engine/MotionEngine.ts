import { Sprite } from '../stage/Sprite';

class MotionEngine {
    move(sprite: Sprite, steps: number) {
        const radians = (sprite.direction - 90) * Math.PI / 180;
        sprite.setX(sprite.x + Math.cos(radians) * steps);
        sprite.setY(sprite.y - Math.sin(radians) * steps);
    }

    turnRight(sprite: Sprite, degrees: number) {
        sprite.pointInDirection(sprite.direction + degrees);
    }

    turnLeft(sprite: Sprite, degrees: number) {
        this.turnRight(sprite, -degrees);
    }

    goTo(sprite: Sprite, x: number, y: number) {
        sprite.setX(x);
        sprite.setY(y);
    }

    pointInDirection(sprite: Sprite, direction: number) {
        sprite.pointInDirection(direction);
    }

    glide(sprite: Sprite, x: number, y: number, durationSecs: number) {
        sprite.startGlide(x, y, durationSecs);
    }

    ifOnEdgeBounce(sprite: Sprite) {
        sprite.ifOnEdgeBounce();
    }

    setRotationStyle(sprite: Sprite, style: 'left-right' | 'all around' | 'none') {
        sprite.setRotationStyle(style);
    }
}

export const motionEngine = new MotionEngine();
export default motionEngine;
