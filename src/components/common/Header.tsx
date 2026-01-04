import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { ChevronDown } from 'lucide-react';

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
    const langRef = useRef<HTMLDivElement>(null);

    const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (langRef.current && !langRef.current.contains(event.target as Node)) {
                setIsLangOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    return (
        <header className="bg-[#141414] border-b-2 border-[#232323] h-[68px] w-full">
            <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-34">
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

                    <div ref={langRef} className="relative">
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
                            <div className="absolute right-0 top-full mt-2 w-full bg-[#141414] border border-[#232323] rounded-xl overflow-hidden shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] z-50">
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
                </div>
            </div>
        </header>
    );
};

export default Header;