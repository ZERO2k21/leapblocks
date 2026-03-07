import React from "react";
import { stageManager } from "../engine/StageManager";
import { ActionMenu } from "./ActionMenu";

interface StagePanelProps {
    isSelected: boolean;
    onSelect: () => void;
    onOpenLibrary: () => void;
    onOpenEditor: () => void;
}

export const StagePanel: React.FC<StagePanelProps> = ({
    isSelected,
    onSelect,
    onOpenLibrary,
    onOpenEditor,
}) => {
    const currentBackdrop = stageManager.currentBackdrop;

    // Based on Image 1 (Scratch 3 Stage Panel)
    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <span
                    style={{ fontSize: "12px", fontWeight: "bold", color: "#575E75" }}
                >
                    Stage
                </span>
            </div>

            {/* Thumbnail Card */}
            <div
                style={{
                    ...styles.thumbnailCard,
                    ...(isSelected ? styles.thumbnailSelected : {})
                }}
                onClick={() => {
                    onSelect();
                    // Don't auto-open editor here, just select. 
                    // But PictoBlox opens it if already on that tab or similar.
                    // For now, let's just select.
                }}
                title="Manage backdrops"
            >
                <div style={styles.preview}>
                    {currentBackdrop && currentBackdrop.image ? (
                        <img
                            src={currentBackdrop.src}
                            alt={currentBackdrop.name}
                            style={styles.image}
                        />
                    ) : (
                        <div style={styles.placeholder}>🖼️</div>
                    )}
                </div>
            </div>

            {/* Backdrop Info */}
            <div style={styles.info}>
                <div style={styles.backdropText}>Backdrops</div>
                <div style={styles.backdropCount}>1</div>
            </div>

            {/* Floating Add Backdrop Button */}
            <div style={styles.floatingAction}>
                <ActionMenu
                    mainIcon="🖼️"
                    color="#855CD6" // Purple matching Stage Panel button
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
                                // For Intermediate Mode, we can grab predefined backdrops from assets or generate random colors.
                                const surpriseBackdrops = [
                                    "/assets/backdrops/park.png",
                                    "/assets/backdrops/space.png",
                                    "/assets/backdrops/city.png",
                                    "/assets/backdrops/maze.png",
                                    "/assets/backdrops/underwater.png"
                                ];
                                const randomSrc = surpriseBackdrops[Math.floor(Math.random() * surpriseBackdrops.length)];
                                const img = new Image();
                                img.onload = () => {
                                    const canvas = document.createElement("canvas");
                                    canvas.width = 480;
                                    canvas.height = 360;
                                    const ctx = canvas.getContext("2d");
                                    ctx?.drawImage(img, 0, 0, 480, 360);
                                    stageManager.addBackdrop(`Surprise ${Math.floor(Math.random() * 100)}`, canvas.toDataURL());

                                    // Hack to force re-render in parent app
                                    window.dispatchEvent(new Event('leap-stage-update'));
                                };
                                img.onerror = () => {
                                    console.warn("Could not load surprise backdrop image, adding blank.");
                                    const canvas = document.createElement("canvas");
                                    canvas.width = 480;
                                    canvas.height = 360;
                                    const ctx = canvas.getContext("2d");
                                    if (ctx) {
                                        ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 80%)`;
                                        ctx.fillRect(0, 0, 480, 360);
                                    }
                                    stageManager.addBackdrop(`Surprise ${Math.floor(Math.random() * 100)}`, canvas.toDataURL());
                                    window.dispatchEvent(new Event('leap-stage-update'));
                                };
                                img.src = randomSrc;
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
                            onClick: onOpenLibrary
                        }
                    ]}
                />
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        width: '100px',
        backgroundColor: '#EDF1F7', // PictoBlox style light blue-gray
        borderRadius: '8px',
        border: '1px solid #d9d9d9',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px',
        position: 'relative',
        minHeight: '260px',
    },
    header: {
        width: "100%",
        display: "flex",
        justifyContent: "flex-start",
        marginBottom: "6px",
        paddingLeft: "4px",
    },
    thumbnailCard: {
        width: "100%",
        height: "70px",
        backgroundColor: "#fff",
        border: "2px solid #d9d9d9",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
        overflow: "hidden",
        position: "relative",
        marginBottom: "8px",
    },
    thumbnailSelected: {
        border: "2px solid #855CD6",
        boxShadow: "0 0 0 2px rgba(133, 92, 214, 0.2)",
    },
    preview: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
    },
    image: {
        width: "100%",
        height: "100%",
        objectFit: "contain",
    },
    placeholder: {
        fontSize: "24px",
    },
    info: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2px",
    },
    backdropText: {
        fontSize: "11px",
        color: "#575E75",
        fontWeight: "normal",
    },
    backdropCount: {
        fontSize: "11px",
        color: "#575E75",
        fontWeight: "normal",
    },
    floatingAction: {
        position: "absolute",
        bottom: "16px",
        right: "16px",
        zIndex: 10,
    },
    floatingAddButton: {
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        backgroundColor: "#855CD6",
        color: "white",
        border: "none",
        fontSize: "20px",
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
        fontSize: "14px",
        fontWeight: "bold",
        textShadow: "0 0 2px rgba(0,0,0,0.5)",
    },
};

export default StagePanel;
