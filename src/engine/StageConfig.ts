/**
 * GLOBAL STAGE CONFIGURATION
 * Centralizes dimensions and coordinate boundaries to ensure consistency 
 * between the visual Stage, Sprite logic, and Animation VM.
 */

export const STAGE_CONFIG = {
    // Stage Internal Resolution
    WIDTH: 480,
    HEIGHT: 310,

    // Coordinate Boundaries (derived)
    get MIN_X() { return -(this.WIDTH / 2); },
    get MAX_X() { return this.WIDTH / 2; },
    get MIN_Y() { return -(this.HEIGHT / 2); },
    get MAX_Y() { return this.HEIGHT / 2; },

    // Default Layout Scaling
    LARGE_SCALE: 1.0,
    SMALL_SCALE: 0.5,
};
