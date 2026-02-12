import { useRef, useCallback, useState, useEffect } from 'react';

interface DragTiltOptions {
    maxRotation?: number;
    sensitivity?: number;
    springDuration?: number;
    dragThreshold?: number;
    axis?: 'horizontal' | 'vertical' | 'both';
    fullSpin?: boolean;
    momentumDecay?: number;
    snapBack?: boolean;
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
    fullSpin = false,
    momentumDecay = 0.95,
    snapBack = true,
}: DragTiltOptions = {}): DragTiltResult => {
    const elementRef = useRef<HTMLDivElement | null>(null);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const startY = useRef(0);
    const lastX = useRef(0);
    const lastY = useRef(0);
    const velocityX = useRef(0);
    const velocityY = useRef(0);
    const dragDistance = useRef(0);
    const wasDraggedRef = useRef(false);
    const animationFrame = useRef<number>(0);
    const baseRotationY = useRef(0);
    const baseRotationX = useRef(0);
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

    useEffect(() => {
        return () => {
            if (animationFrame.current) {
                cancelAnimationFrame(animationFrame.current);
            }
        };
    }, []);

    const startMomentum = useCallback(() => {
        const decay = momentumDecay;
        const tick = () => {
            let vx = velocityX.current;
            let vy = velocityY.current;

            if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1) {
                velocityX.current = 0;
                velocityY.current = 0;

                if (snapBack) {
                    setIsAnimating(true);
                    setRotationY(0);
                    setRotationX(0);
                    baseRotationY.current = 0;
                    baseRotationX.current = 0;
                }
                return;
            }

            vx *= decay;
            vy *= decay;
            velocityX.current = vx;
            velocityY.current = vy;

            baseRotationY.current += vx;
            baseRotationX.current += vy;

            setRotationY(baseRotationY.current);
            setRotationX(baseRotationX.current);

            animationFrame.current = requestAnimationFrame(tick);
        };

        animationFrame.current = requestAnimationFrame(tick);
    }, [momentumDecay, snapBack]);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (animationFrame.current) {
            cancelAnimationFrame(animationFrame.current);
        }

        isDragging.current = true;
        startX.current = e.clientX;
        startY.current = e.clientY;
        lastX.current = e.clientX;
        lastY.current = e.clientY;
        velocityX.current = 0;
        velocityY.current = 0;
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

        const frameVx = (e.clientX - lastX.current) * sensitivity;
        const frameVy = -(e.clientY - lastY.current) * sensitivity;
        lastX.current = e.clientX;
        lastY.current = e.clientY;

        velocityX.current = frameVx;
        velocityY.current = frameVy;

        if (fullSpin) {
            if (axis === 'horizontal' || axis === 'both') {
                baseRotationY.current += frameVx;
                setRotationY(baseRotationY.current);
            }
            if (axis === 'vertical' || axis === 'both') {
                baseRotationX.current += frameVy;
                setRotationX(baseRotationX.current);
            }
        } else {
            if (axis === 'horizontal' || axis === 'both') {
                setRotationY(clamp(deltaX * sensitivity, -maxRotation, maxRotation));
            }
            if (axis === 'vertical' || axis === 'both') {
                setRotationX(clamp(-deltaY * sensitivity, -maxRotation, maxRotation));
            }
        }
    }, [maxRotation, sensitivity, dragThreshold, axis, fullSpin]);

    const release = useCallback((e?: React.PointerEvent) => {
        if (!isDragging.current) return;
        isDragging.current = false;
        if (e) {
            (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        }

        if (fullSpin) {
            startMomentum();
        } else {
            setIsAnimating(true);
            setRotationY(0);
            setRotationX(0);
        }
    }, [fullSpin, startMomentum]);

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