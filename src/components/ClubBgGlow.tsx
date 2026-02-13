interface ClubBgGlowProps {
    color: string;
    height?: number;
    fadeStart?: number;
}

const ClubBgGlow = ({ color, height = 504, fadeStart = 40 }: ClubBgGlowProps) => (
    <div
        className="absolute top-0 left-0 right-0 z-0 pointer-events-none"
        style={{ height: `${height}px` }}
    >
        <div
            className="absolute inset-0 transition-colors duration-500 ease-out"
            style={{ backgroundColor: color }}
        />
        <div
            className="absolute inset-0"
            style={{
                background: `linear-gradient(to bottom, rgba(5,5,5,0) 0%, #050505 ${fadeStart}%)`,
            }}
        />
    </div>
);

export default ClubBgGlow;