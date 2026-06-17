/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { HTMLAttributes } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'leap-led': HTMLAttributes<HTMLElement> & {
        color?: string;
        value?: boolean;
        brightness?: number;
        label?: string;
        flip?: boolean;
      };
      'leap-arduino-uno': HTMLAttributes<HTMLElement>;
      'leap-pushbutton': HTMLAttributes<HTMLElement> & {
        color?: string;
        pressed?: boolean;
        label?: string;
      };
      'leap-resistor': HTMLAttributes<HTMLElement> & {
        value?: string;
        label?: string;
      };
      'leap-neo-pixel': HTMLAttributes<HTMLElement> & {
        color?: string;
      };
      'leap-neo-pixel-matrix': HTMLAttributes<HTMLElement> & {
        rows?: number;
        cols?: number;
        data?: string;
      };
      'leap-ili9341-touch': HTMLAttributes<HTMLElement> & {
        imageData?: ImageData | null;
        flipHorizontal?: boolean;
        flipVertical?: boolean;
        rotation?: number;
      };
      // Add all other Leap/Leap elements as needed
      [elemName: string]: any;
    }
  }
}
