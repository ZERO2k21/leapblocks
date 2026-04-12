import React, { useState, useEffect, useCallback, memo } from 'react';
import { Search, Download, Trash2, Library, CheckCircle2, Loader2, ExternalLink, FolderOpen, Sparkles } from 'lucide-react';
import { useForgeStore } from '../../store/useForgeStore';

interface ArduinoLib {
  name: string;
  author: string;
  version: string;
  sentence: string;
  paragraph?: string;
  website?: string;
}

interface LibraryManagerProps {
  onInitializeProject?: () => void;
}

// ── MEMOIZED SUB-COMPONENTS ──────────────────────────────────────────────────

const LibraryCard = memo(({ 
  lib, 
  projectPath, 
  isImported, 
  isInstalling, 
  handleImport, 
  handleUninstall 
}: { 
  lib: ArduinoLib, 
  projectPath: string | null, 
  isImported: boolean, 
  isInstalling: boolean, 
  handleImport: (lib: ArduinoLib) => void,
  handleUninstall: (name: string) => void
}) => {
  return (
    <div key={lib.name} style={{
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '16px',
      transition: 'all 0.2s ease',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ flex: 1, paddingRight: '20px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#f8fafc', margin: '0 0 6px 0' }}>
            {lib.name}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
            <span style={{
              background: 'rgba(190, 242, 100, 0.1)',
              color: '#BEF264',
              padding: '2px 8px',
              borderRadius: '6px',
              fontWeight: 600
            }}>v{lib.version}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              by <span style={{ color: '#cbd5e1' }}>{lib.author}</span>
            </span>
          </div>
        </div>

        <div style={{ flexShrink: 0 }}>
          {isImported ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#10b981',
                fontSize: '13px',
                fontWeight: 700,
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '6px 12px',
                borderRadius: '10px'
              }}>
                <CheckCircle2 size={16} /> Imported
              </div>
              <button
                onClick={() => handleUninstall(lib.name)}
                style={{
                  background: 'rgba(248, 81, 73, 0.1)',
                  border: 'none',
                  color: '#f85149',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  borderRadius: '10px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(248, 81, 73, 0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(248, 81, 73, 0.1)'}
                title="Uninstall"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleImport(lib)}
              disabled={isInstalling || !projectPath}
              style={{
                background: '#BEF264',
                color: '#0f172a',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isInstalling || !projectPath ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'transform 0.2s, opacity 0.2s',
                opacity: isInstalling || !projectPath ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isInstalling && projectPath) e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {isInstalling ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
              {isInstalling ? 'Installing...' : 'Import'}
            </button>
          )}
        </div>
      </div>

      <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', margin: '0 0 16px 0' }}>
        {lib.sentence}
      </p>

      {lib.website && (
        <a
          href={lib.website}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '12px',
            color: '#3b82f6',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 500
          }}
        >
          <ExternalLink size={14} /> Documentation <Sparkles size={12} style={{ opacity: 0.6 }} />
        </a>
      )}
    </div>
  );
});

const LibrarySearchForm = ({ 
  initialValue, 
  onSearch, 
  isSearching 
}: { 
  initialValue: string, 
  onSearch: (q: string) => void, 
  isSearching: boolean 
}) => {
  const [val, setVal] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(val);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexShrink: 0 }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
        <input
          type="text"
          placeholder="Search peripherals (e.g. WiFi, OLED, BME280)..."
          value={val}
          onChange={(e) => setVal(e.target.value)}
          style={{
            width: '100%',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '12px 16px 12px 46px',
            color: '#f8fafc',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
          onBlur={(e) => (e.target.style.borderColor = '#334155')}
        />
      </div>
      <button
        type="submit"
        disabled={isSearching}
        style={{
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          padding: '0 24px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: isSearching ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '100px'
        }}
      >
        {isSearching ? <Loader2 className="animate-spin" size={20} /> : 'Search'}
      </button>
    </form>
  );
};

export const LibraryManager: React.FC<LibraryManagerProps> = ({ onInitializeProject }) => {
  const {
    projectPath,
    importedLibraries,
    addImportedLibrary,
    setImportedLibraries,
    librarySearchQuery,
    librarySearchResults,
    setLibrarySearch,
    setProjectPath
  } = useForgeStore();

  const [searchQuery, setSearchQuery] = useState(librarySearchQuery);
  const [results, setResults] = useState<ArduinoLib[]>(librarySearchResults);
  const [isSearching, setIsSearching] = useState(false);
  const [installingLib, setInstallingLib] = useState<string | null>(null);

  // Environment detection
  const isElectron = !!(window as any).electronAPI;

  const fetchProjectLibs = useCallback(async () => {
    if (!projectPath || !isElectron) return;
    try {
      console.log(`[FORGE LIB] Syncing project libraries for: ${projectPath}`);
      const libs = await (window as any).electronAPI.libraryListProject(projectPath);
      console.log(`[FORGE LIB] Project libraries synced: [${libs.join(', ')}]`);
      setImportedLibraries(libs);
    } catch (err) {
      console.error('[FORGE LIB] Failed to fetch project libs:', err);
    }
  }, [projectPath, isElectron, setImportedLibraries]);

  const performSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      if (isElectron) {
        console.log(`[FORGE LIB] Triggering search for: "${query}"`);
        const data = await (window as any).electronAPI.librarySearch(query);
        const libs = data.libraries || [];
        console.log(`[FORGE LIB] Search returned ${libs.length} results.`);
        setResults(libs);
        setLibrarySearch(query, libs);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('[FORGE LIB] Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  }, [isElectron, setLibrarySearch]);

  useEffect(() => {
    if (projectPath && isElectron) {
      fetchProjectLibs();
    }
    // Only auto-fetch featured libraries if there are no results at all.
    // The backend now returns featured libraries instantly for empty queries.
    if (results.length === 0 && !searchQuery) {
      console.log('[FORGE LIB] No results detected, fetching featured libraries.');
      performSearch('');
    }
  }, [fetchProjectLibs, projectPath, isElectron]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const handleUninstall = async (libName: string) => {
    if (!projectPath || !isElectron) return;

    if (confirm(`Are you sure you want to remove ${libName}?`)) {
      try {
        const res = await (window as any).electronAPI.libraryUninstall(libName, projectPath);
        if (res.success) {
          fetchProjectLibs();
        } else {
          alert(`Failed to uninstall: ${res.error}`);
        }
      } catch (err) {
        console.error('Uninstall failed:', err);
      }
    }
  };

  const handleImport = async (lib: ArduinoLib) => {
    if (!projectPath) {
      // Automatic path initialization fallback if somehow called without path
      if (window.electronAPI?.getDefaultProjectPath) {
        const defaultPath = await window.electronAPI.getDefaultProjectPath();
        setProjectPath(defaultPath);
        // Continue with the newly set path
      } else {
        return;
      }
    }

    if (!isElectron) {
      alert('Cloud library management is available in the desktop version!');
      return;
    }

    setInstallingLib(lib.name);
    try {
      console.log(`[FORGE LIB] Starting installation for: ${lib.name}`);
      const res = await (window as any).electronAPI.libraryInstall(lib.name, projectPath || '');
      if (res.success) {
        console.log(`[FORGE LIB] Successfully installed: ${lib.name}`);
        addImportedLibrary(lib.name);
        fetchProjectLibs();
      } else {
        console.error(`[FORGE LIB] Installation failed for ${lib.name}: ${res.error}`);
        alert(`Failed to install ${lib.name}: ${res.error}`);
      }
    } catch (err) {
      console.error('[FORGE LIB] Import exception:', err);
    } finally {
      setInstallingLib(null);
    }
  };

  return (
    <div className="library-manager-root" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      overflow: 'hidden',
      flex: '1 1 0%',
      minHeight: 0,
      background: '#0f172a',
      color: '#e2e8f0',
      padding: '24px',
      boxSizing: 'border-box'
    }}>
      <style>{`
        .lib-scroll-container::-webkit-scrollbar {
          width: 8px;
        }
        .lib-scroll-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
        }
        .lib-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .lib-scroll-container::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
      `}</style>

      <div style={{ flexShrink: 0, marginBottom: '24px' }}>

        <h2 style={{ fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', color: '#BEF264', margin: 0 }}>
          <Library size={24} /> Library Marketplace
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
          Enhance your sketches with over 5,000 community-contributed hardware drivers.
        </p>
      </div>

        {!projectPath && (
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            padding: '12px 16px',
            borderRadius: '10px',
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <FolderOpen size={18} color="#3b82f6" />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '13px', color: '#f8fafc', fontWeight: 600, margin: 0 }}>Isolated Workspace Required</p>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>Installations are saved locally to your project directory.</p>
            </div>
            <button
              onClick={onInitializeProject}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Configure
            </button>
          </div>
        )}


      <LibrarySearchForm 
        initialValue={librarySearchQuery} 
        onSearch={(q) => {
          setSearchQuery(q);
          performSearch(q);
        }} 
        isSearching={isSearching} 
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
        <p style={{ fontSize: '12px', color: '#64748b' }}>
          {results.length > 0 ? `Showing ${Math.min(results.length, 100)} of ${results.length} results` : ''}
        </p>
      </div>

      {/* Resilient Scroll Container: Uses absolute positioning within a flex parent to fix height calculation issues */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0, marginTop: '8px' }}>
        <div className="lib-scroll-container" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingRight: '12px',
          scrollBehavior: 'smooth'
        }}>
          {results.length === 0 && !isSearching && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <Library size={64} style={{ opacity: 0.1, marginBottom: '20px', marginInline: 'auto' }} />
              <p style={{ fontSize: '15px' }}>Discover and import hardware libraries for your project.</p>
            </div>
          )}

          {results.slice(0, 100).map((lib) => {
            const normalize = (name: string) => name.toLowerCase().replace(/[- ]/g, '_');
            const isImported = importedLibraries.some(imported =>
              normalize(imported) === normalize(lib.name)
            );
            return (
              <LibraryCard
                key={lib.name}
                lib={lib}
                projectPath={projectPath}
                isImported={isImported}
                isInstalling={installingLib === lib.name}
                handleImport={handleImport}
                handleUninstall={handleUninstall}
              />
            );
          })}
      </div>
    </div>
  </div>
);
};

