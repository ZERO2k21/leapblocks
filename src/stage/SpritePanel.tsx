import React, { useState } from "react";
import { Sprite, SpriteType } from "./Sprite";
import { ActionMenu } from "./ActionMenu";

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
}

export const SpritePanel: React.FC<SpritePanelProps> = ({
  sprites,
  selectedSpriteId,
  onSelectSprite,
  onAddSprite,
  onDeleteSprite,
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
          <div style={{ ...styles.propertyGroup, flex: 1 }}>
            <span style={styles.propertyLabel}>Sprite</span>
            <input
              type="text"
              value={selectedSprite ? selectedSprite.name : ""}
              readOnly // Keeping name read-only as there's no setName in Sprite.ts currently
              style={{ ...styles.propertyInput, flex: 1 }}
            />
          </div>
          <div style={styles.propertyGroup}>
            <span style={styles.propertyIcon}>↔️ x</span>
            <input
              type="number"
              value={selectedSprite ? Math.round(selectedSprite.x) : 0}
              onChange={(e) => selectedSprite?.setX(Number(e.target.value))}
              style={styles.numberInput}
            />
          </div>
          <div style={styles.propertyGroup}>
            <span style={styles.propertyIcon}>↕️ y</span>
            <input
              type="number"
              value={selectedSprite ? Math.round(selectedSprite.y) : 0}
              onChange={(e) => selectedSprite?.setY(Number(e.target.value))}
              style={styles.numberInput}
            />
          </div>
        </div>

        <div style={styles.propertyRow}>
          <div style={styles.propertyGroup}>
            <span style={styles.propertyLabel}>Show</span>
            <div style={styles.toggleGroup}>
              <button
                onClick={() => selectedSprite?.show()}
                style={{
                  ...styles.toggleButton,
                  ...(selectedSprite?.visible
                    ? styles.toggleActive
                    : styles.toggleInactive),
                }}
                title="Show"
              >
                👁️
              </button>
              <button
                onClick={() => selectedSprite?.hide()}
                style={{
                  ...styles.toggleButton,
                  ...(!selectedSprite?.visible
                    ? styles.toggleActive
                    : styles.toggleInactive),
                }}
                title="Hide"
              >
                🚫
              </button>
            </div>
          </div>
          <div style={styles.propertyGroup}>
            <span style={styles.propertyLabel}>Size</span>
            <input
              type="number"
              value={selectedSprite ? Math.round(selectedSprite.size) : 100}
              onChange={(e) => selectedSprite?.setSize(Number(e.target.value))}
              style={styles.numberInput}
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
              style={styles.numberInput}
            />
          </div>
        </div>
      </div>

      {/* Bottom Area: Sprites List */}
      <div style={styles.spriteListContainer}>
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
          {sprites.map((sprite) => {
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

        <div style={styles.floatingAction}>
          <ActionMenu
            mainIcon="🐱"
            color="#f11a69ff" // Red/Pink from screenshot
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
                onClick: () => setShowPicker(!showPicker)
              }
            ]}
          />
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
    width: "376px", // 376 + 8 (gap) + 96 (stage) = 480px
  },
  propertyPanel: {
    padding: "12px",
    backgroundColor: "#fff",
    borderBottom: "1px solid #d9d9d9",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  propertyRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  propertyGroup: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  propertyLabel: {
    fontSize: "12px",
    color: "#575E75",
    fontWeight: "bold",
  },
  propertyIcon: {
    fontSize: "12px",
    color: "#575E75",
    fontWeight: "bold",
  },
  propertyInput: {
    minWidth: "0",
    padding: "6px 10px",
    border: "1px solid #d9d9d9",
    borderRadius: "16px",
    fontSize: "12px",
    color: "#575E75",
    backgroundColor: "#fff",
    outline: "none",
    textAlign: "left",
  },
  numberInput: {
    width: "50px",
    padding: "6px 2px",
    border: "1px solid #d9d9d9",
    borderRadius: "16px",
    fontSize: "12px",
    color: "#575E75",
    backgroundColor: "#fff",
    outline: "none",
    textAlign: "center",
  },
  toggleGroup: {
    display: "flex",
    border: "1px solid #d9d9d9",
    borderRadius: "16px",
    overflow: "hidden",
  },
  toggleButton: {
    border: "none",
    padding: "6px 8px",
    cursor: "pointer",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: "#E8F0FE", // Light blue/purple active background
    color: "#4C97FF",
  },
  toggleInactive: {
    backgroundColor: "#fff",
    color: "#ccc",
  },
  spriteListContainer: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#F9F9F9",
    position: "relative",
    minHeight: "180px",
    padding: "8px",
  },
  spriteList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    overflowY: "auto",
  },
  spriteItem: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "64px",
    height: "80px",
    backgroundColor: "#fff",
    border: "2px solid transparent",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.15s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    overflow: "visible",
  },
  spriteItemSelected: {
    border: "2px solid #855CD6",
    boxShadow: "0 0 0 2px rgba(133, 92, 214, 0.2)",
  },
  spriteThumbnail: {
    width: "100%",
    height: "56px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
    top: "-8px",
    right: "-8px",
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
    bottom: "16px",
    right: "16px",
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
};

export default SpritePanel;
