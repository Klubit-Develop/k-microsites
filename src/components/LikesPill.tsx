import { useTranslation } from 'react-i18next';
import { DislikeIcon } from '@/components/icons';

interface LikesPillProps {
    count: number;
    isLiked?: boolean;
    onClick?: () => void;
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
}

export const LikesPill = ({
    count,
    isLiked = false,
    onClick,
    isLoading = false,
    disabled = false,
    className = '',
}: LikesPillProps) => {
    const { t } = useTranslation();
    
    const label = count === 1 ? t('club.like') : t('club.likes');

    if (isLoading) {
        return (
            <div className={`
                inline-flex items-center justify-center
                px-2 py-1.5
                bg-[#141414]
                border-[1.5px] border-[#232323]
                rounded-[25px]
                shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]
                animate-pulse
                ${className}
            `}>
                <div className="w-[26px] h-[30px] flex items-center justify-center">
                    <div className="w-5 h-5 bg-[#232323] rounded" />
                </div>
                <div className="pl-1 pr-1.5 h-[30px] flex items-center">
                    <div className="w-16 h-4 bg-[#232323] rounded" />
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            className={`
                inline-flex items-center justify-center
                px-2 py-1.5
                bg-[#141414]
                border-[1.5px] border-[#232323]
                rounded-[25px]
                shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]
                transition-all duration-200
                ${disabled 
                    ? 'cursor-default opacity-70' 
                    : 'cursor-pointer hover:bg-[#1a1a1a] active:scale-95'
                }
                ${className}
            `}
        >
            <div className="flex items-center justify-center w-[26px] h-[30px]">
                <DislikeIcon size={22} isActive={isLiked} />
            </div>
            <div className="flex items-center justify-center pl-1 pr-1.5 h-[30px]">
                <span className="text-[#f6f6f6] text-[16px] font-medium leading-none whitespace-nowrap font-helvetica">
                    {count} {label}
                </span>
            </div>
        </button>
    );
};

export default LikesPill;