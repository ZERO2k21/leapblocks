/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Download, Trash2, Library, CheckCircle, Info, Loader2, Package, X } from 'lucide-react';
import { IS_ELECTRON } from '../../../../config/platform';
import { 
  searchLibraries, 
  getLibraries, 
  installLibrary, 
  removeLibrary 
} from '../../../../services/LibraryService';

interface Library {
  name: string;
  author: string;
  description: string;
  version: string;
  isInstalled?: boolean;
}

export const LibraryManager: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Library[]>([]);
  const [installedLibraries, setInstalledLibraries] = useState<Library[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isInstalling, setIsInstalling] = useState<{ [key: string]: boolean }>({});
  const [forgeLibPath, setForgeLibPath] = useState<string>('');

  const refreshInstalled = useCallback(async () => {
    try {
      const libs = await getLibraries();
      setInstalledLibraries(libs);
    } catch (err) {
      console.error('[FORGE] Failed to fetch libraries:', err);
    }
  }, []);

  const performSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const libs = await searchLibraries(query);
      
      const mapped = libs.map((lib: any) => ({
        ...lib,
        isInstalled: installedLibraries.some(i => i.name.toLowerCase() === lib.name.toLowerCase())
      }));
      
      setSearchResults(mapped);
    } catch (err) {
      console.error('[FORGE] Library search failed:', err);
    } finally {
      setIsSearching(false);
    }
  }, [installedLibraries]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  useEffect(() => {
    refreshInstalled();
    if (IS_ELECTRON && (window as any).electronAPI) {
      (window as any).electronAPI.getForgeLibPath().then(setForgeLibPath);
    }
    performSearch('');
  }, [refreshInstalled, performSearch]);

  const handleInstall = async (lib: Library) => {
    setIsInstalling(prev => ({ ...prev, [lib.name]: true }));
    try {
      await installLibrary(lib);
      await refreshInstalled();
      setSearchResults(prev => prev.map(l => 
        l.name === lib.name ? { ...l, isInstalled: true } : l
      ));
    } catch (err) {
      console.error('[FORGE] Installation error:', err);
    } finally {
      setIsInstalling(prev => ({ ...prev, [lib.name]: false }));
    }
  };

  const handleRemove = async (name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}"?`)) return;
    
    try {
      await removeLibrary(name);
      await refreshInstalled();
      setSearchResults(prev => prev.map(l => 
        l.name === name ? { ...l, isInstalled: false } : l
      ));
    } catch (err) {
      console.error('[FORGE] Removal error:', err);
    }
  };

  const theme = {
    bg: '#0d1117',
    surface: '#161b22',
    border: '#30363d',
    text: '#c9d1d9',
    textDim: '#8b949e',
    accent: IS_ELECTRON ? '#00ff9d' : '#58a6ff',
    accentDim: IS_ELECTRON ? 'rgba(0, 255, 157, 0.1)' : 'rgba(88, 166, 255, 0.1)',
    danger: '#f85149',
    white: '#f0f6fc'
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: theme.bg,
      color: theme.text,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden'
    }}>
      <div style={{ padding: '24px 32px', borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Library size={32} color={theme.accent} />
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: theme.white }}>Library Marketplace</h1>
        </div>
        <p style={{ margin: 0, color: theme.textDim, fontSize: '14px' }}>
          Enhance your sketches with over 5,000 community-contributed hardware drivers.
        </p>
      </div>

      <div style={{
        margin: '20px 32px 0 32px',
        background: theme.accentDim,
        border: `1px solid ${theme.accent}33`,
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '13px',
        color: theme.accent
      }}>
        <Info size={16} />
        <span>
          {IS_ELECTRON 
            ? "Libraries are cached in forge-lib — shared across all projects."
            : "Libraries are bundled at compile time via cloud."}
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '20px 32px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: `1px solid ${theme.border}`, paddingRight: '24px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: theme.textDim }} />
              <input
                type="text"
                placeholder="Search peripherals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: theme.surface,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '6px',
                  padding: '10px 12px 10px 40px',
                  color: theme.white,
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              style={{
                background: theme.accent,
                color: theme.bg,
                border: 'none',
                borderRadius: '6px',
                padding: '0 20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: isSearching ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isSearching ? <Loader2 size={18} className="animate-spin" /> : 'Search'}
            </button>
          </form>

          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
            {searchResults.length === 0 && !isSearching ? (
              <div style={{ textAlign: 'center', marginTop: '60px', color: theme.textDim }}>
                <Search size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                <p>Search for libraries to add functionality to your project.</p>
              </div>
            ) : (
              searchResults.map(lib => (
                <div key={lib.name} style={{
                  background: theme.surface,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: '16px', color: theme.accent, fontFamily: 'monospace' }}>{lib.name}</h3>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: theme.textDim }}>By {lib.author}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: theme.textDim, background: '#21262d', padding: '2px 6px', borderRadius: '4px' }}>v{lib.version}</span>
                      {lib.isInstalled ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: theme.accent, fontSize: '12px', fontWeight: 600 }}>
                          <CheckCircle size={14} /> {IS_ELECTRON ? "Cached" : "Added"}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleInstall(lib)}
                          disabled={isInstalling[lib.name]}
                          style={{
                            background: 'transparent',
                            border: `1px solid ${theme.accent}`,
                            color: theme.accent,
                            borderRadius: '4px',
                            padding: '4px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {isInstalling[lib.name] ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                          Install
                        </button>
                      )}
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.4', color: theme.text }}>{lib.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ width: '320px', paddingLeft: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Package size={20} color={theme.accent} />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: theme.white }}>Installed</h2>
            <span style={{ 
              marginLeft: 'auto', 
              fontSize: '12px', 
              background: theme.border, 
              color: theme.textDim, 
              padding: '2px 8px', 
              borderRadius: '10px' 
            }}>{installedLibraries.length}</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {installedLibraries.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '40px', color: theme.textDim, fontSize: '13px' }}>
                No libraries installed yet.
              </div>
            ) : (
              installedLibraries.map(lib => (
                <div key={lib.name} style={{
                  padding: '12px',
                  borderBottom: `1px solid ${theme.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: theme.white, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lib.name}
                    </div>
                    <div style={{ fontSize: '11px', color: theme.textDim }}>v{lib.version}</div>
                  </div>
                  <button
                    onClick={() => handleRemove(lib.name)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: theme.textDim,
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{ 
        padding: '8px 32px', 
        borderTop: `1px solid ${theme.border}`, 
        fontSize: '11px', 
        color: theme.textDim,
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>Environment: <b style={{ color: theme.accent }}>{IS_ELECTRON ? 'Desktop' : 'Web'}</b></span>
        {IS_ELECTRON && <span>Path: {forgeLibPath}</span>}
      </div>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default LibraryManager;
