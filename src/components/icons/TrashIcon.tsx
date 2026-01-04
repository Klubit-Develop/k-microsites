const Icon = ({ width = 92, height = 120 }) => (
    <svg width={width} height={height} viewBox="0 0 92 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 30H84V108C84 114.627 78.627 120 72 120H20C13.373 120 8 114.627 8 108V30Z" fill="url(#trash-body)" />
        <path d="M0 24C0 20.686 2.686 18 6 18H86C89.314 18 92 20.686 92 24V30H0V24Z" fill="url(#trash-lid)" />
        <path d="M32 0H60C63.314 0 66 2.686 66 6V18H26V6C26 2.686 28.686 0 32 0Z" fill="url(#trash-handle)" />
        <path d="M24 42V108" stroke="#999" strokeWidth="4" strokeLinecap="round" />
        <path d="M46 42V108" stroke="#999" strokeWidth="4" strokeLinecap="round" />
        <path d="M68 42V108" stroke="#999" strokeWidth="4" strokeLinecap="round" />
        <defs>
            <linearGradient id="trash-body" x1="46" y1="30" x2="46" y2="120" gradientUnits="userSpaceOnUse">
                <stop stopColor="#B8B8B8" />
                <stop offset="1" stopColor="#6B6B6B" />
            </linearGradient>
            <linearGradient id="trash-lid" x1="46" y1="18" x2="46" y2="30" gradientUnits="userSpaceOnUse">
                <stop stopColor="#D4D4D4" />
                <stop offset="1" stopColor="#A0A0A0" />
            </linearGradient>
            <linearGradient id="trash-handle" x1="46" y1="0" x2="46" y2="18" gradientUnits="userSpaceOnUse">
                <stop stopColor="#C8C8C8" />
                <stop offset="1" stopColor="#909090" />
            </linearGradient>
        </defs>
    </svg>
);

export default Icon;