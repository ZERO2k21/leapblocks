/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import { Cpu, Wifi, Zap, ArrowRight } from 'lucide-react';
import './BoardSelectionModal.css';

interface BoardSelectionModalProps {
    onSelect: (board: 'arduino-uno' | 'esp32-c3') => void;
    onClose: () => void;
}

export const BoardSelectionModal: React.FC<BoardSelectionModalProps> = ({ onSelect, onClose }) => {
    return (
        <div className="board-selection-overlay">
            <div className="board-selection-modal">
                {/* Header */}
                <div className="board-modal-header">
                    <div className="board-modal-icon">
                        <Zap size={32} strokeWidth={2.5} />
                    </div>
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
                        <div className="board-card-glow arduino-glow"></div>
                        <div className="board-card-content">
                            <div className="board-icon-wrapper arduino-icon">
                                <Cpu size={48} strokeWidth={2} />
                            </div>
                            <h2 className="board-card-title">Arduino Uno</h2>
                            <p className="board-card-description">
                                Classic AVR microcontroller perfect for learning electronics and embedded programming
                            </p>
                            <div className="board-features">
                                <div className="board-feature">
                                    <div className="feature-dot arduino-dot"></div>
                                    <span>ATmega328P Processor</span>
                                </div>
                                <div className="board-feature">
                                    <div className="feature-dot arduino-dot"></div>
                                    <span>14 Digital I/O Pins</span>
                                </div>
                                <div className="board-feature">
                                    <div className="feature-dot arduino-dot"></div>
                                    <span>6 Analog Inputs</span>
                                </div>
                            </div>
                            <button className="board-select-btn arduino-btn">
                                <span>Start Simulation</span>
                                <ArrowRight size={18} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>

                    {/* ESP32-C3 */}
                    <div
                        className="board-card esp32-card"
                        onClick={() => onSelect('esp32-c3')}
                    >
                        <div className="board-card-glow esp32-glow"></div>
                        <div className="board-card-content">
                            <div className="board-icon-wrapper esp32-icon">
                                <Wifi size={48} strokeWidth={2} />
                            </div>
                            <h2 className="board-card-title">ESP32-C3</h2>
                            <p className="board-card-description">
                                Modern RISC-V microcontroller with built-in WiFi and Bluetooth for IoT projects
                            </p>
                            <div className="board-features">
                                <div className="board-feature">
                                    <div className="feature-dot esp32-dot"></div>
                                    <span>RISC-V 32-bit Processor</span>
                                </div>
                                <div className="board-feature">
                                    <div className="feature-dot esp32-dot"></div>
                                    <span>WiFi & Bluetooth 5.0</span>
                                </div>
                                <div className="board-feature">
                                    <div className="feature-dot esp32-dot"></div>
                                    <span>22 GPIO Pins</span>
                                </div>
                            </div>
                            <button className="board-select-btn esp32-btn">
                                <span>Start Simulation</span>
                                <ArrowRight size={18} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Close button */}
                <button className="board-modal-close" onClick={onClose}>
                    Cancel
                </button>
            </div>
        </div>
    );
};
