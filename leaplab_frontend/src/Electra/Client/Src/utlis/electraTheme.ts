export interface ElectraVars {
  [key: string]: string;
}

export function getElectraVars(board: string, theme: string): ElectraVars {
  const v: ElectraVars = {
    '--lp-dark-bg': 'rgba(10, 11, 14, 0.45)',
    '--lp-dark-surface': 'rgba(20, 22, 28, 0.6)',
    '--lp-zinc-800': 'rgba(39, 39, 42, 0.5)',
    '--lp-zinc-700': 'rgba(63, 63, 70, 0.5)',
    '--lp-zinc-600': 'rgba(82, 82, 91, 0.5)',
    '--lp-zinc-400': '#a1a1aa',
    '--lp-accent-primary': '#3B82F6',
    '--lp-accent-bright': '#60A5FA',
    '--lp-accent-dark': '#1D4ED8',
    '--lp-accent-hover': 'rgba(59, 130, 246, 0.08)',
    '--lp-btn-text': '#ffffff',
    '--lp-emerald': '#10b981',
    '--lp-amber': '#f59e0b',
    '--lp-rose': '#f43f5e',
    '--lp-bg': '#09090b',
    '--lp-glass': 'rgba(15, 17, 23, 0.65)',
    '--lp-border': 'rgba(255, 255, 255, 0.08)',
    '--lp-border-active': 'rgba(59, 130, 246, 0.3)',
    '--lp-shadow': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    '--lp-shadow-lg': '0 12px 40px 0 rgba(0, 0, 0, 0.5)',
    '--lp-glow': '0 0 20px rgba(59, 130, 246, 0.2)',
    '--lp-save-glow': 'rgba(59, 130, 246, 0.4) 0px 4px 10px -1px',
    '--lp-radius': '16px',
    '--lp-radius-sm': '8px',
    '--header-height': '48px',
    '--footer-height': '30px',
    '--sidebar-width': '260px',
    '--lp-bg-gradient': 'radial-gradient(at 20% 10%, rgba(59, 130, 246, 0.12) 0px, transparent 50%), radial-gradient(at 80% 20%, rgba(96, 165, 250, 0.08) 0px, transparent 50%), linear-gradient(180deg, #07080b 0%, #0f1115 100%)',
    '--code-font': "'JetBrains Mono', monospace",
    '--lp-text-color': '#f8fafc',
    '--lp-badge-bg': 'rgba(255, 255, 255, 0.03)',
    '--lp-badge-border': 'rgba(255, 255, 255, 0.08)',
    '--lp-badge-color': '#3B82F6',
    '--lp-wifi-clear-bg': 'rgba(34, 211, 238, 0.1)',
    '--lp-wifi-clear-border': 'rgba(34, 211, 238, 0.3)',
  };

  if (board === 'arduino-uno') {
    Object.assign(v, {
      '--lp-accent-primary': '#00f2fe',
      '--lp-accent-bright': '#4facfe',
      '--lp-accent-dark': '#00828a',
      '--lp-accent-hover': 'rgba(0, 242, 254, 0.08)',
      '--lp-btn-text': '#05050a',
      '--lp-bg': '#0b0c10',
      '--lp-dark-surface': 'rgba(15, 23, 30, 0.65)',
      '--lp-dark-bg': 'rgba(10, 15, 20, 0.45)',
      '--lp-zinc-800': 'rgba(30, 41, 59, 0.5)',
      '--lp-zinc-700': 'rgba(51, 65, 85, 0.5)',
      '--lp-zinc-600': 'rgba(71, 85, 105, 0.5)',
      '--lp-zinc-400': '#94a3b8',
      '--lp-border-active': 'rgba(0, 242, 254, 0.35)',
      '--lp-save-glow': 'rgba(0, 242, 254, 0.3) 0px 4px 12px',
      '--lp-bg-gradient': 'radial-gradient(at 20% 10%, rgba(0, 242, 254, 0.1) 0px, transparent 50%), radial-gradient(at 80% 20%, rgba(79, 172, 254, 0.06) 0px, transparent 50%), linear-gradient(180deg, #07090e 0%, #0d1117 100%)',
      '--code-font': "'Space Mono', 'Fira Code', monospace",
      '--lp-badge-bg': 'rgba(0, 242, 254, 0.08)',
      '--lp-badge-border': 'rgba(0, 242, 254, 0.3)',
      '--lp-badge-color': '#00f2fe',
      '--lp-wifi-clear-bg': 'rgba(0, 242, 254, 0.08)',
      '--lp-wifi-clear-border': '1px solid rgba(0, 242, 254, 0.2)',
      '--lp-glass': 'rgba(10, 15, 20, 0.7)',
    });
  }

  if (board === 'esp32-c3') {
    Object.assign(v, {
      '--lp-accent-primary': '#f97316',
      '--lp-accent-bright': '#fdba74',
      '--lp-accent-dark': '#c2410c',
      '--lp-accent-hover': 'rgba(249, 115, 22, 0.1)',
      '--lp-btn-text': '#050505',
      '--lp-bg': '#09090b',
      '--lp-dark-surface': 'rgba(24, 20, 20, 0.65)',
      '--lp-dark-bg': 'rgba(14, 10, 10, 0.45)',
      '--lp-zinc-800': 'rgba(59, 41, 30, 0.5)',
      '--lp-zinc-700': 'rgba(85, 65, 51, 0.5)',
      '--lp-zinc-600': 'rgba(105, 85, 71, 0.5)',
      '--lp-zinc-400': '#cbd5e1',
      '--lp-border-active': 'rgba(249, 115, 22, 0.35)',
      '--lp-save-glow': 'rgba(249, 115, 22, 0.3) 0px 4px 12px',
      '--lp-bg-gradient': 'radial-gradient(at 20% 10%, rgba(249, 115, 22, 0.12) 0px, transparent 50%), radial-gradient(at 80% 20%, rgba(239, 68, 68, 0.06) 0px, transparent 50%), linear-gradient(180deg, #090807 0%, #15110f 100%)',
      '--code-font': "'JetBrains Mono', 'Fira Code', monospace",
      '--lp-badge-bg': 'rgba(249, 115, 22, 0.1)',
      '--lp-badge-border': 'rgba(249, 115, 22, 0.4)',
      '--lp-badge-color': '#f97316',
      '--lp-wifi-clear-bg': 'rgba(249, 115, 22, 0.15)',
      '--lp-wifi-clear-border': '1px solid rgba(249, 115, 22, 0.4)',
      '--lp-glass': 'rgba(24, 20, 20, 0.7)',
    });
  }

  return v;
}

export function getLightThemeVars(board: string): ElectraVars {
  const v: ElectraVars = {
    '--lp-bg': '#e2e8f0',
    '--lp-dark-bg': '#f1f5f9',
    '--lp-dark-surface': '#ffffff',
    '--lp-border': '#e2e8f0',
    '--lp-border-active': '#cbd5e1',
    '--lp-zinc-800': '#f1f5f9',
    '--lp-zinc-700': '#e2e8f0',
    '--lp-zinc-600': '#94a3b8',
    '--lp-zinc-400': '#475569',
    '--lp-text-color': '#0f172a',
    '--lp-glass': 'rgba(255, 255, 255, 0.85)',
    '--lp-shadow': '0 4px 12px rgba(0, 0, 0, 0.05)',
    '--lp-shadow-lg': '0 10px 25px rgba(0, 0, 0, 0.08)',
  };

  if (board === 'arduino-uno') {
    v['--lp-accent-primary'] = '#0284c7';
    v['--lp-accent-bright'] = '#0ea5e9';
    v['--lp-border-active'] = 'rgba(2, 132, 199, 0.3)';
  }

  if (board === 'esp32-c3') {
    v['--lp-accent-primary'] = '#ea580c';
    v['--lp-accent-bright'] = '#f97316';
    v['--lp-border-active'] = 'rgba(234, 88, 12, 0.3)';
  }

  return v;
}
