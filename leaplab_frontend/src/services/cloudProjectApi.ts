/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */
import { useLeapLabAuthStore } from '../auth/leaplabAuthStore';

export const LMS_API_BASE =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_LMS_API_URL) ||
    'https://lms-api.creoleap.workers.dev';

export const LMS_PROJECTS_URL = `${LMS_API_BASE}/api/leaplab/projects`;

export interface CloudProject {
    id: string;
    institutionId: string;
    credentialId: string;
    name: string;
    description: string | null;
    mode: string;
    fileKey: string | null;
    thumbnailKey: string | null;
    metadata: string | null;
    isActive: number;
    isDeleted: number;
    createdAt: string | null;
    updatedAt: string | null;
    fileUrl: string | null;
    thumbnailUrl: string | null;
}

export interface CloudProjectListResponse {
    success: boolean;
    data: CloudProject[];
}

export interface CloudProjectResponse {
    success: boolean;
    data: CloudProject;
}

export interface SaveProjectPayload {
    projectName: string;
    mode: string;
    payload: any;
    description?: string;
    metadata?: Record<string, any>;
}

function getAuthHeaders(): Record<string, string> {
    const token = useLeapLabAuthStore.getState().token;
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
        throw new Error(data?.message || `Request failed with status ${response.status}`);
    }
    return data as T;
}

export async function saveProjectToCloud({
    projectName,
    mode,
    payload,
    description,
    metadata,
}: SaveProjectPayload): Promise<CloudProject> {
    const projectData = {
        version: '1.0',
        projectName,
        mode,
        timestamp: Date.now(),
        ...payload,
    };

    const file = new File(
        [JSON.stringify(projectData, null, 2)],
        `${projectName.replace(/\s+/g, '_')}.leap`,
        { type: 'application/json' },
    );

    const formData = new FormData();
    formData.append('name', projectName);
    formData.append('mode', mode);
    formData.append('file', file);

    if (description) {
        formData.append('description', description);
    }

    if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
    }

    const response = await fetch(LMS_PROJECTS_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
    });

    const result = await handleResponse<CloudProjectResponse>(response);
    return result.data;
}

export async function listMyProjects(mode?: string): Promise<CloudProject[]> {
    const url = new URL(LMS_PROJECTS_URL);
    if (mode) {
        url.searchParams.set('mode', mode);
    }

    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const result = await handleResponse<CloudProjectListResponse>(response);
    return result.data;
}

export async function getCloudProject(projectId: string): Promise<CloudProject> {
    const response = await fetch(`${LMS_PROJECTS_URL}/${projectId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const result = await handleResponse<CloudProjectResponse>(response);
    return result.data;
}

export async function fetchCloudProjectContent(fileUrl: string): Promise<any> {
    const response = await fetch(fileUrl, {
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch project content: ${response.status}`);
    }

    const text = await response.text();
    return JSON.parse(text);
}

export async function updateCloudProject(
    projectId: string,
    payload: SaveProjectPayload,
): Promise<CloudProject> {
    const projectData = {
        version: '1.0',
        projectName: payload.projectName,
        mode: payload.mode,
        timestamp: Date.now(),
        ...payload.payload,
    };

    const file = new File(
        [JSON.stringify(projectData, null, 2)],
        `${payload.projectName.replace(/\s+/g, '_')}.leap`,
        { type: 'application/json' },
    );

    const formData = new FormData();
    formData.append('name', payload.projectName);
    formData.append('file', file);

    if (payload.description) {
        formData.append('description', payload.description);
    }

    if (payload.metadata) {
        formData.append('metadata', JSON.stringify(payload.metadata));
    }

    const response = await fetch(`${LMS_PROJECTS_URL}/${projectId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: formData,
    });

    const result = await handleResponse<CloudProjectResponse>(response);
    return result.data;
}

export async function deleteCloudProject(projectId: string): Promise<void> {
    const response = await fetch(`${LMS_PROJECTS_URL}/${projectId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    await handleResponse<{ success: boolean; message?: string }>(response);
}
