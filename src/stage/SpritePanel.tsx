import React, { useState } from "react";
import { Sprite, SpriteType } from "./Sprite";
import { ActionMenu } from "./ActionMenu";
import { SpriteLibrary, SpriteEntry } from "../components/SpriteLibrary";
import { StageManager } from '../engine/StageManager';

// ═══════════════════════════════════════════════════════════════════════════
// SPRITE PANEL - Match Scratch 3.0 Look
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
  stageManager,
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

  return (
    <div style={styles.container}>
      {/* Top Area: Sprite Properties */}
      <div style={styles.propertyPanel}>
        <div style={styles.propertyRow}>
          {/* Sprite Name Input */}
          <div style={{ ...styles.propertyGroup, flex: 2 }}>
            <span style={styles.propertyLabel}>{selectedSpriteId === 'stage' ? 'Stage' : 'Sprite'}</span>
            <input
              type="text"
              value={selectedSprite ? selectedSprite.name : ""}
              readOnly
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
      <div style={{ display: "flex", flex: 1, backgroundColor: "#F9F9F9", minHeight: "240px" }}>

        {/* Main Sprites Area */}
        <div style={{ ...styles.spriteListContainer, flex: 1, borderRight: "1px solid #d9d9d9" }}>
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

          <div style={styles.spriteList}>
            {sprites.filter(s => s.id !== 'stage').map((sprite) => {
              const isSelected = selectedSpriteId === sprite.id;
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

          {/* Floating action button for Sprites */}
          <div style={styles.floatingAction}>
            <ActionMenu
              mainIcon="🐱"
              color="#855CD6"
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
        </div>

        {/* Stage Area */}
        <div style={{ width: "88px", padding: "16px 8px", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#575E75', marginBottom: '8px' }}>Stage</div>
          {sprites.filter(s => s.id === 'stage').map((stageSprite) => {
            const isSelected = selectedSpriteId === 'stage';
            return (
              <div
                key="stage"
                style={{
                  ...styles.spriteItem,
                  ...(isSelected ? styles.spriteItemSelected : {}),
                  borderColor: isSelected ? '#3498DB' : '#d9d9d9', // Differentiate Stage color slightly
                  width: '64px',
                  height: '76px',
                }}
                onClick={() => onSelectSprite('stage')}
              >
                <div style={{ ...styles.spriteThumbnail, height: '48px', backgroundColor: 'transparent', borderTopLeftRadius: '6px', borderTopRightRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {stageManager.getCurrentBackdrop()?.src ? (
                    <img
                      src={stageManager.getCurrentBackdrop()?.src}
                      alt="Backdrop"
                      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }} />
                  )}
                </div>
                <div style={{
                  ...styles.spriteName,
                  padding: '2px 0',
                  fontSize: '9px',
                  ...(isSelected ? { backgroundColor: '#3498DB', color: '#fff' } : {})
                }}>
                  Backdrops<br />{stageManager.getAllBackdrops().length}
                </div>
              </div>
            );
          })}

          {/* Floating action button for Backdrops */}
          <div style={{ ...styles.floatingAction, right: '4px', bottom: '12px' }}>
            <ActionMenu
              mainIcon="🖼️"
              color="#3498DB"
              tooltipLabel="Choose a Backdrop"
              actions={[
                {
                  id: 'upload',
                  icon: '⬆️',
                  label: 'Upload Backdrop',
                  onClick: () => alert('Upload backdrop coming soon!')
                },
                {
                  id: 'search',
                  icon: '🔍',
                  label: 'Choose a Backdrop',
                  onClick: () => onOpenBackdropLibrary ? onOpenBackdropLibrary() : alert('Backdrop library coming soon!')
                }
              ]}
            />
          </div>
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
    overflow: "hidden",
    width: "376px",
  },
  propertyPanel: {
    padding: "12px 16px",
    backgroundColor: "#EDF1F7", // PictoBlox style light blue-gray
    borderBottom: "1px solid #d9d9d9",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  propertyRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
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
    color: "#575E75",
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
    minHeight: "240px",
    padding: "16px",
    paddingBottom: "80px",
  },
  spriteList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    overflowY: "auto",
  },
  spriteItem: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "72px",
    height: "88px",
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
    height: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: "4px",
  },
  spriteName: {
    width: "100%",
    backgroundColor: "transparent",
    color: "#575E75",
    fontSize: "11px",
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
};

export default SpritePanel;
