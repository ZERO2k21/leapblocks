/**
 * Contour-based geometric feature extraction for shape classification.
 * Extracts rotation-invariant features: circularity, aspect ratio, extent,
 * solidity, vertex count, and Hu moments from binary edge maps.
 */

/** Feature vector size: 6 geometric + 7 Hu moments = 13 */
export const SHAPE_FEATURE_SIZE = 13

/**
 * Convert an image element to a grayscale canvas.
 */
function toGrayscaleCanvas(
    input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    const w = input instanceof HTMLVideoElement
        ? input.videoWidth
        : input instanceof HTMLCanvasElement
            ? input.width
            : (input as HTMLImageElement).naturalWidth || 224
    const h = input instanceof HTMLVideoElement
        ? input.videoHeight
        : input instanceof HTMLCanvasElement
            ? input.height
            : (input as HTMLImageElement).naturalHeight || 224
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(input as CanvasImageSource, 0, 0, w, h)
    return canvas
}

/**
 * Apply Sobel edge detection on a grayscale canvas, returning a binary edge map.
 * Returns { edges: Uint8Array (0/1), width, height }
 */
function sobelEdgeDetect(grayCanvas: HTMLCanvasElement): { edges: Uint8Array; width: number; height: number } {
    const ctx = grayCanvas.getContext('2d')!
    const { width, height } = grayCanvas
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    // Convert to grayscale
    const gray = new Float32Array(width * height)
    for (let i = 0; i < width * height; i++) {
        const idx = i * 4
        gray[i] = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114
    }

    // Sobel kernels
    const edges = new Uint8Array(width * height)
    const threshold = 30

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x
            // Gx
            const gx =
                -gray[(y - 1) * width + (x - 1)] + gray[(y - 1) * width + (x + 1)]
                - 2 * gray[y * width + (x - 1)] + 2 * gray[y * width + (x + 1)]
                - gray[(y + 1) * width + (x - 1)] + gray[(y + 1) * width + (x + 1)]
            // Gy
            const gy =
                -gray[(y - 1) * width + (x - 1)] - 2 * gray[(y - 1) * width + x] - gray[(y - 1) * width + (x + 1)]
                + gray[(y + 1) * width + (x - 1)] + 2 * gray[(y + 1) * width + x] + gray[(y + 1) * width + (x + 1)]
            const magnitude = Math.sqrt(gx * gx + gy * gy)
            edges[idx] = magnitude > threshold ? 1 : 0
        }
    }

    return { edges, width, height }
}

/**
 * Find the largest connected contour from the edge map.
 * Returns an array of {x, y} points tracing the contour boundary.
 */
function findLargestContour(edges: Uint8Array, width: number, height: number): { x: number; y: number }[] {
    const visited = new Uint8Array(width * height)
    let bestContour: { x: number; y: number }[] = []

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x
            if (edges[idx] === 0 || visited[idx]) continue

            // BFS flood fill to find connected component
            const component: { x: number; y: number }[] = []
            const queue = [idx]
            visited[idx] = 1

            while (queue.length > 0) {
                const ci = queue.pop()!
                const cx = ci % width
                const cy = (ci - cx) / width
                component.push({ x: cx, y: cy })

                // 8-connectivity
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue
                        const nx = cx + dx
                        const ny = cy + dy
                        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
                        const ni = ny * width + nx
                        if (edges[ni] === 0 || visited[ni]) continue
                        visited[ni] = 1
                        queue.push(ni)
                    }
                }
            }

            if (component.length > bestContour.length) {
                bestContour = component
            }
        }
    }

    return bestContour
}

/**
 * Trace boundary points from a filled binary region.
 * Walks the edge pixels in order to get a proper contour sequence.
 */
function traceBoundary(edges: Uint8Array, width: number, height: number): { x: number; y: number }[] {
    // Find starting edge pixel
    let startX = -1, startY = -1
    for (let y = 1; y < height - 1 && startX < 0; y++) {
        for (let x = 1; x < width - 1 && startX < 0; x++) {
            if (edges[y * width + x] === 1) {
                // Check if it's a boundary pixel (has at least one 0 neighbor)
                const neighbors = [
                    edges[(y - 1) * width + x], edges[(y + 1) * width + x],
                    edges[y * width + (x - 1)], edges[y * width + (x + 1)]
                ]
                if (neighbors.some(n => n === 0)) {
                    startX = x
                    startY = y
                }
            }
        }
    }

    if (startX < 0) return []

    // Moore neighborhood tracing
    const boundary: { x: number; y: number }[] = []
    const dirs = [
        { dx: 0, dy: -1 }, { dx: 1, dy: -1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 },
        { dx: 0, dy: 1 }, { dx: -1, dy: 1 }, { dx: -1, dy: 0 }, { dx: -1, dy: -1 }
    ]
    let dir = 6 // start looking left
    let x = startX, y = startY
    const maxIter = width * height
    let iter = 0

    do {
        boundary.push({ x, y })
        // Try directions starting from (dir+5)%8 (turn right from current direction)
        let found = false
        for (let i = 0; i < 8; i++) {
            const tryDir = (dir + 5 + i) % 8
            const nx = x + dirs[tryDir].dx
            const ny = y + dirs[tryDir].dy
            if (nx >= 0 && nx < width && ny >= 0 && ny < height && edges[ny * width + nx] === 1) {
                x = nx
                y = ny
                dir = tryDir
                found = true
                break
            }
        }
        if (!found) break
        iter++
    } while ((x !== startX || y !== startY) && iter < maxIter)

    return boundary
}

/**
 * Compute polygon approximation of a contour using the Ramer-Douglas-Peucker algorithm.
 * Returns the simplified polygon vertices.
 */
function approximatePolygon(
    contour: { x: number; y: number }[],
    epsilon: number
): { x: number; y: number }[] {
    if (contour.length <= 2) return contour

    // Find point farthest from line between first and last
    let maxDist = 0
    let maxIdx = 0
    const first = contour[0]
    const last = contour[contour.length - 1]

    for (let i = 1; i < contour.length - 1; i++) {
        const dist = pointToLineDistance(contour[i], first, last)
        if (dist > maxDist) {
            maxDist = dist
            maxIdx = i
        }
    }

    if (maxDist > epsilon) {
        const left = approximatePolygon(contour.slice(0, maxIdx + 1), epsilon)
        const right = approximatePolygon(contour.slice(maxIdx), epsilon)
        return left.slice(0, -1).concat(right)
    }

    return [first, last]
}

function pointToLineDistance(
    point: { x: number; y: number },
    lineStart: { x: number; y: number },
    lineEnd: { x: number; y: number }
): number {
    const dx = lineEnd.x - lineStart.x
    const dy = lineEnd.y - lineStart.y
    const lenSq = dx * dx + dy * dy
    if (lenSq === 0) return Math.hypot(point.x - lineStart.x, point.y - lineStart.y)
    const t = Math.max(0, Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSq))
    const projX = lineStart.x + t * dx
    const projY = lineStart.y + t * dy
    return Math.hypot(point.x - projX, point.y - projY)
}

/**
 * Compute simplified Hu moments (7 values) from a contour.
 * These are translation-, scale-, and rotation-invariant.
 */
function computeHuMoments(contour: { x: number; y: number }[]): number[] {
    const n = contour.length
    if (n < 3) return new Array(7).fill(0)

    // Compute central moments
    let m00 = n
    let m10 = 0, m01 = 0
    for (const p of contour) {
        m10 += p.x
        m01 += p.y
    }
    const cx = m10 / m00
    const cy = m01 / m00

    // Central moments
    let mu20 = 0, mu02 = 0, mu11 = 0, mu30 = 0, mu03 = 0, mu21 = 0, mu12 = 0
    for (const p of contour) {
        const dx = p.x - cx
        const dy = p.y - cy
        mu20 += dx * dx
        mu02 += dy * dy
        mu11 += dx * dy
        mu30 += dx * dx * dx
        mu03 += dy * dy * dy
        mu21 += dx * dx * dy
        mu12 += dx * dy * dy
    }

    // Normalize
    const s = m00
    const n2 = s * s
    const n3 = s * s * s

    const eta20 = mu20 / n2
    const eta02 = mu02 / n2
    const eta11 = mu11 / n2
    const eta30 = mu30 / n3
    const eta03 = mu03 / n3
    const eta21 = mu21 / n3
    const eta12 = mu12 / n3

    // Hu moments (simplified, using log scale for invariance)
    const hu = [
        eta20 + eta02,
        (eta20 - eta02) ** 2 + 4 * eta11 ** 2,
        (eta30 - 3 * eta12) ** 2 + (3 * eta21 - eta03) ** 2,
        (eta30 + eta12) ** 2 + (eta21 + eta03) ** 2,
        (eta30 - 3 * eta12) * (eta30 + eta12) * ((eta30 + eta12) ** 2 - 3 * (eta21 + eta03) ** 2) +
        (3 * eta21 - eta03) * (eta21 + eta03) * (3 * (eta30 + eta12) ** 2 - (eta21 + eta03) ** 2),
        (eta20 - eta02) * ((eta30 + eta12) ** 2 - (eta21 + eta03) ** 2) +
        4 * eta11 * (eta30 + eta12) * (eta21 + eta03),
        (3 * eta21 - eta03) * (eta30 + eta12) * ((eta30 + eta12) ** 2 - 3 * (eta21 + eta03) ** 2) -
        (eta30 - 3 * eta12) * (eta21 + eta03) * (3 * (eta30 + eta12) ** 2 - (eta21 + eta03) ** 2)
    ]

    // Apply sign log for scale invariance: sign(x) * log(1 + |x|)
    return hu.map(v => Math.sign(v) * Math.log1p(Math.abs(v)))
}

/**
 * Compute the convex hull of a set of 2D points using Graham scan.
 */
function convexHull(points: { x: number; y: number }[]): { x: number; y: number }[] {
    if (points.length < 3) return points

    // Find bottom-most point (and leftmost if tie)
    let pivot = points[0]
    for (const p of points) {
        if (p.y > pivot.y || (p.y === pivot.y && p.x < pivot.x)) {
            pivot = p
        }
    }

    // Sort by polar angle with respect to pivot
    const sorted = points
        .filter(p => p !== pivot)
        .sort((a, b) => {
            const angleA = Math.atan2(a.y - pivot.y, a.x - pivot.x)
            const angleB = Math.atan2(b.y - pivot.y, b.x - pivot.x)
            if (angleA !== angleB) return angleA - angleB
            const distA = (a.x - pivot.x) ** 2 + (a.y - pivot.y) ** 2
            const distB = (b.x - pivot.x) ** 2 + (b.y - pivot.y) ** 2
            return distA - distB
        })

    const hull = [pivot, sorted[0]]
    for (let i = 1; i < sorted.length; i++) {
        while (hull.length > 1) {
            const a = hull[hull.length - 2]
            const b = hull[hull.length - 1]
            const c = sorted[i]
            const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
            if (cross <= 0) {
                hull.pop()
            } else {
                break
            }
        }
        hull.push(sorted[i])
    }

    return hull
}

function polygonArea(points: { x: number; y: number }[]): number {
    let area = 0
    const n = points.length
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n
        area += points[i].x * points[j].y
        area -= points[j].x * points[i].y
    }
    return Math.abs(area) / 2
}

function contourPerimeter(contour: { x: number; y: number }[]): number {
    let perim = 0
    for (let i = 0; i < contour.length; i++) {
        const j = (i + 1) % contour.length
        perim += Math.hypot(contour[j].x - contour[i].x, contour[j].y - contour[i].y)
    }
    return perim
}

function boundingBox(points: { x: number; y: number }[]): { x: number; y: number; w: number; h: number } {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const p of points) {
        if (p.x < minX) minX = p.x
        if (p.x > maxX) maxX = p.x
        if (p.y < minY) minY = p.y
        if (p.y > maxY) maxY = p.y
    }
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

/**
 * Extract 13-d geometric shape features from an image element.
 * Features: circularity, aspectRatio, extent, solidity, vertexCount, areaRatio,
 *           + 7 Hu moments
 */
export function extractShapeFeatures(
    input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Float32Array {
    const features = new Float32Array(SHAPE_FEATURE_SIZE)

    const grayCanvas = toGrayscaleCanvas(input)
    const { edges, width, height } = sobelEdgeDetect(grayCanvas)

    const contour = traceBoundary(edges, width, height)
    if (contour.length < 10) {
        // Too few points — return zero features
        return features
    }

    const area = polygonArea(contour)
    const perim = contourPerimeter(contour)
    const bbox = boundingBox(contour)

    // 1. Circularity: 4π × area / perimeter² (1.0 for perfect circle)
    features[0] = perim > 0 ? (4 * Math.PI * area) / (perim * perim) : 0

    // 2. Aspect ratio: width / height of bounding box
    features[1] = bbox.h > 0 ? bbox.w / bbox.h : 1

    // 3. Extent: area / bounding box area
    const bboxArea = bbox.w * bbox.h
    features[2] = bboxArea > 0 ? area / bboxArea : 0

    // 4. Solidity: area / convex hull area
    const hull = convexHull(contour)
    const hullArea = polygonArea(hull)
    features[3] = hullArea > 0 ? area / hullArea : 0

    // 5. Vertex count (normalized): polygon approximation
    const perimeter = contourPerimeter(contour)
    const epsilon = perimeter * 0.02 // 2% of perimeter
    const polygon = approximatePolygon(contour, epsilon)
    features[4] = Math.min(1, polygon.length / 12) // normalize: 0-12 vertices → 0-1

    // 6. Area ratio: shape area / total image area
    features[5] = (width * height) > 0 ? area / (width * height) : 0

    // 7-13. Hu moments (7 values)
    const hu = computeHuMoments(contour)
    for (let i = 0; i < 7; i++) {
        features[6 + i] = hu[i]
    }

    return features
}

/**
 * Normalize a 13-d shape feature vector to [0,1] range using min-max normalization.
 */
export function normalizeShapeFeatures(features: Float32Array): Float32Array {
    const out = new Float32Array(features.length)
    // Heuristic ranges for each feature
    const maxVals = [
        1.0,    // circularity: 0-1
        3.0,    // aspectRatio: 0-3
        1.0,    // extent: 0-1
        1.0,    // solidity: 0-1
        1.0,    // vertexCount: 0-1 (already normalized)
        0.5,    // areaRatio: 0-0.5
        2.0,    // Hu1: variable
        2.0,    // Hu2: variable
        2.0,    // Hu3: variable
        2.0,    // Hu4: variable
        4.0,    // Hu5: variable
        4.0,    // Hu6: variable
        4.0,    // Hu7: variable
    ]
    for (let i = 0; i < features.length; i++) {
        out[i] = Math.max(0, Math.min(1, features[i] / (maxVals[i] || 1)))
    }
    return out
}
