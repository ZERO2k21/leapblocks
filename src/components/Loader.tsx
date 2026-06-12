/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';

const Loader: React.FC = () => (
    <>
        <style>{`
      .leaplab-loader-root {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        z-index: 9999;
      }

      .leaplab-loader-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 32px;
      }

      .leaplab-loader-spinner {
        position: relative;
        width: 80px;
        height: 80px;
      }

      .leaplab-loader-ring {
        position: absolute;
        width: 100%;
        height: 100%;
        border: 3px solid transparent;
        border-radius: 50%;
        animation: leaplab-spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
      }

      .leaplab-loader-ring:nth-child(1) {
        border-top-color: #0a015a;
        animation-delay: -0.45s;
      }

      .leaplab-loader-ring:nth-child(2) {
        width: 60px;
        height: 60px;
        top: 10px;
        left: 10px;
        border-top-color: #6366f1;
        animation-delay: -0.3s;
      }

      .leaplab-loader-ring:nth-child(3) {
        width: 40px;
        height: 40px;
        top: 20px;
        left: 20px;
        border-top-color: #a855f7;
        animation-delay: -0.15s;
      }

      @keyframes leaplab-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .leaplab-loader-text {
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
        font-size: 1.1rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        background: linear-gradient(90deg, #0a015a 0%, #6366f1 50%, #a855f7 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .leaplab-loader-dots {
        display: flex;
        gap: 6px;
      }

      .leaplab-loader-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #6366f1;
        animation: leaplab-pulse 1.4s ease-in-out infinite;
      }

      .leaplab-loader-dot:nth-child(2) {
        animation-delay: 0.2s;
      }

      .leaplab-loader-dot:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes leaplab-pulse {
        0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
        40% { transform: scale(1); opacity: 1; }
      }
    `}</style>

        <div className="leaplab-loader-root">
            <div className="leaplab-loader-wrapper">
                <div className="leaplab-loader-spinner">
                    <div className="leaplab-loader-ring" />
                    <div className="leaplab-loader-ring" />
                    <div className="leaplab-loader-ring" />
                </div>
                <div className="leaplab-loader-text">Loading LeapLab</div>
                <div className="leaplab-loader-dots">
                    <div className="leaplab-loader-dot" />
                    <div className="leaplab-loader-dot" />
                    <div className="leaplab-loader-dot" />
                </div>
            </div>
        </div>
    </>
);

export default Loader;
