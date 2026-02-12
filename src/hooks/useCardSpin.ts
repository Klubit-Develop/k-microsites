import { useRef, useCallback, useEffect } from 'react';

const FRICTION = 0.993;
const SWIPE_SENSITIVITY = 1.0;
const BASE_SPEED = 0.6;
const MIN_VELOCITY = 0.2;
const MAX_VELOCITY = 30;
const TAP_THRESHOLD_PX = 6;
const TAP_THRESHOLD_MS = 250;
const TAP_FLIP_VELOCITY = 12;

interface UseCardSpinOptions {
    baseSpeed?: number;
    friction?: number;
    maxVelocity?: number;
}

const useCardSpin = (options?: UseCardSpinOptions) => {
    const {
        baseSpeed = BASE_SPEED,
        friction = FRICTION,
        maxVelocity = MAX_VELOCITY,
    } = options || {};

    const rotation = useRef(0);
    const velocity = useRef(baseSpeed);
    const isDragging = useRef(false);
    const lastPointerX = useRef(0);
    const lastMoveTime = useRef(0);
    const swipeVelocity = useRef(0);
    const animFrame = useRef<number>(0);
    const cardInnerRef = useRef<HTMLDivElement | null>(null);
    const shimmerFrontRef = useRef<HTMLDivElement | null>(null);
    const shimmerBackRef = useRef<HTMLDivElement | null>(null);
    const tapStart = useRef({ x: 0, y: 0, time: 0 });
    const wasDraggedRef = useRef(false);

    const animate = useCallback(() => {
        if (!isDragging.current) {
            if (Math.abs(velocity.current) > MIN_VELOCITY + 0.05) {
                velocity.current *= friction;
            } else {
                velocity.current += (baseSpeed - velocity.current) * 0.008;
            }
        }

        rotation.current += velocity.current;

        if (cardInnerRef.current) {
            cardInnerRef.current.style.transform = `rotateY(${rotation.current}deg)`;
        }

        const shimmerX = ((Math.sin((rotation.current / 180) * Math.PI) + 1) / 2) * 100;
        const shimmerCSS = `linear-gradient(105deg, transparent ${shimmerX - 25}%, rgba(255,255,255,0.07) ${shimmerX - 5}%, rgba(255,255,255,0.15) ${shimmerX}%, rgba(255,255,255,0.07) ${shimmerX + 5}%, transparent ${shimmerX + 25}%)`;

        if (shimmerFrontRef.current) shimmerFrontRef.current.style.background = shimmerCSS;
        if (shimmerBackRef.current) shimmerBackRef.current.style.background = shimmerCSS;

        animFrame.current = requestAnimationFrame(animate);
    }, [baseSpeed, friction]);

    useEffect(() => {
        animFrame.current = requestAnimationFrame(animate);
        return () => {
            if (animFrame.current) cancelAnimationFrame(animFrame.current);
        };
    }, [animate]);

    const onPointerDown = useCallback((e: React.PointerEvent) => {
        isDragging.current = true;
        wasDraggedRef.current = false;
        lastPointerX.current = e.clientX;
        lastMoveTime.current = performance.now();
        swipeVelocity.current = 0;
        velocity.current *= 0.5;
        tapStart.current = { x: e.clientX, y: e.clientY, time: performance.now() };
        e.currentTarget.setPointerCapture(e.pointerId);
    }, []);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging.current) return;
        const now = performance.now();
        const dx = e.clientX - lastPointerX.current;
        const dt = Math.max(now - lastMoveTime.current, 1);
        swipeVelocity.current = (dx / dt) * 16 * SWIPE_SENSITIVITY;
        rotation.current += dx * 0.6;
        velocity.current = dx * 0.6;
        lastPointerX.current = e.clientX;
        lastMoveTime.current = now;

        if (Math.abs(e.clientX - tapStart.current.x) > TAP_THRESHOLD_PX ||
            Math.abs(e.clientY - tapStart.current.y) > TAP_THRESHOLD_PX) {
            wasDraggedRef.current = true;
        }
    }, []);

    const onPointerUp = useCallback((e: React.PointerEvent) => {
        if (!isDragging.current) return;
        isDragging.current = false;

        const dx = Math.abs(e.clientX - tapStart.current.x);
        const dy = Math.abs(e.clientY - tapStart.current.y);
        const dt = performance.now() - tapStart.current.time;

        if (dx < TAP_THRESHOLD_PX && dy < TAP_THRESHOLD_PX && dt < TAP_THRESHOLD_MS) {
            velocity.current = TAP_FLIP_VELOCITY;
            return;
        }

        const flick = Math.max(-maxVelocity, Math.min(maxVelocity, swipeVelocity.current));
        if (Math.abs(flick) > 0.5) velocity.current = flick;
    }, [maxVelocity]);

    const onPointerCancel = useCallback(() => {
        isDragging.current = false;
    }, []);

    const wasDragged = useCallback(() => wasDraggedRef.current, []);

    return {
        cardInnerRef,
        shimmerFrontRef,
        shimmerBackRef,
        handlers: {
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onPointerCancel,
        },
        wasDragged,
    };
};

export default useCardSpin;