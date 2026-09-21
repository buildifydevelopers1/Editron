import { useEffect, useState, RefObject } from 'react';
import { AspectRatio } from '../types';

export interface ViewportRect {
  width: number;
  height: number;
  letterboxTop: number;
  letterboxLeft: number;
  targetAspectRatio: number;
}

export function parseAspectRatio(ar: AspectRatio): number {
  switch (ar) {
    case '9:16':
      return 9 / 16;
    case '1:1':
      return 1;
    case '4:5':
      return 4 / 5;
    case '2.39:1':
      return 2.39;
    case '16:9':
    default:
      return 16 / 9;
  }
}

/**
 * useVideoViewport:
 * Precision bounding-box calculator for video monitor viewports.
 * Computes exact letterbox/pillarbox dimensions so video content is NEVER
 * cropped or distorted, maintaining 100% frame fidelity in standard, theater,
 * or native fullscreen modes.
 */
export function useVideoViewport(
  containerRef: RefObject<HTMLDivElement | null>,
  aspectRatio: AspectRatio
): ViewportRect {
  const targetAR = parseAspectRatio(aspectRatio);

  const [rect, setRect] = useState<ViewportRect>({
    width: 640,
    height: 360,
    letterboxTop: 0,
    letterboxLeft: 0,
    targetAspectRatio: targetAR,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const compute = () => {
      const containerWidth = el.clientWidth;
      const containerHeight = el.clientHeight;

      if (containerWidth <= 0 || containerHeight <= 0) return;

      // Allow 8px safety padding around borders
      const availableW = Math.max(120, containerWidth - 16);
      const availableH = Math.max(120, containerHeight - 16);

      const containerAR = availableW / availableH;
      let finalW = availableW;
      let finalH = availableH;

      if (containerAR > targetAR) {
        // Container is wider than target aspect ratio -> Pillarbox left/right
        finalH = Math.floor(availableH);
        finalW = Math.floor(finalH * targetAR);
      } else {
        // Container is taller than target aspect ratio -> Letterbox top/bottom
        finalW = Math.floor(availableW);
        finalH = Math.floor(finalW / targetAR);
      }

      const top = Math.max(0, Math.floor((containerHeight - finalH) / 2));
      const left = Math.max(0, Math.floor((containerWidth - finalW) / 2));

      setRect({
        width: finalW,
        height: finalH,
        letterboxTop: top,
        letterboxLeft: left,
        targetAspectRatio: targetAR,
      });
    };

    compute();

    const observer = new ResizeObserver(() => {
      compute();
    });

    observer.observe(el);

    // Also listen to window resize and fullscreenchange
    window.addEventListener('resize', compute);
    document.addEventListener('fullscreenchange', compute);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', compute);
      document.removeEventListener('fullscreenchange', compute);
    };
  }, [containerRef, aspectRatio, targetAR]);

  return rect;
}
