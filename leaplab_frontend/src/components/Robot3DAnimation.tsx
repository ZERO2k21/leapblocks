/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * Robot3DAnimation.tsx — Video-based hero animation with orbiting cards.
 */

import React, { useEffect, useRef } from 'react';

const VIDEO_SRC = 'assets/90016cbb-797a-4bee-89e2-63d493380c8e-webm-alpha.webm';

interface Robot3DAnimationProps {
  onSelect?: (mode: string) => void;
}

const Robot3DAnimation: React.FC<Robot3DAnimationProps> = ({ onSelect }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <div className="robot-3d-container">
      <style>{`
        .robot-3d-container {
          width: 100%;
          height: 100%;
          min-height: 400px;
          max-height: 500px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: visible;
        }

        .robot-3d-wrapper {
          width: 100%;
          height: 100%;
          min-height: 400px;
          max-height: 500px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transform-style: preserve-3d;
          perspective: 1000px;
        }

        .robot-video-canvas {
          width: 100%;
          height: 100%;
          min-height: 400px;
          max-height: 450px;
          object-fit: contain;
          border-radius: 20px;
        }

      `}</style>

      <div className="robot-3d-wrapper">
        <video
          ref={videoRef}
          className="robot-video-canvas"
          src={VIDEO_SRC}
          autoPlay
          loop
          muted
          playsInline
        />
      </div>
    </div>
  );
};

export default Robot3DAnimation;
