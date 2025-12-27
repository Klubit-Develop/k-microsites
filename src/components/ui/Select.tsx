import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    label?: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    error?: string;
    disabled?: boolean;
    className?: string;
}

const Select = ({
    label,
    placeholder = 'Selecciona...',
    value,
    onChange,
    options,
    error,
    disabled = false,
    className = ''
}: SelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getBorderColor = () => {
        if (error) return 'border-[#FF2323]';
        return 'border-[#232323]';
    };

    const getContainerBgColor = () => {
        if (error) return 'bg-[rgba(255,35,35,0.05)]';
        return 'bg-transparent';
    };

    return (
        <div className={`flex flex-col gap-1 w-full ${className}`} ref={selectRef}>
            {/* Label */}
            {label && (
                <div className="flex items-center px-1.5">
                    <span className="font-helvetica text-sm font-normal text-[#939393] leading-none">
                        {label}
                    </span>
                </div>
            )}

            {/* Select Button */}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`
                        w-full h-12 px-4 py-3
                        flex items-center justify-between gap-6
                        border-[1.5px] border-solid rounded-xl
                        ${getBorderColor()}
                        ${getContainerBgColor()}
                        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                        transition-colors
                    `}
                >
                    <span
                        className={`
                            flex-1 text-left
                            font-helvetica font-medium text-base
                            ${selectedOption ? 'text-[#F6F6F6]' : 'text-[#939393]'}
                            overflow-ellipsis overflow-hidden whitespace-nowrap
                        `}
                    >
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>

                    <ChevronDown
                        className={`
                            shrink-0 size-5 text-[#939393]
                            transition-transform duration-200
                            ${isOpen ? 'rotate-180' : ''}
                        `}
                        strokeWidth={1.5}
                    />
                </button>

                {/* Dropdown */}
                {isOpen && (
                    <div className="absolute z-20 w-full mt-1 bg-[#1A1A1A] rounded-xl shadow-lg max-h-60 overflow-auto border border-[#232323]">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`
                                    w-full flex items-center px-4 py-3
                                    font-helvetica font-medium text-base text-left
                                    hover:bg-[#232323] transition-colors
                                    ${option.value === value ? 'text-[#FF336D] bg-[#2A1A1F]' : 'text-[#F6F6F6]'}
                                `}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="flex items-center px-1.5 py-0.5">
                    <span className="font-helvetica font-medium text-xs text-[#FF2323] leading-none">
                        {error}
                    </span>
                </div>
            )}
        </div>
    );
};

export default Select;