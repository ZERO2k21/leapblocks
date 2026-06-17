export interface Point { x: number; y: number }

/**
 * Auto-compute orthogonal (Manhattan) bend points between source and target.
 * Returns 2 corner points for a 3-segment H-V-H or V-H-V path.
 */
export function computeOrthogonalPath(source: Point, target: Point): Point[] {
  const dx = Math.abs(target.x - source.x);
  const dy = Math.abs(target.y - source.y);

  // When horizontally close, use V-H-V (vertical → horizontal → vertical)
  if (dx < 30 && dy > 30) {
    const midY = (source.y + target.y) / 2;
    return [
      { x: source.x, y: midY },
      { x: target.x, y: midY },
    ];
  }

  // Default: H-V-H (horizontal → vertical → horizontal)
  const midX = (source.x + target.x) / 2;
  return [
    { x: midX, y: source.y },
    { x: midX, y: target.y },
  ];
}

/**
 * Build an SVG path string with orthogonal (H/V-only) routing.
 * Points are: source, bend-points..., target.
 * Each segment goes horizontal then vertical (L-shaped bends).
 */
export function buildOrthogonalPath(points: Point[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    d += ` L ${curr.x} ${prev.y}`;
    if (curr.y !== prev.y) {
      d += ` L ${curr.x} ${curr.y}`;
    }
  }
  return d;
}

/**
 * Compute the midpoint between two points along the orthogonal path.
 * Places it on the longer of the horizontal or vertical segment.
 */
export function getOrthogonalMidpoint(a: Point, b: Point): Point {
  const dx = Math.abs(b.x - a.x);
  const dy = Math.abs(b.y - a.y);
  if (dx >= dy) {
    return { x: (a.x + b.x) / 2, y: a.y };
  }
  return { x: b.x, y: (a.y + b.y) / 2 };
}
