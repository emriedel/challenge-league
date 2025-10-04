'use client';

import { useState, useRef, useEffect, TouchEvent } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';

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
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialDistanceRef = useRef<number>(0);
  const initialScaleRef = useRef<number>(1);
  const initialCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialTranslateRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate distance between two touch points
  const getDistance = (touch1: React.Touch, touch2: React.Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Calculate center point between two touches
  const getCenter = (touch1: React.Touch, touch2: React.Touch): { x: number; y: number } => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    // Only process if we have exactly 2 fingers (pinch gesture)
    if (e.touches.length === 2) {
      e.preventDefault(); // Prevent default zoom behavior
      e.stopPropagation(); // Stop event from bubbling
      setIsZooming(true);

      // Freeze the page scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';

      initialDistanceRef.current = getDistance(e.touches[0], e.touches[1]);
      initialScaleRef.current = scale;
      initialCenterRef.current = getCenter(e.touches[0], e.touches[1]);
      initialTranslateRef.current = { x: translateX, y: translateY };
    }
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && isZooming) {
      e.preventDefault();
      e.stopPropagation();

      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const currentCenter = getCenter(e.touches[0], e.touches[1]);
      const distanceChange = currentDistance / initialDistanceRef.current;

      // Calculate new scale based on initial scale and distance change
      let newScale = initialScaleRef.current * distanceChange;

      // Clamp scale between 1 (original size) and 3 (3x zoom)
      newScale = Math.max(1, Math.min(3, newScale));

      // Calculate translation based on finger movement
      const deltaX = currentCenter.x - initialCenterRef.current.x;
      const deltaY = currentCenter.y - initialCenterRef.current.y;

      setScale(newScale);
      setTranslateX(initialTranslateRef.current.x + deltaX);
      setTranslateY(initialTranslateRef.current.y + deltaY);
    }
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    // Reset zoom when user lifts fingers
    if (e.touches.length < 2) {
      setIsZooming(false);

      // Unfreeze the page scroll
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';

      // Smooth transition back to original size and position
      setScale(1);
      setTranslateX(0);
      setTranslateY(0);
      initialScaleRef.current = 1;
    }
  };

  // Reset scale if source changes
  useEffect(() => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
    setIsZooming(false);
    initialScaleRef.current = 1;
  }, [src]);

  const zoomedContent = isZooming && scale > 1 && mounted ? (
    createPortal(
      <>
        {/* Backdrop overlay */}
        <div
          className="fixed inset-0 bg-black/40 pointer-events-none"
          style={{
            zIndex: 9998,
            transition: 'opacity 0.2s ease-out'
          }}
        />

        {/* Zoomed image */}
        <div
          className="fixed inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 9999 }}
        >
          <div
            style={{
              transform: `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`,
              transformOrigin: 'center center',
              transition: 'none',
              willChange: 'transform',
              width: containerRef.current?.offsetWidth || width,
              maxWidth: '100vw'
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
        </div>
      </>,
      document.body
    )
  ) : null;

  return (
    <>
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
          touchAction: isZooming ? 'none' : 'pan-y', // Allow scrolling unless actively zooming
          userSelect: 'none',
          opacity: isZooming && scale > 1 ? 0 : 1,
          transition: isZooming ? 'none' : 'opacity 0.2s ease-out',
          WebkitOverflowScrolling: 'touch'
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
        {overlay && !isZooming && (
          <div className="absolute inset-0 pointer-events-none">
            {overlay}
          </div>
        )}
      </div>

      {zoomedContent}
    </>
  );
}
