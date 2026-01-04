import { useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    icon?: ReactNode;
    cancelText?: string;
    confirmText?: string;
    onConfirm: () => void;
    variant?: 'default' | 'delete';
    isLoading?: boolean;
}

const Modal = ({
    isOpen,
    onClose,
    title,
    description,
    icon,
    cancelText = 'Cancelar',
    confirmText = 'Confirmar',
    onConfirm,
    variant = 'default',
    isLoading = false,
}: ModalProps) => {
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isLoading) {
            onClose();
        }
    }, [onClose, isLoading]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !isLoading) {
            onClose();
        }
    };

    const getConfirmButtonStyles = () => {
        if (variant === 'delete') {
            return 'bg-[rgba(255,35,35,0.25)] text-[#FF2323]';
        }
        return 'bg-[#FF336D] text-[#F6F6F6]';
    };

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div className="absolute inset-0 bg-black/70" />

            <div className="relative bg-[#0A0A0A] border-2 border-[#232323] rounded-[42px] w-full max-w-[400px] px-6 py-[42px] flex flex-col gap-9 items-center">
                <div className="absolute top-[-2px] left-1/2 -translate-x-1/2 pt-[5px] opacity-50">
                    <div className="w-9 h-[5px] bg-[#F6F6F6] opacity-50 rounded-full" />
                </div>

                <div className="flex flex-col gap-6 w-full">
                    <div className="flex flex-col gap-4 items-center px-4 w-full">
                        {icon && (
                            <div className="flex items-center justify-center size-[120px]">
                                {icon}
                            </div>
                        )}

                        <h2
                            className="text-[#F6F6F6] text-[24px] font-semibold text-center w-full"
                            style={{ fontFamily: "'Borna', sans-serif" }}
                        >
                            {title}
                        </h2>

                        {description && (
                            <p className="text-[#939393] text-[16px] font-medium text-center w-full font-helvetica">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 w-full">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 h-12 px-6 bg-[#232323] text-[#F6F6F6] font-bold text-[16px] font-helvetica rounded-xl flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 h-12 px-6 font-bold text-[16px] font-helvetica rounded-xl flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${getConfirmButtonStyles()}`}
                    >
                        {isLoading ? 'Cargando...' : confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;