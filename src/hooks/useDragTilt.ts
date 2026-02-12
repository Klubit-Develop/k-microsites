import { useRef, useCallback, useState, useEffect } from 'react';

interface DragTiltOptions {
    maxRotation?: number;
    sensitivity?: number;
    springDuration?: number;
}

interface DragTiltResult {
    ref: React.RefObject<HTMLDivElement | null>;
    style: React.CSSProperties;
    handlers: {
        onPointerDown: (e: React.PointerEvent) => void;
        onPointerMove: (e: React.PointerEvent) => void;
        onPointerUp: (e: React.PointerEvent) => void;
        onPointerLeave: (e: React.PointerEvent) => void;
    };
}

const useDragTilt = ({
    maxRotation = 15,
    sensitivity = 0.15,
    springDuration = 400,
}: DragTiltOptions = {}): DragTiltResult => {
    const ref = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const [rotation, setRotation] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const clamp = (value: number, min: number, max: number) =>
        Math.min(Math.max(value, min), max);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        isDragging.current = true;
        startX.current = e.clientX;
        setIsAnimating(false);
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    }, []);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging.current) return;
        const deltaX = e.clientX - startX.current;
        const rotateY = clamp(deltaX * sensitivity, -maxRotation, maxRotation);
        setRotation(rotateY);
    }, [maxRotation, sensitivity]);

    const release = useCallback(() => {
        if (!isDragging.current) return;
        isDragging.current = false;
        setIsAnimating(true);
        setRotation(0);
    }, []);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
        release();
    }, [release]);

    const handlePointerLeave = useCallback(() => {
        release();
    }, [release]);

    useEffect(() => {
        if (!isAnimating) return;
        const timer = setTimeout(() => setIsAnimating(false), springDuration);
        return () => clearTimeout(timer);
    }, [isAnimating, springDuration]);

    const style: React.CSSProperties = {
        transform: `perspective(800px) rotateY(${rotation}deg)`,
        transition: isAnimating
            ? `transform ${springDuration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`
            : 'none',
        willChange: 'transform',
        touchAction: 'pan-y',
    };

    return {
        ref,
        style,
        handlers: {
            onPointerDown: handlePointerDown,
            onPointerMove: handlePointerMove,
            onPointerUp: handlePointerUp,
            onPointerLeave: handlePointerLeave,
        },
    };
};

export default useDragTilt;