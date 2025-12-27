import { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

interface InputDateProps {
    label?: string;
    error?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    min?: string;
    max?: string;
    minErrorMessage?: string;
    maxErrorMessage?: string;
}

const InputDate = ({
    label,
    error,
    value,
    onChange,
    placeholder = 'dd/mm/yyyy',
    disabled = false,
    className = '',
    min,
    max,
    minErrorMessage = 'La fecha es demasiado antigua',
    maxErrorMessage = 'La fecha no puede ser superior'
}: InputDateProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [internalError, setInternalError] = useState<string | null>(null);
    
    const isoToDisplay = (isoDate: string): string => {
        if (!isoDate) return '';
        const parsed = dayjs(isoDate, 'YYYY-MM-DD', true);
        if (!parsed.isValid()) return '';
        return parsed.format('DD/MM/YYYY');
    };

    const displayToIso = (displayDate: string): string => {
        const parsed = dayjs(displayDate, 'DD/MM/YYYY', true);
        if (!parsed.isValid()) return '';
        return parsed.format('YYYY-MM-DD');
    };

    const [displayValue, setDisplayValue] = useState(isoToDisplay(value));

    useEffect(() => {
        setDisplayValue(isoToDisplay(value));
    }, [value]);

    const formatDateInput = (input: string): string => {
        const numbers = input.replace(/\D/g, '');
        const limited = numbers.slice(0, 8);
        
        let formatted = '';
        for (let i = 0; i < limited.length; i++) {
            if (i === 2 || i === 4) {
                formatted += '/';
            }
            formatted += limited[i];
        }
        
        return formatted;
    };

    const validateDate = (displayDate: string): { valid: boolean; error: string | null } => {
        const parsed = dayjs(displayDate, 'DD/MM/YYYY', true);
        
        if (!parsed.isValid()) {
            return { valid: false, error: 'Fecha inválida' };
        }

        if (min) {
            const minDate = dayjs(min, 'YYYY-MM-DD', true);
            if (minDate.isValid() && parsed.isBefore(minDate)) {
                return { valid: false, error: minErrorMessage };
            }
        }
        
        if (max) {
            const maxDate = dayjs(max, 'YYYY-MM-DD', true);
            if (maxDate.isValid() && parsed.isAfter(maxDate)) {
                return { valid: false, error: maxErrorMessage };
            }
        }

        return { valid: true, error: null };
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        const cursorPosition = e.target.selectionStart || 0;
        
        setInternalError(null);
        
        if (inputValue.length < displayValue.length) {
            const formatted = formatDateInput(inputValue);
            setDisplayValue(formatted);
            
            if (formatted.length === 10) {
                const validation = validateDate(formatted);
                if (validation.valid) {
                    onChange(displayToIso(formatted));
                } else {
                    setInternalError(validation.error);
                    onChange('');
                }
            } else {
                onChange('');
            }
            return;
        }

        const formatted = formatDateInput(inputValue);
        setDisplayValue(formatted);

        setTimeout(() => {
            if (inputRef.current) {
                let newPosition = cursorPosition;
                
                if (formatted.length > displayValue.length) {
                    const addedChars = formatted.length - displayValue.length;
                    if (addedChars > 1) {
                        newPosition = cursorPosition + (addedChars - 1);
                    }
                }
                
                inputRef.current.setSelectionRange(newPosition, newPosition);
            }
        }, 0);

        if (formatted.length === 10) {
            const validation = validateDate(formatted);
            if (validation.valid) {
                onChange(displayToIso(formatted));
            } else {
                setInternalError(validation.error);
                onChange('');
            }
        } else {
            onChange('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
        
        if (allowedKeys.includes(e.key)) {
            return;
        }

        if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
            return;
        }

        if (!/^\d$/.test(e.key)) {
            e.preventDefault();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        const numbers = pastedText.replace(/\D/g, '').slice(0, 8);
        const formatted = formatDateInput(numbers);
        setDisplayValue(formatted);

        if (formatted.length === 10) {
            const validation = validateDate(formatted);
            if (validation.valid) {
                onChange(displayToIso(formatted));
            } else {
                setInternalError(validation.error);
                onChange('');
            }
        }
    };

    const displayError = error || internalError;

    const getBorderColor = () => {
        if (displayError) return 'border-[#FF2323]';
        return 'border-[#232323]';
    };

    const getInputBgColor = () => {
        if (displayError) return 'bg-[rgba(255,35,35,0.05)]';
        return 'bg-transparent';
    };

    return (
        <div className={`flex flex-col gap-1 w-full ${className}`}>
            {/* Label */}
            {label && (
                <div className="flex items-center px-1.5">
                    <span className="font-helvetica text-sm font-normal text-[#939393] leading-none">
                        {label}
                    </span>
                </div>
            )}

            {/* Input Container */}
            <div
                className={`
                    flex items-center gap-6
                    h-12 px-4 py-3
                    border-[1.5px] border-solid rounded-xl
                    ${getBorderColor()}
                    ${getInputBgColor()}
                `}
            >
                <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    value={displayValue}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`
                        flex-1 min-w-0
                        bg-transparent
                        font-helvetica font-medium text-base
                        text-[#F6F6F6]
                        placeholder:text-[#939393] placeholder:font-medium
                        focus:outline-none
                        disabled:opacity-50 disabled:cursor-not-allowed
                        overflow-ellipsis overflow-hidden whitespace-nowrap
                    `}
                />
            </div>

            {/* Error Message */}
            {displayError && (
                <div className="flex items-center px-1.5 py-0.5">
                    <span className="font-helvetica font-medium text-xs text-[#FF2323] leading-none">
                        {displayError}
                    </span>
                </div>
            )}
        </div>
    );
};

export default InputDate;