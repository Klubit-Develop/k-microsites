import type { ReactNode, ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'cta' | 'delete' | 'secondary';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
    variant?: ButtonVariant;
    children: ReactNode;
    icon?: ReactNode;
    isLoading?: boolean;
}

const Button = ({
    variant = 'primary',
    children,
    icon,
    isLoading = false,
    disabled = false,
    className = '',
    ...props
}: ButtonProps) => {
    const isDisabled = disabled || isLoading;

    const getVariantStyles = () => {
        switch (variant) {
            case 'cta':
                return 'bg-[#FF336D] text-[#F6F6F6] h-12';
            case 'delete':
                return 'bg-[rgba(255,35,35,0.25)] text-[#FF2323] h-12';
            case 'secondary':
                return 'bg-[#EBEBEC] text-[#232323] h-12';
            case 'primary':
            default:
                return 'bg-[#232323] text-[#F6F6F6] h-12';
        }
    };

    const getStateStyles = () => {
        if (isDisabled) return 'opacity-50 cursor-not-allowed';
        return 'cursor-pointer active:opacity-80';
    };

    return (
        <button
            disabled={isDisabled}
            className={`
                flex items-center justify-center gap-2.5
                w-full px-[72px] py-0
                rounded-xl
                font-helvetica text-base text-center
                transition-opacity
                ${getVariantStyles()}
                ${getStateStyles()}
                ${className}
            `}
            {...props}
        >
            {icon && !isLoading && (
                <span className="shrink-0 size-5 flex items-center justify-center">
                    {icon}
                </span>
            )}
            {isLoading ? (
                <span className="leading-none">Cargando...</span>
            ) : (
                <span className="leading-none">{children}</span>
            )}
        </button>
    );
};

export default Button;