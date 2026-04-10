import React from 'react';
import '../styles/juniorExtensionLibrary.css';

export default function JuniorExtensionLibrary({ onClose, onSelectExtension }) {
    const extensions = [
        {
            id: 'face_detection',
            name: 'Face Detection',
            description: 'Detect and recognize human face',
            image: 'assets/extensions/face_detection.png', // We'll add a generic background color if image isn't available
            color: '#EFEFEF', // Placeholder color if no image
            bannerColor: '#fbeb21'
        },
        {
            id: 'hand_pose',
            name: 'Hand Pose Detection',
            description: 'Identify hand gestures',
            image: 'assets/extensions/hand_pose.png',
            color: '#EFEFEF',
            bannerColor: '#282759'
        }
    ];

    return (
        <div className="jel-modal-overlay">
            <div className="jel-header">
                <button className="jel-back-btn" onClick={onClose}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    Back
                </button>
                <div className="jel-title">Choose an Extension</div>
            </div>

            <div className="jel-controls-bar">
                <div className="jel-search-container">
                    <svg className="jel-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input type="text" className="jel-search-input" placeholder="Search" />
                </div>
                <button className="jel-docs-btn">Read Documentation</button>
            </div>

            <div className="jel-content">
                <div className="jel-grid">
                    {extensions.map(ext => (
                        <div key={ext.id} className="jel-card" onClick={() => onSelectExtension(ext.id)}>
                            <div className="jel-card-banner" style={{ backgroundColor: ext.bannerColor }}>
                                {/* Try to load an image or fallback to a styled banner */}
                                <div className="jel-banner-icon-container">
                                    {ext.id === 'face_detection' ? (
                                        <div className="jel-icon-overlay" style={{ backgroundColor: '#0FBD8C' }}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                <circle cx="8.5" cy="8.5" r="1.5" fill="white"></circle>
                                                <circle cx="15.5" cy="8.5" r="1.5" fill="white"></circle>
                                                <path d="M12 11V15"></path>
                                                <path d="M8 17H16"></path>
                                            </svg>
                                        </div>
                                    ) : (
                                        <div className="jel-icon-overlay" style={{ backgroundColor: '#0FBD8C' }}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                                <path d="M18 11V6a2 2 0 0 0-4 0v5"></path>
                                                <path d="M14 11V4a2 2 0 0 0-4 0v7"></path>
                                                <path d="M10 11V5a2 2 0 0 0-4 0v6"></path>
                                                <path d="M6 13V9a2 2 0 0 0-4 0v9a8 8 0 0 0 8 8h2a8 8 0 0 0 8-8V15a2 2 0 0 0-4 0v-2"></path>
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="jel-card-info">
                                <h3 className="jel-card-title">{ext.name}</h3>
                                <p className="jel-card-desc">{ext.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
