interface Tab {
    key: string;
    label: string;
}

interface TabSelectorProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (key: string) => void;
    isLoading?: boolean;
    className?: string;
}

const TabSelector = ({
    tabs,
    activeTab,
    onTabChange,
    isLoading = false,
    className = '',
}: TabSelectorProps) => {
    if (isLoading) {
        return (
            <div className={`flex items-center p-[4px] bg-[#141414] border-[1.5px] border-[#232323] rounded-2xl w-full animate-pulse ${className}`}>
                {tabs.map((_, index) => (
                    <div
                        key={index}
                        className="flex-1 h-[36px] bg-[#232323] rounded-[12px] mx-1"
                    />
                ))}
            </div>
        );
    }

    return (
        <div className={`flex items-center p-[4px] bg-[#141414] border-[1.5px] border-[#232323] rounded-2xl w-full ${className}`}>
            {tabs.map(tab => (
                <button
                    key={tab.key}
                    onClick={() => onTabChange(tab.key)}
                    className={`
                        flex-1 flex items-center justify-center h-[36px] px-[8px] rounded-[12px] min-w-0
                        text-[14px] font-bold font-helvetica transition-colors whitespace-nowrap overflow-hidden text-ellipsis
                        ${activeTab === tab.key
                            ? 'bg-[#232323] text-[#f6f6f6]'
                            : 'text-[#939393]'
                        }
                    `}
                >
                    <span className="truncate">{tab.label}</span>
                </button>
            ))}
        </div>
    );
};

export default TabSelector;
export type { Tab };