import { useTranslation } from 'react-i18next';
import PolicyPage from '@/components/Policypage';

const CookiePolicy = () => {
    const { t } = useTranslation();

    return (
        <PolicyPage
            type="cookie-policy"
            title={t('policies.cookie_policy', 'Política de cookies')}
        />
    );
};

export default CookiePolicy;