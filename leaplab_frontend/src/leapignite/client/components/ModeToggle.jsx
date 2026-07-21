import React from 'react';
import { Monitor, Rocket } from 'lucide-react';
import ModeSwitcher from '../../../components/common/ModeSwitcher';

export default function ModeToggle({ mode, onModeChange }) {
  return (
    <ModeSwitcher
      modes={[
        { id: 'stage', label: 'Stage', icon: <Monitor size={12} strokeWidth={2.5} /> },
        { id: 'upload', label: 'Upload', icon: <Rocket size={12} strokeWidth={2.5} /> },
      ]}
      activeMode={mode}
      onChange={onModeChange}
    />
  );
}
