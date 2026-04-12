import React, { useState, useEffect, useCallback } from 'react';
import { Search, Download, Trash2, Library, CheckCircle, Info, Loader2, Package, X } from 'lucide-react';

interface Library {
  name: string;
  author: string;
  description: string;
  version: string;
  isInstalled: boolean;
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
      const installed = await window.electronAPI.getInstalledLibraries();
      setInstalledLibraries(installed);
    } catch (err) {
      console.error('[FORGE] Failed to fetch installed libraries:', err);
    }
  }, []);

  // ── HANDLERS ───────────────────────────────────────────────────────────────

  const performSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const data = await window.electronAPI.librarySearch(query);
      
      const mapped = data.libraries.map((lib: any) => ({
        name: lib.name,
        author: lib.author,
        description: lib.sentence || lib.description,
        version: lib.version,
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
    window.electronAPI.getForgeLibPath().then(setForgeLibPath);
    performSearch(''); // Initial fetch of featured libraries
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  const handleInstall = async (name: string) => {
    setIsInstalling(prev => ({ ...prev, [name]: true }));
    try {
      const res = await window.electronAPI.libraryInstall(name);
      if (res.success) {
        await refreshInstalled();
        // Update search results state to show "Installed" badge
        setSearchResults(prev => prev.map(l => 
          l.name === name ? { ...l, isInstalled: true } : l
        ));
      } else {
        alert(`Installation failed: ${res.error}`);
      }
    } catch (err) {
      console.error('[FORGE] Installation error:', err);
    } finally {
      setIsInstalling(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleRemove = async (name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}"?`)) return;
    
    try {
      const res = await window.electronAPI.libraryUninstall(name);
      if (res.success) {
        await refreshInstalled();
        // Update search results state to clear "Installed" badge
        setSearchResults(prev => prev.map(l => 
          l.name === name ? { ...l, isInstalled: false } : l
        ));
      }
    } catch (err) {
      console.error('[FORGE] Removal error:', err);
    }
  };

  // ── STYLES ─────────────────────────────────────────────────────────────────

  const theme = {
    bg: '#0d1117',
    surface: '#161b22',
    border: '#30363d',
    text: '#c9d1d9',
    textDim: '#8b949e',
    accent: '#00ff9d',
    accentDim: 'rgba(0, 255, 157, 0.1)',
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
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div style={{ padding: '24px 32px', borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Library size={32} color={theme.accent} />
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: theme.white }}>Library Marketplace</h1>
        </div>
        <p style={{ margin: 0, color: theme.textDim, fontSize: '14px' }}>
          Enhance your sketches with over 5,000 community-contributed hardware drivers.
        </p>
      </div>

      {/* ── INFO BANNER ───────────────────────────────────────────────────── */}
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
        <span>Libraries are cached in <strong>forge-lib</strong> — shared across all projects.</span>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '20px 32px' }}>
        
        {/* ── LEFT COLUMN: SEARCH & MARKETPLACE ────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: `1px solid ${theme.border}`, paddingRight: '24px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: theme.textDim }} />
              <input
                type="text"
                placeholder="Search peripherals (e.g. WiFi, OLED, BME280)..."
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
                  marginBottom: '12px',
                  transition: 'border-color 0.2s'
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
                          <CheckCircle size={14} /> Installed
                        </div>
                      ) : (
                        <button
                          onClick={() => handleInstall(lib.name)}
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

        {/* ── RIGHT COLUMN: INSTALLED LIBRARIES ───────────────────────────── */}
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
                      alignItems: 'center',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = theme.danger}
                    onMouseLeave={(e) => e.currentTarget.style.color = theme.textDim}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <div style={{ 
        padding: '8px 32px', 
        borderTop: `1px solid ${theme.border}`, 
        fontSize: '11px', 
        color: theme.textDim,
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>Marketplace Path: <code style={{ color: theme.accent }}>{forgeLibPath}</code></span>
        <span>Ready</span>
      </div>

      <style>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #30363d;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #484f58;
        }
      `}</style>
    </div>
  );
};

export default LibraryManager;
