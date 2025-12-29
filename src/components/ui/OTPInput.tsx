import { useState, useRef, useEffect } from 'react';

interface OTPInputProps {
    length?: number;
    onChange: (value: string) => void;
    disabled?: boolean;
    autoFocus?: boolean;
    value?: string;
    label?: string;
    error?: string;
}

const OTPInput = ({
    length = 6,
    onChange,
    disabled = false,
    autoFocus = false,
    value = '',
    label,
    error
}: OTPInputProps) => {
    const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (value === '') {
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

        const focusIndex = Math.min(digits.length, length - 1);
        inputsRef.current[focusIndex]?.focus();
    };

    const getBorderColor = () => {
        if (error) return 'border-[#FF2323]';
        return 'border-[#232323]';
    };

    const getContainerBg = () => {
        if (error) return 'bg-[rgba(255,35,35,0.05)]';
        return '';
    };

    return (
        <div className="flex flex-col gap-1 w-full">
            {/* Label */}
            {label && (
                <div className="flex items-center px-1.5">
                    <span className="font-helvetica text-sm font-normal text-[#939393] leading-none">
                        {label}
                    </span>
                </div>
            )}

            {/* OTP Inputs Container */}
            <div className={`flex items-start justify-between w-full ${getContainerBg()}`}>
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
                        className={`
                            size-12
                            border-[1.5px] border-solid rounded-xl
                            ${getBorderColor()}
                            bg-transparent
                            font-helvetica font-medium text-base text-center
                            text-[#F6F6F6]
                            placeholder:text-[#939393]
                            focus:outline-none
                            disabled:opacity-50 disabled:cursor-not-allowed
                            transition-colors
                        `}
                    />
                ))}
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

export default OTPInput;