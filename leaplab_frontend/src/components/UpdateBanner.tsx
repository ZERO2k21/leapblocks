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
    <div className="fixed bottom-5 right-5 z-[99999] w-[380px] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden font-sans">
      <div className="p-4 px-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="m-0 text-sm font-bold text-slate-800">
              Update Available
            </h3>
            <p className="m-0 mt-1 text-xs text-slate-500">
              LeapLab v{updateInfo.latestVersion} is ready to install
            </p>
          </div>
          {isIdle && (
            <button
              type="button"
              onClick={handleDismiss}
              className="bg-transparent border-0 cursor-pointer text-slate-400 text-lg leading-none p-0 hover:text-slate-600"
              title="Dismiss"
            >
              &times;
            </button>
          )}
        </div>

        {updateInfo.releaseNotes && (
          <p className="my-2 text-xs text-slate-500 leading-relaxed max-h-15 overflow-auto whitespace-pre-wrap">
            {updateInfo.releaseNotes}
          </p>
        )}

        {isDownloading && (
          <div className="mt-3">
            <div className="flex justify-between text-[11px] text-slate-500 mb-1">
              <span>Downloading...</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        )}

        {isVerifying && (
          <p className="mt-3 m-0 text-xs text-slate-500">
            Verifying download...
          </p>
        )}

        {error && (
          <p className="mt-3 m-0 text-xs text-red-500 font-medium">
            {error}
          </p>
        )}

        {isIdle && !error && !isDone && (
          <button
            type="button"
            onClick={handleUpdate}
            className="mt-3 w-full py-2.5 rounded-xl border-0 bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-semibold cursor-pointer shadow-md shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 transition-all"
          >
            Update to v{updateInfo.latestVersion}
          </button>
        )}

        {isDone && (
          <p className="mt-3 m-0 text-xs text-emerald-600 font-semibold text-center">
            Update installed. The app will restart.
          </p>
        )}
      </div>
    </div>
  );
}
