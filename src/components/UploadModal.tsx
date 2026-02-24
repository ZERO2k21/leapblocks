import React from 'react';

interface UploadModalProps {
    isOpen: boolean;
    progress: string; // Format: "25%: Configuring board..."
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, progress }) => {
    if (!isOpen) return null;

    // Parse progress string
    let percentage = 0;
    let message = progress;

    const match = progress.match(/(\d+)%/);
    if (match) {
        percentage = parseInt(match[1], 10);
        const parts = progress.split(':');
        if (parts.length > 1) {
            message = parts[1].trim();
        } else {
            message = progress;
        }
    }

    return (
        <div style={styles.overlay}>
            <div style={styles.card}>
                <div style={styles.iconContainer}>
                    {/* Rocket Icon with Animation */}
                    <svg
                        width="80"
                        height="80"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={percentage < 100 ? styles.rocketRumble : styles.rocketLaunch}
                    >
                        {/* Rocket Body */}
                        <path d="M12 2.5C12 2.5 14.5 7 14.5 11C14.5 13 13.5 15 12 15C10.5 15 9.5 13 9.5 11C9.5 7 12 2.5 12 2.5Z" stroke="#855CD6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Rocket Wings */}
                        <path d="M9.5 11C8.5 11.5 7.5 12.5 7 14L6 18H9L9.5 15" stroke="#855CD6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M14.5 11C15.5 11.5 16.5 12.5 17 14L18 18H15L14.5 15" stroke="#855CD6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Exhaust Trail */}
                        <path d="M10.5 18C10.5 18 10.5 21 12 21C13.5 21 13.5 18 13.5 18" stroke="#855CD6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <animate attributeName="d" values="M10.5 18C10.5 18 10.5 21 12 21C13.5 21 13.5 18 13.5 18;M10.5 18C10 22 10 22 12 22C14 22 14 22 13.5 18;M10.5 18C10.5 18 10.5 21 12 21C13.5 21 13.5 18 13.5 18" dur="0.2s" repeatCount="indefinite" />
                        </path>
                        {/* Exhaust sparks */}
                        <circle cx="11" cy="20" r="0.5" fill="#855CD6">
                            <animate attributeName="cy" values="20;23" dur="0.3s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="1;0" dur="0.3s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="13" cy="20" r="0.5" fill="#855CD6">
                            <animate attributeName="cy" values="20;23" dur="0.3s" repeatCount="indefinite" begin="0.1s" />
                            <animate attributeName="opacity" values="1;0" dur="0.3s" repeatCount="indefinite" begin="0.1s" />
                        </circle>
                    </svg>
                </div>

                <h2 style={styles.title}>Uploading...</h2>

                <div style={styles.progressWrapper}>
                    <div style={styles.progressBarBg}>
                        <div style={{ ...styles.progressBarFill, width: `${percentage}%` }}></div>
                    </div>
                </div>

                <div style={styles.statusMessage}>{progress}</div>
                <div style={styles.percentageText}>{percentage}%</div>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        animation: 'fadeIn 0.3s ease-out',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '24px',
        width: '420px',
        padding: '40px 30px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.2)',
    },
    iconContainer: {
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100px',
    },
    rocketRumble: {
        animation: 'rumble 0.1s infinite alternate',
    },
    rocketLaunch: {
        animation: 'launch 0.5s ease-in forwards',
    },
    title: {
        margin: '0 0 24px 0',
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#333',
    },
    progressWrapper: {
        width: '100%',
        marginBottom: '20px',
    },
    progressBarBg: {
        width: '100%',
        height: '14px',
        backgroundColor: '#F0F0F0',
        borderRadius: '10px',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#855CD6',
        borderRadius: '10px',
        transition: 'width 0.4s ease-out',
    },
    statusMessage: {
        fontSize: '14px',
        color: '#666',
        marginBottom: '8px',
        fontWeight: 500,
    },
    percentageText: {
        fontSize: '14px',
        color: '#999',
        fontWeight: 'bold',
    },
};

// Add global animation styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.id = "upload-animations";
    styleSheet.innerText = `
        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        @keyframes rumble {
            from { transform: rotate(-1deg) translateX(-1px); }
            to { transform: rotate(1deg) translateX(1px); }
        }
        @keyframes launch {
            to { transform: translateY(-120px) scale(0.8); opacity: 0; }
        }
    `;
    // Only append if not already present
    if (!document.getElementById("upload-animations")) {
        document.head.appendChild(styleSheet);
    }
}

export default UploadModal;
