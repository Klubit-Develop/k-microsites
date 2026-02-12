import { useRef, useCallback, useState, useEffect } from 'react';

interface DragTiltOptions {
    maxRotation?: number;
    sensitivity?: number;
    springDuration?: number;
    dragThreshold?: number;
}

interface DragTiltResult {
    style: React.CSSProperties;
    handlers: {
        onPointerDown: (e: React.PointerEvent) => void;
        onPointerMove: (e: React.PointerEvent) => void;
        onPointerUp: (e: React.PointerEvent) => void;
        onPointerLeave: (e: React.PointerEvent) => void;
    };
    wasDragged: () => boolean;
}

const useDragTilt = ({
    maxRotation = 15,
    sensitivity = 0.15,
    springDuration = 400,
    dragThreshold = 6,
}: DragTiltOptions = {}): DragTiltResult => {
    const isDragging = useRef(false);
    const startX = useRef(0);
    const dragDistance = useRef(0);
    const wasDraggedRef = useRef(false);
    const [rotation, setRotation] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const clamp = (value: number, min: number, max: number) =>
        Math.min(Math.max(value, min), max);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        isDragging.current = true;
        startX.current = e.clientX;
        dragDistance.current = 0;
        wasDraggedRef.current = false;
        setIsAnimating(false);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }, []);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging.current) return;
        const deltaX = e.clientX - startX.current;
        dragDistance.current = Math.abs(deltaX);
        if (dragDistance.current > dragThreshold) {
            wasDraggedRef.current = true;
        }
        const rotateY = clamp(deltaX * sensitivity, -maxRotation, maxRotation);
        setRotation(rotateY);
    }, [maxRotation, sensitivity, dragThreshold]);

    const release = useCallback((e?: React.PointerEvent) => {
        if (!isDragging.current) return;
        isDragging.current = false;
        if (e) {
            (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        }
        setIsAnimating(true);
        setRotation(0);
    }, []);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        release(e);
    }, [release]);

    const handlePointerLeave = useCallback((e: React.PointerEvent) => {
        release(e);
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

    const wasDragged = useCallback(() => wasDraggedRef.current, []);

    return {
        style,
        handlers: {
            onPointerDown: handlePointerDown,
            onPointerMove: handlePointerMove,
            onPointerUp: handlePointerUp,
            onPointerLeave: handlePointerLeave,
        },
        wasDragged,
    };
};

export default useDragTilt;