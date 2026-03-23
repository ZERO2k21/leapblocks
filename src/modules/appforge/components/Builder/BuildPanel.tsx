// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AppForge — Build Panel
// APK build UI with progress & logs
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import React, { useState, useRef, useEffect } from 'react';
import type { AFProject } from '../../AppForgeStudio';

interface BuildPanelProps {
  project: AFProject;
}

interface LogEntry {
  time: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

type BuildStatus = 'idle' | 'building' | 'done' | 'error';

export default function BuildPanel({ project }: BuildPanelProps) {
  const [status, setStatus] = useState<BuildStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [outputPath, setOutputPath] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const entry = { time: new Date().toLocaleTimeString(), message, type };
    setLogs(prev => [...prev, entry]);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleBuild = async () => {
    setStatus('building');
    setProgress(0);
    setLogs([]);
    setOutputPath(null);

    addLog('Starting APK build...', 'info');
    addLog(`App: ${project.appName}`, 'info');
    addLog(`Package: ${project.packageName}`, 'info');
    addLog(`Components: ${project.screens.flatMap(s => s.components).length}`, 'info');

    const w = window as any;
    if (!w.electronAPI?.buildApk) {
      addLog('Build API not available (not in Electron)', 'error');
      setStatus('error');
      return;
    }

    // Listen for logs
    const logHandler = (msg: string) => {
      addLog(msg, 'info');
      // Estimate progress from log messages
      if (msg.includes('Decoding')) setProgress(15);
      if (msg.includes('Manifest')) setProgress(30);
      if (msg.includes('assets') || msg.includes('Assets')) setProgress(45);
      if (msg.includes('feature') || msg.includes('Feature')) setProgress(55);
      if (msg.includes('Repack')) setProgress(70);
      if (msg.includes('Sign')) setProgress(85);
      if (msg.includes('complete') || msg.includes('Complete')) setProgress(100);
    };
    w.electronAPI.onBuildLog(logHandler);

    try {
      const result = await w.electronAPI.buildApk({
        appName: project.appName,
        packageName: project.packageName,
        screens: project.screens,
        blocks: project.blocks,
        assets: project.assets,
      });

      if (result.success) {
        setStatus('done');
        setProgress(100);
        setOutputPath(result.outputPath);
        addLog(`✅ Build successful! APK at: ${result.outputPath}`, 'success');
      } else {
        setStatus('error');
        addLog(`❌ Build failed: ${result.error}`, 'error');
      }
    } catch (err: any) {
      setStatus('error');
      addLog(`❌ Build error: ${err.message}`, 'error');
    } finally {
      w.electronAPI.removeBuildLogListener?.();
    }
  };

  const handleOpenFolder = () => {
    if (outputPath) {
      const w = window as any;
      w.electronAPI?.showInFolder?.(outputPath);
    }
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return '#22c55e';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#a1a1aa';
    }
  };

  const componentCount = project.screens.flatMap(s => s.components).length;
  const screenCount = project.screens.length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ── Build Header ──────────────────── */}
      <div style={{ padding: 20, borderBottom: '1px solid #2a2a3a', background: '#16161d' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Build APK
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#71717a' }}>
              {screenCount} screen{screenCount > 1 ? 's' : ''} · {componentCount} component{componentCount > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleBuild}
            disabled={status === 'building'}
            style={{
              padding: '10px 24px', borderRadius: 10, fontWeight: 700, fontSize: 13,
              background: status === 'building' ? '#3f3f46' : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              color: '#fff', border: 'none', cursor: status === 'building' ? 'not-allowed' : 'pointer',
              boxShadow: status === 'building' ? 'none' : '0 4px 16px rgba(59,130,246,0.3)',
              transition: 'all 0.2s',
            }}
          >
            {status === 'building' ? '⏳ Building...' : '🚀 Build APK'}
          </button>
        </div>

        {/* Progress bar */}
        {status !== 'idle' && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#71717a', marginBottom: 4 }}>
              <span>{status === 'building' ? 'Building...' : status === 'done' ? 'Complete!' : 'Error'}</span>
              <span>{progress}%</span>
            </div>
            <div style={{ height: 6, background: '#2a2a3a', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 999, transition: 'width 0.4s ease',
                width: `${progress}%`,
                background: status === 'error' ? '#ef4444' : status === 'done' ? '#22c55e' : 'linear-gradient(90deg, #3b82f6, #06b6d4)',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Project Summary ───────────────── */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #2a2a3a', display: 'flex', gap: 20, fontSize: 12, color: '#a1a1aa' }}>
        <div><strong>App:</strong> {project.appName}</div>
        <div><strong>Package:</strong> {project.packageName}</div>
        <div><strong>Method:</strong> hybrid</div>
      </div>

      {/* ── Build Logs ────────────────────── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px', background: '#0c0c10', fontFamily: '"JetBrains Mono", monospace', fontSize: 11 }}>
        {logs.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#52525b', textAlign: 'center', gap: 8 }}>
            <span style={{ fontSize: 40 }}>📦</span>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Ready to build</div>
            <div style={{ fontSize: 12 }}>Click "Build APK" to compile your app</div>
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={i} style={{ padding: '3px 0', display: 'flex', gap: 8, color: getLogColor(log.type) }}>
              <span style={{ color: '#52525b', minWidth: 70 }}>{log.time}</span>
              <span>{log.message}</span>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      {/* ── Download Bar ──────────────────── */}
      {status === 'done' && outputPath && (
        <div style={{ padding: '12px 20px', borderTop: '1px solid #2a2a3a', background: 'rgba(34,197,94,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>✅ APK Ready</div>
          <button
            onClick={handleOpenFolder}
            style={{ padding: '6px 14px', borderRadius: 6, background: '#22c55e', color: '#000', border: 'none', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
          >
            📂 Open Folder
          </button>
        </div>
      )}
    </div>
  );
}
