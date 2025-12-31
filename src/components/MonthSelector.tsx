import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';

interface MonthSelectorProps {
    date: string;
    onPrevious: () => void;
    onNext: () => void;
    isPreviousDisabled?: boolean;
    className?: string;
}

const MonthSelector = ({
    date,
    onPrevious,
    onNext,
    isPreviousDisabled = false,
    className = '',
}: MonthSelectorProps) => {
    return (
        <div className={`flex gap-1.5 items-center justify-center w-full ${className}`}>
            <button
                onClick={onPrevious}
                disabled={isPreviousDisabled}
                className={`
                    flex items-center justify-center w-[100px] h-[36px] rounded-lg transition-colors
                    ${isPreviousDisabled
                        ? 'bg-[#1a1a1a] cursor-not-allowed'
                        : 'bg-[#232323] cursor-pointer hover:bg-[#2a2a2a] active:bg-[#1a1a1a]'
                    }
                `}
            >
                <ChevronLeftIcon />
            </button>

            <span className="flex-1 text-[#f6f6f6] text-[16px] font-medium leading-normal text-center font-helvetica">
                {date}
            </span>

            <button
                onClick={onNext}
                className="flex items-center justify-center w-[100px] h-[36px] bg-[#232323] rounded-lg cursor-pointer transition-colors hover:bg-[#2a2a2a] active:bg-[#1a1a1a]"
            >
                <ChevronRightIcon />
            </button>
        </div>
    );
};

export default MonthSelector;