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

  return (
    <div
      className={`flex flex-col h-full font-mono overflow-hidden rounded-xl ${
        isLightTheme ? 'bg-white text-slate-700' : 'bg-[var(--lp-dark-bg)] text-[var(--lp-zinc-400)]'
      }`}
    >

      {/* Header */}
      <div
        className={`p-4 px-6 border-b ${
          isLightTheme
            ? 'bg-slate-50 border-slate-200 shadow-sm'
            : 'bg-[var(--lp-dark-surface)] border-[var(--lp-border)] shadow-md'
        }`}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[var(--lp-accent-primary)] flex items-center justify-center">
            <LibraryIcon size={18} color="#000" strokeWidth={3} />
          </div>
          <h1 className={`m-0 text-lg font-black tracking-widest uppercase ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>LIBRARY_CORE.V1</h1>
        </div>
        <p className={`m-0 text-[10px] pl-11 uppercase tracking-wider ${isLightTheme ? 'text-slate-500' : 'text-[var(--lp-zinc-600)]'}`}>
          Central dependency manager for external modules
        </p>
      </div>

      {/* Status bar */}
      <div
        className={`mx-6 my-3 rounded-lg py-2 px-3.5 flex items-center gap-2 text-[10px] font-bold uppercase ${
          isLightTheme
            ? board === 'esp32-c3'
              ? 'bg-orange-500/5 border border-orange-500 text-orange-600'
              : 'bg-sky-500/5 border border-sky-500 text-sky-600'
            : 'bg-cyan-500/10 border border-[var(--lp-accent-primary)] text-[var(--lp-accent-primary)] shadow-[0_2px_8px_rgba(34,211,238,0.08)]'
        }`}
      >
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
        <div className={`flex-1 flex flex-col min-w-0 border-r pr-4 ${isLightTheme ? 'border-slate-200' : 'border-[var(--lp-border)]'}`}>

          {/* Filter input */}
          <div className="relative mb-4">
            <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black ${
              isLightTheme
                ? board === 'esp32-c3' ? 'text-orange-600' : 'text-sky-600'
                : 'text-[var(--lp-accent-primary)]'
            }`}>&gt;</span>
            <input
              type="text"
              placeholder="FILTER_MODULES..."
              value={searchQuery}
              onChange={handleQueryChange}
              className={`w-full rounded-lg py-2.5 pr-3 pl-8 text-xs outline-none font-bold box-border transition-all focus:ring-2 ${isLightTheme ? 'text-slate-900' : 'text-white'} ${
                isLightTheme
                  ? 'bg-white border border-slate-200 focus:border-sky-500 focus:ring-sky-500/20 shadow-sm'
                  : 'bg-[var(--lp-dark-surface)] border border-[var(--lp-border)] focus:border-[var(--lp-accent-primary)] focus:ring-cyan-500/20 shadow-md'
              }`}
            />
          </div>

          {/* Result count */}
          {!isLoading && (
            <div className={`text-[9px] mb-2 font-bold tracking-widest ${isLightTheme ? 'text-slate-500' : 'text-[var(--lp-zinc-600)]'}`}>
              QUERY_RESULT: {searchResults.length.toLocaleString()} UNITS
            </div>
          )}

          {/* List */}
          <div ref={listRef} onScroll={handleScroll} className="flex-1 overflow-y-auto pr-1">
            {isLoading ? (
              <div className={`text-center mt-15 ${isLightTheme ? 'text-slate-500' : 'text-[var(--lp-zinc-600)]'}`}>
                <Loader2 size={24} className={`opacity-60 mb-3 animate-spin mx-auto ${
                  isLightTheme
                    ? board === 'esp32-c3' ? 'text-orange-600' : 'text-sky-600'
                    : 'text-[var(--lp-accent-primary)]'
                }`} strokeWidth={3} />
                <p className="m-0 text-[11px] font-bold">SYNCING...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className={`text-center mt-15 ${isLightTheme ? 'text-slate-500' : 'text-[var(--lp-zinc-600)]'}`}>
                <Search size={32} className="opacity-20 mb-3 mx-auto" />
                <p className="m-0 text-[11px] font-bold">NO_MATCHES</p>
              </div>
            ) : (
              visibleResults.map(lib => (
                <div
                  key={lib.name}
                  className={`rounded-lg p-3 mb-2 transition-all duration-150 ease-in-out hover:-translate-y-0.5 hover:shadow-md ${
                    isLightTheme
                      ? 'bg-white border border-slate-200 hover:border-sky-500 hover:bg-slate-50'
                      : 'bg-[var(--lp-dark-surface)] border border-[var(--lp-border)] hover:border-[var(--lp-accent-primary)] hover:bg-[var(--lp-zinc-800)]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-black overflow-hidden text-ellipsis whitespace-nowrap ${
                        isLightTheme
                          ? board === 'esp32-c3' ? 'text-orange-600' : 'text-sky-600'
                          : 'text-[var(--lp-accent-bright)]'
                      }`}>{lib.name}</div>
                      <div className={`text-[9px] mt-0.5 font-bold ${isLightTheme ? 'text-slate-500' : 'text-[var(--lp-zinc-600)]'}`}>AUTOR: {lib.author}</div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <span className={`text-[9px] py-0.5 px-1.5 rounded-[1px] font-bold border ${
                        isLightTheme
                          ? board === 'esp32-c3'
                            ? 'text-orange-600 border-orange-500/20 bg-orange-500/5'
                            : 'text-sky-600 border-sky-500/20 bg-sky-500/5'
                          : 'text-[var(--lp-accent-primary)] border-cyan-500/20 bg-cyan-500/5'
                      }`}>{lib.version}</span>
                      {lib.isInstalled ? (
                        <div className={`flex items-center gap-1 text-[9px] font-black ${isLightTheme ? 'text-emerald-600' : 'text-[var(--lp-emerald)]'}`}>
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
                  <p className={`m-0 text-[11px] leading-relaxed font-medium ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>{lib.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right — installed */}
        <div className="w-[280px] flex flex-col">
          <div
            className={`flex items-center gap-2.5 mb-4 p-2.5 px-3.5 rounded-lg border ${
              isLightTheme
                ? 'bg-slate-50 border-slate-200 shadow-sm'
                : 'bg-[var(--lp-dark-surface)] border-[var(--lp-border)] shadow-md'
            }`}
          >
            <div className="w-6 h-6 rounded-[2px] bg-[var(--lp-amber)] flex items-center justify-center">
              <Package size={14} color="#000" strokeWidth={3} />
            </div>
            <h2 className={`m-0 text-xs font-black tracking-wider uppercase ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>LOCAL_DEPS</h2>
            <span className="ml-auto text-[10px] bg-[var(--lp-accent-primary)] text-black py-0.25 px-2 rounded-full font-black">{installedLibraries.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-1">
            {installedLibraries.length === 0 ? (
              <div className={`text-center mt-10 text-[11px] font-bold ${isLightTheme ? 'text-slate-500' : 'text-[var(--lp-zinc-600)]'}`}>
                <p className="m-0">EMPTY_DEP_TREE</p>
              </div>
            ) : (
              installedLibraries.map(lib => (
                <div
                  key={lib.name}
                  className={`p-2.5 px-3 border-b flex justify-between items-center mb-1.5 rounded-[2px] ${
                    isLightTheme
                      ? 'border-slate-200 bg-white'
                      : 'border-[var(--lp-border)] bg-[var(--lp-dark-surface)]'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-black overflow-hidden text-ellipsis whitespace-nowrap ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>{lib.name}</div>
                    <div className={`text-[9px] mt-0.25 font-bold ${
                      isLightTheme
                        ? board === 'esp32-c3' ? 'text-orange-600' : 'text-sky-600'
                        : 'text-[var(--lp-accent-primary)]'
                    }`}>{lib.version}</div>
                  </div>
                  <button
                    onClick={() => handleRemove(lib.name)}
                    className="bg-rose-500/10 border border-rose-500 text-rose-600 hover:bg-rose-500 hover:text-white cursor-pointer p-1 flex items-center rounded-[2px] transition-all"
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
        ::-webkit-scrollbar-track { background: ${isLightTheme ? '#f1f5f9' : 'var(--lp-dark-bg)'}; }
        ::-webkit-scrollbar-thumb { background: ${isLightTheme ? '#cbd5e1' : 'var(--lp-zinc-800)'}; border-radius: 0; }
        ::-webkit-scrollbar-thumb:hover { background: ${isLightTheme ? '#94a3b8' : 'var(--lp-accent-primary)'}; }
      `}</style>
    </div>
  );
};

export default LibraryManager;
