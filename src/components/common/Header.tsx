import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { ChevronDown, ChevronRight, Menu, X } from 'lucide-react';

import { LogoIcon } from '@/components/icons';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
}

interface Language {
    code: string;
    label: string;
    flag: string;
}

interface HeaderProps {
    user?: User | null;
    onLanguageChange?: (lang: string) => void;
}

const LANGUAGES: Language[] = [
    { code: 'es', label: 'ES', flag: '🇪🇸' },
    { code: 'en', label: 'EN', flag: '🇬🇧' },
];

const Header = ({
    user,
    onLanguageChange,
}: HeaderProps) => {
    const { t, i18n } = useTranslation();
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const langRef = useRef<HTMLDivElement>(null);

    const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (langRef.current && !langRef.current.contains(event.target as Node)) {
                setIsLangOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    const handleLanguageSelect = (lang: Language) => {
        i18n.changeLanguage(lang.code);
        onLanguageChange?.(lang.code);
        setIsLangOpen(false);
    };

    const getUserDisplayName = () => {
        if (!user) return '';
        return `${user.firstName} ${user.lastName}`;
    };

    const getInitials = () => {
        if (!user) return '';
        const firstInitial = user.firstName?.charAt(0) || '';
        const lastInitial = user.lastName?.charAt(0) || '';
        return `${firstInitial}${lastInitial}`.toUpperCase();
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    // Language selector component (reusable for desktop and mobile)
    const LanguageSelector = ({ isMobile = false }: { isMobile?: boolean }) => (
        <div ref={isMobile ? undefined : langRef} className="relative">
            <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className={`
                    flex items-center gap-1 h-9 px-3.5
                    border-[1.5px] border-[#232323] rounded-xl
                    shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)]
                    cursor-pointer transition-colors
                    ${isLangOpen ? 'bg-[#232323]' : 'hover:bg-[#232323]/50'}
                `}
            >
                <span className="text-xl leading-none">{currentLang.flag}</span>
                <span className="font-helvetica font-normal text-sm text-[#F6F6F6]">
                    {currentLang.label}
                </span>
                <ChevronDown
                    size={16}
                    className={`text-[#F6F6F6] transition-transform ${isLangOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isLangOpen && (
                <div className={`
                    absolute ${isMobile ? 'left-0 bottom-full mb-2' : 'right-0 top-full mt-2'} 
                    w-full min-w-[80px] bg-[#141414] border border-[#232323] rounded-xl 
                    overflow-hidden shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] z-50
                `}>
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageSelect(lang)}
                            className={`
                                flex items-center gap-2 w-full px-4 py-2.5
                                cursor-pointer transition-colors
                                ${lang.code === currentLang.code
                                    ? 'bg-[#232323]'
                                    : 'hover:bg-[#232323]/50'
                                }
                            `}
                        >
                            <span className="text-xl leading-none">{lang.flag}</span>
                            <span className="font-helvetica font-normal text-sm text-[#F6F6F6]">
                                {lang.label}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    // Menu item component for mobile drawer
    const MobileMenuItem = ({
        to,
        children,
        showAvatar = false
    }: {
        to: string;
        children: React.ReactNode;
        showAvatar?: boolean;
    }) => (
        <Link
            to={to}
            onClick={closeMobileMenu}
            className="flex items-center justify-between w-full px-3 py-3 border-b border-[#232323]"
        >
            <div className="flex items-center gap-3">
                {showAvatar && (
                    <div className="relative size-[30px] rounded-full overflow-hidden border border-[#232323] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt={getUserDisplayName()}
                                className="size-full object-cover"
                            />
                        ) : (
                            <div className="size-full bg-[#232323] flex items-center justify-center">
                                <span className="text-[#F6F6F6] text-xs font-medium">
                                    {getInitials()}
                                </span>
                            </div>
                        )}
                    </div>
                )}
                <span className="font-helvetica font-medium text-base text-[#F6F6F6]">
                    {children}
                </span>
            </div>
            <ChevronRight size={20} className="text-[#F6F6F6]" />
        </Link>
    );

    return (
        <>
            {/* Header */}
            <header className="bg-[#141414] md:bg-[#141414] bg-[#050505] border-b-2 border-[#232323] w-full">
                {/* Desktop Header */}
                <div className="hidden md:flex items-center justify-between h-[68px] px-4 sm:px-6 lg:px-34">
                    <Link to="/" className="shrink-0">
                        <LogoIcon
                            width={87}
                            height={20}
                        />
                    </Link>

                    <div className="flex items-center gap-8 lg:gap-16">
                        {user ? (
                            <>
                                <Link
                                    to="/wallet"
                                    className="font-helvetica font-medium text-base text-[#F6F6F6] hover:opacity-80 transition-opacity"
                                >
                                    {t('header.my_wallet', 'Mi wallet')}
                                </Link>

                                <Link
                                    to="/profile"
                                    className="flex items-center gap-3 group hover:opacity-80 transition-opacity"
                                >
                                    <div className="relative size-[30px] rounded-full overflow-hidden border border-[#232323] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                                        {user.avatar ? (
                                            <img
                                                src={user.avatar}
                                                alt={getUserDisplayName()}
                                                className="size-full object-cover"
                                            />
                                        ) : (
                                            <div className="size-full bg-[#232323] flex items-center justify-center">
                                                <span className="text-[#F6F6F6] text-xs font-medium">
                                                    {getInitials()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <span className="font-helvetica font-medium text-base text-[#F6F6F6] truncate max-w-[150px]">
                                        {getUserDisplayName()}
                                    </span>
                                </Link>
                            </>
                        ) : (
                            <Link
                                to="/auth"
                                className="font-helvetica font-medium text-base text-[#F6F6F6] hover:opacity-80 transition-opacity"
                            >
                                {t('header.access_account', 'Acceder a mi cuenta')}
                            </Link>
                        )}

                        <LanguageSelector />
                    </div>
                </div>

                {/* Mobile Header */}
                <div className="flex md:hidden items-center justify-between h-[94px] px-6 pt-[42px] pb-[32px] bg-[#050505]">
                    <Link to="/" className="shrink-0">
                        <LogoIcon
                            width={87}
                            height={20}
                        />
                    </Link>

                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="flex items-center justify-center size-[21px] rounded-[10px] cursor-pointer"
                        aria-label={t('header.open_menu', 'Abrir menú')}
                    >
                        <Menu size={20} className="text-[#F6F6F6]" />
                    </button>
                </div>
            </header>

            {/* Mobile Menu Drawer */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60"
                        onClick={closeMobileMenu}
                    />

                    {/* Drawer */}
                    <div className="absolute inset-0 bg-[#050505] flex flex-col animate-in slide-in-from-right duration-300">
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between px-6 pt-[42px] pb-6">
                            <Link to="/" onClick={closeMobileMenu} className="shrink-0">
                                <LogoIcon
                                    width={87}
                                    height={20}
                                />
                            </Link>

                            <button
                                onClick={closeMobileMenu}
                                className="flex items-center justify-center size-[21px] rounded-[10px] cursor-pointer"
                                aria-label={t('header.close_menu', 'Cerrar menú')}
                            >
                                <X size={16} className="text-white" />
                            </button>
                        </div>

                        {/* Menu Content */}
                        <div className="flex-1 flex flex-col justify-between px-4 pt-[30px] pb-16">
                            {/* Menu Items */}
                            <div className="flex flex-col">
                                {user ? (
                                    <>
                                        <MobileMenuItem to="/wallet">
                                            {t('header.my_wallet', 'Mi wallet')}
                                        </MobileMenuItem>
                                        <MobileMenuItem to="/profile" showAvatar>
                                            {getUserDisplayName()}
                                        </MobileMenuItem>
                                    </>
                                ) : (
                                    <MobileMenuItem to="/auth">
                                        {t('header.access_account', 'Accede a tu cuenta')}
                                    </MobileMenuItem>
                                )}
                            </div>

                            {/* Language Selector at Bottom */}
                            <div ref={langRef}>
                                <LanguageSelector isMobile />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;