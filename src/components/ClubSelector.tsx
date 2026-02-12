import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Modal from '@/components/ui/Modal';

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

const UpDownArrowsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 4L13 8H7L10 4Z" fill="#939393" />
        <path d="M10 16L7 12H13L10 16Z" fill="#939393" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="12" fill="#e5ff88" />
        <path d="M7.5 12L10.5 15L16.5 9" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const EmptyCircleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="#939393" strokeWidth="2" />
    </svg>
);

const ClubLogo = ({ club }: { club: Club }) => (
    <div className="relative w-[32px] h-[32px] shrink-0">
        {club.logo ? (
            <img
                src={club.logo}
                alt={club.name}
                className="w-full h-full object-cover rounded-full border-[1.5px] border-[#232323] shadow-[0px_0px_10.667px_0px_rgba(0,0,0,0.5)]"
            />
        ) : (
            <div className="w-full h-full rounded-full bg-[#323232] border-[1.5px] border-[#232323] flex items-center justify-center shadow-[0px_0px_10.667px_0px_rgba(0,0,0,0.5)]">
                <span className="text-[#939393] text-[10px] font-bold">
                    {club.name.charAt(0).toUpperCase()}
                </span>
            </div>
        )}
    </div>
);

const ClubInfo = ({ club }: { club: Club }) => {
    const venueLabel = VENUE_TYPE_MAP[club.venueType] || club.venueType;
    return (
        <div className="flex gap-[4px] items-center min-w-0">
            <span className="text-[#f6f6f6] text-[16px] font-medium font-borna leading-[24px] truncate">
                {club.name}
            </span>
            <div className="w-[3px] h-[3px] bg-[#939393] rounded-full shrink-0" />
            <span className="text-[#939393] text-[14px] font-normal font-borna leading-[20px] whitespace-nowrap">
                {venueLabel}
            </span>
        </div>
    );
};

const ClubSelector = ({
    clubs,
    selectedClub,
    onSelectClub,
    isLoading = false,
    isOpen = false,
    onToggle,
}: ClubSelectorProps) => {
    const { t } = useTranslation();
    const [tempSelected, setTempSelected] = useState<Club | null>(selectedClub);

    useEffect(() => {
        if (isOpen) {
            setTempSelected(selectedClub);
        }
    }, [isOpen, selectedClub]);

    const handleConfirm = () => {
        if (tempSelected) {
            onSelectClub(tempSelected);
            onToggle?.();
        }
    };

    const handleClose = () => {
        onToggle?.();
    };

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
        <>
            <button
                onClick={onToggle}
                className="flex items-center justify-between px-[16px] py-[12px] bg-[#141414] border-[1.5px] border-[#232323] rounded-[12px] w-full cursor-pointer transition-colors hover:bg-[#1a1a1a]"
            >
                {selectedClub ? (
                    <div className="flex gap-[8px] items-center min-w-0">
                        <ClubLogo club={selectedClub} />
                        <ClubInfo club={selectedClub} />
                    </div>
                ) : (
                    <span className="text-[#939393] text-[16px] font-normal font-borna">
                        {clubs.length > 0 ? 'Selecciona un club' : 'Sin clubs'}
                    </span>
                )}
                <UpDownArrowsIcon />
            </button>

            <Modal isOpen={isOpen} onClose={handleClose}>
                <div className="flex flex-col gap-[24px] items-center w-full">
                    <div className="flex flex-col items-start w-full">
                        <div className="flex items-start justify-end w-full">
                            <button
                                onClick={handleClose}
                                className="flex items-center justify-center w-[36px] h-[36px] bg-[#232323] rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] cursor-pointer"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18" stroke="#F6F6F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M6 6L18 18" stroke="#F6F6F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex flex-col gap-[16px] items-center pt-[16px] px-[24px] w-full">
                            <h2 className="text-[#f6f6f6] text-[20px] font-semibold font-borna text-center w-full">
                                {t('rrpp.clubs_title', 'Klubs en los que trabaja')}
                            </h2>
                        </div>
                    </div>

                    <div className="relative flex flex-col gap-[8px] items-start max-h-[300px] overflow-y-auto overflow-x-hidden pb-[54px] w-full">
                        {clubs.map((club) => {
                            const isSelected = tempSelected?.id === club.id;
                            return (
                                <button
                                    key={club.id}
                                    onClick={() => setTempSelected(club)}
                                    className={`flex items-center justify-between p-[12px] rounded-[16px] w-full cursor-pointer transition-all duration-150 ${
                                        isSelected
                                            ? 'bg-[#141414] border-2 border-[#e5ff88]'
                                            : 'bg-[#141414] border-2 border-[#232323]'
                                    }`}
                                >
                                    <div className="flex gap-[8px] items-center min-w-0">
                                        <ClubLogo club={club} />
                                        <ClubInfo club={club} />
                                    </div>
                                    <div className="shrink-0 ml-[8px]">
                                        {isSelected ? <CheckCircleIcon /> : <EmptyCircleIcon />}
                                    </div>
                                </button>
                            );
                        })}

                        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[54px] bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={!tempSelected}
                        className="w-full h-[48px] bg-[#ff336d] text-[#f6f6f6] text-[16px] font-semibold font-borna rounded-[12px] flex items-center justify-center cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t('common.select', 'Seleccionar')}
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default ClubSelector;
export type { Club };