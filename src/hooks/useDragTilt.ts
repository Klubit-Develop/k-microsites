import { useRef, useCallback, useState, useEffect } from 'react';

interface DragTiltOptions {
    maxRotation?: number;
    sensitivity?: number;
    springDuration?: number;
    dragThreshold?: number;
    axis?: 'horizontal' | 'vertical' | 'both';
    fullSpin?: boolean;
    momentumDecay?: number;
    maxVelocity?: number;
    velocitySmoothing?: number;
}

interface DragTiltResult {
    ref: React.RefObject<HTMLDivElement | null>;
    containerStyle: React.CSSProperties;
    frontStyle: React.CSSProperties;
    backStyle: React.CSSProperties;
    isFrontFace: boolean;
    handlers: {
        onPointerDown: (e: React.PointerEvent) => void;
        onPointerMove: (e: React.PointerEvent) => void;
        onPointerUp: (e: React.PointerEvent) => void;
        onPointerLeave: (e: React.PointerEvent) => void;
    };
    wasDragged: () => boolean;
}

const normalizeAngle = (angle: number): number => {
    const mod = ((angle % 360) + 360) % 360;
    return mod;
};

const useDragTilt = ({
    maxRotation = 15,
    sensitivity = 0.15,
    springDuration = 400,
    dragThreshold = 6,
    axis = 'both',
    fullSpin = false,
    momentumDecay = 0.92,
    maxVelocity = 12,
    velocitySmoothing = 0.4,
}: DragTiltOptions = {}): DragTiltResult => {
    const elementRef = useRef<HTMLDivElement | null>(null);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const startY = useRef(0);
    const lastX = useRef(0);
    const lastY = useRef(0);
    const lastTime = useRef(0);
    const velocityX = useRef(0);
    const velocityY = useRef(0);
    const smoothVelocityX = useRef(0);
    const smoothVelocityY = useRef(0);
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

    const getSnapTarget = (angle: number): number => {
        const normalized = normalizeAngle(angle);
        const fullTurns = Math.round(angle / 360) * 360;

        if (normalized <= 90) return fullTurns;
        if (normalized <= 270) return fullTurns + 180;
        return fullTurns + 360;
    };

    const isFront = (yDeg: number, xDeg: number): boolean => {
        const ny = normalizeAngle(yDeg);
        const nx = normalizeAngle(xDeg);
        const yBack = ny > 90 && ny < 270;
        const xBack = nx > 90 && nx < 270;
        return !(yBack !== xBack);
    };

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

    const snapToFace = useCallback(() => {
        const targetY = (axis === 'horizontal' || axis === 'both')
            ? getSnapTarget(baseRotationY.current)
            : 0;
        const targetX = (axis === 'vertical' || axis === 'both')
            ? getSnapTarget(baseRotationX.current)
            : 0;

        baseRotationY.current = targetY;
        baseRotationX.current = targetX;

        setIsAnimating(true);
        setRotationY(targetY);
        setRotationX(targetX);
    }, [axis]);

    const startMomentum = useCallback(() => {
        const tick = () => {
            let vx = velocityX.current;
            let vy = velocityY.current;

            if (Math.abs(vx) < 0.3 && Math.abs(vy) < 0.3) {
                velocityX.current = 0;
                velocityY.current = 0;
                snapToFace();
                return;
            }

            vx *= momentumDecay;
            vy *= momentumDecay;
            velocityX.current = vx;
            velocityY.current = vy;

            if (axis === 'horizontal' || axis === 'both') {
                baseRotationY.current += vx;
            }
            if (axis === 'vertical' || axis === 'both') {
                baseRotationX.current += vy;
            }

            setRotationY(baseRotationY.current);
            setRotationX(baseRotationX.current);

            animationFrame.current = requestAnimationFrame(tick);
        };

        animationFrame.current = requestAnimationFrame(tick);
    }, [momentumDecay, axis, snapToFace]);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (animationFrame.current) {
            cancelAnimationFrame(animationFrame.current);
        }

        isDragging.current = true;
        startX.current = e.clientX;
        startY.current = e.clientY;
        lastX.current = e.clientX;
        lastY.current = e.clientY;
        lastTime.current = performance.now();
        velocityX.current = 0;
        velocityY.current = 0;
        smoothVelocityX.current = 0;
        smoothVelocityY.current = 0;
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

        const now = performance.now();
        const dt = now - lastTime.current;

        if (dt < 1) return;

        const timeFactor = Math.min(dt / 16, 2.5);

        const rawVx = ((e.clientX - lastX.current) / timeFactor) * sensitivity;
        const rawVy = (-(e.clientY - lastY.current) / timeFactor) * sensitivity;

        lastX.current = e.clientX;
        lastY.current = e.clientY;
        lastTime.current = now;

        const clampedVx = clamp(rawVx, -maxVelocity, maxVelocity);
        const clampedVy = clamp(rawVy, -maxVelocity, maxVelocity);

        smoothVelocityX.current += (clampedVx - smoothVelocityX.current) * velocitySmoothing;
        smoothVelocityY.current += (clampedVy - smoothVelocityY.current) * velocitySmoothing;

        velocityX.current = smoothVelocityX.current;
        velocityY.current = smoothVelocityY.current;

        if (fullSpin) {
            if (axis === 'horizontal' || axis === 'both') {
                baseRotationY.current += smoothVelocityX.current * timeFactor;
                setRotationY(baseRotationY.current);
            }
            if (axis === 'vertical' || axis === 'both') {
                baseRotationX.current += smoothVelocityY.current * timeFactor;
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
    }, [maxRotation, sensitivity, dragThreshold, axis, fullSpin, maxVelocity, velocitySmoothing]);

    const release = useCallback((e?: React.PointerEvent) => {
        if (!isDragging.current) return;
        isDragging.current = false;
        if (e) {
            (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        }

        if (fullSpin) {
            const hasVelocity = Math.abs(velocityX.current) > 0.5 || Math.abs(velocityY.current) > 0.5;
            if (hasVelocity) {
                startMomentum();
            } else {
                snapToFace();
            }
        } else {
            setIsAnimating(true);
            setRotationY(0);
            setRotationX(0);
        }
    }, [fullSpin, startMomentum, snapToFace]);

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

    const isFrontFace = isFront(rotationY, rotationX);

    const containerStyle: React.CSSProperties = {
        perspective: '800px',
        touchAction: 'none',
    };

    const sharedTransform = `rotateY(${rotationY}deg) rotateX(${rotationX}deg)`;
    const sharedTransition = isAnimating
        ? `transform ${springDuration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`
        : 'none';

    const frontStyle: React.CSSProperties = {
        transform: sharedTransform,
        transition: sharedTransition,
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
    };

    const backStyle: React.CSSProperties = {
        transform: `${sharedTransform} rotateY(180deg)`,
        transition: sharedTransition,
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        position: 'absolute',
        inset: 0,
    };

    const wasDragged = useCallback(() => wasDraggedRef.current, []);

    return {
        ref: elementRef,
        containerStyle,
        frontStyle,
        backStyle,
        isFrontFace,
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