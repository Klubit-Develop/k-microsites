import { useRef, useCallback, useState, useEffect } from 'react';
import { useDrag } from '@use-gesture/react';

interface DragTiltOptions {
    maxRotation?: number;
    sensitivity?: number;
    springDuration?: number;
    dragThreshold?: number;
    axis?: 'horizontal' | 'vertical' | 'both';
    fullSpin?: boolean;
    momentumDecay?: number;
}

const normalizeAngle = (angle: number): number => {
    return ((angle % 360) + 360) % 360;
};

const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

const useDragTilt = ({
    maxRotation = 15,
    sensitivity = 0.15,
    springDuration = 400,
    dragThreshold = 6,
    axis = 'both',
    fullSpin = false,
    momentumDecay = 0.92,
}: DragTiltOptions = {}) => {
    const elementRef = useRef<HTMLDivElement | null>(null);
    const wasDraggedRef = useRef(false);
    const animationFrame = useRef<number>(0);
    const baseRotationY = useRef(0);
    const baseRotationX = useRef(0);
    const momentumVx = useRef(0);
    const momentumVy = useRef(0);
    const [rotationY, setRotationY] = useState(0);
    const [rotationX, setRotationX] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

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
        let vx = clamp(momentumVx.current, -15, 15);
        let vy = clamp(momentumVy.current, -15, 15);

        const tick = () => {
            if (Math.abs(vx) < 0.3 && Math.abs(vy) < 0.3) {
                snapToFace();
                return;
            }

            vx *= momentumDecay;
            vy *= momentumDecay;

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

    const bind = useDrag(
        ({ movement: [mx, my], velocity: [vx, vy], direction: [dirX, dirY], distance: [distX, distY], active, first, memo }) => {
            if (first) {
                if (animationFrame.current) {
                    cancelAnimationFrame(animationFrame.current);
                }
                wasDraggedRef.current = false;
                setIsAnimating(false);
                return [baseRotationY.current, baseRotationX.current];
            }

            const [savedBaseY, savedBaseX] = (memo as [number, number]) ?? [baseRotationY.current, baseRotationX.current];
            const totalDistance = Math.hypot(distX, distY);

            if (totalDistance > dragThreshold) {
                wasDraggedRef.current = true;
            }

            if (active) {
                if (fullSpin) {
                    if (axis === 'horizontal' || axis === 'both') {
                        setRotationY(savedBaseY + mx * sensitivity);
                    }
                    if (axis === 'vertical' || axis === 'both') {
                        setRotationX(savedBaseX + -my * sensitivity);
                    }
                } else {
                    if (axis === 'horizontal' || axis === 'both') {
                        setRotationY(clamp(mx * sensitivity, -maxRotation, maxRotation));
                    }
                    if (axis === 'vertical' || axis === 'both') {
                        setRotationX(clamp(-my * sensitivity, -maxRotation, maxRotation));
                    }
                }
            } else {
                if (fullSpin) {
                    if (axis === 'horizontal' || axis === 'both') {
                        baseRotationY.current = savedBaseY + mx * sensitivity;
                    }
                    if (axis === 'vertical' || axis === 'both') {
                        baseRotationX.current = savedBaseX + -my * sensitivity;
                    }

                    momentumVx.current = vx * dirX * sensitivity * 16;
                    momentumVy.current = -vy * dirY * sensitivity * 16;

                    const hasVelocity = vx > 0.1 || vy > 0.1;
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
            }

            return memo;
        },
        {
            pointer: { capture: true, touch: true },
            threshold: 0,
            filterTaps: true,
        }
    );

    useEffect(() => {
        if (!isAnimating) return;
        const timer = setTimeout(() => setIsAnimating(false), springDuration);
        return () => clearTimeout(timer);
    }, [isAnimating, springDuration]);

    useEffect(() => {
        const el = elementRef.current;
        if (!el) return;

        const preventScroll = (e: TouchEvent) => {
            if (wasDraggedRef.current) {
                e.preventDefault();
            }
        };

        el.addEventListener('touchmove', preventScroll, { passive: false });
        return () => el.removeEventListener('touchmove', preventScroll);
    }, []);

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
        handlers: bind(),
        wasDragged,
    };
};

export default useDragTilt;