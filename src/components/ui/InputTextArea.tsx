import type { TextareaHTMLAttributes } from 'react';

interface InputTextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
    label?: string;
    error?: string;
    onChange?: (value: string) => void;
}

const InputTextArea = ({
    label,
    error,
    value,
    onChange,
    placeholder,
    disabled = false,
    className = '',
    ...props
}: InputTextAreaProps) => {
    const getBorderColor = () => {
        if (error) return 'border-[#FF2323]';
        return 'border-[#232323]';
    };

    const getInputBgColor = () => {
        if (error) return 'bg-[rgba(255,35,35,0.05)]';
        return 'bg-transparent';
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange?.(e.target.value);
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

            {/* TextArea Container */}
            <div
                className={`
                    flex items-start
                    h-36 px-4 py-3
                    border-[1.5px] border-solid rounded-xl
                    ${getBorderColor()}
                    ${getInputBgColor()}
                `}
            >
                <textarea
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`
                        flex-1 min-w-0 h-full
                        bg-transparent
                        font-helvetica font-medium text-base
                        text-[#F6F6F6]
                        placeholder:text-[#939393] placeholder:font-medium
                        focus:outline-none
                        disabled:opacity-50 disabled:cursor-not-allowed
                        resize-none
                    `}
                    {...props}
                />
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

export default InputTextArea;