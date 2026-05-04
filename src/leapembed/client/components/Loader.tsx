/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';

const Loader: React.FC = () => (
    <>
        <style>{`
      .leapblocks-loader-root {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: #f8fafc;
      }

      .leapblocks-loader-container {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .leapblocks-loader {
        position: relative;
        width: 200px;
        height: 200px;
        perspective: 800px;
      }

      .leapblocks-loader .crystal {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 60px;
        height: 60px;
        opacity: 0;
        transform-origin: bottom center;
        transform: translate(-50%, -50%) rotateX(45deg) rotateZ(0deg);
        animation: leapblocks-spin 4s linear infinite, leapblocks-emerge 2s ease-in-out infinite alternate, leapblocks-fadeIn 0.3s ease-out forwards;
        border-radius: 10px;
        visibility: hidden;
      }

      @keyframes leapblocks-spin {
        from { transform: translate(-50%, -50%) rotateX(45deg) rotateZ(0deg); }
        to { transform: translate(-50%, -50%) rotateX(45deg) rotateZ(360deg); }
      }

      @keyframes leapblocks-emerge {
        0%, 100% {
          transform: translate(-50%, -50%) scale(0.5);
          opacity: 0;
        }
        50% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }
      }

      @keyframes leapblocks-fadeIn {
        to {
          visibility: visible;
          opacity: 0.8;
        }
      }

      .leapblocks-loader .crystal:nth-child(1) {
        background: linear-gradient(45deg, #003366, #336699);
        animation-delay: 0s;
      }
      .leapblocks-loader .crystal:nth-child(2) {
        background: linear-gradient(45deg, #003399, #3366cc);
        animation-delay: 0.3s;
      }
      .leapblocks-loader .crystal:nth-child(3) {
        background: linear-gradient(45deg, #0066cc, #3399ff);
        animation-delay: 0.6s;
      }
      .leapblocks-loader .crystal:nth-child(4) {
        background: linear-gradient(45deg, #0099ff, #66ccff);
        animation-delay: 0.9s;
      }
      .leapblocks-loader .crystal:nth-child(5) {
        background: linear-gradient(45deg, #33ccff, #99ccff);
        animation-delay: 1.2s;
      }
      .leapblocks-loader .crystal:nth-child(6) {
        background: linear-gradient(45deg, #66ffff, #ccffff);
        animation-delay: 1.5s;
      }

      .leapblocks-loader-text {
        margin-top: 24px;
        text-align: center;
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        color: #1e293b;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        font-size: 0.95rem;
      }
    `}</style>

        <div className="leapblocks-loader-root">
            <div className="leapblocks-loader-container">
                <div>
                    <div className="leapblocks-loader">
                        <div className="crystal" />
                        <div className="crystal" />
                        <div className="crystal" />
                        <div className="crystal" />
                        <div className="crystal" />
                        <div className="crystal" />
                    </div>
                    <div className="leapblocks-loader-text">Loading LeapBlocks...</div>
                </div>
            </div>
        </div>
    </>
);

export default Loader;
