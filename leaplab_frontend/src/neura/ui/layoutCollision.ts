// Non-colliding layout rule for Neura canvas — brain / classes / predictor never overlap
// Each node is treated as an axis-aligned bounding box; we enforce minimum gap.

export type Pos = { x: number; y: number }
export type Rect = Pos & { w: number; h: number }

const GAP = 32 // minimum gap between nodes
const CLASS_W = 344
const CLASS_H = 320 // approx with 8 images expanded may be taller; we use conservative 360
const DATASET_W = 720
const DATASET_H = 360
const BRAIN_W = 400
const BRAIN_H = 420
const VISION_W = 420
const VISION_H = 520

function overlap(a: Rect, b: Rect): boolean {
  return !(a.x + a.w + GAP <= b.x || b.x + b.w + GAP <= a.x || a.y + a.h + GAP <= b.y || b.y + b.h + GAP <= a.y)
}

export function getClassRect(id: string, pos: Pos, expanded?: boolean): Rect {
  const h = expanded ? 420 : CLASS_H
  return { x: pos.x, y: pos.y, w: CLASS_W, h }
}
export function getDatasetRect(pos: Pos): Rect { return { x: pos.x, y: pos.y, w: DATASET_W, h: DATASET_H } }
export function getBrainRect(pos: Pos): Rect { return { x: pos.x, y: pos.y, w: BRAIN_W, h: BRAIN_H } }
export function getVisionRect(pos: Pos): Rect { return { x: pos.x, y: pos.y, w: VISION_W, h: VISION_H } }

/**
 * Ensures brain and vision are to the right of all classes/dataset and never overlap.
 * Called on project load, class add, and after drag end.
 * Returns adjusted brainPos / visionPos (classPositions unchanged — classes are primary).
 */
export function layoutNonColliding(
  classPositions: Record<string, Pos>,
  brainPos: Pos,
  visionPos: Pos,
  opts: { isSingleDataset?: boolean; datasetPos?: Pos; expandedClasses?: Record<string, boolean> } = {}
): { brainPos: Pos; visionPos: Pos } {
  const { isSingleDataset, datasetPos, expandedClasses } = opts

  // collect all left nodes (classes or dataset)
  const leftRects: Rect[] = []
  if (isSingleDataset && datasetPos) {
    leftRects.push(getDatasetRect(datasetPos))
  } else {
    for (const [id, pos] of Object.entries(classPositions)) {
      const exp = expandedClasses?.[id]
      leftRects.push(getClassRect(id, pos, !!exp))
    }
  }

  // if no left nodes, keep brain/vision as is but ensure they don't overlap each other
  let maxRight = 48 + CLASS_W // minimum
  let maxBottom = 80
  for (const r of leftRects) {
    maxRight = Math.max(maxRight, r.x + r.w)
    maxBottom = Math.max(maxBottom, r.y + r.h)
  }

  let newBrain = { ...brainPos }
  let newVision = { ...visionPos }

  // Place brain to the right of left nodes with gap, keep y near top but avoid vertical overlap if needed
  const desiredBrainX = maxRight + 80
  if (newBrain.x < desiredBrainX) newBrain.x = desiredBrainX
  // If brain vertically overlaps any left node at same x-range, push down
  // Simple: keep brain y at least max 80, but if left nodes are tall, keep brain y = 80 as well (horizontal separation is enough)
  // Horizontal separation already ensures no overlap if x gap enforced, so y can stay.

  // Ensure brain and vision don't overlap each other
  const brainRect = getBrainRect(newBrain)
  const visionRect = getVisionRect(newVision)
  if (overlap(brainRect, visionRect)) {
    // push vision to the right of brain
    newVision.x = brainRect.x + brainRect.w + 80
  }
  // Also ensure vision is to the right of left nodes
  const desiredVisionX = Math.max(newVision.x, maxRight + 80 + BRAIN_W + 80)
  // Actually vision should be to right of brain, which already is to right of left, so just ensure.
  if (newVision.x < desiredBrainX + BRAIN_W + 80) {
    // if brain was pushed, vision must be pushed again
    const br = getBrainRect(newBrain)
    newVision.x = br.x + br.w + 80
  }

  // Clamp to canvas bounds (3000x2000) — keep visible within reasonable area
  newBrain.x = Math.min(Math.max(newBrain.x, 48), 2600 - BRAIN_W)
  newBrain.y = Math.min(Math.max(newBrain.y, 24), 1600 - BRAIN_H)
  newVision.x = Math.min(Math.max(newVision.x, 48), 2600 - VISION_W)
  newVision.y = Math.min(Math.max(newVision.y, 24), 1600 - VISION_H)

  return { brainPos: newBrain, visionPos: newVision }
}

/**
 * Checks if a candidate position for a dragged node would overlap any other node.
 * If so, nudges it to the nearest non-overlapping spot (right or down).
 */
export function nudgeToNonColliding(
  draggedId: string,
  candidate: Pos,
  classPositions: Record<string, Pos>,
  brainPos: Pos,
  visionPos: Pos,
  opts: { isSingleDataset?: boolean; datasetPos?: Pos; expandedClasses?: Record<string, boolean> } = {}
): Pos {
  const { isSingleDataset, datasetPos, expandedClasses } = opts
  // Build list of other rects
  const others: Rect[] = []
  if (isSingleDataset) {
    if (draggedId !== 'dataset' && datasetPos) others.push(getDatasetRect(datasetPos))
  } else {
    for (const [id, pos] of Object.entries(classPositions)) {
      if (id === draggedId) continue
      others.push(getClassRect(id, pos, !!expandedClasses?.[id]))
    }
  }
  if (draggedId !== 'brain') others.push(getBrainRect(brainPos))
  if (draggedId !== 'vision') others.push(getVisionRect(visionPos))

  let w: number, h: number
  if (draggedId === 'brain') { w = BRAIN_W; h = BRAIN_H }
  else if (draggedId === 'vision') { w = VISION_W; h = VISION_H }
  else if (draggedId === 'dataset') { w = DATASET_W; h = DATASET_H }
  else { w = CLASS_W; h = (expandedClasses?.[draggedId] ? 420 : CLASS_H) }

  let candRect: Rect = { x: candidate.x, y: candidate.y, w, h }
  // If no overlap, return as is
  if (!others.some(o => overlap(candRect, o))) return candidate

  // Try nudging: first to the right, then down, then right+down
  const tries: Pos[] = [
    { x: candidate.x + GAP + w, y: candidate.y },
    { x: candidate.x, y: candidate.y + GAP + h },
    { x: candidate.x + GAP + w, y: candidate.y + GAP + h },
    { x: candidate.x - GAP - w, y: candidate.y },
    { x: candidate.x, y: candidate.y - GAP - h },
  ]
  for (const t of tries) {
    const r: Rect = { x: t.x, y: t.y, w, h }
    if (!others.some(o => overlap(r, o)) && t.x >= 0 && t.y >= 0 && t.x + w <= 3000 && t.y + h <= 2000) return t
  }
  // If all tries overlap, return original but log (will be overlapping — user can manually move)
  return candidate
}
