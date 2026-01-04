import { useTranslation } from 'react-i18next';
import PolicyPage from '@/components/Policypage';

const TermsAndConditions = () => {
    const { t } = useTranslation();

    return (
        <PolicyPage
            type="terms-and-conditions"
            title={t('policies.terms_and_conditions', 'Términos y condiciones')}
        />
    );
};

export default TermsAndConditions;