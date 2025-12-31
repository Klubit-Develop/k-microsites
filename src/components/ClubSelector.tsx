interface Club {
    id: string;
    name: string;
    slug: string;
    logo: string;
    venueType: string;
}

interface ClubSelectorProps {
    clubs: Club[];
    selectedClub: Club | null;
    onSelectClub: (club: Club) => void;
    isLoading?: boolean;
    isOpen?: boolean;
    onToggle?: () => void;
}

const VENUE_TYPE_MAP: Record<string, string> = {
    CLUB: 'Club',
    DISCO: 'Discoteca',
    BAR: 'Bar',
    LOUNGE: 'Lounge',
    PUB: 'Pub',
};

// Up/Down arrows icon
const UpDownArrowsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M10 4L13 8H7L10 4Z"
            fill="#939393"
        />
        <path
            d="M10 16L7 12H13L10 16Z"
            fill="#939393"
        />
    </svg>
);

const ClubSelector = ({
    clubs,
    selectedClub,
    onSelectClub,
    isLoading = false,
    isOpen = false,
    onToggle,
}: ClubSelectorProps) => {
    if (isLoading) {
        return (
            <div className="flex items-center justify-between px-[16px] py-[12px] bg-[#141414] border-[1.5px] border-[#232323] rounded-[12px] w-full animate-pulse">
                <div className="flex gap-[12px] items-center">
                    <div className="w-[30px] h-[30px] rounded-full bg-[#232323]" />
                    <div className="h-4 w-32 bg-[#232323] rounded" />
                </div>
                <div className="w-[20px] h-[20px] bg-[#232323] rounded" />
            </div>
        );
    }

    return (
        <div className="relative w-full">
            <button
                onClick={onToggle}
                className="flex items-center justify-between px-[16px] py-[12px] bg-[#141414] border-[1.5px] border-[#232323] rounded-[12px] w-full cursor-pointer transition-colors hover:bg-[#1a1a1a]"
            >
                {selectedClub ? (
                    <div className="flex gap-[12px] items-center rounded-[16px]">
                        {/* Club logo */}
                        <div className="relative w-[30px] h-[30px] shrink-0">
                            {selectedClub.logo ? (
                                <img
                                    src={selectedClub.logo}
                                    alt={selectedClub.name}
                                    className="w-full h-full object-cover rounded-full border border-[#232323] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.5)]"
                                />
                            ) : (
                                <div className="w-full h-full rounded-full bg-[#033f3e] border border-[#232323] flex items-center justify-center shadow-[0px_0px_10px_0px_rgba(0,0,0,0.5)]">
                                    <span className="text-[#f6f6f6] text-[10px] font-bold">
                                        {selectedClub.name.charAt(0)}
                                    </span>
                                </div>
                            )}
                        </div>
                        {/* Club info */}
                        <div className="flex gap-[4px] items-center">
                            <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica truncate">
                                {selectedClub.name}
                            </span>
                            <div className="w-[3px] h-[3px] bg-[#939393] rounded-full shrink-0" />
                            <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                                {VENUE_TYPE_MAP[selectedClub.venueType] || selectedClub.venueType}
                            </span>
                        </div>
                    </div>
                ) : (
                    <span className="text-[#939393] text-[16px] font-normal font-helvetica">
                        Selecciona un club
                    </span>
                )}
                <UpDownArrowsIcon />
            </button>

            {/* Dropdown menu */}
            {isOpen && clubs.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-[4px] bg-[#141414] border-[1.5px] border-[#232323] rounded-[12px] overflow-hidden z-50 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)]">
                    {clubs.map((club) => (
                        <button
                            key={club.id}
                            onClick={() => {
                                onSelectClub(club);
                                onToggle?.();
                            }}
                            className={`
                                flex gap-[12px] items-center px-[16px] py-[12px] w-full cursor-pointer transition-colors hover:bg-[#1a1a1a]
                                ${selectedClub?.id === club.id ? 'bg-[#1a1a1a]' : ''}
                            `}
                        >
                            {/* Club logo */}
                            <div className="relative w-[30px] h-[30px] shrink-0">
                                {club.logo ? (
                                    <img
                                        src={club.logo}
                                        alt={club.name}
                                        className="w-full h-full object-cover rounded-full border border-[#232323] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.5)]"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-[#033f3e] border border-[#232323] flex items-center justify-center shadow-[0px_0px_10px_0px_rgba(0,0,0,0.5)]">
                                        <span className="text-[#f6f6f6] text-[10px] font-bold">
                                            {club.name.charAt(0)}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {/* Club info */}
                            <div className="flex gap-[4px] items-center">
                                <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica truncate">
                                    {club.name}
                                </span>
                                <div className="w-[3px] h-[3px] bg-[#939393] rounded-full shrink-0" />
                                <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                                    {VENUE_TYPE_MAP[club.venueType] || club.venueType}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClubSelector;
export type { Club };