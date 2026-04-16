import React, { useState } from "react";
import { Sprite, SpriteType } from "./Sprite";
import { ActionMenu } from "./ActionMenu";
import { SpriteLibrary, SpriteEntry } from "../components/SpriteLibrary";
import type { StageManager } from '../engine/StageManager';

// ═══════════════════════════════════════════════════════════════════════════
// SPRITE PANEL - Match leap 3.0 Look
// ═══════════════════════════════════════════════════════════════════════════

const SPRITE_TYPES: {
  type: SpriteType;
  name: string;
  emoji: string;
  color: string;
}[] = [
    { type: "cat", name: "Cat", emoji: "🐱", color: "#FF8C1A" },
    { type: "ball", name: "Ball", emoji: "⚽", color: "#2980B9" },
    { type: "arrow", name: "Arrow", emoji: "➤", color: "#E74C3C" },
    { type: "robot", name: "Robot", emoji: "🤖", color: "#7D8C9C" },
  ];

interface SpritePanelProps {
  sprites: Sprite[];
  selectedSpriteId: string | null;
  onSelectSprite: (id: string) => void;
  onAddSprite: (type: SpriteType) => void;
  onDeleteSprite: (id: string) => void;
  onRemoveBackground: (spriteId: string) => void; // v2
  onOpenSpriteLibrary?: () => void;
  onOpenBackdropLibrary?: () => void;
  stageManager: StageManager;
  backdropVersion?: number; // triggers re-render when backdrops change
  isFullscreen?: boolean;
}

export const SpritePanel: React.FC<SpritePanelProps> = ({
  sprites,
  selectedSpriteId,
  onSelectSprite,
  onAddSprite,
  onDeleteSprite,
  onRemoveBackground,
  onOpenSpriteLibrary,
  onOpenBackdropLibrary,
  backdropVersion,
  stageManager,
  isFullscreen = false,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const selectedSprite = sprites.find((s) => s.id === selectedSpriteId);

  const handleAddSprite = (type: SpriteType) => {
    onAddSprite(type);
    setShowPicker(false);
  };

  const getSpriteColor = (sprite: Sprite) => {
    const found = SPRITE_TYPES.find((t) => t.type === sprite.spriteType);
    return found ? found.color : "#FF8C1A";
  };

  const getSpriteEmoji = (sprite: Sprite) => {
    const found = SPRITE_TYPES.find((t) => t.type === sprite.spriteType);
    return found ? found.emoji : "🐱";
  };

  // Dynamic colors for the fading overlay
  const overlayColor = isFullscreen ? "#111116" : "#F9F9F9";

  return (
    <div style={{
      ...styles.container,
      ...(isFullscreen ? {
        border: '1px solid rgba(255,255,255,0.1)',
        backgroundColor: '#16161a',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      } : {})
    }}>
      {/* Slim Modern Scrollbar CSS */}
      <style>{`
        .slim-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .slim-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .slim-scrollbar::-webkit-scrollbar-thumb {
          background: ${isFullscreen ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
          border-radius: 10px;
        }
        .slim-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isFullscreen ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};
        }
      `}</style>
      {/* Top Area: Sprite Properties */}
      <div style={{
        ...styles.propertyPanel,
        ...(isFullscreen ? {
          backgroundColor: '#1c1c21',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        } : {})
      }}>
        <div style={styles.propertyRow}>
          {/* Sprite Name Input */}
          <div style={{ ...styles.propertyGroup, flex: 2 }}>
            <span style={styles.propertyLabel}>{selectedSpriteId === 'stage' ? 'Stage' : 'Sprite'}</span>
            <input
              type="text"
              value={selectedSprite ? selectedSprite.name : ""}
              onChange={(e) => selectedSprite?.setName(e.target.value)}
              disabled={!selectedSprite || selectedSpriteId === 'stage'}
              style={{ ...styles.propertyInput, width: '100%', minWidth: '60px' }}
            />
          </div>

          {selectedSpriteId !== 'stage' ? (
            <>
              {/* X and Y Inputs */}
              <div style={{ ...styles.propertyGroup, flex: 3, justifyContent: 'flex-start' }}>
                <div style={styles.coordGroup}>
                  <span style={styles.propertyIcon}>↔ x</span>
                  <input
                    type="number"
                    value={selectedSprite ? Math.round(selectedSprite.x) : 0}
                    onChange={(e) => selectedSprite?.setX(Number(e.target.value))}
                    style={styles.numberInput}
                  />
                </div>
                <div style={styles.coordGroup}>
                  <span style={styles.propertyIcon}>↕ y</span>
                  <input
                    type="number"
                    value={selectedSprite ? Math.round(selectedSprite.y) : 0}
                    onChange={(e) => selectedSprite?.setY(Number(e.target.value))}
                    style={styles.numberInput}
                  />
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 3, display: 'flex', alignItems: 'center', color: '#575E75', fontSize: '12px', paddingLeft: '8px' }}>
              Main backdrop environment
            </div>
          )}
        </div>

        <div style={styles.propertyRow}>
          {selectedSpriteId !== 'stage' ? (
            <>
              {/* Show / Hide */}
              <div style={styles.propertyGroup}>
                <span style={styles.propertyLabel}>Show</span>
                <div style={styles.toggleContainer}>
                  <button
                    onClick={() => selectedSprite?.show()}
                    style={{
                      ...styles.toggleButton,
                      ...(selectedSprite?.visible ? styles.toggleActive : styles.toggleInactive),
                    }}
                    disabled={!selectedSprite}
                    title="Show"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={selectedSprite?.visible ? "#855CD6" : "#575E75"}>
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => selectedSprite?.hide()}
                    style={{
                      ...styles.toggleButton,
                      ...(!selectedSprite?.visible && selectedSprite ? styles.toggleActive : styles.toggleInactive),
                    }}
                    disabled={!selectedSprite}
                    title="Hide"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={!selectedSprite?.visible && selectedSprite ? "#855CD6" : "#575E75"}>
                      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div style={styles.propertyGroup}>
                <span style={styles.propertyLabel}>Size</span>
                <input
                  type="number"
                  value={selectedSprite ? Math.round(selectedSprite.size) : 100}
                  onChange={(e) => selectedSprite?.setSize(Number(e.target.value))}
                  style={{ ...styles.numberInput, width: '48px' }}
                />
              </div>

              <div style={styles.propertyGroup}>
                <span style={styles.propertyLabel}>Direction</span>
                <input
                  type="number"
                  value={selectedSprite ? Math.round(selectedSprite.direction) : 90}
                  onChange={(e) =>
                    selectedSprite?.pointInDirection(Number(e.target.value))
                  }
                  style={{ ...styles.numberInput, width: '48px' }}
                />
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', color: '#575E75', fontSize: '11px', fontStyle: 'italic', paddingLeft: '8px', opacity: 0.7 }}>
              Backdrops cannot be hidden or moved like sprites.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Area: Sprites and Stage Lists */}
      <div style={{
        display: "flex",
        flex: 1,
        backgroundColor: isFullscreen ? "#111116" : "#F9F9F9",
        minHeight: "180px",
        overflow: "hidden",
        position: "relative",
        zIndex: 10
      }}>

        {/* Main Sprites Area */}
        <div style={{
          ...styles.spriteListContainer,
          flex: 1,
          borderRight: isFullscreen ? "1px solid rgba(255,255,255,0.05)" : "1px solid #d9d9d9",
          backgroundColor: isFullscreen ? "#111116" : "#F9F9F9",
        }}>
          {showPicker && (
            <div style={styles.picker}>
              <div style={styles.pickerTitle}>Choose a sprite:</div>
              <div style={styles.pickerGrid}>
                {SPRITE_TYPES.map((spriteType) => (
                  <button
                    key={spriteType.type}
                    style={{
                      ...styles.pickerItem,
                      backgroundColor: spriteType.color,
                    }}
                    onClick={() => handleAddSprite(spriteType.type)}
                    title={spriteType.name}
                  >
                    <span style={styles.pickerEmoji}>{spriteType.emoji}</span>
                    <span style={styles.pickerLabel}>{spriteType.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="slim-scrollbar" style={{
            ...styles.spriteList,
            overflowY: "auto",
            height: "100%",
          }}>
            {sprites.filter(s => s.id !== 'stage' && !s.id.includes('_clone_')).map((sprite) => {
              const isSelected = selectedSpriteId === sprite.id;
              const cloneCount = sprites.filter(s => s.id.startsWith(`${sprite.id}_clone_`)).length;

              return (
                <div
                  key={sprite.id}
                  style={{
                    ...styles.spriteItem,
                    ...(isSelected ? styles.spriteItemSelected : {}),
                  }}
                  onClick={() => onSelectSprite(sprite.id)}
                >
                  {isSelected && (
                    <button
                      style={styles.deleteButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSprite(sprite.id);
                      }}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  )}

                  {cloneCount > 0 && (
                    <div style={styles.cloneBadge} title={`${cloneCount} clones active`}>
                      {cloneCount}
                    </div>
                  )}

                  <div style={styles.spriteThumbnail}>
                    {sprite.currentCostume ? (
                      <img
                        src={sprite.currentCostume.image.src}
                        alt={sprite.name}
                        style={{
                          maxWidth: "40px",
                          maxHeight: "40px",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: "32px" }}>
                        {getSpriteEmoji(sprite)}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      ...styles.spriteName,
                      ...(isSelected ? styles.spriteNameSelected : {}),
                    }}
                  >
                    {sprite.name}
                  </div>
                </div>
              );
            })}

          </div>

          {/* Floating Add Sprite Button - leap 3.0 style */}
          <div style={{ position: 'absolute', bottom: '12px', right: '12px', zIndex: 20 }}>
            <ActionMenu
              mainIcon="➕"
              color="#9974ffff"
              tooltipLabel="Choose a Sprite"
              actions={[
                {
                  id: 'upload',
                  icon: '⬆️',
                  label: 'Upload Sprite',
                  onClick: () => alert('Upload sprite coming soon!')
                },
                {
                  id: 'surprise',
                  icon: '✨',
                  label: 'Surprise',
                  onClick: () => {
                    const randomSprite = SPRITE_TYPES[Math.floor(Math.random() * SPRITE_TYPES.length)];
                    handleAddSprite(randomSprite.type);
                  }
                },
                {
                  id: 'paint',
                  icon: '🖌️',
                  label: 'Paint',
                  onClick: () => alert('Paint editor coming soon!')
                },
                {
                  id: 'search',
                  icon: '🔍',
                  label: 'Choose a Sprite',
                  onClick: () => onOpenSpriteLibrary ? onOpenSpriteLibrary() : setShowPicker(!showPicker)
                }
              ]}
            />
          </div>

          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '40px',
            pointerEvents: 'none',
            background: `linear-gradient(to bottom, transparent, ${overlayColor})`,
            zIndex: 5,
          }} />
        </div>

        {/* Stage Area */}
        <div className="slim-scrollbar" style={{
          width: "108px",
          padding: "12px 8px",
          paddingBottom: "56px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          height: "100%",
          overflowY: "auto",
          boxSizing: "border-box",
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', width: '100%', justifyContent: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#575E75' }}>Stage</div>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#4c97ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '10px' }}>🖼️</span>
            </div>
          </div>
          {sprites.filter(s => s.id === 'stage').map((stageSprite) => {
            const isSelected = selectedSpriteId === 'stage';
            return (
              <div
                key="stage"
                style={{
                  ...styles.spriteItem,
                  ...(isSelected ? styles.spriteItemSelected : {}),
                  borderColor: isSelected ? '#3498DB' : '#d9d9d9',
                  width: '80px',
                  height: '80px',
                }}
                onClick={() => onSelectSprite('stage')}
              >
                <div style={{ ...styles.spriteThumbnail, height: '52px', backgroundColor: 'transparent', borderTopLeftRadius: '6px', borderTopRightRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {stageManager.getCurrentBackdrop()?.src ? (
                    <img
                      src={stageManager.getCurrentBackdrop()?.src}
                      alt="Backdrop"
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderTopLeftRadius: '6px', borderTopRightRadius: '6px' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', backgroundColor: '#e8e8e8' }} />
                  )}
                </div>
                <div style={{
                  ...styles.spriteName,
                  padding: '4px 2px',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  ...(isSelected ? { backgroundColor: '#3498DB', color: '#fff' } : {})
                }}>
                  Backdrops {stageManager.getAllBackdrops().length}
                </div>
              </div>
            );
          })}

          {/* Floating Add Backdrop Button */}
          <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
            <ActionMenu
              mainIcon={<span style={{ fontSize: '10px' }}>🖼️</span>}
              color="#4c97ffff"
              tooltipLabel="Choose a Backdrop"
              actions={[
                {
                  id: 'upload',
                  icon: '⬆️',
                  label: 'Upload Backdrop',
                  onClick: () => alert('Upload backdrop coming soon!')
                },
                {
                  id: 'surprise',
                  icon: '✨',
                  label: 'Surprise',
                  onClick: () => {
                    // Logic for surprise backdrop
                  }
                },
                {
                  id: 'paint',
                  icon: '🖌️',
                  label: 'Paint',
                  onClick: () => alert('Paint editor coming soon!')
                },
                {
                  id: 'search',
                  icon: '🔍',
                  label: 'Choose a Backdrop',
                  onClick: () => onOpenBackdropLibrary ? onOpenBackdropLibrary() : alert('Library coming soon!')
                }
              ]}
            />
          </div>

          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '20px',
            pointerEvents: 'none',
            background: `linear-gradient(to bottom, transparent, ${overlayColor})`,
            zIndex: 5,
          }} />
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#fff",
    borderRadius: "8px",
    border: "1px solid #d9d9d9",
    width: "466px",
  },
  propertyPanel: {
    padding: "8px 16px",
    backgroundColor: "#EDF1F7", // style light blue-gray
    borderBottom: "1px solid #d9d9d9",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  propertyRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: "12px",
  },
  propertyGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  coordGroup: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  propertyLabel: {
    fontSize: "12px",
    color: "#8E94A7", // Lighter for dark mode
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
  propertyIcon: {
    fontSize: "12px",
    color: "#575E75",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
  propertyInput: {
    minWidth: "0",
    padding: "4px 12px",
    border: "1px solid #d9d9d9",
    borderRadius: "12px",
    fontSize: "12px",
    color: "#575E75",
    backgroundColor: "#fff",
    outline: "none",
    textAlign: "left",
  },
  numberInput: {
    width: "48px",
    padding: "4px 4px",
    border: "1px solid #d9d9d9",
    borderRadius: "12px",
    fontSize: "12px",
    color: "#575E75",
    backgroundColor: "#fff",
    outline: "none",
    textAlign: "center",
  },
  toggleContainer: {
    display: "flex",
    gap: "4px",
  },
  toggleButton: {
    border: "1px solid #d9d9d9",
    borderRadius: "4px",
    padding: "4px 8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    transition: "all 0.2s",
  },
  toggleActive: {
    borderColor: "#855CD6",
    backgroundColor: "#E8F0FE",
  },
  toggleInactive: {
    borderColor: "#d9d9d9",
    backgroundColor: "#fff",
    opacity: 0.6,
  },
  spriteListContainer: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#F9F9F9",
    position: "relative",
    minHeight: "180px",
    padding: "12px",
    paddingBottom: "60px",
  },
  spriteList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    alignItems: "flex-start",
    paddingBottom: "60px",
  },
  spriteItem: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "64px",
    height: "80px",
    backgroundColor: "#fff",
    border: "2px solid #d9d9d9",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.15s",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    overflow: "visible", // for the delete badge
  },
  spriteItemSelected: {
    border: "2px solid #855CD6",
    boxShadow: "0 0 0 2px rgba(133, 92, 214, 0.2)",
  },
  spriteThumbnail: {
    width: "100%",
    height: "52px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: "4px",
  },
  spriteName: {
    width: "100%",
    backgroundColor: "transparent",
    color: "#575E75",
    fontSize: "10px",
    textAlign: "center",
    padding: "4px 0",
    borderBottomLeftRadius: "6px",
    borderBottomRightRadius: "6px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  spriteNameSelected: {
    backgroundColor: "#855CD6",
    color: "#fff",
  },
  deleteButton: {
    position: "absolute",
    top: "-10px",
    right: "-10px",
    width: "24px",
    height: "24px",
    padding: 0,
    border: "none",
    borderRadius: "50%",
    backgroundColor: "#855CD6",
    color: "#fff",
    fontSize: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
  },
  floatingAction: {
    position: "absolute",
    bottom: "12px",
    right: "12px",
    zIndex: 100,
  },
  floatingAddButton: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: "#855CD6",
    color: "white",
    border: "none",
    fontSize: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    position: "relative",
    transition: "transform 0.1s",
  },
  plusOverlay: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    color: "white",
    fontSize: "16px",
    fontWeight: "bold",
    textShadow: "0 0 2px rgba(0,0,0,0.5)",
  },
  picker: {
    position: "absolute",
    bottom: "70px",
    right: "16px",
    padding: "12px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: 100,
    border: "1px solid #eee",
  },
  pickerTitle: {
    fontSize: "12px",
    color: "#575E75",
    marginBottom: "8px",
    fontWeight: "bold",
  },
  pickerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "8px",
  },
  pickerItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "8px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    color: "white",
    transition: "transform 0.1s",
  },
  pickerEmoji: {
    fontSize: "20px",
    marginBottom: "4px",
  },
  pickerLabel: {
    fontSize: "10px",
    fontWeight: "bold",
  },
  actionBtnSmall: {
    backgroundColor: '#855CD6',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    fontSize: '10px',
    padding: '4px 8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  cloneBadge: {
    position: 'absolute',
    top: '-8px',
    left: '-8px',
    backgroundColor: '#FF8C1A',
    color: 'white',
    borderRadius: '10px',
    padding: '2px 8px',
    fontSize: '10px',
    fontWeight: 'bold',
    border: '2px solid white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    zIndex: 11,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '20px',
  },
};

export default SpritePanel;
