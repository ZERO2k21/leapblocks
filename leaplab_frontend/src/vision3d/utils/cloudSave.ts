import { saveProjectToCloud, updateCloudProject } from '../../services/cloudProjectApi'
import type { CloudProject } from '../../services/cloudProjectApi'
import { log } from './logger'

async function captureCanvasScreenshot(): Promise<Blob | null> {
  try {
    const canvases = Array.from(document.querySelectorAll('canvas'))
    const mainCanvas = canvases.find((c) => {
      const rect = c.getBoundingClientRect()
      const parent = c.closest('.canvas-3d-container')
      return parent && rect.width > 0 && rect.height > 0
    })

    if (mainCanvas) {
      const offscreen = document.createElement('canvas')
      offscreen.width = 400
      offscreen.height = 300
      const ctx = offscreen.getContext('2d')
      if (ctx) {
        ctx.drawImage(mainCanvas, 0, 0, offscreen.width, offscreen.height)
        return new Promise<Blob | null>((resolve) =>
          offscreen.toBlob(resolve, 'image/png')
        )
      }
    }
  } catch (err) {
    log('captureCanvasScreenshot failed:', err)
  }
  return null
}

export async function saveVision3DProject(
  projectName: string,
  shapes: unknown[],
  project: unknown,
  cloudProjectId?: string
): Promise<CloudProject> {
  const payload = {
    project,
    shapes,
  }

  const thumbnail = await captureCanvasScreenshot()

  log('saveVision3DProject: saving to cloud', projectName)

  if (cloudProjectId) {
    return updateCloudProject(cloudProjectId, {
      projectName,
      mode: 'vision3d',
      payload,
      thumbnail: thumbnail ?? undefined,
    })
  }

  return saveProjectToCloud({
    projectName,
    mode: 'vision3d',
    payload,
    thumbnail: thumbnail ?? undefined,
  })
}
