import React from 'react';

interface InputProps {
    label: string;
    type?: 'text' | 'email' | 'tel' | 'date';
    value: string;
    onChange: (value: string) => void;
    error?: string;
    maxLength?: number;
    pattern?: string;
    inputMode?: 'text' | 'numeric' | 'email';
    onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    max?: string;
    min?: string;
}

export const Input = ({
    label,
    type = 'text',
    value,
    onChange,
    error,
    maxLength,
    pattern,
    inputMode,
    onKeyPress,
    max,
    min
}: InputProps) => {
    const id = label.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="flex flex-col items-start gap-0">
            <label className="text-[#98AAC0] text-[13px] font-helvetica font-medium mb-0 pl-3">
                {label}
            </label>
            <div className="w-full">
                <input
                    type={type}
                    id={id}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyPress={onKeyPress}
                    maxLength={maxLength}
                    pattern={pattern}
                    inputMode={inputMode}
                    max={max}
                    min={min}
                    className={`
                        w-full px-3 py-2.5 bg-transparent 
                        border-b ${error ? 'border-red-500' : 'border-[#CCCCCC]'}
                        hover:border-[#252E39] focus:border-[#252E39] focus:outline-none 
                        text-[#252E39] text-lg font-helvetica transition-colors
                        ${type === 'date' ? 'scheme-light' : ''}
                    `}
                />
                {error && <p className="text-red-500 text-xs mt-1 pl-3 font-helvetica">{error}</p>}
            </div>
        </div>
    );
};

interface SelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    error?: string;
    placeholder?: string;
}

export const Select = ({
    label,
    value,
    onChange,
    options,
    error,
    placeholder
}: SelectProps) => {
    const id = label.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="flex flex-col items-start gap-0">
            <label className="text-[#98AAC0] text-[13px] font-helvetica font-medium mb-0 pl-3">
                {label}
            </label>
            <div className="w-full">
                <select
                    id={id}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`
                        w-full px-3 py-2.5 bg-transparent 
                        border-b ${error ? 'border-red-500' : 'border-[#CCCCCC]'}
                        hover:border-[#252E39] focus:border-[#252E39] focus:outline-none 
                        text-[#252E39] text-lg font-helvetica transition-colors 
                        appearance-none cursor-pointer
                    `}
                >
                    {placeholder && (
                        <option key="placeholder-option" value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((option, index) => (
                        <option
                            key={`${option.value}-${index}`}
                            value={option.value}
                        >
                            {option.label}
                        </option>
                    ))}
                </select>
                {error && <p className="text-red-500 text-xs mt-1 pl-3 font-helvetica">{error}</p>}
            </div>
        </div>
    );
};