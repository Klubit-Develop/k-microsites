import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';

interface FooterProps {
    copyrightYear?: number;
    appStoreUrl?: string;
    googlePlayUrl?: string;
    logoSrc?: string;
}

const Footer: FC<FooterProps> = ({
    copyrightYear = 2026,
    appStoreUrl = 'https://apps.apple.com',
    googlePlayUrl = 'https://play.google.com',
    logoSrc = '/assets/images/logo-footer.png',
}) => {
    const { t, i18n } = useTranslation();

    const lang = i18n.language === 'en' ? 'en' : 'es';

    const legalLinks = [
        { label: t('footer.legal_notice'), href: '/aviso-legal' },
        { label: t('footer.terms_conditions'), href: '/terminos-condiciones' },
        { label: t('footer.cookie_policy'), href: '/politica-cookies' },
        { label: t('footer.privacy_policy'), href: '/politica-privacidad' },
    ];

    return (
        <footer className="bg-[#141414] border-t-2 border-[#232323] flex flex-col gap-6 pt-6 pb-8 px-40 w-full">
            {/* Top Section - Legal Links & Copyright */}
            <div className="flex items-center justify-between w-full">
                {/* Legal Links */}
                <nav className="flex items-center gap-3.5">
                    {legalLinks.map((link, index) => (
                        <div key={link.href} className="flex items-center gap-3.5">
                            <Link
                                to={link.href}
                                className="font-helvetica text-sm font-normal text-[#F6F6F6] hover:opacity-80 transition-opacity whitespace-nowrap"
                            >
                                {link.label}
                            </Link>
                            {index < legalLinks.length - 1 && (
                                <span className="font-helvetica text-sm font-medium text-[#F6F6F6]">
                                    |
                                </span>
                            )}
                        </div>
                    ))}
                </nav>

                {/* Copyright */}
                <span className="font-helvetica text-sm font-normal text-[#F6F6F6] whitespace-nowrap">
                    {t('footer.copyright', { year: copyrightYear })}
                </span>
            </div>

            {/* Bottom Section - App Download */}
            <div className="flex items-center justify-between pt-6 border-t-2 border-[#232323]">
                {/* App Info */}
                <div className="flex items-center gap-[15px]">
                    {/* App Logo */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                        <img
                            src={logoSrc}
                            alt="Klubit App"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Text Content */}
                    <div className="flex flex-col justify-center py-1">
                        <span className="font-helvetica text-base font-medium text-[#F6F6F6]">
                            {t('footer.download_app')}
                        </span>
                        <span className="font-helvetica text-sm font-normal text-[#F6F6F6]/50">
                            {t('footer.download_app_description')}
                        </span>
                    </div>
                </div>

                {/* Download Badges */}
                <div className="flex items-center gap-6">
                    <a
                        href={appStoreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 hover:opacity-80 transition-opacity"
                    >
                        <img
                            src={`/assets/images/apple-store-${lang}.png`}
                            alt="Download on the App Store"
                            className="h-full w-auto object-contain"
                        />
                    </a>
                    <a
                        href={googlePlayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 hover:opacity-80 transition-opacity"
                    >
                        <img
                            src={`/assets/images/google-store-${lang}.png`}
                            alt="Get it on Google Play"
                            className="h-full w-auto object-contain"
                        />
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;