import React, { useState, useEffect, useCallback } from 'react';
import { Search, Download, Trash2, Library, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
import { useForgeStore } from '../../store/useForgeStore';

interface ArduinoLib {
  name: string;
  author: string;
  version: string;
  sentence: string;
  paragraph?: string;
  website?: string;
}

export const LibraryManager: React.FC = () => {
  const { projectPath, importedLibraries, addImportedLibrary, setImportedLibraries } = useForgeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<ArduinoLib[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [installingLib, setInstallingLib] = useState<string | null>(null);

  const fetchProjectLibs = useCallback(async () => {
    if (!projectPath) return;
    const libs = await window.electronAPI.libraryListProject(projectPath);
    setImportedLibraries(libs);
  }, [projectPath, setImportedLibraries]);

  const performSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const data = await window.electronAPI.librarySearch(query);
      setResults(data.libraries || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    fetchProjectLibs();
    // Auto-fetch featured libraries on mount
    performSearch('');
  }, [fetchProjectLibs, performSearch]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const handleUninstall = async (libName: string) => {
    if (!projectPath) return;

    if (confirm(`Are you sure you want to remove ${libName}?`)) {
      try {
        const res = await window.electronAPI.libraryUninstall(libName, projectPath);
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
      alert('Please save the project first to import libraries.');
      return;
    }

    setInstallingLib(lib.name);
    try {
      const res = await window.electronAPI.libraryInstall(lib.name, projectPath);
      if (res.success) {
        addImportedLibrary(lib.name);
      } else {
        alert(`Failed to install ${lib.name}: ${res.error}`);
      }
    } catch (err) {
      console.error('Import failed:', err);
    } finally {
      setInstallingLib(null);
    }
  };

  return (
    <div className="library-manager-root" style={{
      padding: '20px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0f172a',
      color: '#e2e8f0'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: '#BEF264' }}>
          <Library size={20} /> Library Marketplace
        </h2>
        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
          Manage project-specific libraries. Changes are isolated to this project.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Browse hardware libraries (e.g. Servo, DHT11, NeoPixel)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '10px 12px 10px 36px',
              color: '#f8fafc',
              fontSize: '13px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#334155'}
          />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0 16px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
        >
          {isSearching ? <Loader2 className="animate-spin" size={18} /> : 'Search'}
        </button>
      </form>

      {/* Results List */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
        {results.length === 0 && !isSearching && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            <Library size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p>Search for hardware libraries to add to your project.</p>
          </div>
        )}

        {results.map((lib) => {
          const isImported = importedLibraries.includes(lib.name);
          const isInstalling = installingLib === lib.name;

          return (
            <div key={lib.name} style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '12px',
              transition: 'transform 0.2s, border-color 0.2s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>
                    {lib.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>
                    <span style={{ background: '#334155', padding: '2px 6px', borderRadius: '4px' }}>v{lib.version}</span>
                    <span>by {lib.author}</span>
                  </div>
                </div>

                {isImported ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '12px', fontWeight: 600 }}>
                      <CheckCircle2 size={16} /> Imported
                    </div>
                    <button
                      onClick={() => handleUninstall(lib.name)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#f85149',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(248, 81, 73, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      title="Uninstall Library"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleImport(lib)}
                    disabled={isInstalling}
                    style={{
                      background: '#BEF264',
                      color: '#1a1a1b',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {isInstalling ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                    {isInstalling ? 'Installing...' : 'Import'}
                  </button>
                )}
              </div>

              <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.6', margin: '8px 0' }}>
                {lib.sentence}
              </p>

              {lib.website && (
                <a
                  href={lib.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '11px', color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <ExternalLink size={12} /> Documentation
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
