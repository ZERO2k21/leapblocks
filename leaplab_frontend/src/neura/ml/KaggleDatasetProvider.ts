/**
 * Kaggle Dataset API Provider for NEURA.
 * Allows users to search and download images from Kaggle's free public datasets.
 *
 * Requires Kaggle API credentials (username + API key).
 * Get yours at: https://www.kaggle.com/settings -> API -> Create New Token
 */

const KAGGLE_API_BASE = 'https://www.kaggle.com/api/v1'

export interface KaggleDataset {
    ref: string
    title: string
    size: number
    totalBytes: number
    downloadCount: number
    lastUpdated: string
    slug: string
}

export interface KaggleFile {
    path: string
    name: string
    size: number
    creationDate: string
}

export interface KaggleCredentials {
    username: string
    apiKey: string
}

export interface KaggleSearchResult {
    datasets: KaggleDataset[]
    totalCount: number
}

// Storage keys
const CREDENTIALS_KEY = 'neura-kaggle-credentials'

/**
 * Get stored Kaggle credentials from localStorage.
 */
export function getStoredCredentials(): KaggleCredentials | null {
    try {
        const stored = localStorage.getItem(CREDENTIALS_KEY)
        if (!stored) return null
        return JSON.parse(stored)
    } catch {
        return null
    }
}

/**
 * Store Kaggle credentials in localStorage.
 */
export function storeCredentials(credentials: KaggleCredentials): void {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials))
}

/**
 * Clear stored Kaggle credentials.
 */
export function clearCredentials(): void {
    localStorage.removeItem(CREDENTIALS_KEY)
}

/**
 * Check if Kaggle credentials are configured.
 */
export function hasCredentials(): boolean {
    return getStoredCredentials() !== null
}

/**
 * Create Basic Auth header for Kaggle API.
 */
function createAuthHeader(credentials: KaggleCredentials): string {
    const encoded = btoa(`${credentials.username}:${credentials.apiKey}`)
    return `Basic ${encoded}`
}

/**
 * Make an authenticated request to Kaggle API.
 */
async function kaggleFetch(
    endpoint: string,
    credentials: KaggleCredentials,
    options: RequestInit = {}
): Promise<any> {
    const url = `${KAGGLE_API_BASE}${endpoint}`
    const headers = {
        'Authorization': createAuthHeader(credentials),
        ...options.headers
    }

    console.log('[Kaggle] Request:', url)

    const response = await fetch(url, {
        ...options,
        headers
    })

    console.log('[Kaggle] Response:', response.status, response.statusText)

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('[Kaggle] Error response:', errorText)

        if (response.status === 401) {
            throw new Error('Invalid Kaggle credentials. Please check your username and API key.')
        }
        if (response.status === 403) {
            throw new Error('Kaggle API access denied. Your API key may be invalid.')
        }
        if (response.status === 400) {
            throw new Error(`Kaggle API error: Bad Request. Please check your credentials and try again.`)
        }
        throw new Error(`Kaggle API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
}

/**
 * Test Kaggle credentials by making a simple API call.
 */
export async function testCredentials(credentials: KaggleCredentials): Promise<boolean> {
    try {
        await kaggleFetch('/datasets/list?search=test&maxSize=1', credentials)
        return true
    } catch (err) {
        console.error('[Kaggle] Credential test failed:', err)
        return false
    }
}

/**
 * Search for datasets on Kaggle.
 */
export async function searchDatasets(
    query: string,
    credentials: KaggleCredentials,
    page: number = 1,
    pageSize: number = 20
): Promise<KaggleSearchResult> {
    const params = new URLSearchParams({
        search: query,
        page: String(page),
        pageSize: String(pageSize)
    })

    const data = await kaggleFetch(`/datasets/list?${params}`, credentials)

    return {
        datasets: (data || []).map((d: any) => ({
            ref: d.ref || '',
            title: d.title || d.ref || 'Untitled',
            size: d.totalBytes || 0,
            totalBytes: d.totalBytes || 0,
            downloadCount: d.downloadCount || 0,
            lastUpdated: d.lastUpdated || '',
            slug: d.slug || d.ref || ''
        })),
        totalCount: data?.length || 0
    }
}

/**
 * Download a dataset as a zip file and extract images.
 * Returns an array of { name, dataUrl } pairs.
 */
export async function downloadDatasetImages(
    datasetRef: string,
    credentials: KaggleCredentials,
    maxImages: number = 50,
    onProgress?: (progress: number, message: string) => void
): Promise<{ name: string; dataUrl: string }[]> {
    onProgress?.(0, 'Starting download...')

    const results: { name: string; dataUrl: string }[] = []

    // Download the dataset zip
    onProgress?.(10, 'Downloading dataset zip...')
    const zipUrl = `${KAGGLE_API_BASE}/datasets/download/${datasetRef}`

    try {
        const response = await fetch(zipUrl, {
            headers: {
                'Authorization': createAuthHeader(credentials)
            }
        })

        if (!response.ok) {
            throw new Error(`Download failed: ${response.status} ${response.statusText}`)
        }

        const blob = await response.blob()
        onProgress?.(40, 'Extracting images...')

        // Dynamic import of JSZip
        const JSZip = (await import('jszip')).default
        const zip = await JSZip.loadAsync(blob)
        let processed = 0

        // Get all image files from the zip
        const imageFiles: { path: string; file: any }[] = []
        zip.forEach((path, file) => {
            if (!file.dir && /\.(jpg|jpeg|png|gif|webp)$/i.test(path)) {
                imageFiles.push({ path, file })
            }
        })

        console.log(`[Kaggle] Found ${imageFiles.length} images in dataset`)

        if (imageFiles.length === 0) {
            throw new Error('No image files found in this dataset. The dataset may contain non-image files.')
        }

        // Extract up to maxImages
        const filesToExtract = imageFiles.slice(0, maxImages)

        for (let i = 0; i < filesToExtract.length; i++) {
            const { path, file } = filesToExtract[i]

            try {
                const data = await file.async('base64')
                const ext = path.split('.').pop()?.toLowerCase() || 'jpg'
                const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg'
                const dataUrl = `data:${mimeType};base64,${data}`
                const name = path.split('/').pop() || path

                results.push({ name, dataUrl })
                processed++
                onProgress?.(40 + (processed / filesToExtract.length) * 55, `Processing ${processed}/${filesToExtract.length}...`)
            } catch (err) {
                console.warn(`[Kaggle] Failed to extract ${path}:`, err)
            }
        }
    } catch (err: any) {
        console.error('[Kaggle] Download error:', err)
        throw new Error(`Failed to download dataset: ${err.message}`)
    }

    onProgress?.(100, `Downloaded ${results.length} images`)
    return results
}

/**
 * Resize an image to fit within max dimensions.
 */
export function resizeImage(
    dataUrl: string,
    maxDim: number = 200,
    quality: number = 0.8
): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
            const canvas = document.createElement('canvas')
            const scale = Math.min(maxDim / img.width, maxDim / img.height, 1)
            canvas.width = Math.floor(img.width * scale)
            canvas.height = Math.floor(img.height * scale)
            const ctx = canvas.getContext('2d')!
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            resolve(canvas.toDataURL('image/jpeg', quality))
        }
        img.onerror = () => resolve(dataUrl)
        img.src = dataUrl
    })
}
