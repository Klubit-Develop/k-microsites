import { useRef, useCallback, useState, useEffect } from 'react';

interface DragTiltOptions {
    maxRotation?: number;
    sensitivity?: number;
    springDuration?: number;
    dragThreshold?: number;
    axis?: 'horizontal' | 'vertical' | 'both';
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
    wasDragged: () => boolean;
}

const useDragTilt = ({
    maxRotation = 15,
    sensitivity = 0.15,
    springDuration = 400,
    dragThreshold = 6,
    axis = 'both',
}: DragTiltOptions = {}): DragTiltResult => {
    const elementRef = useRef<HTMLDivElement | null>(null);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const startY = useRef(0);
    const dragDistance = useRef(0);
    const wasDraggedRef = useRef(false);
    const [rotationY, setRotationY] = useState(0);
    const [rotationX, setRotationX] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const clamp = (value: number, min: number, max: number) =>
        Math.min(Math.max(value, min), max);

    useEffect(() => {
        const el = elementRef.current;
        if (!el) return;

        const preventScroll = (e: TouchEvent) => {
            if (isDragging.current) {
                e.preventDefault();
            }
        };

        el.addEventListener('touchmove', preventScroll, { passive: false });
        return () => el.removeEventListener('touchmove', preventScroll);
    }, []);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        isDragging.current = true;
        startX.current = e.clientX;
        startY.current = e.clientY;
        dragDistance.current = 0;
        wasDraggedRef.current = false;
        setIsAnimating(false);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }, []);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging.current) return;

        const deltaX = e.clientX - startX.current;
        const deltaY = e.clientY - startY.current;
        dragDistance.current = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (dragDistance.current > dragThreshold) {
            wasDraggedRef.current = true;
        }

        if (axis === 'horizontal' || axis === 'both') {
            setRotationY(clamp(deltaX * sensitivity, -maxRotation, maxRotation));
        }
        if (axis === 'vertical' || axis === 'both') {
            setRotationX(clamp(-deltaY * sensitivity, -maxRotation, maxRotation));
        }
    }, [maxRotation, sensitivity, dragThreshold, axis]);

    const release = useCallback((e?: React.PointerEvent) => {
        if (!isDragging.current) return;
        isDragging.current = false;
        if (e) {
            (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        }
        setIsAnimating(true);
        setRotationY(0);
        setRotationX(0);
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
        transform: `perspective(800px) rotateY(${rotationY}deg) rotateX(${rotationX}deg)`,
        transition: isAnimating
            ? `transform ${springDuration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`
            : 'none',
        willChange: 'transform',
        touchAction: 'none',
    };

    const wasDragged = useCallback(() => wasDraggedRef.current, []);

    return {
        ref: elementRef,
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