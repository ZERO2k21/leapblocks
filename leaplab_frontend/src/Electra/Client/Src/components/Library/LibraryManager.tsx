/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Download, Trash2, Library as LibraryIcon, CheckCircle, Info, Loader2, Package } from 'lucide-react';
import {
  searchLibraries,
  getLibraries,
  installLibrary,
  removeLibrary,
  Library,
} from '../../services/LibraryService';
import { useForgeStore } from '../../../utlis/store/useForgeStore';

export const LibraryManager: React.FC = () => {
  const uiTheme = useForgeStore((state) => state.uiTheme);
  const board = useForgeStore((state) => state.board);
  const isLightTheme = uiTheme === 'light';

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [allLibraries, setAllLibraries] = useState<Library[]>([]);
  const [installedLibraries, setInstalledLibraries] = useState<Library[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInstalling, setIsInstalling] = useState<Record<string, boolean>>({});
  const [visibleCount, setVisibleCount] = useState(40);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshInstalled = useCallback(async (): Promise<Library[]> => {
    try {
      const libs = await getLibraries();
      setInstalledLibraries(libs);
      return libs;
    } catch (err) {
      console.error('[FORGE] Failed to fetch libraries:', err);
      return [];
    }
  }, []);

  // Load full index on mount
  useEffect(() => {
    setIsLoading(true);
    Promise.all([searchLibraries(''), refreshInstalled()]).then(([libs, installed]) => {
      const installedNames = new Set(installed.map((i: Library) => i.name.toLowerCase()));
      const mapped = libs.map((lib: Library) => ({
        ...lib,
        isInstalled: installedNames.has(lib.name.toLowerCase()),
      }));
      setAllLibraries(mapped);
      setIsLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search input — 200ms delay
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(val);
      setVisibleCount(40); // reset scroll window on new search
    }, 200);
  };

  // Filtered list — computed only when debouncedQuery or allLibraries changes
  const searchResults = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return allLibraries;
    return allLibraries.filter(
      l =>
        l.name.toLowerCase().includes(q) ||
        l.author.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q),
    );
  }, [debouncedQuery, allLibraries]);

  // Visible slice — only render what's needed
  const visibleResults = useMemo(() => searchResults.slice(0, visibleCount), [searchResults, visibleCount]);

  // Load more on scroll
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
      setVisibleCount(c => Math.min(c + 40, searchResults.length));
    }
  }, [searchResults.length]);

  const handleInstall = async (lib: Library) => {
    setIsInstalling(prev => ({ ...prev, [lib.name]: true }));
    try {
      console.log(`[LIBRARY MANAGER] Installing library: ${lib.name}`);
      const result = await installLibrary(lib);
      console.log(`[LIBRARY MANAGER] Install result:`, result);

      if (result.success) {
        console.log(`[LIBRARY MANAGER] Successfully installed ${lib.name}, refreshing list...`);

        // Wait a bit for filesystem to sync
        await new Promise(resolve => setTimeout(resolve, 500));

        // Refresh installed libraries
        const installed = await refreshInstalled();
        console.log(`[LIBRARY MANAGER] Refreshed installed libraries:`, installed);
        console.log(`[LIBRARY MANAGER] Installed library names:`, installed.map(l => l.name));

        // Update the search results to show as installed
        setAllLibraries(prev => {
          const installedNames = new Set(installed.map(l => l.name.toLowerCase()));
          return prev.map(l => ({
            ...l,
            isInstalled: installedNames.has(l.name.toLowerCase())
          }));
        });

        console.log(`[LIBRARY MANAGER] UI updated, ${lib.name} should now show as LINKED`);
      } else {
        console.error('[LIBRARY MANAGER] Install failed:', result.error);
        alert(`Failed to install "${lib.name}":\n${result.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('[LIBRARY MANAGER] Installation error:', err);
      alert(`Error installing "${lib.name}":\n${err.message || 'Unknown error'}`);
    } finally {
      setIsInstalling(prev => ({ ...prev, [lib.name]: false }));
    }
  };

  const handleRemove = async (name: string) => {
    if (!confirm(`Remove "${name}" from this project?`)) return;
    try {
      console.log(`[LIBRARY MANAGER] Removing library: ${name}`);
      const result = await removeLibrary(name);
      console.log(`[LIBRARY MANAGER] Remove result:`, result);

      if (result.success) {
        console.log(`[LIBRARY MANAGER] Successfully removed ${name}, refreshing list...`);

        // Wait a bit for filesystem to sync
        await new Promise(resolve => setTimeout(resolve, 500));

        // Refresh installed libraries
        const installed = await refreshInstalled();
        console.log(`[LIBRARY MANAGER] Refreshed installed libraries:`, installed);

        // Update the search results to show as not installed
        setAllLibraries(prev => {
          const installedNames = new Set(installed.map(l => l.name.toLowerCase()));
          return prev.map(l => ({
            ...l,
            isInstalled: installedNames.has(l.name.toLowerCase())
          }));
        });

        console.log(`[LIBRARY MANAGER] UI updated, ${name} should now show LINK button`);
      } else {
        console.error('[LIBRARY MANAGER] Remove failed:', result.error);
        alert(`Failed to remove "${name}":\n${result.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('[LIBRARY MANAGER] Removal error:', err);
      alert(`Error removing "${name}":\n${err.message || 'Unknown error'}`);
    }
  };

  const accentDim = useMemo(() => {
    if (!isLightTheme) return 'rgba(34, 211, 238, 0.1)';
    return board === 'esp32-c3' ? 'rgba(234, 88, 12, 0.08)' : 'rgba(2, 132, 199, 0.08)';
  }, [isLightTheme, board]);

  const t = {
    bg: 'var(--lp-dark-bg)',
    surface: 'var(--lp-dark-surface)',
    surfaceHover: 'var(--lp-zinc-800)',
    border: 'var(--lp-border)',
    borderBright: 'var(--lp-border-active)',
    text: 'var(--lp-zinc-400)',
    dim: 'var(--lp-zinc-600)',
    accent: 'var(--lp-accent-primary)',
    accentBright: 'var(--lp-accent-bright)',
    accentDim,
    cyan: 'var(--lp-accent-primary)',
    cyanBright: 'var(--lp-accent-bright)',
    orange: 'var(--lp-amber)',
    danger: 'var(--lp-rose)',
    success: 'var(--lp-emerald)',
    white: isLightTheme ? '#0f172a' : '#ffffff',
  };

  return (
    <div className="flex flex-col h-full bg-[var(--lp-dark-bg)] text-[var(--lp-zinc-400)] font-mono overflow-hidden rounded-xl">

      {/* Header */}
      <div className={`p-4 px-6 border-b border-[var(--lp-border)] bg-[var(--lp-dark-surface)] ${isLightTheme ? 'shadow-sm' : 'shadow-md'}`}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[var(--lp-accent-primary)] flex items-center justify-center">
            <LibraryIcon size={18} color="#000" strokeWidth={3} />
          </div>
          <h1 className="m-0 text-lg font-black text-slate-900 dark:text-white tracking-widest uppercase">LIBRARY_CORE.V1</h1>
        </div>
        <p className="m-0 text-[10px] text-[var(--lp-zinc-600)] pl-11 uppercase tracking-wider">
          Central dependency manager for external modules
        </p>
      </div>

      {/* Status bar */}
      <div className={`mx-6 my-3 bg-cyan-500/10 border border-[var(--lp-accent-primary)] rounded-lg py-2 px-3.5 flex items-center gap-2 text-[10px] text-[var(--lp-accent-primary)] font-bold uppercase ${isLightTheme ? '' : 'shadow-[0_2px_8px_rgba(34,211,238,0.08)]'}`}>
        <Info size={14} strokeWidth={3} />
        <span>
          {isLoading
            ? 'SYNCING_INDEX...'
            : `${allLibraries.length.toLocaleString()} REMOTE_LIBS · ${installedLibraries.length} LOCAL_DEPS`}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden px-6 pb-4 gap-4">

        {/* Left — search + results */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-[var(--lp-border)] pr-4">

          {/* Filter input */}
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--lp-accent-primary)] text-xs font-black">&gt;</span>
            <input
              type="text"
              placeholder="FILTER_MODULES..."
              value={searchQuery}
              onChange={handleQueryChange}
              className={`w-full bg-[var(--lp-dark-surface)] border border-[var(--lp-border)] rounded-lg py-2.5 pr-3 pl-8 text-slate-900 dark:text-white text-xs outline-none font-bold box-border transition-all focus:border-[var(--lp-accent-primary)] focus:ring-2 ${
                isLightTheme ? (board === 'esp32-c3' ? 'focus:ring-orange-500/20 shadow-sm' : 'focus:ring-sky-500/20 shadow-sm') : 'focus:ring-cyan-500/20 shadow-md'
              }`}
            />
          </div>

          {/* Result count */}
          {!isLoading && (
            <div className="text-[9px] text-[var(--lp-zinc-600)] mb-2 font-bold tracking-widest">
              QUERY_RESULT: {searchResults.length.toLocaleString()} UNITS
            </div>
          )}

          {/* List */}
          <div ref={listRef} onScroll={handleScroll} className="flex-1 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="text-center mt-15 text-[var(--lp-zinc-600)]">
                <Loader2 size={24} className="opacity-60 mb-3 animate-spin text-[var(--lp-accent-primary)] mx-auto" strokeWidth={3} />
                <p className="m-0 text-[11px] font-bold">SYNCING...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center mt-15 text-[var(--lp-zinc-600)]">
                <Search size={32} className="opacity-20 mb-3 mx-auto" />
                <p className="m-0 text-[11px] font-bold">NO_MATCHES</p>
              </div>
            ) : (
              visibleResults.map(lib => (
                <div
                  key={lib.name}
                  className="bg-[var(--lp-dark-surface)] border border-[var(--lp-border)] rounded-lg p-3 mb-2 transition-all duration-150 ease-in-out hover:border-[var(--lp-accent-primary)] hover:bg-[var(--lp-zinc-800)] hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black text-[var(--lp-accent-bright)] overflow-hidden text-ellipsis whitespace-nowrap">{lib.name}</div>
                      <div className="text-[9px] text-[var(--lp-zinc-600)] mt-0.5 font-bold">AUTOR: {lib.author}</div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <span className={`text-[9px] text-[var(--lp-accent-primary)] py-0.5 px-1.5 rounded-[1px] font-bold border border-cyan-500/20 ${
                        isLightTheme ? (board === 'esp32-c3' ? 'bg-orange-500/5 border-orange-500/20' : 'bg-sky-500/5 border-sky-500/20') : 'bg-cyan-500/5'
                      }`}>{lib.version}</span>
                      {lib.isInstalled ? (
                        <div className="flex items-center gap-1 text-[var(--lp-emerald)] text-[9px] font-black">
                          <CheckCircle size={12} strokeWidth={3} /> LINKED
                        </div>
                      ) : (
                        <button
                          onClick={() => handleInstall(lib)}
                          disabled={!!isInstalling[lib.name]}
                          className="bg-[var(--lp-accent-primary)] border-none text-black rounded-[2px] py-1 px-2.5 text-[9px] font-black cursor-pointer flex items-center gap-1 uppercase hover:opacity-90 transition-opacity"
                        >
                          {isInstalling[lib.name] ? <Loader2 size={10} className="animate-spin" strokeWidth={3} /> : <Download size={10} strokeWidth={3} />}
                          LINK
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="m-0 text-[11px] leading-relaxed text-slate-900 dark:text-white font-medium">{lib.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right — installed */}
        <div className="w-[280px] flex flex-col">
          <div className={`flex items-center gap-2.5 mb-4 p-2.5 px-3.5 bg-[var(--lp-dark-surface)] rounded-lg border border-[var(--lp-border)] ${isLightTheme ? 'shadow-sm' : 'shadow-md'}`}>
            <div className="w-6 h-6 rounded-[2px] bg-[var(--lp-amber)] flex items-center justify-center">
              <Package size={14} color="#000" strokeWidth={3} />
            </div>
            <h2 className="m-0 text-xs font-black text-slate-900 dark:text-white tracking-wider uppercase">LOCAL_DEPS</h2>
            <span className="ml-auto text-[10px] bg-[var(--lp-accent-primary)] text-black py-0.25 px-2 rounded-full font-black">{installedLibraries.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-1">
            {installedLibraries.length === 0 ? (
              <div className="text-center mt-10 text-[var(--lp-zinc-600)] text-[11px] font-bold">
                <p className="m-0">EMPTY_DEP_TREE</p>
              </div>
            ) : (
              installedLibraries.map(lib => (
                <div key={lib.name} className="p-2.5 px-3 border-b border-[var(--lp-border)] flex justify-between items-center bg-[var(--lp-dark-surface)] mb-1.5 rounded-[2px]">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-slate-900 dark:text-white overflow-hidden text-ellipsis whitespace-nowrap">{lib.name}</div>
                    <div className="text-[9px] text-[var(--lp-accent-primary)] mt-0.25 font-bold">{lib.version}</div>
                  </div>
                  <button
                    onClick={() => handleRemove(lib.name)}
                    className="bg-rose-500/10 border border-[var(--lp-rose)] text-[var(--lp-rose)] hover:bg-[var(--lp-rose)] hover:text-black cursor-pointer p-1 flex items-center rounded-[2px] transition-all"
                  >
                    <Trash2 size={12} strokeWidth={3} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: var(--lp-dark-bg); }
        ::-webkit-scrollbar-thumb { background: var(--lp-zinc-800); border-radius: 0; }
        ::-webkit-scrollbar-thumb:hover { background: var(--lp-accent-primary); }
      `}</style>
    </div>
  );
};

export default LibraryManager;
