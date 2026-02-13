import { useRef, useCallback, useEffect } from 'react';

const FRICTION = 0.993;
const SWIPE_SENSITIVITY = 1.0;
const BASE_SPEED = 0.6;
const MIN_VELOCITY = 0.2;
const MAX_VELOCITY = 30;
const TAP_THRESHOLD_PX = 6;
const TAP_THRESHOLD_MS = 250;

const EDGE_SLICES = 41;
const EDGE_DEPTH = 2;

type DragTiltMode = 'tilt' | 'spin';

interface DragTiltOptions {
    mode?: DragTiltMode;
    maxRotation?: number;
    sensitivity?: number;
    springDuration?: number;
    dragThreshold?: number;
    baseSpeed?: number;
    friction?: number;
    maxVelocity?: number;
    enableShadow?: boolean;
    enableShimmer?: boolean;
    enableWobble?: boolean;
    onTap?: () => void;
}

interface DragTiltResult {
    cardInnerRef: React.RefObject<HTMLDivElement | null>;
    shimmerFrontRef: React.RefObject<HTMLDivElement | null>;
    shimmerBackRef: React.RefObject<HTMLDivElement | null>;
    containerStyle: React.CSSProperties;
    edgeSlices: number[];
    handlers: {
        onPointerDown: (e: React.PointerEvent) => void;
        onPointerMove: (e: React.PointerEvent) => void;
        onPointerUp: (e: React.PointerEvent) => void;
        onPointerCancel: () => void;
    };
    wasDragged: () => boolean;
    resetRotation: () => void;
}

const useDragTilt = (options?: DragTiltOptions): DragTiltResult => {
    const {
        mode = 'spin',
        maxRotation = 18,
        sensitivity = 0.12,
        springDuration = 450,
        dragThreshold = TAP_THRESHOLD_PX,
        baseSpeed = BASE_SPEED,
        friction = FRICTION,
        maxVelocity = MAX_VELOCITY,
        enableShadow = true,
        enableShimmer = true,
        enableWobble = true,
        onTap,
    } = options || {};

    const cardInnerRef = useRef<HTMLDivElement | null>(null);
    const shimmerFrontRef = useRef<HTMLDivElement | null>(null);
    const shimmerBackRef = useRef<HTMLDivElement | null>(null);

    const rotation = useRef(0);
    const velocity = useRef(mode === 'spin' ? baseSpeed : 0);
    const isDragging = useRef(false);
    const lastPointerX = useRef(0);
    const lastMoveTime = useRef(0);
    const swipeVelocity = useRef(0);
    const animFrame = useRef<number>(0);
    const tapStart = useRef({ x: 0, y: 0, time: 0 });
    const wasDraggedRef = useRef(false);
    const onTapRef = useRef(onTap);
    const isSpringBack = useRef(false);
    const springStartTime = useRef(0);
    const springFrom = useRef(0);

    onTapRef.current = onTap;

    const edgeSlices = useRef<number[]>(
        Array.from({ length: EDGE_SLICES }, (_, i) => -EDGE_DEPTH + i * ((EDGE_DEPTH * 2) / (EDGE_SLICES - 1)))
    ).current;

    const applyVisualEffects = useCallback((deg: number) => {
        const el = cardInnerRef.current;
        if (!el) return;

        const norm = ((deg % 360) + 360) % 360;
        const rad = (norm / 180) * Math.PI;

        const wobbleX = enableWobble ? 2 + Math.sin(rad * 0.5) * 0.5 : 0;
        el.style.transform = `rotateY(${deg}deg) rotateX(${wobbleX}deg)`;

        if (enableShadow) {
            const edgeDir = Math.cos(rad);
            const shadowX = Math.round(edgeDir * -20);
            const shadowBlur = 35 + Math.round(Math.abs(Math.sin(rad)) * 15);
            el.style.boxShadow = `${shadowX}px 25px ${shadowBlur}px -5px rgba(0,0,0,0.55)`;
        }

        if (enableShimmer) {
            const shimmerX = ((Math.sin((deg / 180) * Math.PI) + 1) / 2) * 100;
            const shimmerCSS = `linear-gradient(105deg, transparent ${shimmerX - 25}%, rgba(255,255,255,0.07) ${shimmerX - 5}%, rgba(255,255,255,0.15) ${shimmerX}%, rgba(255,255,255,0.07) ${shimmerX + 5}%, transparent ${shimmerX + 25}%)`;
            if (shimmerFrontRef.current) shimmerFrontRef.current.style.background = shimmerCSS;
            if (shimmerBackRef.current) shimmerBackRef.current.style.background = shimmerCSS;
        }
    }, [enableShadow, enableShimmer, enableWobble]);

    const animateSpin = useCallback(() => {
        if (!isDragging.current) {
            if (Math.abs(velocity.current) > MIN_VELOCITY + 0.05) {
                velocity.current *= friction;
            } else {
                velocity.current += (baseSpeed - velocity.current) * 0.008;
            }
        }

        rotation.current += velocity.current;
        applyVisualEffects(rotation.current);
        animFrame.current = requestAnimationFrame(animateSpin);
    }, [friction, baseSpeed, applyVisualEffects]);

    const animateTilt = useCallback(() => {
        if (isSpringBack.current) {
            const elapsed = performance.now() - springStartTime.current;
            const progress = Math.min(elapsed / springDuration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            rotation.current = springFrom.current * (1 - eased);

            if (progress >= 1) {
                rotation.current = 0;
                isSpringBack.current = false;
            }
        }

        applyVisualEffects(rotation.current);
        animFrame.current = requestAnimationFrame(animateTilt);
    }, [springDuration, applyVisualEffects]);

    useEffect(() => {
        const animate = mode === 'spin' ? animateSpin : animateTilt;
        animFrame.current = requestAnimationFrame(animate);
        return () => {
            if (animFrame.current) cancelAnimationFrame(animFrame.current);
        };
    }, [mode, animateSpin, animateTilt]);

    const onPointerDown = useCallback((e: React.PointerEvent) => {
        isDragging.current = true;
        wasDraggedRef.current = false;
        isSpringBack.current = false;
        lastPointerX.current = e.clientX;
        lastMoveTime.current = performance.now();
        swipeVelocity.current = 0;
        tapStart.current = { x: e.clientX, y: e.clientY, time: performance.now() };

        if (mode === 'spin') {
            velocity.current *= 0.5;
        }

        e.currentTarget.setPointerCapture(e.pointerId);
    }, [mode]);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging.current) return;

        const now = performance.now();
        const dx = e.clientX - lastPointerX.current;
        const dt = Math.max(now - lastMoveTime.current, 1);

        if (Math.abs(e.clientX - tapStart.current.x) > dragThreshold ||
            Math.abs(e.clientY - tapStart.current.y) > dragThreshold) {
            wasDraggedRef.current = true;
        }

        if (mode === 'spin') {
            swipeVelocity.current = (dx / dt) * 16 * SWIPE_SENSITIVITY;
            rotation.current += dx * 0.6;
            velocity.current = dx * 0.6;
        } else {
            const totalDx = e.clientX - tapStart.current.x;
            const raw = totalDx * sensitivity;
            rotation.current = Math.max(-maxRotation, Math.min(maxRotation, raw));
        }

        lastPointerX.current = e.clientX;
        lastMoveTime.current = now;
    }, [mode, sensitivity, maxRotation, dragThreshold]);

    const onPointerUp = useCallback((e: React.PointerEvent) => {
        if (!isDragging.current) return;
        isDragging.current = false;

        const dx = Math.abs(e.clientX - tapStart.current.x);
        const dy = Math.abs(e.clientY - tapStart.current.y);
        const dt = performance.now() - tapStart.current.time;

        if (dx < dragThreshold && dy < dragThreshold && dt < TAP_THRESHOLD_MS) {
            if (mode === 'tilt') {
                rotation.current = 0;
                applyVisualEffects(0);
            }
            onTapRef.current?.();
            return;
        }

        if (mode === 'spin') {
            const flick = Math.max(-maxVelocity, Math.min(maxVelocity, swipeVelocity.current));
            if (Math.abs(flick) > 0.5) velocity.current = flick;
        } else {
            springFrom.current = rotation.current;
            springStartTime.current = performance.now();
            isSpringBack.current = true;
        }
    }, [mode, maxVelocity, dragThreshold, applyVisualEffects]);

    const onPointerCancel = useCallback(() => {
        isDragging.current = false;
        if (mode === 'tilt') {
            springFrom.current = rotation.current;
            springStartTime.current = performance.now();
            isSpringBack.current = true;
        }
    }, [mode]);

    const wasDragged = useCallback(() => wasDraggedRef.current, []);

    const resetRotation = useCallback(() => {
        rotation.current = 0;
        velocity.current = mode === 'spin' ? baseSpeed : 0;
        isSpringBack.current = false;
        applyVisualEffects(0);
    }, [mode, baseSpeed, applyVisualEffects]);

    const containerStyle: React.CSSProperties = {
        perspective: 1200,
        perspectiveOrigin: '50% 40%',
        touchAction: 'none',
    };

    return {
        cardInnerRef,
        shimmerFrontRef,
        shimmerBackRef,
        containerStyle,
        edgeSlices,
        handlers: {
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onPointerCancel,
        },
        wasDragged,
        resetRotation,
    };
};

export default useDragTilt;