'use client';

import { useState, useRef, useEffect, TouchEvent } from 'react';
import Image from 'next/image';

interface PinchZoomImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  overlay?: React.ReactNode;
  onClick?: () => void;
}

export default function PinchZoomImage({
  src,
  alt,
  width,
  height,
  className = '',
  style,
  priority = false,
  overlay,
  onClick
}: PinchZoomImageProps) {
  const [scale, setScale] = useState(1);
  const [isZooming, setIsZooming] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialDistanceRef = useRef<number>(0);
  const initialScaleRef = useRef<number>(1);

  // Calculate distance between two touch points
  const getDistance = (touch1: React.Touch, touch2: React.Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    // Only process if we have exactly 2 fingers (pinch gesture)
    if (e.touches.length === 2) {
      e.preventDefault(); // Prevent default zoom behavior
      setIsZooming(true);
      initialDistanceRef.current = getDistance(e.touches[0], e.touches[1]);
      initialScaleRef.current = scale;
    }
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && isZooming) {
      e.preventDefault();

      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const distanceChange = currentDistance / initialDistanceRef.current;

      // Calculate new scale based on initial scale and distance change
      let newScale = initialScaleRef.current * distanceChange;

      // Clamp scale between 1 (original size) and 3 (3x zoom)
      newScale = Math.max(1, Math.min(3, newScale));

      setScale(newScale);
    }
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    // Reset zoom when user lifts fingers
    if (e.touches.length < 2) {
      setIsZooming(false);

      // Smooth transition back to original size
      setScale(1);
      initialScaleRef.current = 1;
    }
  };

  // Reset scale if source changes
  useEffect(() => {
    setScale(1);
    setIsZooming(false);
    initialScaleRef.current = 1;
  }, [src]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        WebkitTapHighlightColor: onClick ? 'transparent' : undefined,
        touchAction: 'none', // Prevent default touch actions
        userSelect: 'none'
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          transition: isZooming ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform'
        }}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={className}
          style={style}
          priority={priority}
        />
      </div>
      {overlay && (
        <div className="absolute inset-0 pointer-events-none">
          {overlay}
        </div>
      )}
    </div>
  );
}
