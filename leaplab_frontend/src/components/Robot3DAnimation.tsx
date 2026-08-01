/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * Robot3DAnimation.tsx — Video-based hero animation with multi-browser (Safari/Chrome/Edge) support.
 * Configured as a pure background animation with all media controls, miniplayer overlays, and PiP disabled.
 */

import React, { useEffect, useRef } from 'react';

const WEBM_SRC = 'assets/90016cbb-797a-4bee-89e2-63d493380c8e-webm-alpha.webm';
const MP4_SRC = 'assets/Create_animation_video_white_bac._202607151022.mp4';

interface Robot3DAnimationProps {
  onSelect?: (mode: string) => void;
}

const Robot3DAnimation: React.FC<Robot3DAnimationProps> = ({ onSelect }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Strict WebKit/Chromium attribute enforcement for autoplay & control hiding
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.disablePictureInPicture = true;
    
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('muted', '');
    video.setAttribute('autoplay', '');
    video.setAttribute('disablepictureinpicture', 'true');
    video.setAttribute('disableremoteplayback', 'true');
    video.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback');

    const playVideo = () => {
      video.play().catch((err) => {
        console.warn('[Robot3DAnimation] Autoplay restricted or failed, attaching touch fallback:', err);
        const handleInteraction = () => {
          video.play().catch(() => {});
          window.removeEventListener('touchstart', handleInteraction);
          window.removeEventListener('click', handleInteraction);
        };
        window.addEventListener('touchstart', handleInteraction, { once: true });
        window.addEventListener('click', handleInteraction, { once: true });
      });
    };

    if (video.readyState >= 2) {
      playVideo();
    } else {
      video.addEventListener('canplay', playVideo, { once: true });
      video.addEventListener('loadeddata', playVideo, { once: true });
    }
  }, []);

  return (
    <div className="robot-3d-container">
      <style>{`
        .robot-3d-container {
          width: 100%;
          height: 100%;
          min-height: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: visible;
        }

        .robot-3d-wrapper {
          width: 100%;
          height: 100%;
          min-height: 0;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transform-style: preserve-3d;
          perspective: 1000px;
        }

        /* Prevent browser video overlays, miniplayer buttons, & hover controls in Edge/Chrome */
        .robot-video-canvas {
          width: 100%;
          height: 100%;
          min-height: 0;
          max-height: 100%;
          object-fit: contain;
          border-radius: 20px;
          pointer-events: none !important;
          user-select: none !important;
          -webkit-user-select: none !important;
          -webkit-touch-callout: none !important;
        }

        /* Hide all WebKit media controls, overflow buttons, & Picture-in-Picture popups */
        .robot-video-canvas::-webkit-media-controls {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
        }
        .robot-video-canvas::-webkit-media-controls-enclosure {
          display: none !important;
        }
        .robot-video-canvas::-webkit-media-controls-panel {
          display: none !important;
        }
        .robot-video-canvas::-webkit-media-controls-overlay-play-button {
          display: none !important;
        }
        .robot-video-canvas::-webkit-media-controls-play-button {
          display: none !important;
        }
        .robot-video-canvas::-webkit-media-controls-start-playback-button {
          display: none !important;
        }
        .robot-video-canvas::-internal-media-controls-overflow-button {
          display: none !important;
        }
        .robot-video-canvas::-internal-media-controls-picture-in-picture-button {
          display: none !important;
        }

        @media (min-width: 1025px) {
          .robot-3d-container { min-height: 400px; max-height: 500px; }
          .robot-3d-wrapper { min-height: 400px; max-height: 500px; }
          .robot-video-canvas { min-height: 400px; max-height: 450px; }
        }
      `}</style>

      <div className="robot-3d-wrapper">
        <video
          ref={videoRef}
          className="robot-video-canvas"
          autoPlay
          loop
          muted
          playsInline
          poster="assets/video_frames/frame_01.png"
          // @ts-ignore WebKit attribute for legacy Safari
          webkit-playsinline=""
          // @ts-ignore Mobile WebKit attribute
          x5-playsinline=""
          // @ts-ignore Mobile WebKit attribute
          x5-video-player-type="h5"
          // @ts-ignore Mobile WebKit attribute
          x5-video-player-inline="true"
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback={true}
          controlsList="nodownload nofullscreen noremoteplayback"
          onContextMenu={(e) => e.preventDefault()}
        >
          <source src={WEBM_SRC} type="video/webm" />
          <source src={MP4_SRC} type="video/mp4" />
        </video>
      </div>
    </div>
  );
};

export default Robot3DAnimation;
