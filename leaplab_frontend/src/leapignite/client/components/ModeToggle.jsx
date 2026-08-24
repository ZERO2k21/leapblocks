import React from 'react';
import { Monitor, Rocket } from 'lucide-react';
import ModeSwitcher from '../../../components/common/ModeSwitcher';

export default function ModeToggle({ mode, onModeChange }) {
  return (
    <ModeSwitcher
      modes={[
        {
          id: 'stage',
          label: 'Stage',
          icon: <Monitor size={13} strokeWidth={2} />,
          activeIcon: <Monitor size={13} strokeWidth={2.5} fill="currentColor" />,
        },
        {
          id: 'upload',
          label: 'Upload',
          icon: <Rocket size={13} strokeWidth={2} />,
          activeIcon: <Rocket size={13} strokeWidth={2.5} fill="currentColor" />,
        },
      ]}
      activeMode={mode}
      onChange={onModeChange}
    />
  );
}
