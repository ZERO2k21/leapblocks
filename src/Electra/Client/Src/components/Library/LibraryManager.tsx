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
    bg: '#0d1117',
    surface: '#161b22',
    border: '#30363d',
    text: '#c9d1d9',
    dim: '#8b949e',
    accent: '#00ff9d',
    accentDim: 'rgba(0,255,157,0.08)',
    danger: '#f85149',
    white: '#f0f6fc',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg, color: t.text, fontFamily: 'system-ui,-apple-system,sans-serif', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '20px 28px 16px', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <LibraryIcon size={24} color={t.accent} />
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: t.white }}>Library Marketplace</h1>
        </div>
        <p style={{ margin: 0, color: t.dim, fontSize: '13px' }}>
          Browse and add Arduino libraries to your project.
        </p>
      </div>

      {/* Status bar */}
      <div style={{ margin: '12px 28px', background: t.accentDim, border: `1px solid ${t.accent}33`, borderRadius: '6px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: t.accent }}>
        <Info size={14} />
        <span>
          {isLoading
            ? 'Fetching Arduino library index…'
            : `${allLibraries.length.toLocaleString()} libraries available · ${installedLibraries.length} added to project`}
        </span>      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '0 28px 16px' }}>

        {/* Left — search + results */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: `1px solid ${t.border}`, paddingRight: '20px' }}>

          {/* Filter input */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={16} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: t.dim, pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Filter by name, author or description…"
              value={searchQuery}
              onChange={handleQueryChange} style={{ width: '100%', background: t.surface, border: `1px solid ${t.border}`, borderRadius: '6px', padding: '9px 12px 9px 36px', color: t.white, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Result count */}
          {!isLoading && (
            <div style={{ fontSize: '11px', color: t.dim, marginBottom: '10px' }}>
              {searchResults.length.toLocaleString()} {debouncedQuery.trim() ? 'results' : 'libraries'}
            </div>
          )}

          {/* List */}
          <div ref={listRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', marginTop: '60px', color: t.dim }}>
                <Loader2 size={28} style={{ opacity: 0.4, marginBottom: '10px', animation: 'spin 1s linear infinite' }} />
                <p style={{ margin: 0, fontSize: '13px' }}>Loading library index…</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '60px', color: t.dim }}>
                <Search size={40} style={{ opacity: 0.15, marginBottom: '12px' }} />
                <p style={{ margin: 0, fontSize: '13px' }}>No libraries match "{debouncedQuery}"</p>
              </div>
            ) : (
              visibleResults.map(lib => (
                <div key={lib.name} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: '7px', padding: '14px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: t.accent, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lib.name}</div>
                      <div style={{ fontSize: '11px', color: t.dim, marginTop: '2px' }}>by {lib.author}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px', flexShrink: 0 }}>
                      <span style={{ fontSize: '10px', color: t.dim, background: '#21262d', padding: '2px 6px', borderRadius: '4px' }}>v{lib.version}</span>
                      {lib.isInstalled ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: t.accent, fontSize: '11px', fontWeight: 700 }}>
                          <CheckCircle size={13} /> Added
                        </div>
                      ) : (
                        <button
                          onClick={() => handleInstall(lib)}
                          disabled={!!isInstalling[lib.name]}
                          style={{ background: 'transparent', border: `1px solid ${t.accent}`, color: t.accent, borderRadius: '4px', padding: '3px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                          {isInstalling[lib.name] ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={11} />}
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.5', color: t.text }}>{lib.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right — installed */}
        <div style={{ width: '280px', paddingLeft: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Package size={18} color={t.accent} />
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: t.white }}>Project Libraries</h2>
            <span style={{ marginLeft: 'auto', fontSize: '11px', background: t.border, color: t.dim, padding: '1px 7px', borderRadius: '10px' }}>{installedLibraries.length}</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {installedLibraries.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '40px', color: t.dim, fontSize: '12px' }}>
                No libraries added yet.
              </div>
            ) : (
              installedLibraries.map(lib => (
                <div key={lib.name} style={{ padding: '10px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: t.white, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lib.name}</div>
                    <div style={{ fontSize: '10px', color: t.dim }}>v{lib.version}</div>
                  </div>
                  <button onClick={() => handleRemove(lib.name)} style={{ background: 'transparent', border: 'none', color: t.dim, cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
      `}</style>
    </div>
  );
};

export default LibraryManager;
