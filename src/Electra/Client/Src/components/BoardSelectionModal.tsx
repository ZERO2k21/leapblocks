/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import { X, ArrowRight } from 'lucide-react';
import { useForgeStore } from '../../utlis/store/useForgeStore';
import './BoardSelectionModal.css';

interface BoardSelectionModalProps {
    onSelect: (board: 'arduino-uno' | 'esp32-c3') => void;
    onClose: () => void;
}

export const BoardSelectionModal: React.FC<BoardSelectionModalProps> = ({ onSelect, onClose }) => {
    const uiTheme = useForgeStore(state => state.uiTheme);
    const ArduinoUnoPreview = 'leap-arduino-uno' as any;
    const Esp32C3Preview = 'leap-esp32-c3' as any;

    return (
        <div className={`board-selection-overlay theme-${uiTheme}`}>
            <div className="board-selection-modal">
                {/* Floating Close Button */}
                <button className="board-modal-close-btn" onClick={onClose} aria-label="Close modal">
                    <X size={18} />
                </button>

                {/* Header */}
                <div className="board-modal-header">
                    <h1 className="board-modal-title">Choose Your Board</h1>
                    <p className="board-modal-subtitle">Select a microcontroller to start your simulation</p>
                </div>

                {/* Board Options */}
                <div className="board-options">
                    {/* Arduino Uno */}
                    <div
                        className="board-card arduino-card"
                        onClick={() => onSelect('arduino-uno')}
                    >
                        <div className="board-card-preview-container">
                            <div className="board-card-hardware-wrapper">
                                <ArduinoUnoPreview className="board-preview-hardware" />
                            </div>
                        </div>
                        <div className="board-card-content">
                            <h2 className="board-card-title">Arduino Uno</h2>
                            <p className="board-card-description">
                                Classic AVR microcontroller perfect for learning electronics and embedded programming.
                            </p>
                            <div className="board-features">
                                <span className="board-feature-tag">ATmega328P</span>
                                <span className="board-feature-tag">14 Digital I/O</span>
                                <span className="board-feature-tag">6 Analog Inputs</span>
                            </div>
                            <div className="board-action-row">
                                <span className="board-action-text">Start Simulation</span>
                                <ArrowRight size={16} className="board-action-arrow" />
                            </div>
                        </div>
                    </div>

                    {/* ESP32-C3 */}
                    <div
                        className="board-card esp32-card"
                        onClick={() => onSelect('esp32-c3')}
                    >
                        <div className="board-card-preview-container">
                            <div className="board-card-hardware-wrapper">
                                <Esp32C3Preview className="board-preview-hardware" />
                            </div>
                        </div>
                        <div className="board-card-content">
                            <h2 className="board-card-title">ESP32-C3</h2>
                            <p className="board-card-description">
                                Modern RISC-V microcontroller with built-in WiFi and Bluetooth for IoT projects.
                            </p>
                            <div className="board-features">
                                <span className="board-feature-tag">RISC-V 32-bit</span>
                                <span className="board-feature-tag">WiFi & BLE 5.0</span>
                                <span className="board-feature-tag">22 GPIO Pins</span>
                            </div>
                            <div className="board-action-row">
                                <span className="board-action-text">Start Simulation</span>
                                <ArrowRight size={16} className="board-action-arrow" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


