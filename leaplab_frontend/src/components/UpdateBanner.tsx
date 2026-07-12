import React, { useState, useEffect, useCallback } from 'react';

interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  downloadUrl: string;
  releaseNotes: string | null;
  checksum: string | null;
}

interface DownloadProgress {
  percent: number;
  bytesDownloaded: number;
  totalBytes: number;
  status: 'downloading' | 'verifying' | 'done' | 'error';
  error?: string;
}

export function UpdateBanner() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api?.onUpdateAvailable) return;

    const cleanup = api.onUpdateAvailable((info: UpdateInfo) => {
      if (info.hasUpdate) {
        setUpdateInfo(info);
      }
    });

    return () => { if (typeof cleanup === 'function') cleanup(); };
  }, []);

  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api?.onUpdateDownloadProgress) return;

    const cleanup = api.onUpdateDownloadProgress((p: DownloadProgress) => {
      setProgress(p);
      if (p.status === 'error') {
        setError(p.error || 'Download failed');
      }
    });

    return () => { if (typeof cleanup === 'function') cleanup(); };
  }, []);

  const handleUpdate = useCallback(async () => {
    if (!updateInfo) return;

    const api = (window as any).electronAPI;
    if (!api) return;

    setInstalling(true);
    setError(null);

    try {
      const result = await api.downloadUpdate(updateInfo);

      if (!result.success) {
        setError(result.error || 'Download failed');
        setInstalling(false);
        return;
      }

      // Install and quit
      await api.installUpdate(result.installerPath);
    } catch (err: any) {
      setError(err.message || 'Update failed');
      setInstalling(false);
    }
  }, [updateInfo]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  if (!updateInfo || dismissed) return null;

  const progressPercent = progress ? progress.percent : 0;
  const isDownloading = progress?.status === 'downloading';
  const isVerifying = progress?.status === 'verifying';
  const isDone = progress?.status === 'done';
  const isIdle = !installing || isDone;

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      zIndex: 99999,
      width: 380,
      borderRadius: 12,
      background: '#fff',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
              Update Available
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
              LeapLab v{updateInfo.latestVersion} is ready to install
            </p>
          </div>
          {isIdle && (
            <button
              onClick={handleDismiss}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
                fontSize: 18, lineHeight: 1, padding: 0,
              }}
              title="Dismiss"
            >
              &times;
            </button>
          )}
        </div>

        {updateInfo.releaseNotes && (
          <p style={{ margin: '8px 0', fontSize: 12, color: '#64748b', lineHeight: 1.4, maxHeight: 60, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
            {updateInfo.releaseNotes}
          </p>
        )}

        {isDownloading && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
              <span>Downloading...</span>
              <span>{progressPercent}%</span>
            </div>
            <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPercent}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 3, transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )}

        {isVerifying && (
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#64748b' }}>
            Verifying download...
          </p>
        )}

        {error && (
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#ef4444' }}>
            {error}
          </p>
        )}

        {isIdle && !error && !isDone && (
          <button
            onClick={handleUpdate}
            style={{
              marginTop: 12, width: '100%', padding: '10px 0', borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
            }}
          >
            Update to v{updateInfo.latestVersion}
          </button>
        )}

        {isDone && (
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#10b981', textAlign: 'center' }}>
            Update installed. The app will restart.
          </p>
        )}
      </div>
    </div>
  );
}
