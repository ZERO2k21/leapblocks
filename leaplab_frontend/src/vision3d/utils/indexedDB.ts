/**
 * Vision3D - IndexedDB Service for Offline Storage
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import { log, debug, warn } from './logger'
import { serializeGeometry } from './geometry'

const DB_NAME = 'vision3d_db'
const DB_VERSION = 1
const PROJECTS_STORE = 'projects'
const SHAPES_STORE = 'shapes'

function openDB(): Promise<IDBDatabase> {
  debug('openDB: opening', DB_NAME, 'v' + DB_VERSION)
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        const projectStore = db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' })
        projectStore.createIndex('name', 'name', { unique: false })
        projectStore.createIndex('updatedAt', 'updatedAt', { unique: false })
      }

      if (!db.objectStoreNames.contains(SHAPES_STORE)) {
        const shapeStore = db.createObjectStore(SHAPES_STORE, { keyPath: 'id' })
        shapeStore.createIndex('projectId', 'projectId', { unique: false })
      }
    }
  })
}

interface Project {
  id: string
  name: string
  updatedAt?: string
  [key: string]: unknown
}

export async function saveProject(project: Project): Promise<void> {
  debug('saveProject:', project.id, project.name)
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PROJECTS_STORE, 'readwrite')
    const store = transaction.objectStore(PROJECTS_STORE)

    const updatedProject: Project = {
      ...project,
      updatedAt: new Date().toISOString(),
    }

    const request = store.put(updatedProject)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function loadProject(projectId: string): Promise<Project | null> {
  debug('loadProject:', projectId)
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PROJECTS_STORE, 'readonly')
    const store = transaction.objectStore(PROJECTS_STORE)
    const request = store.get(projectId)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function loadAllProjects(): Promise<Project[]> {
  debug('loadAllProjects')
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PROJECTS_STORE, 'readonly')
    const store = transaction.objectStore(PROJECTS_STORE)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

export async function deleteProject(projectId: string): Promise<void> {
  log('deleteProject:', projectId)
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PROJECTS_STORE, 'readwrite')
    const store = transaction.objectStore(PROJECTS_STORE)
    const request = store.delete(projectId)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function saveShapes(
  projectId: string,
  shapes: Record<string, unknown>[]
): Promise<void> {
  debug('saveShapes:', shapes.length, 'shapes for project:', projectId)
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SHAPES_STORE, 'readwrite')
    const store = transaction.objectStore(SHAPES_STORE)

    const index = store.index('projectId')
    const deleteRequest = index.openCursor(IDBKeyRange.only(projectId))

    deleteRequest.onsuccess = (event: Event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      } else {
        const serializedShapes = JSON.parse(JSON.stringify(shapes, (key, val) => {
          if (key === '_csgGeometry' && val && val.attributes) return serializeGeometry(val)
          if (key === '_customGeometry' && val && val.attributes) return serializeGeometry(val)
          return val
        }))
        ;(serializedShapes as Record<string, unknown>[]).forEach((shape) => {
          store.put({ ...shape, projectId })
        })
      }
    }

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function loadShapes(
  projectId: string
): Promise<Record<string, unknown>[]> {
  debug('loadShapes: project:', projectId)
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SHAPES_STORE, 'readonly')
    const store = transaction.objectStore(SHAPES_STORE)
    const index = store.index('projectId')
    const request = index.getAll(projectId)

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null

export function autoSave(
  project: Project,
  shapes: Record<string, unknown>[]
): void {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout)
  }

  autoSaveTimeout = setTimeout(async () => {
    try {
      await saveProject(project)
      await saveShapes(project.id, shapes)
      console.log('[Vision3D] Auto-saved project:', project.id)
    } catch (error) {
      console.error('[Vision3D] Auto-save failed:', error)
    }
  }, 2000)
}

export function exportProjectAsJSON(
  project: Project,
  shapes: Record<string, unknown>[]
): string {
  return JSON.stringify(
    {
      version: '1.0',
      project,
      shapes,
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  )
}

export function importProjectFromJSON(
  jsonString: string
): { project: Project; shapes: Record<string, unknown>[] } {
  log('importProjectFromJSON')
  const data = JSON.parse(jsonString) as Record<string, unknown>

  if (!data.version || !data.shapes) {
    throw new Error('Invalid project file format')
  }

  const project: Project = (data.project as Project) || {
    id: `project_${Date.now()}`,
    name: (data.projectName as string) || (data.name as string) || 'Imported Project',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return {
    project,
    shapes: data.shapes as Record<string, unknown>[],
  }
}
