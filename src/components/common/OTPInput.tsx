import { useState, useRef, useEffect } from 'react';

interface OTPInputProps {
    length?: number;
    onChange: (value: string) => void;
    disabled?: boolean;
    autoFocus?: boolean;
    value?: string;
}

const OTPInput = ({ length = 6, onChange, disabled = false, autoFocus = false, value = '' }: OTPInputProps) => {
    const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    // Sincronizar con el valor externo (incluyendo cuando se limpia)
    useEffect(() => {
        if (value === '') {
            // Limpiar todos los campos cuando el valor es vacío
            setOtp(Array(length).fill(''));
        } else {
            const valueArray = value.split('').slice(0, length);
            const newOtp = Array(length).fill('');
            valueArray.forEach((char, index) => {
                newOtp[index] = char;
            });
            setOtp(newOtp);
        }
    }, [value, length]);

    const handleChange = (element: HTMLInputElement, index: number) => {
        const inputValue = element.value;
        if (/[^0-9]/.test(inputValue)) return;

        const newOtp = [...otp];
        newOtp[index] = inputValue;
        setOtp(newOtp);
        onChange(newOtp.join(''));

        if (inputValue && index < length - 1) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && index > 0 && !otp[index]) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');
        
        // Extraer solo los dígitos del texto pegado
        const digits = pastedData.replace(/\D/g, '').slice(0, length);
        
        if (digits.length === 0) return;

        const newOtp = Array(length).fill('');
        digits.split('').forEach((digit, index) => {
            if (index < length) {
                newOtp[index] = digit;
            }
        });

        setOtp(newOtp);
        onChange(newOtp.join(''));

        // Mover el foco al último campo completado o al siguiente vacío
        const focusIndex = Math.min(digits.length, length - 1);
        inputsRef.current[focusIndex]?.focus();
    };

    return (
        <div className="flex justify-center gap-2 w-full">
            {otp.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => { inputsRef.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleChange(e.target, index)}
                    onKeyUp={(e) => handleKeyUp(e, index)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    autoFocus={autoFocus && index === 0}
                    maxLength={1}
                    className="w-[50px] h-[50px] md:w-[50px] md:h-[50px] text-center text-base md:text-lg font-bold bg-[#ECF0F5] border-2 border-[#ECF0F5] rounded-lg focus:outline-none focus:border-[#252E39] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                />
            ))}
        </div>
    );
};

export default OTPInput;