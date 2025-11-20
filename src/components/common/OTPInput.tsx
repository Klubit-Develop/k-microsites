import { useState, useRef } from 'react';

interface OTPInputProps {
    length?: number;
    onChange: (value: string) => void;
    disabled?: boolean;
    autoFocus?: boolean;
    value?: string;
}

const OTPInput = ({ length = 6, onChange, disabled = false, autoFocus = false }: OTPInputProps) => {
    const [otp, setOtp] = useState(Array(length).fill(''));
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (element: HTMLInputElement, index: number) => {
        const value = element.value;
        if (/[^0-9]/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        onChange(newOtp.join(''));

        if (value && index < length - 1) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && index > 0 && !otp[index]) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    return (
        <div className="flex justify-center gap-2 w-full">
            {otp.map((_, index) => (
                <input
                    key={index}
                    ref={(el) => { inputsRef.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    value={otp[index]}
                    onChange={(e) => handleChange(e.target, index)}
                    onKeyUp={(e) => handleKeyUp(e, index)}
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