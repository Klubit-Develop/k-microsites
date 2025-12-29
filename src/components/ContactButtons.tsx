import { useTranslation } from 'react-i18next';
import Button from '@/components/ui/Button';

interface ContactButtonsProps {
    onPhoneClick?: () => void;
    onEmailClick?: () => void;
    isLoading?: boolean;
    className?: string;
}

const ContactButtons = ({
    onPhoneClick,
    onEmailClick,
    isLoading = false,
    className = '',
}: ContactButtonsProps) => {
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <div className={`flex gap-2 w-full ${className}`}>
                <div className="flex-1 h-9 bg-[#232323] rounded-xl animate-pulse" />
                <div className="flex-1 h-9 bg-[#232323] rounded-xl animate-pulse" />
            </div>
        );
    }

    return (
        <div className={`flex gap-2 w-full ${className}`}>
            <Button
                variant="primary"
                onClick={onPhoneClick}
                className="flex-1 h-9 px-2!"
            >
                {t('club.phone')}
            </Button>
            <Button
                variant="primary"
                onClick={onEmailClick}
                className="flex-1 h-9 px-2!"
            >
                {t('club.email')}
            </Button>
        </div>
    );
};

export default ContactButtons;