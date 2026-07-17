/**
 * Download dataset images for NEURA object detection.
 * Uses Unsplash source URLs to get free images at 200x200px.
 *
 * Usage: node scripts/download-dataset.js
 */

const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')

const BASE_DIR = path.join(__dirname, '..', 'public', 'assets', 'neura-datasets')

// Dataset configuration: category -> subcategory -> search query
const DATASET_CONFIG = {
    animals: {
        cat: { query: 'cat+portrait', count: 10 },
        dog: { query: 'dog+portrait', count: 10 },
        bird: { query: 'bird+photo', count: 10 }
    },
    vehicles: {
        car: { query: 'car+photo', count: 10 },
        bicycle: { query: 'bicycle+photo', count: 10 }
    },
    food: {
        apple: { query: 'apple+fruit', count: 10 },
        banana: { query: 'banana+fruit', count: 10 }
    },
    objects: {
        cup: { query: 'coffee+cup', count: 10 },
        book: { query: 'book+cover', count: 10 }
    }
}

function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http
        const request = protocol.get(url, { timeout: 15000 }, (response) => {
            // Handle redirects
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                downloadFile(response.headers.location, destPath)
                    .then(resolve)
                    .catch(reject)
                return
            }

            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode} for ${url}`))
                return
            }

            const fileStream = fs.createWriteStream(destPath)
            response.pipe(fileStream)
            fileStream.on('finish', () => {
                fileStream.close()
                resolve()
            })
            fileStream.on('error', (err) => {
                fs.unlink(destPath, () => {})
                reject(err)
            })
        })

        request.on('error', reject)
        request.on('timeout', () => {
            request.destroy()
            reject(new Error(`Timeout for ${url}`))
        })
    })
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function downloadSubcategory(category, subcategory, config) {
    const dir = path.join(BASE_DIR, category, subcategory)
    fs.mkdirSync(dir, { recursive: true })

    console.log(`\n📥 Downloading ${subcategory} images (${config.count} images)...`)

    let successCount = 0
    let failCount = 0

    for (let i = 1; i <= config.count; i++) {
        const filename = `${subcategory}_${String(i).padStart(2, '0')}.jpg`
        const destPath = path.join(dir, filename)

        // Skip if file already exists and is valid
        if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
            console.log(`  ⏭️  ${filename} already exists, skipping`)
            successCount++
            continue
        }

        // Unsplash source URL - provides random images at specified size
        const url = `https://source.unsplash.com/200x200/?${config.query}&sig=${Date.now() + i}`

        try {
            await downloadFile(url, destPath)

            // Verify file was downloaded and has reasonable size
            const stats = fs.statSync(destPath)
            if (stats.size < 500) {
                console.log(`  ⚠️  ${filename} too small (${stats.size} bytes), removing`)
                fs.unlinkSync(destPath)
                failCount++
            } else {
                console.log(`  ✅ ${filename} (${Math.round(stats.size / 1024)}KB)`)
                successCount++
            }
        } catch (err) {
            console.log(`  ❌ ${filename} failed: ${err.message}`)
            failCount++
        }

        // Rate limiting - wait between requests
        await sleep(500)
    }

    return { success: successCount, failed: failCount }
}

async function main() {
    console.log('🚀 NEURA Dataset Downloader')
    console.log('============================')
    console.log(`📁 Target directory: ${BASE_DIR}`)
    console.log('')

    let totalSuccess = 0
    let totalFailed = 0

    for (const [category, subcategories] of Object.entries(DATASET_CONFIG)) {
        console.log(`\n📂 Category: ${category.toUpperCase()}`)

        for (const [subcategory, config] of Object.entries(subcategories)) {
            const result = await downloadSubcategory(category, subcategory, config)
            totalSuccess += result.success
            totalFailed += result.failed
        }
    }

    console.log('\n============================')
    console.log(`✅ Download complete!`)
    console.log(`   Success: ${totalSuccess} images`)
    console.log(`   Failed: ${totalFailed} images`)
    console.log(`   Total: ${totalSuccess + totalFailed} images`)
}

main().catch(err => {
    console.error('❌ Fatal error:', err)
    process.exit(1)
})
