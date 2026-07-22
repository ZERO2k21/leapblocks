/**
 * Geometry utility functions for feature extraction.
 * Used by HandPoseClassifier and PoseClassifier for angle/distance calculations.
 */

export interface Point2D {
    x: number
    y: number
}

export interface Point3D extends Point2D {
    z?: number
}

/**
 * Calculate the angle (in degrees) at point b formed by segments a->b and b->c.
 * Returns a value between 0 and 180 degrees.
 * 
 * Uses atan2 for robust angle calculation:
 * angle = atan2(|cross(AB, BC)|, dot(AB, BC))
 */
export function calcAngle(a: Point2D, b: Point2D, c: Point2D): number {
    const ab = { x: a.x - b.x, y: a.y - b.y }
    const bc = { x: c.x - b.x, y: c.y - b.y }
    
    const dot = ab.x * bc.x + ab.y * bc.y
    const cross = ab.x * bc.y - ab.y * bc.x
    
    const angle = Math.atan2(Math.abs(cross), dot)
    return Math.round(angle * (180 / Math.PI))
}

/**
 * Normalize an angle from degrees (0-180) to [0,1] range.
 */
export function normalizeAngle(degrees: number): number {
    return Math.max(0, Math.min(1, degrees / 180))
}

/**
 * Calculate 2D Euclidean distance between two points.
 */
export function euclidean(a: Point2D, b: Point2D): number {
    const dx = a.x - b.x
    const dy = a.y - b.y
    return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calculate midpoint between two points.
 */
export function midpoint(a: Point2D, b: Point2D): Point2D {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

/**
 * Calculate the angle of a line segment relative to horizontal.
 * Returns degrees (0-180, where 0=horizontal right, 90=vertical down).
 */
export function lineAngle(a: Point2D, b: Point2D): number {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const angle = Math.atan2(dy, dx) * (180 / Math.PI)
    // Normalize to 0-180 range (absolute value for tilt)
    return Math.abs(Math.round(angle))
}
