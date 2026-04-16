import React, { useState } from 'react';

export interface ActionMenuItem {
    id: string;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}

interface ActionMenuProps {
    mainIcon: React.ReactNode;
    color: string;
    tooltipLabel: string;
    actions: ActionMenuItem[];
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ mainIcon, color, tooltipLabel, actions }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            style={styles.container}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Expanded drop-up menu items */}
            <div style={{
                ...styles.menuFlyout,
                backgroundColor: color,
                opacity: isHovered ? 1 : 0,
                visibility: isHovered ? 'visible' : 'hidden',
                bottom: isHovered ? '44px' : '22px', // Slide up effect
            }}>
                {actions.map((action, index) => (
                    <div
                        key={action.id}
                        className="menu-item-wrapper"
                        style={styles.menuItemWrapper}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsHovered(false);
                            action.onClick();
                        }}
                    >
                        {/* Tooltip for individual actions */}
                        <div className="action-tooltip" style={styles.actionTooltip}>
                            {action.label}
                        </div>
                        <button
                            className="action-menu-btn"
                            style={styles.menuButton}
                            title={action.label}
                        >
                            {action.icon}
                        </button>
                    </div>
                ))}
            </div>

            {/* Primary floating action button */}
            <div className="primary-button-wrapper" style={styles.primaryButtonWrapper}>
                {/* Tooltip for main action */}
                <div className="main-tooltip" style={{
                    ...styles.mainTooltip
                }}>
                    {tooltipLabel}
                </div>

                <button
                    style={{
                        ...styles.mainButton,
                        backgroundColor: color,
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        // Also trigger the primary action (first in list usually, but in leap it's search)
                        actions.find(a => a.id === 'search')?.onClick();
                    }}
                >
                    {mainIcon}
                    {/* SVG Plus Overlay standard in leap */}
                    <div style={styles.plusOverlay}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </div>
                </button>
            </div>

            <style>{`
                .action-menu-btn {
                    transition: background-color 0.2s;
                }
                .action-menu-btn:hover {
                    background-color: rgba(0,0,0,0.15);
                }
                .menu-item-wrapper {
                    position: relative;
                }
                .menu-item-wrapper:hover .action-tooltip {
                    opacity: 1;
                    visibility: visible;
                    right: 45px;
                }
                .primary-button-wrapper:hover .main-tooltip {
                    opacity: 1;
                    visibility: visible;
                    right: 65px;
                }
            `}</style>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    menuFlyout: {
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '10px 0',
        borderRadius: '24px',
        width: '36px',
        transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        gap: '8px'
    },
    menuItemWrapper: {
        position: 'relative',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
    },
    menuButton: {
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        backgroundColor: 'transparent',
        border: 'none',
        color: 'white',
        fontSize: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
    },
    primaryButtonWrapper: {
        position: 'relative',
        display: 'flex',
        justifyContent: 'flex-end',
        width: '34px',
        height: '34px',
    },
    mainButton: {
        width: '34px',
        height: '34px',
        borderRadius: '50%',
        color: 'white',
        border: '2px solid white',
        fontSize: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        position: 'relative',
        zIndex: 101, // Above flyout
    },
    plusOverlay: {
        position: "absolute",
        top: "-2px",
        right: "-2px",
        color: "white",
        display: "flex"
    },
    mainTooltip: {
        position: 'absolute',
        right: '48px', // Will animate to 58px via CSS
        top: '50%',
        transform: 'translateY(-50%)',
        backgroundColor: '#855CD6',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        opacity: 0,
        visibility: 'hidden',
        transition: 'all 0.2s',
        pointerEvents: 'none',
        zIndex: 102,
    },
    actionTooltip: {
        position: 'absolute',
        right: '28px', // Will animate to 38px via CSS
        top: '50%',
        transform: 'translateY(-50%)',
        backgroundColor: '#855CD6',
        color: 'white',
        padding: '6px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        opacity: 0,
        visibility: 'hidden',
        transition: 'all 0.2s',
        pointerEvents: 'none',
    }
};
