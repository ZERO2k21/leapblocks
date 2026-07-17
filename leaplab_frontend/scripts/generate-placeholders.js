/**
 * Generate placeholder dataset images for NEURA.
 * Creates 200x200 JPEG images with varied visual patterns.
 *
 * Usage: node scripts/generate-placeholders.js
 */

const fs = require('fs')
const path = require('path')

const BASE_DIR = path.join(__dirname, '..', 'public', 'assets', 'neura-datasets')

// Dataset configuration
const DATASET = {
    animals: {
        cat: { count: 10, baseColor: [255, 140, 0], patterns: ['stripes', 'spots', 'solid'] },
        dog: { count: 10, baseColor: [139, 90, 43], patterns: ['fur', 'spots', 'solid'] },
        bird: { count: 10, baseColor: [236, 72, 153], patterns: ['feathers', 'wings', 'solid'] }
    },
    vehicles: {
        car: { count: 10, baseColor: [59, 130, 246], patterns: ['sedan', 'suv', 'solid'] },
        bicycle: { count: 10, baseColor: [139, 92, 246], patterns: ['wheels', 'frame', 'solid'] }
    },
    food: {
        apple: { count: 10, baseColor: [239, 68, 68], patterns: ['round', 'stem', 'solid'] },
        banana: { count: 10, baseColor: [245, 158, 11], patterns: ['curved', 'peel', 'solid'] }
    },
    objects: {
        cup: { count: 10, baseColor: [6, 182, 212], patterns: ['handle', 'rim', 'solid'] },
        book: { count: 10, baseColor: [16, 185, 129], patterns: ['cover', 'pages', 'solid'] }
    }
}

// Simple seeded random number generator
function seededRandom(seed) {
    let s = seed
    return function() {
        s = (s * 16807 + 0) % 2147483647
        return (s - 1) / 2147483646
    }
}

// Generate a simple JPEG-like binary (actually a BMP converted approach won't work in pure Node)
// Instead, we'll create the images as base64-encoded PNGs using a minimal PNG encoder

function createMinimalPNG(width, height, pixels) {
    // Minimal PNG creation
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

    // IHDR chunk
    const ihdrData = Buffer.alloc(13)
    ihdrData.writeUInt32BE(width, 0)
    ihdrData.writeUInt32BE(height, 4)
    ihdrData[8] = 8  // bit depth
    ihdrData[9] = 2  // color type (RGB)
    ihdrData[10] = 0 // compression
    ihdrData[11] = 0 // filter
    ihdrData[12] = 0 // interlace
    const ihdr = createChunk('IHDR', ihdrData)

    // IDAT chunk (raw image data with zlib)
    const rawData = []
    for (let y = 0; y < height; y++) {
        rawData.push(0) // filter byte (none)
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 3
            rawData.push(pixels[idx], pixels[idx + 1], pixels[idx + 2])
        }
    }
    const rawBuffer = Buffer.from(rawData)
    const zlib = require('zlib')
    const compressed = zlib.deflateSync(rawBuffer)
    const idat = createChunk('IDAT', compressed)

    // IEND chunk
    const iend = createChunk('IEND', Buffer.alloc(0))

    return Buffer.concat([signature, ihdr, idat, iend])
}

function createChunk(type, data) {
    const length = Buffer.alloc(4)
    length.writeUInt32BE(data.length, 0)
    const typeBuffer = Buffer.from(type, 'ascii')
    const crcData = Buffer.concat([typeBuffer, data])
    const crc = crc32(crcData)
    const crcBuffer = Buffer.alloc(4)
    crcBuffer.writeUInt32BE(crc, 0)
    return Buffer.concat([length, typeBuffer, data, crcBuffer])
}

function crc32(buf) {
    let crc = 0xFFFFFFFF
    for (let i = 0; i < buf.length; i++) {
        crc ^= buf[i]
        for (let j = 0; j < 8; j++) {
            crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0)
        }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0
}

function generateImage(label, baseColor, index, pattern) {
    const width = 200
    const height = 200
    const pixels = new Uint8Array(width * height * 3)
    const rand = seededRandom(index * 1000 + label.charCodeAt(0) * 100 + baseColor[0])

    // Background gradient
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 3
            const gradient = 0.7 + 0.3 * (y / height)
            pixels[idx] = Math.min(255, baseColor[0] * gradient * 0.3 + 240)
            pixels[idx + 1] = Math.min(255, baseColor[1] * gradient * 0.3 + 240)
            pixels[idx + 2] = Math.min(255, baseColor[2] * gradient * 0.3 + 240)
        }
    }

    // Draw main shape based on pattern
    const centerX = 100
    const centerY = 100
    const size = 60 + rand() * 30

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dx = x - centerX
            const dy = y - centerY
            const dist = Math.sqrt(dx * dx + dy * dy)
            const idx = (y * width + x) * 3

            let inShape = false

            if (pattern === 'stripes') {
                inShape = dist < size && (Math.floor((x + y) / 15) % 2 === 0)
            } else if (pattern === 'spots') {
                inShape = dist < size && (Math.floor(x / 20) + Math.floor(y / 20)) % 3 === 0
            } else if (pattern === 'round') {
                inShape = dist < size
            } else if (pattern === 'curved') {
                inShape = dist < size && dy > -size * 0.3
            } else if (pattern === 'wheels') {
                const wheelDist = Math.sqrt((x - 60) ** 2 + (y - 130) ** 2) + Math.sqrt((x - 140) ** 2 + (y - 130) ** 2)
                inShape = wheelDist < 200 && dist < size * 1.2
            } else if (pattern === 'handle') {
                inShape = dist < size || (x > 130 && x < 160 && y > 70 && y < 130)
            } else if (pattern === 'cover') {
                inShape = x > 60 && x < 140 && y > 40 && y < 160
            } else {
                inShape = dist < size
            }

            if (inShape) {
                const shade = 0.8 + rand() * 0.2
                pixels[idx] = Math.min(255, baseColor[0] * shade)
                pixels[idx + 1] = Math.min(255, baseColor[1] * shade)
                pixels[idx + 2] = Math.min(255, baseColor[2] * shade)
            }
        }
    }

    // Add border
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 3
            if (x < 3 || x >= width - 3 || y < 3 || y >= height - 3) {
                pixels[idx] = baseColor[0] * 0.5
                pixels[idx + 1] = baseColor[1] * 0.5
                pixels[idx + 2] = baseColor[2] * 0.5
            }
        }
    }

    return createMinimalPNG(width, height, pixels)
}

function main() {
    console.log('🖼️  NEURA Dataset Image Generator')
    console.log('==================================')
    console.log(`📁 Target: ${BASE_DIR}`)
    console.log('')

    let totalGenerated = 0

    for (const [category, subcategories] of Object.entries(DATASET)) {
        console.log(`\n📂 Category: ${category.toUpperCase()}`)

        for (const [subcategory, config] of Object.entries(subcategories)) {
            const dir = path.join(BASE_DIR, category, subcategory)
            fs.mkdirSync(dir, { recursive: true })

            console.log(`  📥 ${subcategory} (${config.count} images)...`)

            for (let i = 1; i <= config.count; i++) {
                const filename = `${subcategory}_${String(i).padStart(2, '0')}.png`
                const filepath = path.join(dir, filename)

                // Skip if exists
                if (fs.existsSync(filepath) && fs.statSync(filepath).size > 500) {
                    console.log(`    ⏭️  ${filename} exists, skipping`)
                    totalGenerated++
                    continue
                }

                const pattern = config.patterns[i % config.patterns.length]
                const imageData = generateImage(subcategory, config.baseColor, i, pattern)
                fs.writeFileSync(filepath, imageData)

                console.log(`    ✅ ${filename} (${Math.round(imageData.length / 1024)}KB)`)
                totalGenerated++
            }
        }
    }

    console.log('\n==================================')
    console.log(`✅ Generated ${totalGenerated} images`)
    console.log('')
    console.log('⚠️  Note: These are generated placeholder images.')
    console.log('    Replace them with real photos for better training results.')
    console.log('    Use the same naming pattern: {subcategory}_{NN}.png')
}

main()
