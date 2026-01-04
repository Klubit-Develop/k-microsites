import { useTranslation } from 'react-i18next';
import PolicyPage from '@/components/Policypage';

const PrivacyPolicy = () => {
    const { t } = useTranslation();
    
    return (
        <PolicyPage
            type="privacy-policy"
            title={t('policies.privacy_policy', 'Política de privacidad')}
        />
    );
};

export default PrivacyPolicy;