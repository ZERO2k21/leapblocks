const SKELETON_CONNECTIONS: Array<[number, number]> = [
  [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
  [5, 11], [6, 12], [11, 12], [11, 13], [13, 15],
  [12, 14], [14, 16], [0, 1], [0, 2], [1, 3], [2, 4], [9, 10]
];

const KEYPOINT_NAMES: string[] = [
  'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
  'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
  'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
];

export interface Keypoint {
  x: number;
  y: number;
  z?: number;
  score?: number;
  name?: string;
}

export interface CanvasPoint {
  x: number;
  y: number;
  score: number;
}

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
function dist(x1: number, y1: number, x2: number, y2: number): number { return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2); }

function angleBetween(p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }): number {
  const a = dist(p3.x, p3.y, p2.x, p2.y);
  const b = dist(p1.x, p1.y, p2.x, p2.y);
  const c = dist(p1.x, p1.y, p3.x, p3.y);
  if (a === 0 || b === 0) return 0;
  const cos = (a * a + b * b - c * c) / (2 * a * b);
  return Math.acos(Math.max(-1, Math.min(1, cos))) * (180 / Math.PI);
}

function toCanvas(kp: Keypoint, vw: number, vh: number): CanvasPoint {
  return { x: kp.x * vw, y: kp.y * vh, score: kp.score ?? 0 };
}

export interface KeypointBlockOptions {
  showLabels?: boolean;
  dotRadius?: number;
  color?: string;
  minScore?: number;
}

class KeypointBlock {
  public showLabels: boolean;
  public dotRadius: number;
  public color: string;
  public minScore: number;

  constructor(options: KeypointBlockOptions = {}) {
    this.showLabels = options.showLabels ?? false;
    this.dotRadius = options.dotRadius ?? 3;
    this.color = options.color ?? '#00FF00';
    this.minScore = options.minScore ?? 0.3;
  }

  render(ctx: CanvasRenderingContext2D, keypoints: Keypoint[], vw: number, vh: number): void {
    ctx.fillStyle = this.color;
    for (const kp of keypoints) {
      if ((kp.score ?? 1) < this.minScore) continue;
      const p = toCanvas(kp, vw, vh);
      ctx.beginPath();
      ctx.arc(p.x, p.y, this.dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    if (this.showLabels) {
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      for (let i = 0; i < keypoints.length; i++) {
        const kp = keypoints[i];
        if ((kp.score ?? 1) < this.minScore) continue;
        const p = toCanvas(kp, vw, vh);
        const label = KEYPOINT_NAMES[i] ?? `kp_${i}`;
        ctx.fillText(label, p.x, p.y - this.dotRadius - 4);
      }
    }
  }
}

export interface SkeletonBlockOptions {
  lineColor?: string;
  lineWidth?: number;
  minScore?: number;
}

class SkeletonBlock {
  public lineColor: string;
  public lineWidth: number;
  public minScore: number;

  constructor(options: SkeletonBlockOptions = {}) {
    this.lineColor = options.lineColor ?? '#00FF00';
    this.lineWidth = options.lineWidth ?? 2;
    this.minScore = options.minScore ?? 0.3;
  }

  render(ctx: CanvasRenderingContext2D, keypoints: Keypoint[], vw: number, vh: number): void {
    ctx.strokeStyle = this.lineColor;
    ctx.lineWidth = this.lineWidth;
    for (const [i, j] of SKELETON_CONNECTIONS) {
      const a = keypoints[i], b = keypoints[j];
      if (!a || !b) continue;
      if ((a.score ?? 1) < this.minScore || (b.score ?? 1) < this.minScore) continue;
      const p1 = toCanvas(a, vw, vh);
      const p2 = toCanvas(b, vw, vh);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }
}

export interface BoundingBoxBlockOptions {
  padding?: number;
  showLabel?: boolean;
  color?: string;
  lineWidth?: number;
}

class BoundingBoxBlock {
  public padding: number;
  public showLabel: boolean;
  public color: string;
  public lineWidth: number;

  constructor(options: BoundingBoxBlockOptions = {}) {
    this.padding = options.padding ?? 10;
    this.showLabel = options.showLabel ?? false;
    this.color = options.color ?? '#FFD700';
    this.lineWidth = options.lineWidth ?? 2;
  }

  render(ctx: CanvasRenderingContext2D, keypoints: Keypoint[], vw: number, vh: number): { x1: number; y1: number; x2: number; y2: number } {
    const valid = keypoints.filter(k => (k.score ?? 1) >= 0.3);
    if (valid.length === 0) return { x1: 0, y1: 0, x2: 0, y2: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const kp of valid) {
      const p = toCanvas(kp, vw, vh);
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const pad = this.padding;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.strokeRect(minX - pad, minY - pad, maxX - minX + pad * 2, maxY - minY + pad * 2);
    if (this.showLabel) {
      ctx.fillStyle = this.color;
      ctx.font = '12px monospace';
      ctx.fillText('person', minX - pad, minY - pad - 4);
    }
    return { x1: minX, y1: minY, x2: maxX, y2: maxY };
  }
}

export interface ConfidenceBlockOptions {
  showScore?: boolean;
  color?: string;
  fontSize?: number;
  minScore?: number;
}

class ConfidenceBlock {
  public showScore: boolean;
  public color: string;
  public fontSize: number;
  public minScore: number;

  constructor(options: ConfidenceBlockOptions = {}) {
    this.showScore = options.showScore ?? true;
    this.color = options.color ?? '#FFFFFF';
    this.fontSize = options.fontSize ?? 10;
    this.minScore = options.minScore ?? 0.3;
  }

  render(ctx: CanvasRenderingContext2D, keypoints: Keypoint[], vw: number, vh: number): void {
    if (!this.showScore) return;
    ctx.fillStyle = this.color;
    ctx.font = `${this.fontSize}px monospace`;
    ctx.textAlign = 'center';
    for (const kp of keypoints) {
      if ((kp.score ?? 1) < this.minScore) continue;
      const p = toCanvas(kp, vw, vh);
      ctx.fillText((kp.score ?? 0).toFixed(2), p.x, p.y + 14);
    }
  }
}

export interface JointAngleBlockOptions {
  joints?: Array<[string, number, number, number]>;
  drawArc?: boolean;
  color?: string;
}

class JointAngleBlock {
  public joints: Array<[string, number, number, number]>;
  public drawArc: boolean;
  public color: string;

  constructor(options: JointAngleBlockOptions = {}) {
    this.joints = options.joints ?? [
      ['L shoulder', 5, 7, 9], ['R shoulder', 6, 8, 10],
      ['L elbow', 7, 9, 11], ['R elbow', 8, 10, 12],
      ['L hip', 11, 13, 15], ['R hip', 12, 14, 16],
      ['L knee', 13, 11, 15], ['R knee', 14, 12, 16]
    ];
    this.drawArc = options.drawArc ?? false;
    this.color = options.color ?? '#00FFFF';
  }

  render(ctx: CanvasRenderingContext2D, keypoints: Keypoint[], vw: number, vh: number): Record<string, number> {
    const results: Record<string, number> = {};
    for (const [name, i, j, k] of this.joints) {
      const a = keypoints[i], b = keypoints[j], c = keypoints[k];
      if (!a || !b || !c) continue;
      if ((a.score ?? 1) < 0.3 || (b.score ?? 1) < 0.3 || (c.score ?? 1) < 0.3) continue;
      const p1 = toCanvas(a, vw, vh), p2 = toCanvas(b, vw, vh), p3 = toCanvas(c, vw, vh);
      const angle = angleBetween(p1, p2, p3);
      results[name] = Math.round(angle);
      if (this.drawArc) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5;
        const radius = 20;
        const startAngle = Math.atan2(p1.y - p2.y, p1.x - p2.x);
        const endAngle = Math.atan2(p3.y - p2.y, p3.x - p2.x);
        ctx.beginPath();
        ctx.arc(p2.x, p2.y, radius, startAngle, endAngle);
        ctx.stroke();
        ctx.fillStyle = this.color;
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        const midAngle = (startAngle + endAngle) / 2;
        ctx.fillText(`${Math.round(angle)}°`, p2.x + Math.cos(midAngle) * (radius + 14), p2.y + Math.sin(midAngle) * (radius + 14));
      }
    }
    return results;
  }
}

export interface PoseClassifierBlockOptions {
  minScore?: number;
}

class PoseClassifierBlock {
  public minScore: number;

  constructor(options: PoseClassifierBlockOptions = {}) {
    this.minScore = options.minScore ?? 0.3;
  }

  render(ctx: CanvasRenderingContext2D, keypoints: Keypoint[], vw: number, vh: number): string {
    const kps: Record<string, Keypoint> = {};
    for (let i = 0; i < keypoints.length; i++) {
      kps[KEYPOINT_NAMES[i] || `kp${i}`] = keypoints[i];
    }
    const get = (name: string) => kps[name] ? toCanvas(kps[name], vw, vh) : null;
    const ls = get('left_shoulder'), rs = get('right_shoulder');
    const lh = get('left_hip'), rh = get('right_hip');
    const lk = get('left_knee'), rk = get('right_knee');
    const la = get('left_ankle'), ra = get('right_ankle');
    const le = get('left_elbow'), re = get('right_elbow');
    const lw = get('left_wrist');
    const no = get('nose');

    const hipMid = lh && rh ? { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 } : null;
    const shoulderMid = ls && rs ? { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 } : null;
    const torsoLen = hipMid && shoulderMid ? dist(hipMid.x, hipMid.y, shoulderMid.x, shoulderMid.y) : 0;

    let pose = 'unknown';

    if (lk && rk && la && ra) {
      const leftKneeAngle = angleBetween(lk, lh || la, la);
      const rightKneeAngle = angleBetween(rk, rh || ra, ra);
      if (leftKneeAngle < 120 || rightKneeAngle < 120) {
        pose = 'sitting';
      }
    }

    if (pose === 'unknown' && no && shoulderMid && no.y < shoulderMid.y - torsoLen * 0.3) {
      pose = 'standing';
    }

    if (lh && rh && la && ra && no && shoulderMid) {
      const footY = Math.min(la.y, ra.y);
      const bodyHeight = footY - (no.y);
      const totalHeight = footY - no.y;
      if (totalHeight > 0 && bodyHeight / totalHeight < 0.4) {
        pose = 'lying';
      }
    }

    if (lw && re && no && le) {
      const armAngle = angleBetween(le, re, lw);
      if (armAngle > 160) {
        pose = 'arms_out';
      }
    }

    if (pose === 'unknown' && torsoLen > 0) {
      pose = 'standing';
    }

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Pose: ${pose}`, 8, 20);

    return pose;
  }
}

export interface MovementTrackerBlockOptions {
  trailLength?: number;
  trackedIndices?: number[];
  color?: string;
}

class MovementTrackerBlock {
  public trailLength: number;
  public trackedIndices: number[];
  public color: string;
  public history: Array<Record<number, CanvasPoint>>;
  public prevPositions: Record<number, CanvasPoint> | null;

  constructor(options: MovementTrackerBlockOptions = {}) {
    this.trailLength = options.trailLength ?? 20;
    this.trackedIndices = options.trackedIndices ?? [0, 9, 10];
    this.color = options.color ?? '#FF69B4';
    this.history = [];
    this.prevPositions = null;
  }

  render(ctx: CanvasRenderingContext2D, keypoints: Keypoint[], vw: number, vh: number): { velocities: Record<number, number> } {
    const positions: Record<number, CanvasPoint> = {};
    for (const idx of this.trackedIndices) {
      const kp = keypoints[idx];
      if (kp && (kp.score ?? 1) >= 0.3) {
        positions[idx] = toCanvas(kp, vw, vh);
      }
    }
    this.history.push(positions);
    if (this.history.length > this.trailLength) this.history.shift();

    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.5;
    for (const idx of this.trackedIndices) {
      const trail: CanvasPoint[] = [];
      for (const frame of this.history) {
        if (frame[idx]) trail.push(frame[idx]);
      }
      if (trail.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(trail[0].x, trail[0].y);
      for (let t = 1; t < trail.length; t++) {
        ctx.lineTo(trail[t].x, trail[t].y);
      }
      ctx.stroke();
    }

    const velocities: Record<number, number> = {};
    if (this.prevPositions) {
      for (const idx of this.trackedIndices) {
        const curr = positions[idx];
        const prev = this.prevPositions[idx];
        if (curr && prev) {
          velocities[idx] = dist(curr.x, curr.y, prev.x, prev.y);
        }
      }
    }
    this.prevPositions = positions;
    return { velocities };
  }
}

export interface BodySymmetryBlockOptions {
  drawAxis?: boolean;
  color?: string;
}

class BodySymmetryBlock {
  public drawAxis: boolean;
  public color: string;

  constructor(options: BodySymmetryBlockOptions = {}) {
    this.drawAxis = options.drawAxis ?? false;
    this.color = options.color ?? '#FF69B4';
  }

  render(ctx: CanvasRenderingContext2D, keypoints: Keypoint[], vw: number, vh: number): number {
    const pairs: Array<[number, number]> = [
      [5, 6], [7, 8], [9, 10], [11, 12], [13, 14], [15, 16]
    ];
    let totalSym = 0, count = 0;
    for (const [l, r] of pairs) {
      const a = keypoints[l], b = keypoints[r];
      if (!a || !b) continue;
      if ((a.score ?? 1) < 0.3 || (b.score ?? 1) < 0.3) continue;
      const p1 = toCanvas(a, vw, vh), p2 = toCanvas(b, vw, vh);
      const midX = (p1.x + p2.x) / 2, midY = (p1.y + p2.y) / 2;
      const leftDist = dist(p1.x, p1.y, midX, midY);
      const rightDist = dist(p2.x, p2.y, midX, midY);
      const maxDist = Math.max(leftDist, rightDist);
      if (maxDist === 0) continue;
      const sym = 1 - Math.abs(leftDist - rightDist) / maxDist;
      totalSym += sym;
      count++;
    }
    const symmetry = count > 0 ? totalSym / count : 1;

    if (this.drawAxis) {
      const nose = keypoints[0];
      const lhip = keypoints[11], rhip = keypoints[12];
      if (nose && (lhip || rhip) && (nose.score ?? 1) >= 0.3) {
        const n = toCanvas(nose, vw, vh);
        let hipY = n.y;
        if (lhip && (lhip.score ?? 1) >= 0.3 && rhip && (rhip.score ?? 1) >= 0.3) {
          hipY = (toCanvas(lhip, vw, vh).y + toCanvas(rhip, vw, vh).y) / 2;
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(n.x, hipY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    ctx.fillStyle = this.color;
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Symmetry: ${(symmetry * 100).toFixed(0)}%`, 8, 36);

    return symmetry;
  }
}

export interface DepthEstimationBlockOptions {
  showLabels?: boolean;
  maxDepth?: number;
  color?: string;
}

class DepthEstimationBlock {
  public showLabels: boolean;
  public maxDepth: number;
  public color: string;

  constructor(options: DepthEstimationBlockOptions = {}) {
    this.showLabels = options.showLabels ?? false;
    this.maxDepth = options.maxDepth ?? 10;
    this.color = options.color ?? '#FF4500';
  }

  render(ctx: CanvasRenderingContext2D, keypoints: Keypoint[], vw: number, vh: number): Keypoint[] {
    const lsh = keypoints[5], rsh = keypoints[6];
    const lhip = keypoints[11], rhip = keypoints[12];
    let shoulderWidth = 0;
    if (lsh && rsh && (lsh.score ?? 1) >= 0.3 && (rsh.score ?? 1) >= 0.3) {
      shoulderWidth = dist(toCanvas(lsh, vw, vh).x, 0, toCanvas(rsh, vw, vh).x, 0);
    }
    let hipWidth = 0;
    if (lhip && rhip && (lhip.score ?? 1) >= 0.3 && (rhip.score ?? 1) >= 0.3) {
      hipWidth = dist(toCanvas(lhip, vw, vh).x, 0, toCanvas(rhip, vw, vh).x, 0);
    }
    const avgWidth = shoulderWidth > 0 && hipWidth > 0 ? (shoulderWidth + hipWidth) / 2 : (shoulderWidth || hipWidth);
    const depth = avgWidth > 0 ? Math.min(this.maxDepth, (vw * 0.4) / avgWidth) : 0;

    const zKeypoints = keypoints.map((kp) => {
      const zVal = (kp.score ?? 1) >= 0.3 ? depth * (0.5 + Math.random() * 0.1) : 0;
      return { ...kp, z: zVal };
    });

    if (this.showLabels && depth > 0) {
      ctx.fillStyle = this.color;
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Depth: ${depth.toFixed(2)}m`, 8, 52);
    }

    return zKeypoints;
  }
}

export interface RepCounterBlockOptions {
  exercise?: string;
  triggerAngle?: number;
  onRep?: ((count: number) => void) | null;
}

class RepCounterBlock {
  public exercise: string;
  public triggerAngle: number;
  public onRep: ((count: number) => void) | null;
  public count: number;
  public wasBelow: boolean;
  public lastAngle: number;

  constructor(options: RepCounterBlockOptions = {}) {
    this.exercise = options.exercise ?? 'squat';
    this.triggerAngle = options.triggerAngle ?? 100;
    this.onRep = options.onRep ?? null;
    this.count = 0;
    this.wasBelow = false;
    this.lastAngle = 0;
  }

  render(ctx: CanvasRenderingContext2D, keypoints: Keypoint[], vw: number, vh: number): { count: number; angle: number } {
    let angle = 0;
    if (this.exercise === 'squat') {
      const lk = keypoints[13], rk = keypoints[14];
      const lh = keypoints[11], rh = keypoints[12];
      const la = keypoints[15], ra = keypoints[16];
      let leftAngle = 0, rightAngle = 0;
      if (lk && lh && la && (lk.score ?? 1) >= 0.3) {
        leftAngle = angleBetween(toCanvas(lh, vw, vh), toCanvas(lk, vw, vh), toCanvas(la, vw, vh));
      }
      if (rk && rh && ra && (rk.score ?? 1) >= 0.3) {
        rightAngle = angleBetween(toCanvas(rh, vw, vh), toCanvas(rk, vw, vh), toCanvas(ra, vw, vh));
      }
      angle = leftAngle > 0 && rightAngle > 0 ? (leftAngle + rightAngle) / 2 : (leftAngle || rightAngle);
    }
    if (this.exercise === 'pushup') {
      const le = keypoints[7], re = keypoints[8];
      const ls = keypoints[5], rs = keypoints[6];
      const lw = keypoints[9], rw = keypoints[10];
      let leftAngle = 0, rightAngle = 0;
      if (le && ls && lw && (le.score ?? 1) >= 0.3) {
        leftAngle = angleBetween(toCanvas(ls, vw, vh), toCanvas(le, vw, vh), toCanvas(lw, vw, vh));
      }
      if (re && rs && rw && (re.score ?? 1) >= 0.3) {
        rightAngle = angleBetween(toCanvas(rs, vw, vh), toCanvas(re, vw, vh), toCanvas(rw, vw, vh));
      }
      angle = leftAngle > 0 && rightAngle > 0 ? (leftAngle + rightAngle) / 2 : (leftAngle || rightAngle);
    }
    if (this.exercise === 'bicep_curl') {
      const le = keypoints[7], re = keypoints[8];
      const ls = keypoints[5], rs = keypoints[6];
      const lw = keypoints[9], rw = keypoints[10];
      let leftAngle = 0, rightAngle = 0;
      if (le && ls && lw && (le.score ?? 1) >= 0.3) {
        leftAngle = 180 - angleBetween(toCanvas(ls, vw, vh), toCanvas(le, vw, vh), toCanvas(lw, vw, vh));
      }
      if (re && rs && rw && (re.score ?? 1) >= 0.3) {
        rightAngle = 180 - angleBetween(toCanvas(rs, vw, vh), toCanvas(re, vw, vh), toCanvas(rw, vw, vh));
      }
      angle = leftAngle > 0 && rightAngle > 0 ? (leftAngle + rightAngle) / 2 : (leftAngle || rightAngle);
    }

    this.lastAngle = angle;
    const isBelow = angle < this.triggerAngle;
    if (isBelow && !this.wasBelow) {
      this.count++;
      if (this.onRep) this.onRep(this.count);
    }
    this.wasBelow = isBelow;

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Reps: ${this.count}`, 8, 76);

    return { count: this.count, angle: Math.round(angle) };
  }
}

export interface PostureAlertBlockOptions {
  slouchThreshold?: number;
  onAlert?: ((type: string, data: any) => void) | null;
  alertCooldown?: number;
}

class PostureAlertBlock {
  public slouchThreshold: number;
  public onAlert: ((type: string, data: any) => void) | null;
  public prevShoulderAngle: number | null;
  public lastAlertTime: number;
  public alertCooldown: number;

  constructor(options: PostureAlertBlockOptions = {}) {
    this.slouchThreshold = options.slouchThreshold ?? 25;
    this.onAlert = options.onAlert ?? null;
    this.prevShoulderAngle = null;
    this.lastAlertTime = 0;
    this.alertCooldown = options.alertCooldown ?? 3000;
  }

  render(ctx: CanvasRenderingContext2D, keypoints: Keypoint[], vw: number, vh: number): Record<string, any> {
    const le = keypoints[7], re = keypoints[8];
    const ls = keypoints[5], rs = keypoints[6];
    if (!le || !re || !ls || !rs) return {};
    if ((le.score ?? 1) < 0.3 || (re.score ?? 1) < 0.3) return {};

    const leftArm = angleBetween(toCanvas(ls, vw, vh), toCanvas(le, vw, vh), toCanvas(re, vw, vh));
    const rightArm = angleBetween(toCanvas(rs, vw, vh), toCanvas(re, vw, vh), toCanvas(le, vw, vh));
    const shoulderAngle = (leftArm + rightArm) / 2;

    const angleDiff = this.prevShoulderAngle !== null ? Math.abs(shoulderAngle - this.prevShoulderAngle) : 0;
    this.prevShoulderAngle = shoulderAngle;

    const alerts: Array<{ type: string; [key: string]: any }> = [];
    if (shoulderAngle < 90 - this.slouchThreshold) {
      alerts.push({ type: 'slouch', shoulderAngle: Math.round(shoulderAngle) });
    }
    if (angleDiff > 30) {
      alerts.push({ type: 'sudden_movement', delta: Math.round(angleDiff) });
    }

    const now = Date.now();
    for (const alert of alerts) {
      if (now - this.lastAlertTime > this.alertCooldown) {
        this.lastAlertTime = now;
        if (this.onAlert) this.onAlert(alert.type, alert);
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`⚠ ${alert.type.toUpperCase()}`, vw / 2, 30);
      }
    }

    return alerts[0] || {};
  }
}

export interface MultiPersonBlockOptions {
  maxPersons?: number;
  colors?: string[];
  lineWidth?: number;
  minScore?: number;
}

class MultiPersonBlock {
  public maxPersons: number;
  public colors: string[];
  public lineWidth: number;
  public minScore: number;
  public blockInstances: Array<{ skeleton: SkeletonBlock; keypoints: KeypointBlock }> | null;

  constructor(options: MultiPersonBlockOptions = {}) {
    this.maxPersons = options.maxPersons ?? 2;
    this.colors = options.colors ?? ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
    this.lineWidth = options.lineWidth ?? 2;
    this.minScore = options.minScore ?? 0.3;
    this.blockInstances = null;
  }

  render(ctx: CanvasRenderingContext2D, allKeypointsList: any[], vw: number, vh: number): void {
    if (!allKeypointsList || allKeypointsList.length === 0) return;
    let list = allKeypointsList;
    if (!Array.isArray(allKeypointsList[0]?.[0])) {
      list = [allKeypointsList];
    }
    const count = Math.min(list.length, this.maxPersons);
    if (!this.blockInstances) {
      this.blockInstances = list.map((_, i) => ({
        skeleton: new SkeletonBlock({ lineColor: this.colors[i % this.colors.length], lineWidth: this.lineWidth, minScore: this.minScore }),
        keypoints: new KeypointBlock({ dotRadius: 3, color: this.colors[i % this.colors.length], minScore: this.minScore }),
      }));
    }
    for (let i = 0; i < count; i++) {
      const inst = this.blockInstances[i];
      inst.skeleton.render(ctx, list[i], vw, vh);
      inst.keypoints.render(ctx, list[i], vw, vh);
    }
  }
}

export interface SmoothingBlockOptions {
  alpha?: number;
}

class SmoothingBlock {
  public alpha: number;
  public smoothed: Keypoint[] | null;

  constructor(options: SmoothingBlockOptions = {}) {
    this.alpha = options.alpha ?? 0.45;
    this.smoothed = null;
  }

  render(ctx: CanvasRenderingContext2D, keypoints: Keypoint[], _vw: number, _vh: number): Keypoint[] {
    if (!this.smoothed || this.smoothed.length !== keypoints.length) {
      this.smoothed = keypoints.map(k => ({ ...k }));
      return this.smoothed;
    }
    const a = this.alpha;
    for (let i = 0; i < keypoints.length; i++) {
      const curr = keypoints[i];
      const prev = this.smoothed[i];
      if (!prev) {
        this.smoothed[i] = { ...curr };
        continue;
      }
      this.smoothed[i] = {
        x: lerp(prev.x, curr.x, a),
        y: lerp(prev.y, curr.y, a),
        score: curr.score ?? prev.score ?? 0,
      };
    }
    return this.smoothed;
  }

  reset(): void {
    this.smoothed = null;
  }
}

export interface PerformanceMonitorBlockOptions {}

class PerformanceMonitorBlock {
  public frameTimestamps: number[];
  public lastFrameTime: number | null;
  public fps: number;
  public latencyMs: number;

  constructor(_options: PerformanceMonitorBlockOptions = {}) {
    this.frameTimestamps = [];
    this.lastFrameTime = null;
    this.fps = 0;
    this.latencyMs = 0;
  }

  render(ctx: CanvasRenderingContext2D, _keypoints: Keypoint[], vw: number, _vh: number): { fps: number; latency: number } {
    const now = performance.now();
    if (this.lastFrameTime !== null) {
      this.latencyMs = Math.round(now - this.lastFrameTime);
    }
    this.lastFrameTime = now;
    this.frameTimestamps.push(now);
    while (this.frameTimestamps.length > 0 && this.frameTimestamps[0] < now - 1000) {
      this.frameTimestamps.shift();
    }
    this.fps = this.frameTimestamps.length;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(vw - 110, 4, 106, 32);
    ctx.fillStyle = '#0F0';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${this.fps} FPS`, vw - 8, 20);
    ctx.fillText(`${this.latencyMs}ms`, vw - 8, 32);

    return { fps: this.fps, latency: this.latencyMs };
  }
}

const BLOCK_CLASSES: Record<string, any> = {
  keypoint: KeypointBlock,
  skeleton: SkeletonBlock,
  boundingbox: BoundingBoxBlock,
  confidence: ConfidenceBlock,
  angles: JointAngleBlock,
  classifier: PoseClassifierBlock,
  movement: MovementTrackerBlock,
  symmetry: BodySymmetryBlock,
  depth: DepthEstimationBlock,
  repcount: RepCounterBlock,
  alert: PostureAlertBlock,
  multiperson: MultiPersonBlock,
  smooth: SmoothingBlock,
  perf: PerformanceMonitorBlock,
};

export interface PoseDetectionSuiteOptions {
  perf?: boolean;
  blocks?: string[];
  smooth?: number;
  [key: string]: any;
}

class PoseDetectionSuite {
  public canvas: HTMLCanvasElement;
  public blocks: any[];
  public perfBlock: PerformanceMonitorBlock | null;
  public smoothBlock: SmoothingBlock | null;
  public multiPersonBlock: MultiPersonBlock | null;
  public lastKeypoints: Keypoint[] | null;
  public lastVw: number;
  public lastVh: number;

  constructor(canvas: HTMLCanvasElement, options: PoseDetectionSuiteOptions = {}) {
    this.canvas = canvas;
    this.blocks = [];
    this.perfBlock = options.perf !== false ? new PerformanceMonitorBlock() : null;
    this.smoothBlock = null;
    this.multiPersonBlock = null;
    this.lastKeypoints = null;
    this.lastVw = 640;
    this.lastVh = 480;

    const blockList = options.blocks ?? ['skeleton', 'keypoint'];
    for (const id of blockList) {
      const idLower = id.toLowerCase().replace(/[_-]/g, '');
      const Cls = BLOCK_CLASSES[idLower] || BLOCK_CLASSES[id];
      if (!Cls) {
        console.warn(`[PoseBlocks] Unknown block: "${id}"`);
        continue;
      }
      const instance = new Cls(options[id] || {});
      if (instance instanceof SmoothingBlock) this.smoothBlock = instance;
      if (instance instanceof MultiPersonBlock) this.multiPersonBlock = instance;
      this.blocks.push(instance);
    }
    if (this.smoothBlock && options.smooth !== undefined) {
      this.smoothBlock.alpha = options.smooth;
    }
  }

  render(keypoints: Keypoint[], videoWidth?: number, videoHeight?: number, rawPoses?: any) {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return { results: {}, perf: { fps: 0, latency: 0 } };

    const vw = videoWidth || this.canvas.width;
    const vh = videoHeight || this.canvas.height;
    this.lastKeypoints = keypoints;
    this.lastVw = vw;
    this.lastVh = vh;

    let currentKeypoints = keypoints;
    if (this.smoothBlock) {
      currentKeypoints = this.smoothBlock.render(ctx, currentKeypoints, vw, vh);
    }

    const results: Record<string, any> = {};

    for (const block of this.blocks) {
      if (block instanceof SmoothingBlock || block instanceof PerformanceMonitorBlock || block instanceof MultiPersonBlock) continue;
      if (block instanceof PostureAlertBlock || block instanceof RepCounterBlock || block instanceof JointAngleBlock || block instanceof PoseClassifierBlock || block instanceof BodySymmetryBlock || block instanceof DepthEstimationBlock || block instanceof MovementTrackerBlock || block instanceof BoundingBoxBlock) {
        results[block.constructor.name.replace('Block', '').toLowerCase()] = block.render(ctx, currentKeypoints, vw, vh);
      } else {
        block.render(ctx, currentKeypoints, vw, vh);
      }
    }

    if (this.multiPersonBlock) {
      this.multiPersonBlock.render(ctx, rawPoses || [currentKeypoints], vw, vh);
    }

    const perf = { fps: 0, latency: 0 };
    if (this.perfBlock) {
      Object.assign(perf, this.perfBlock.render(ctx, currentKeypoints, vw, vh));
    }

    return { results, perf };
  }

  getSmoothed(): Keypoint[] | null {
    return this.smoothBlock ? this.smoothBlock.smoothed : this.lastKeypoints;
  }
}

export {
  KeypointBlock, SkeletonBlock, BoundingBoxBlock, ConfidenceBlock,
  JointAngleBlock, PoseClassifierBlock, MovementTrackerBlock, BodySymmetryBlock,
  DepthEstimationBlock, RepCounterBlock, PostureAlertBlock, MultiPersonBlock,
  SmoothingBlock, PerformanceMonitorBlock, PoseDetectionSuite, SKELETON_CONNECTIONS, KEYPOINT_NAMES,
};
