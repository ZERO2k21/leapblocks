/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LMS_VERIFY_URL } from './api';

export interface LeapLabAuthState {
    isAuthenticated: boolean;
    username: string | null;
    institutionName: string | null;
    institutionId: string | null;
    credentialId: string | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;
    signIn: (username: string, password: string) => Promise<boolean>;
    signOut: () => void;
    clearError: () => void;
}

export const useLeapLabAuthStore = create<LeapLabAuthState>()(
    persist(
        (set) => ({
            isAuthenticated: false,
            username: null,
            institutionName: null,
            institutionId: null,
            credentialId: null,
            token: null,
            isLoading: false,
            error: null,

            signIn: async (username: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(LMS_VERIFY_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: username.trim(), password }),
                    });

                    const data = await response.json().catch(() => ({}));

                    if (!response.ok || !data.success) {
                        set({
                            isLoading: false,
                            error: data?.message || 'Invalid username or password',
                        });
                        return false;
                    }

                    const { id, username: verifiedUsername, institutionName, institutionId, token } = data.data;

                    set({
                        isAuthenticated: true,
                        username: verifiedUsername,
                        institutionName,
                        institutionId,
                        credentialId: id ?? null,
                        token: token ?? null,
                        isLoading: false,
                        error: null,
                    });
                    return true;
                } catch (err) {
                    set({
                        isLoading: false,
                        error: err instanceof Error ? err.message : 'Network error. Please try again.',
                    });
                    return false;
                }
            },

            signOut: () => {
                set({
                    isAuthenticated: false,
                    username: null,
                    institutionName: null,
                    institutionId: null,
                    credentialId: null,
                    token: null,
                    error: null,
                });
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'leaplab-auth',
            partialize: (state) => ({
                isAuthenticated: state.isAuthenticated,
                username: state.username,
                institutionName: state.institutionName,
                institutionId: state.institutionId,
                credentialId: state.credentialId,
                token: state.token,
            }),
            onRehydrateStorage: () => (state) => {
                // Old sessions persisted before token support won't have a token.
                // Treat them as signed-out so the user re-authenticates.
                if (state && state.isAuthenticated && !state.token) {
                    state.isAuthenticated = false;
                    state.username = null;
                    state.institutionName = null;
                    state.institutionId = null;
                    state.credentialId = null;
                    state.token = null;
                }
            },
        },
    ),
);
