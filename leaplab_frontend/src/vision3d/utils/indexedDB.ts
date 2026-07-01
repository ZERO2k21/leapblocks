/**
 * Vision3D - IndexedDB Service for Offline Storage
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import { Shape3D, Project3D } from '../types';
import { log, debug, warn } from './logger';

const DB_NAME = 'vision3d_db';
const DB_VERSION = 1;
const PROJECTS_STORE = 'projects';
const SHAPES_STORE = 'shapes';

function openDB(): Promise<IDBDatabase> {
  debug('openDB: opening', DB_NAME, 'v' + DB_VERSION);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        const projectStore = db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
        projectStore.createIndex('name', 'name', { unique: false });
        projectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(SHAPES_STORE)) {
        const shapeStore = db.createObjectStore(SHAPES_STORE, { keyPath: 'id' });
        shapeStore.createIndex('projectId', 'projectId', { unique: false });
      }
    };
  });
}

/**
 * Save a project to IndexedDB
 */
export async function saveProject(project: Project3D): Promise<void> {
  debug('saveProject:', project.id, project.name);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PROJECTS_STORE, 'readwrite');
    const store = transaction.objectStore(PROJECTS_STORE);

    const updatedProject = {
      ...project,
      updatedAt: new Date().toISOString(),
    };

    const request = store.put(updatedProject);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Load a project from IndexedDB
 */
export async function loadProject(projectId: string): Promise<Project3D | null> {
  debug('loadProject:', projectId);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PROJECTS_STORE, 'readonly');
    const store = transaction.objectStore(PROJECTS_STORE);
    const request = store.get(projectId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Load all projects from IndexedDB
 */
export async function loadAllProjects(): Promise<Project3D[]> {
  debug('loadAllProjects');
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PROJECTS_STORE, 'readonly');
    const store = transaction.objectStore(PROJECTS_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a project from IndexedDB
 */
export async function deleteProject(projectId: string): Promise<void> {
  log('deleteProject:', projectId);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PROJECTS_STORE, 'readwrite');
    const store = transaction.objectStore(PROJECTS_STORE);
    const request = store.delete(projectId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save shapes to IndexedDB
 */
export async function saveShapes(
  projectId: string,
  shapes: Shape3D[]
): Promise<void> {
  debug('saveShapes:', shapes.length, 'shapes for project:', projectId);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SHAPES_STORE, 'readwrite');
    const store = transaction.objectStore(SHAPES_STORE);

    // Delete existing shapes for this project
    const index = store.index('projectId');
    const deleteRequest = index.openCursor(IDBKeyRange.only(projectId));

    deleteRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        // All deleted, now add new shapes
        shapes.forEach((shape) => {
          store.put({ ...shape, projectId });
        });
      }
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * Load shapes from IndexedDB
 */
export async function loadShapes(projectId: string): Promise<Shape3D[]> {
  debug('loadShapes: project:', projectId);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SHAPES_STORE, 'readonly');
    const store = transaction.objectStore(SHAPES_STORE);
    const index = store.index('projectId');
    const request = index.getAll(projectId);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Auto-save project (debounced)
 */
let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;

export function autoSave(project: Project3D, shapes: Shape3D[]): void {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }

  autoSaveTimeout = setTimeout(async () => {
    try {
      await saveProject(project);
      await saveShapes(project.id, shapes);
      console.log('[Vision3D] Auto-saved project:', project.id);
    } catch (error) {
      console.error('[Vision3D] Auto-save failed:', error);
    }
  }, 2000);
}

/**
 * Export project as JSON for download
 */
export function exportProjectAsJSON(project: Project3D, shapes: Shape3D[]): string {
  return JSON.stringify(
    {
      version: '1.0',
      project,
      shapes,
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  );
}

/**
 * Import project from JSON
 */
export function importProjectFromJSON(jsonString: string): {
  project: Project3D;
  shapes: Shape3D[];
} {
  log('importProjectFromJSON');
  const data = JSON.parse(jsonString);

  if (!data.version || !data.project || !data.shapes) {
    throw new Error('Invalid project file format');
  }

  return {
    project: data.project,
    shapes: data.shapes,
  };
}
