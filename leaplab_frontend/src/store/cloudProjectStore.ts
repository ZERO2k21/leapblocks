/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */
import { create } from 'zustand';

export interface PendingCloudProject {
    mode: string;
    data: any;
    projectName?: string;
}

export interface SharedProjectInfo {
    shareId: string;
    permission: 'viewer' | 'editor';
}

interface CloudProjectState {
    pendingProject: PendingCloudProject | null;
    setPendingProject: (project: PendingCloudProject | null) => void;
    clearPendingProject: () => void;
    sharedProjectInfo: SharedProjectInfo | null;
    setSharedProjectInfo: (info: SharedProjectInfo | null) => void;
    clearSharedProjectInfo: () => void;
}

export const useCloudProjectStore = create<CloudProjectState>((set) => ({
    pendingProject: null,
    setPendingProject: (project) => set({ pendingProject: project }),
    clearPendingProject: () => set({ pendingProject: null }),
    sharedProjectInfo: null,
    setSharedProjectInfo: (info) => set({ sharedProjectInfo: info }),
    clearSharedProjectInfo: () => set({ sharedProjectInfo: null }),
}));
