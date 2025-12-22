import { type InputHTMLAttributes, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputTextProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    label?: string;
    error?: string;
    onChange?: (value: string) => void;
}

const InputText = ({
    label,
    error,
    value,
    onChange,
    type = 'text',
    placeholder,
    disabled = false,
    className = '',
    ...props
}: InputTextProps) => {
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    const hasValue = value !== undefined && value !== '';

    const getBorderColor = () => {
        if (error) return 'border-[#FF2323]';
        return 'border-[#E7E7E7]';
    };

    const getInputBgColor = () => {
        if (error) return 'bg-[rgba(255,35,35,0.05)]';
        return 'bg-transparent';
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.(e.target.value);
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
                    type={inputType}
                    value={value}
                    onChange={handleChange}
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
                    {...props}
                />

                {/* Password Toggle Icon */}
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="shrink-0 size-5 flex items-center justify-center text-[#98AAC0] hover:text-[#141414] transition-colors"
                    >
                        {showPassword ? (
                            <Eye className="size-5" strokeWidth={1.5} />
                        ) : (
                            <EyeOff className="size-5" strokeWidth={1.5} />
                        )}
                    </button>
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

export default InputText;