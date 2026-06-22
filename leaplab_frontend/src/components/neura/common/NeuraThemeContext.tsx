/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

type NeuraTheme = 'light' | 'dark';

interface NeuraThemeContextType {
    theme: NeuraTheme;
    toggleTheme: () => void;
    isDark: boolean;
}

const NeuraThemeContext = createContext<NeuraThemeContextType | undefined>(undefined);

export function NeuraThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<NeuraTheme>(() => {
        try {
            const saved = localStorage.getItem('neura-theme');
            if (saved === 'dark' || saved === 'light') return saved;
        } catch {}
        return 'light';
    });

    useEffect(() => {
        try {
            localStorage.setItem('neura-theme', theme);
        } catch {}
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('neura-dark');
        } else {
            root.classList.remove('neura-dark');
        }
    }, [theme]);

    const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

    return (
        <NeuraThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
            {children}
        </NeuraThemeContext.Provider>
    );
}

export function useNeuraTheme() {
    const context = useContext(NeuraThemeContext);
    if (!context) throw new Error('useNeuraTheme must be used within NeuraThemeProvider');
    return context;
}
