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
        { label: t('footer.legal_notice', 'Aviso legal'), href: '/legal-notice' },
        { label: t('footer.terms_conditions', 'Términos y condiciones'), href: '/terms-and-conditions' },
        { label: t('footer.cookie_policy', 'Política de Cookies'), href: '/cookie-policy' },
        { label: t('footer.privacy_policy', 'Política de Privacidad'), href: '/privacy-policy' },
    ];

    return (
        <footer className="bg-[#141414] border-t-2 border-[#232323] w-full">
            {/* Mobile Layout */}
            <div className="flex flex-col gap-6 pt-4 pb-[80px] px-4 md:hidden">
                {/* Legal Links - Wrap on mobile */}
                <nav className="flex flex-wrap items-center gap-2 text-sm text-[#F6F6F6]">
                    {legalLinks.map((link, index) => (
                        <div key={link.href} className="flex items-center gap-2">
                            <Link
                                to={link.href}
                                className="font-helvetica font-normal hover:opacity-80 transition-opacity whitespace-nowrap"
                            >
                                {link.label}
                            </Link>
                            {index < legalLinks.length - 1 && (
                                <span className="font-helvetica font-medium">|</span>
                            )}
                        </div>
                    ))}
                </nav>

                {/* Copyright */}
                <span className="font-helvetica text-sm font-normal text-[#F6F6F6]">
                    © {copyrightYear} Klubit
                </span>

                {/* App Download Section */}
                <div className="flex flex-col gap-6 pt-6 border-t-2 border-[#232323]">
                    {/* App Info */}
                    <div className="flex items-center gap-[15px]">
                        <div className="w-12 h-12 shrink-0">
                            <img
                                src={logoSrc}
                                alt="Klubit App"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="flex flex-col justify-center py-1">
                            <span className="font-helvetica text-base font-medium text-[#F6F6F6]">
                                {t('footer.download_app', 'Descarga la app')}
                            </span>
                            <span className="font-helvetica text-sm font-normal text-[#939393]">
                                {t('footer.download_app_description_mobile', 'Descubre todas las ventajas y beneficios de Klubit.')}
                            </span>
                        </div>
                    </div>

                    {/* Store Badges */}
                    <div className="flex items-center gap-6">
                        <a
                            href={appStoreUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-10 hover:opacity-80 transition-opacity"
                        >
                            <img
                                src={`/assets/images/apple_${lang}.svg`}
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
                                src={`/assets/images/google_${lang}.svg`}
                                alt="Get it on Google Play"
                                className="h-full w-auto object-contain"
                            />
                        </a>
                    </div>
                </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex flex-col gap-6 pt-6 pb-8 px-10 lg:px-40">
                <div className="flex items-center justify-between w-full">
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

                    <span className="font-helvetica text-sm font-normal text-[#F6F6F6] whitespace-nowrap">
                        {t('footer.copyright', { year: copyrightYear, defaultValue: `© ${copyrightYear} Klubit. Todos los derechos reservados.` })}
                    </span>
                </div>

                <div className="flex items-center justify-between pt-6 border-t-2 border-[#232323]">
                    <div className="flex items-center gap-[15px]">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                            <img
                                src={logoSrc}
                                alt="Klubit App"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="flex flex-col justify-center py-1">
                            <span className="font-helvetica text-base font-medium text-[#F6F6F6]">
                                {t('footer.download_app', 'Descarga la app')}
                            </span>
                            <span className="font-helvetica text-sm font-normal text-[#F6F6F6]/50">
                                {t('footer.download_app_description', 'Accede a tus entradas y mucho más')}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <a
                            href={appStoreUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-10 hover:opacity-80 transition-opacity"
                        >
                            <img
                                src={`/assets/images/apple_${lang}.svg`}
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
                                src={`/assets/images/google_${lang}.svg`}
                                alt="Get it on Google Play"
                                className="h-full w-auto object-contain"
                            />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;