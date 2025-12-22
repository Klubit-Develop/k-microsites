import { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

interface InputDateProps {
    label?: string;
    error?: string;
    value: string; // formato YYYY-MM-DD (ISO) para compatibilidad
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    min?: string; // formato YYYY-MM-DD
    max?: string; // formato YYYY-MM-DD
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
    
    // Convertir de YYYY-MM-DD a dd/mm/yyyy para mostrar
    const isoToDisplay = (isoDate: string): string => {
        if (!isoDate) return '';
        const parsed = dayjs(isoDate, 'YYYY-MM-DD', true);
        if (!parsed.isValid()) return '';
        return parsed.format('DD/MM/YYYY');
    };

    // Convertir de dd/mm/yyyy a YYYY-MM-DD para el valor
    const displayToIso = (displayDate: string): string => {
        const parsed = dayjs(displayDate, 'DD/MM/YYYY', true);
        if (!parsed.isValid()) return '';
        return parsed.format('YYYY-MM-DD');
    };

    const [displayValue, setDisplayValue] = useState(isoToDisplay(value));

    // Sincronizar cuando el valor externo cambia
    useEffect(() => {
        setDisplayValue(isoToDisplay(value));
    }, [value]);

    const formatDateInput = (input: string): string => {
        // Eliminar todo excepto números
        const numbers = input.replace(/\D/g, '');
        
        // Limitar a 8 dígitos (ddmmyyyy)
        const limited = numbers.slice(0, 8);
        
        // Formatear con barras
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
        // Usar dayjs con strict mode para validar
        const parsed = dayjs(displayDate, 'DD/MM/YYYY', true);
        
        if (!parsed.isValid()) {
            return { valid: false, error: 'Fecha inválida' };
        }

        // Validar min si está definido
        if (min) {
            const minDate = dayjs(min, 'YYYY-MM-DD', true);
            if (minDate.isValid() && parsed.isBefore(minDate)) {
                return { valid: false, error: minErrorMessage };
            }
        }
        
        // Validar max si está definido
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
        
        // Limpiar error interno al escribir
        setInternalError(null);
        
        // Si está borrando, permitir
        if (inputValue.length < displayValue.length) {
            const formatted = formatDateInput(inputValue);
            setDisplayValue(formatted);
            
            // Si la fecha está completa, validar
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

        // Ajustar posición del cursor después del formateo
        setTimeout(() => {
            if (inputRef.current) {
                let newPosition = cursorPosition;
                
                // Si acabamos de añadir una barra, mover el cursor después de ella
                if (formatted.length > displayValue.length) {
                    const addedChars = formatted.length - displayValue.length;
                    if (addedChars > 1) {
                        newPosition = cursorPosition + (addedChars - 1);
                    }
                }
                
                inputRef.current.setSelectionRange(newPosition, newPosition);
            }
        }, 0);

        // Si la fecha está completa, validar
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
        // Permitir: backspace, delete, tab, escape, enter, flechas
        const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
        
        if (allowedKeys.includes(e.key)) {
            return;
        }

        // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
            return;
        }

        // Solo permitir números
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

    const hasValue = displayValue.length > 0;
    
    // El error a mostrar es el externo (del form) o el interno (de validación)
    const displayError = error || internalError;

    const getBorderColor = () => {
        if (displayError) return 'border-[#FF2323]';
        return 'border-[#E7E7E7]';
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
                    <span className="font-helvetica text-sm font-normal text-[#141414] leading-none">
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
                        ${hasValue ? 'text-[#141414]' : 'text-[#141414]'}
                        placeholder:text-[#98AAC0] placeholder:font-medium
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