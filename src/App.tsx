import React, { useState } from 'react';
import LandingPage from './LandingPage';
import IntermediateApp from './IntermediateApp';
// @ts-ignore
import JuniorApp from './junior/JuniorApp';

type AppMode = 'home' | 'intermediate' | 'junior';

export default function App() {
    const [mode, setMode] = useState<AppMode>('home');

    if (mode === 'intermediate') {
        return <IntermediateApp onBack={() => setMode('home')} />;
    }

    if (mode === 'junior') {
        return <JuniorApp onBack={() => setMode('home')} />;
    }

    return <LandingPage onSelect={setMode} />;
}
