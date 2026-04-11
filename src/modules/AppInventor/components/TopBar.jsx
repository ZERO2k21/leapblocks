import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Edit2, Save, Cpu, Upload } from 'lucide-react';

export default function TopBar({ appState, activeTab, setActiveTab, onBuildApk, onBack }) {
  const { screens, activeScreen, setActiveScreen, appName, setAppName } = appState;
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(appName);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingName]);

  const handleNameSave = () => {
    if (tempName.trim()) {
      setAppName(tempName.trim());
    } else {
      setTempName(appName); // revert
    }
    setIsEditingName(false);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      height: 54,
      padding: '0 16px',
      gap: 6,
      background: 'linear-gradient(135deg, #0a015a 0%, #080a25 100%)',
      boxShadow: '0 2px 12px rgba(8,10,37,0.35)',
      zIndex: 100,
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      position: 'relative',
    }}>

      {/* Home Button */}
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10,
          color: '#fff',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          marginRight: 8,
          flexShrink: 0,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        title="Go Back"
      >
        <ArrowLeft size={18} strokeWidth={2.2} />
      </button>

      {/* Logo + Label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginRight: 16,
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          borderLeft: '1px solid rgba(255,255,255,0.15)',
          paddingLeft: 10,
        }}>
          <span style={{
            color: '#FFD500',
            fontSize: 9,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            lineHeight: 1.2,
            fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
          }}>
            LEAPBLOCKS
          </span>
          <span style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.02em',
            lineHeight: 1.2,
            fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
          }}>
            App Inventor
          </span>
        </div>
      </div>

      {/* Separator */}
      <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.12)', margin: '0 4px', flexShrink: 0 }} />

      {/* App Name Editor */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: 10,
        padding: '0 4px 0 12px',
        border: '1px solid rgba(255,255,255,0.08)',
        height: 36,
        gap: 6,
      }}>
        <span style={{ fontSize: 14, opacity: 0.5 }}>📱</span>
        {isEditingName ? (
          <input
            ref={inputRef}
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
              width: 140,
              outline: 'none',
              letterSpacing: '0.01em',
            }}
            placeholder="App Name"
          />
        ) : (
          <button
            onClick={() => { setTempName(appName); setIsEditingName(true); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <span>{appName}</span>
            <Edit2 size={14} strokeWidth={2.2} style={{ opacity: 0.7 }} />
          </button>
        )}
        <button
          onClick={() => onFileAction?.('save')}
          style={{
            background: 'linear-gradient(135deg, #10B981, #059669)',
            border: 'none',
            borderRadius: 7,
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
            transition: 'all 0.15s ease',
            flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          title="Save Project"
        >
          <Save size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Tab Buttons */}
      <div style={{
        display: 'flex',
        position: 'relative',
        background: 'rgba(0,0,0,0.25)',
        borderRadius: 22,
        padding: 3,
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {/* Sliding indicator */}
        <div style={{
          position: 'absolute',
          top: 3,
          left: activeTab === 'designer' ? 3 : 'calc(50% + 1px)',
          width: 'calc(50% - 4px)',
          height: 'calc(100% - 6px)',
          borderRadius: 19,
          background: activeTab === 'designer'
            ? 'linear-gradient(135deg, #10B981, #059669)'
            : 'linear-gradient(135deg, #3B82F6, #2563EB)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        }} />
        <button
          onClick={() => setActiveTab('designer')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 16px',
            border: 'none',
            borderRadius: 19,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
            cursor: 'pointer',
            background: 'transparent',
            color: activeTab === 'designer' ? '#fff' : 'rgba(255,255,255,0.55)',
            position: 'relative',
            zIndex: 1,
            transition: 'color 0.2s ease',
            letterSpacing: '0.03em',
          }}
        >
          <Edit2 size={13} strokeWidth={2.5} />
          Designer
        </button>
        <button
          onClick={() => setActiveTab('blocks')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 16px',
            border: 'none',
            borderRadius: 19,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
            cursor: 'pointer',
            background: 'transparent',
            color: activeTab === 'blocks' ? '#fff' : 'rgba(255,255,255,0.55)',
            position: 'relative',
            zIndex: 1,
            transition: 'color 0.2s ease',
            letterSpacing: '0.03em',
          }}
        >
          <Cpu size={13} strokeWidth={2.5} />
          Blocks
        </button>
      </div>

      {/* Build APK button */}
      <button
        onClick={onBuildApk}
        style={{
          border: 'none',
          borderRadius: 20,
          padding: '7px 18px',
          fontSize: 12,
          fontWeight: 700,
          fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: '0 2px 10px rgba(255,213,0,0.35)',
          transition: 'all 0.2s ease',
          background: 'linear-gradient(135deg, #FFD500, #FFB800)',
          color: '#1a1a2e',
          letterSpacing: '0.03em',
          marginLeft: 4,
        }}
      >
        <Upload size={14} strokeWidth={2.5} />
        Build APK      </button>
    </div>
  );
}