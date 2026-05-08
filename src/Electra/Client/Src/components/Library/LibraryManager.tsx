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
    bg: '#0a0e1a',
    surface: '#151b2e',
    surfaceHover: '#1a2137',
    border: 'rgba(168, 85, 247, 0.3)',
    borderBright: 'rgba(168, 85, 247, 0.5)',
    text: '#e2e8f0',
    dim: '#94a3b8',
    accent: '#a855f7',
    accentBright: '#c084fc',
    accentDim: 'rgba(168, 85, 247, 0.1)',
    cyan: '#06b6d4',
    cyanBright: '#22d3ee',
    orange: '#fb923c',
    danger: '#ef4444',
    success: '#10b981',
    white: '#f8fafc',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg, color: t.text, fontFamily: 'Outfit,-apple-system,sans-serif', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '24px 32px 20px', borderBottom: `2px solid ${t.border}`, background: `linear-gradient(135deg, ${t.surface}, ${t.bg})` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `linear-gradient(135deg, ${t.accent}, ${t.cyan})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 20px rgba(168, 85, 247, 0.4)` }}>
            <LibraryIcon size={22} color="white" strokeWidth={2.5} />
          </div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: t.white, letterSpacing: '-0.5px' }}>Library Marketplace</h1>
        </div>
        <p style={{ margin: 0, color: t.dim, fontSize: '13px', paddingLeft: '52px' }}>
          Discover and integrate Arduino libraries into your project
        </p>
      </div>

      {/* Status bar */}
      <div style={{ margin: '16px 32px', background: `linear-gradient(135deg, ${t.accentDim}, rgba(6, 182, 212, 0.05))`, border: `2px solid ${t.borderBright}`, borderRadius: '12px', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: t.accentBright, fontWeight: 600, boxShadow: `0 4px 15px rgba(168, 85, 247, 0.2)` }}>
        <Info size={16} strokeWidth={2.5} />
        <span>
          {isLoading
            ? 'Fetching Arduino library index…'
            : `${allLibraries.length.toLocaleString()} libraries available · ${installedLibraries.length} added to project`}
        </span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '0 32px 20px', gap: '24px' }}>

        {/* Left — search + results */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: `2px solid ${t.border}`, paddingRight: '24px' }}>

          {/* Filter input */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: t.accent, pointerEvents: 'none' }} strokeWidth={2.5} />
            <input
              type="text"
              placeholder="Search by name, author, or description…"
              value={searchQuery}
              onChange={handleQueryChange}
              style={{ width: '100%', background: t.surface, border: `2px solid ${t.border}`, borderRadius: '12px', padding: '12px 16px 12px 44px', color: t.white, fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontWeight: 500, transition: 'all 0.3s ease' }}
              onFocus={(e) => e.target.style.borderColor = t.borderBright}
              onBlur={(e) => e.target.style.borderColor = t.border}
            />
          </div>

          {/* Result count */}
          {!isLoading && (
            <div style={{ fontSize: '11px', color: t.dim, marginBottom: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {searchResults.length.toLocaleString()} {debouncedQuery.trim() ? 'RESULTS' : 'LIBRARIES'}
            </div>
          )}

          {/* List */}
          <div ref={listRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', marginTop: '80px', color: t.dim }}>
                <Loader2 size={36} style={{ opacity: 0.6, marginBottom: '16px', animation: 'spin 1s linear infinite', color: t.accent }} strokeWidth={2.5} />
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Loading library index…</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '80px', color: t.dim }}>
                <Search size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>No libraries match "{debouncedQuery}"</p>
              </div>
            ) : (
              visibleResults.map(lib => (
                <div key={lib.name} style={{ background: `linear-gradient(135deg, ${t.surface}, ${t.bg})`, border: `2px solid ${t.border}`, borderRadius: '12px', padding: '16px 18px', marginBottom: '12px', transition: 'all 0.3s ease', cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = t.borderBright;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 8px 20px rgba(168, 85, 247, 0.3)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = t.border;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: t.accentBright, fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.3px' }}>{lib.name}</div>
                      <div style={{ fontSize: '11px', color: t.dim, marginTop: '3px', fontWeight: 600 }}>by {lib.author}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '16px', flexShrink: 0 }}>
                      <span style={{ fontSize: '10px', color: t.cyan, background: 'rgba(6, 182, 212, 0.15)', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, border: `1px solid rgba(6, 182, 212, 0.3)` }}>v{lib.version}</span>
                      {lib.isInstalled ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: t.success, fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          <CheckCircle size={15} strokeWidth={2.5} /> ADDED
                        </div>
                      ) : (
                        <button
                          onClick={() => handleInstall(lib)}
                          disabled={!!isInstalling[lib.name]}
                          style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.cyan})`, border: 'none', color: 'white', borderRadius: '8px', padding: '6px 14px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: `0 4px 12px rgba(168, 85, 247, 0.4)`, transition: 'all 0.3s ease' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = `0 6px 16px rgba(168, 85, 247, 0.6)`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = `0 4px 12px rgba(168, 85, 247, 0.4)`;
                          }}
                        >
                          {isInstalling[lib.name] ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} strokeWidth={2.5} /> : <Download size={12} strokeWidth={2.5} />}
                          ADD
                        </button>
                      )}
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: t.text, fontWeight: 400 }}>{lib.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right — installed */}
        <div style={{ width: '320px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '12px 16px', background: `linear-gradient(135deg, ${t.surface}, ${t.bg})`, borderRadius: '12px', border: `2px solid ${t.border}` }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `linear-gradient(135deg, ${t.orange}, ${t.danger})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px rgba(251, 146, 60, 0.4)` }}>
              <Package size={18} color="white" strokeWidth={2.5} />
            </div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: t.white, letterSpacing: '-0.3px' }}>Project Libraries</h2>
            <span style={{ marginLeft: 'auto', fontSize: '11px', background: `linear-gradient(135deg, ${t.accent}, ${t.cyan})`, color: 'white', padding: '3px 10px', borderRadius: '100px', fontWeight: 800, boxShadow: `0 2px 8px rgba(168, 85, 247, 0.4)` }}>{installedLibraries.length}</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
            {installedLibraries.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '60px', color: t.dim, fontSize: '13px', fontWeight: 600 }}>
                <Package size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
                <p style={{ margin: 0 }}>No libraries added yet</p>
              </div>
            ) : (
              installedLibraries.map(lib => (
                <div key={lib.name} style={{ padding: '14px 16px', borderBottom: `2px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: t.surface, marginBottom: '8px', borderRadius: '10px', transition: 'all 0.3s ease' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = t.surfaceHover;
                    e.currentTarget.style.borderColor = t.borderBright;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = t.surface;
                    e.currentTarget.style.borderColor = t.border;
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: t.white, fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lib.name}</div>
                    <div style={{ fontSize: '10px', color: t.cyan, marginTop: '2px', fontWeight: 700 }}>v{lib.version}</div>
                  </div>
                  <button onClick={() => handleRemove(lib.name)} style={{ background: 'rgba(239, 68, 68, 0.15)', border: `1.5px solid ${t.danger}`, color: t.danger, cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', borderRadius: '8px', transition: 'all 0.3s ease' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = t.danger;
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                      e.currentTarget.style.color = t.danger;
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <Trash2 size={15} strokeWidth={2.5} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: rgba(168, 85, 247, 0.05); border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(135deg, rgba(168, 85, 247, 0.5), rgba(6, 182, 212, 0.5)); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: linear-gradient(135deg, rgba(168, 85, 247, 0.7), rgba(6, 182, 212, 0.7)); }
      `}</style>
    </div>
  );
};

export default LibraryManager;
