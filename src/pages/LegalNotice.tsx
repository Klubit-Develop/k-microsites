import { useTranslation } from 'react-i18next';
import PolicyPage from '@/components/Policypage';

const LegalNotice = () => {
    const { t } = useTranslation();

    return (
        <PolicyPage
            type="legal-notices"
            title={t('policies.legal_notice', 'Aviso legal')}
        />
    );
};

export default LegalNotice;