import type { FC } from 'react';
import { Link } from '@tanstack/react-router';

interface FooterLink {
    label: string;
    href: string;
}

interface FooterProps {
    legalLinks?: FooterLink[];
    copyrightYear?: number;
    appStoreUrl?: string;
    googlePlayUrl?: string;
    logoSrc?: string;
}

const Footer: FC<FooterProps> = ({
    legalLinks = [
        { label: 'Aviso legal', href: '/aviso-legal' },
        { label: 'Términos y condiciones', href: '/terminos-condiciones' },
        { label: 'Política de Cookies', href: '/politica-cookies' },
        { label: 'Política de Privacidad', href: '/politica-privacidad' },
    ],
    copyrightYear = 2026,
    appStoreUrl = 'https://apps.apple.com',
    googlePlayUrl = 'https://play.google.com',
    logoSrc = '/assets/images/logo-footer.png',
}) => {
    return (
        <footer className="bg-[#141414] border-t-2 border-[#232323] flex flex-col gap-6 pt-6 pb-8 px-[160px] w-full">
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
                    © {copyrightYear} Klubit
                </span>
            </div>

            {/* Bottom Section - App Download */}
            <div className="flex items-center justify-between pt-6 border-t-2 border-[#232323]">
                {/* App Info */}
                <div className="flex items-center gap-[15px]">
                    {/* App Logo */}
                    <div className="w-[48px] h-[48px] rounded-xl overflow-hidden shrink-0">
                        <img
                            src={logoSrc}
                            alt="Klubit App"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Text Content */}
                    <div className="flex flex-col justify-center py-1">
                        <span className="font-helvetica text-base font-medium text-[#ECF0F5]">
                            Descarga la app
                        </span>
                        <span className="font-helvetica text-sm font-normal text-[#F6F6F6]/50">
                            Descubre todas las ventajas y beneficios de Klubit.
                        </span>
                    </div>
                </div>

                {/* Download Badges - Enlaces externos, mantienen <a> */}
                <div className="flex items-center gap-6">
                    <a
                        href={appStoreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 hover:opacity-80 transition-opacity"
                    >
                        <img
                            src="/assets/images/apple-store.png"
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
                            src="/assets/images/google-store.png"
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