import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Country {
    code: string;
    phone: string;
    label_es: string;
    label_en: string;
    phoneLength?: number;
    phoneFormat?: number[];
}

interface InputTextPhoneProps {
    label?: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    country: string;
    onCountryChange: (countryCode: string) => void;
    countries: Country[];
    language?: 'es' | 'en';
    disabled?: boolean;
}

const InputTextPhone = ({
    label = 'Teléfono*',
    placeholder = 'Teléfono',
    value,
    onChange,
    error,
    country,
    onCountryChange,
    countries,
    language = 'es',
    disabled = false
}: InputTextPhoneProps) => {
    const [isCountryOpen, setIsCountryOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedCountry = countries.find((c) => c.phone === country);

    const variant: 'empty' | 'filled' | 'error' = error
        ? 'error'
        : value
            ? 'filled'
            : 'empty';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsCountryOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getBorderColor = () => {
        if (variant === 'error') return 'border-[#FF2323]';
        return 'border-[#232323]';
    };

    const getInputBgColor = () => {
        if (variant === 'error') return 'bg-[rgba(255,35,35,0.05)]';
        return 'bg-transparent';
    };

    return (
        <div className="flex flex-col gap-1 w-full">
            {/* Label */}
            <div className="flex items-center px-1.5">
                <span className="font-helvetica text-sm font-normal text-[#939393] leading-none">
                    {label}
                </span>
            </div>

            {/* Input Container */}
            <div className={`flex gap-1.5 w-full ${getInputBgColor()}`}>
                {/* Country Selector */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => !disabled && setIsCountryOpen(!isCountryOpen)}
                        disabled={disabled}
                        className={`
                            flex items-center gap-1 h-12 px-3.5 
                            border-[1.5px] border-solid rounded-xl
                            ${getBorderColor()}
                            bg-transparent
                            transition-colors
                            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                        `}
                    >
                        {selectedCountry && (
                            <img
                                loading="lazy"
                                width="24"
                                height="18"
                                srcSet={`https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png 2x`}
                                src={`https://flagcdn.com/w20/${selectedCountry.code.toLowerCase()}.png`}
                                alt={selectedCountry.code}
                                className="shrink-0 object-contain"
                            />
                        )}
                        <ChevronDown
                            className="w-5 h-5 text-[#939393] shrink-0"
                            strokeWidth={1.5}
                        />
                    </button>

                    {/* Dropdown */}
                    {isCountryOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setIsCountryOpen(false)}
                            />
                            <div className="absolute z-20 w-[280px] mt-1 bg-[#1A1A1A] rounded-xl shadow-lg max-h-60 overflow-auto border border-[#232323]">
                                {countries.map((c) => {
                                    const label = language === 'en' ? c.label_en : c.label_es;
                                    return (
                                        <button
                                            key={c.code}
                                            type="button"
                                            onClick={() => {
                                                onCountryChange(c.phone);
                                                setIsCountryOpen(false);
                                            }}
                                            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[#232323] text-left font-helvetica transition-colors"
                                        >
                                            <img
                                                loading="lazy"
                                                width="20"
                                                srcSet={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png 2x`}
                                                src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`}
                                                alt=""
                                                className="shrink-0"
                                            />
                                            <span className="text-sm text-[#F6F6F6]">
                                                (+{c.phone}) {label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Phone Input */}
                <div className="flex-1">
                    <input
                        type="text"
                        inputMode="numeric"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        disabled={disabled}
                        className={`
                            w-full h-12 px-3.5
                            border-[1.5px] border-solid rounded-xl
                            ${getBorderColor()}
                            bg-transparent
                            font-helvetica font-medium text-base
                            text-[#F6F6F6]
                            placeholder:text-[#939393] placeholder:font-medium
                            focus:outline-none
                            transition-colors
                            ${disabled ? 'cursor-not-allowed opacity-50' : ''}
                        `}
                    />
                </div>
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

export default InputTextPhone;