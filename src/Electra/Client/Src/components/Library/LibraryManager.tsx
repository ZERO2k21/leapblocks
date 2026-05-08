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

export const LibraryManager: React.FC = () => {
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
      const result = await installLibrary(lib);
      if (result.success) {
        await refreshInstalled();
        setAllLibraries(prev => prev.map(l => l.name === lib.name ? { ...l, isInstalled: true } : l));
      } else {
        console.error('[FORGE] Install failed:', result.error);
        alert(`Failed to install "${lib.name}":\n${result.error}`);
      }
    } catch (err) {
      console.error('[FORGE] Installation error:', err);
    } finally {
      setIsInstalling(prev => ({ ...prev, [lib.name]: false }));
    }
  };

  const handleRemove = async (name: string) => {
    if (!confirm(`Remove "${name}" from this project?`)) return;
    try {
      await removeLibrary(name);
      await refreshInstalled();
      setAllLibraries(prev => prev.map(l => l.name === name ? { ...l, isInstalled: false } : l));
    } catch (err) {
      console.error('[FORGE] Removal error:', err);
    }
  };

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
    accentDim: 'rgba(34, 211, 238, 0.1)',
    cyan: 'var(--lp-accent-primary)',
    cyanBright: 'var(--lp-accent-bright)',
    orange: 'var(--lp-amber)',
    danger: 'var(--lp-rose)',
    success: 'var(--lp-emerald)',
    white: '#ffffff',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg, color: t.text, fontFamily: "'Space Mono', monospace", overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: `1px solid ${t.border}`, background: t.surface }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '2px', background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LibraryIcon size={18} color="#000" strokeWidth={3} />
          </div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: t.white, letterSpacing: '1px', textTransform: 'uppercase' }}>LIBRARY_CORE.V1</h1>
        </div>
        <p style={{ margin: 0, color: t.dim, fontSize: '10px', paddingLeft: '44px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Central dependency manager for external modules
        </p>
      </div>

      {/* Status bar */}
      <div style={{ margin: '12px 24px', background: t.accentDim, border: `1px solid ${t.accent}`, borderRadius: '2px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: t.accent, fontWeight: 700, textTransform: 'uppercase' }}>
        <Info size={14} strokeWidth={3} />
        <span>
          {isLoading
            ? 'SYNCING_INDEX...'
            : `${allLibraries.length.toLocaleString()} REMOTE_LIBS · ${installedLibraries.length} LOCAL_DEPS`}
        </span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '0 24px 16px', gap: '16px' }}>

        {/* Left — search + results */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: `1px solid ${t.border}`, paddingRight: '16px' }}>

          {/* Filter input */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: t.accent, fontSize: '12px', fontWeight: 900 }}>&gt;</span>
            <input
              type="text"
              placeholder="FILTER_MODULES..."
              value={searchQuery}
              onChange={handleQueryChange}
              style={{ width: '100%', background: t.surface, border: `1px solid ${t.border}`, borderRadius: '2px', padding: '10px 12px 10px 32px', color: t.white, fontSize: '12px', outline: 'none', boxSizing: 'border-box', fontWeight: 700, fontFamily: 'inherit' }}
            />
          </div>

          {/* Result count */}
          {!isLoading && (
            <div style={{ fontSize: '9px', color: t.dim, marginBottom: '8px', fontWeight: 700, letterSpacing: '1px' }}>
              QUERY_RESULT: {searchResults.length.toLocaleString()} UNITS
            </div>
          )}

          {/* List */}
          <div ref={listRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', marginTop: '60px', color: t.dim }}>
                <Loader2 size={24} style={{ opacity: 0.6, marginBottom: '12px', animation: 'spin 1s linear infinite', color: t.accent }} strokeWidth={3} />
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 700 }}>SYNCING...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '60px', color: t.dim }}>
                <Search size={32} style={{ opacity: 0.2, marginBottom: '12px' }} />
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 700 }}>NO_MATCHES</p>
              </div>
            ) : (
              visibleResults.map(lib => (
                <div key={lib.name} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: '2px', padding: '12px', marginBottom: '8px', transition: 'all 0.1s ease' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = t.accent;
                    e.currentTarget.style.background = t.surfaceHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = t.border;
                    e.currentTarget.style.background = t.surface;
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: t.accentBright, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lib.name}</div>
                      <div style={{ fontSize: '9px', color: t.dim, marginTop: '2px', fontWeight: 700 }}>AUTOR: {lib.author}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px', flexShrink: 0 }}>
                      <span style={{ fontSize: '9px', color: t.cyan, background: 'rgba(34, 211, 238, 0.05)', padding: '2px 6px', borderRadius: '1px', fontWeight: 700, border: `1px solid rgba(34, 211, 238, 0.2)` }}>{lib.version}</span>
                      {lib.isInstalled ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: t.success, fontSize: '9px', fontWeight: 900 }}>
                          <CheckCircle size={12} strokeWidth={3} /> LINKED
                        </div>
                      ) : (
                        <button
                          onClick={() => handleInstall(lib)}
                          disabled={!!isInstalling[lib.name]}
                          style={{ background: t.accent, border: 'none', color: '#000', borderRadius: '2px', padding: '4px 10px', fontSize: '9px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase' }}
                        >
                          {isInstalling[lib.name] ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} strokeWidth={3} /> : <Download size={10} strokeWidth={3} />}
                          LINK
                        </button>
                      )}
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '11px', lineHeight: '1.4', color: t.white, fontWeight: 500 }}>{lib.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right — installed */}
        <div style={{ width: '280px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', padding: '10px 14px', background: t.surface, borderRadius: '2px', border: `1px solid ${t.border}` }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '2px', background: t.orange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={14} color="#000" strokeWidth={3} />
            </div>
            <h2 style={{ margin: 0, fontSize: '13px', fontWeight: 900, color: t.white, letterSpacing: '0.5px', textTransform: 'uppercase' }}>LOCAL_DEPS</h2>
            <span style={{ marginLeft: 'auto', fontSize: '10px', background: t.accent, color: '#000', padding: '1px 8px', borderRadius: '10px', fontWeight: 900 }}>{installedLibraries.length}</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
            {installedLibraries.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '40px', color: t.dim, fontSize: '11px', fontWeight: 700 }}>
                <p style={{ margin: 0 }}>EMPTY_DEP_TREE</p>
              </div>
            ) : (
              installedLibraries.map(lib => (
                <div key={lib.name} style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: t.surface, marginBottom: '6px', borderRadius: '2px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 900, color: t.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lib.name}</div>
                    <div style={{ fontSize: '9px', color: t.cyan, marginTop: '1px', fontWeight: 700 }}>{lib.version}</div>
                  </div>
                  <button onClick={() => handleRemove(lib.name)} style={{ background: 'rgba(244, 63, 94, 0.1)', border: `1px solid ${t.danger}`, color: t.danger, cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '2px', transition: 'all 0.1s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = t.danger; e.currentTarget.style.color = '#000'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'; e.currentTarget.style.color = t.danger; }}
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
