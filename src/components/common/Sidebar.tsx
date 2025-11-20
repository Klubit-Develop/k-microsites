import { useState, useEffect } from 'react';
import type { JSX } from 'react/jsx-runtime';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { Menu, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

import { useSidebarStore } from '@/stores/sidebarStore';
import { useAuthStore } from '@/stores/authStore';
import menuItems from '@/config/sidebarRoutes';

import { LogoIcon } from '@/components/icons';
// import KlubSelector from './KlubSelector';
// import Notifications from './Notifications';

interface MenuItem {
    text: string;
    icon: JSX.Element;
    iconActive: JSX.Element;
    path: string;
    collapse: boolean;
    chip: boolean;
    subMenu?: SubMenuItem[];
}

interface SubMenuItem {
    text: string;
    path: string;
    icon?: JSX.Element;
    iconActive?: JSX.Element;
}

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const authStore = useAuthStore.getState();
    const { open, setOpen, setIsMobile, isMobile } = useSidebarStore();

    const [openSubmenus, setOpenSubmenus] = useState<Record<number, boolean>>({});
    const [savedOpenState, setSavedOpenState] = useState<Record<number, boolean>>({});

    // const hasClubs = Array.isArray(authStore?.clubs) && authStore?.clubs?.length > 0;

    // Check if screen is mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [setIsMobile]);

    const handleSubMenuToggle = (index: number) => {
        const currentItem = menuItems[index];

        if (!open) {
            setOpen(true);
            setSavedOpenState({
                [index]: true
            });

            if (currentItem && currentItem.collapse && currentItem.subMenu && currentItem.subMenu.length > 0) {
                const firstSubItem = currentItem.subMenu[0];
                navigate({ to: firstSubItem.path });
            }
            return;
        }

        setOpenSubmenus((prevState) => {
            const isExpanding = !prevState[index];

            if (
                isExpanding &&
                currentItem &&
                currentItem.collapse &&
                currentItem.subMenu &&
                currentItem.subMenu.length > 0
            ) {
                const firstSubItem = currentItem.subMenu[0];
                navigate({ to: firstSubItem.path });
            }

            if (prevState[index]) {
                return {
                    ...prevState,
                    [index]: false
                };
            }

            return {
                ...Object.keys(prevState).reduce((acc, key) => {
                    acc[parseInt(key)] = false;
                    return acc;
                }, {} as Record<number, boolean>),
                [index]: true
            };
        });
    };

    useEffect(() => {
        if (!open) {
            setSavedOpenState(openSubmenus);
            setOpenSubmenus({});
        } else {
            setOpenSubmenus(savedOpenState);
        }
    }, [open]);

    const getTranslatedText = (item: MenuItem | SubMenuItem) => {
        const menuKey = `menu.${item.text.toLowerCase()}`;
        const translation = t(menuKey, '');
        return translation || item.text;
    };

    // Mobile Header
    const mobileHeader = (
        <header className="md:hidden fixed top-0 left-0 right-0 w-full bg-white z-1199">
            <div className="w-full px-4 py-2 flex">
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2">
                        <LogoIcon width={24} height={32} />
                        <button
                            aria-label="menu"
                            onClick={() => setOpen(true)}
                            className="min-w-0 p-2 text-[#353535] hover:bg-gray-100 rounded transition-colors"
                        >
                            <Menu size={24} />
                        </button>
                    </div>
                    {/* <Notifications /> */}
                </div>
            </div>
        </header>
    );

    return (
        <div className="relative">
            {isMobile && mobileHeader}

            {/* Toggle Button - Desktop only */}
            {!isMobile && (
                <div
                    className={`fixed top-10 ${open ? 'left-[268px]' : 'left-[60px]'} -translate-y-1/2 w-[25px] h-[25px] rounded-[25%] bg-white flex justify-center items-center shadow-md cursor-pointer z-1199 transition-all duration-300`}
                    onClick={() => setOpen(!open)}
                >
                    {open ? (
                        <ChevronLeft size={18} strokeWidth={2.5} className="text-[#353535]" />
                    ) : (
                        <ChevronRight size={18} strokeWidth={2.5} className="text-[#353535]" />
                    )}
                </div>
            )}

            {/* Overlay for mobile */}
            {isMobile && open && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-1197"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Drawer/Sidebar */}
            <div
                className={`
                    ${isMobile ? 'fixed' : 'fixed'}
                    ${isMobile && !open ? '-translate-x-full' : 'translate-x-0'}
                    ${isMobile ? 'w-3/4' : open ? 'w-[280px]' : 'w-[73px]'}
                    h-full bg-[#F9F9FA] z-1198 transition-all duration-300 ease-in-out
                    ${isMobile ? 'top-0 left-0' : 'top-0 left-0'}
                    overflow-x-hidden
                    ${isMobile ? 'pt-6 px-2.5' : ''}
                `}
            >

                <div className="flex flex-col justify-between h-full">
                    {/* Top Section */}
                    <div>
                        {/* Logo and Notifications */}
                        <div className={`flex justify-between py-6 items-center ${open ? 'px-8' : 'px-6'}`}>
                            <LogoIcon width={24} height={32} />
                            
                            {open && (
                                <div className="flex items-center gap-2">
                                    {/* <Notifications /> */}
                                </div>
                            )}
                        </div>

                        {/* Menu Items */}
                        <div className="overflow-y-auto">
                            {menuItems.map((item: MenuItem, index: number) => {
                                const isActive = location.pathname.includes(item.path);
                                const translatedText = getTranslatedText(item);

                                return (
                                    <div key={index}>
                                        {/* Main Menu Item */}
                                        <div
                                            className={`
                                                max-h-[45px] h-[45px] flex items-center cursor-pointer
                                                ${location.pathname.includes(item.path) ? 'bg-[#F9F9FA]' : 'bg-transparent'}
                                                hover:bg-[#F0F0F0] transition-colors duration-300
                                            `}
                                            onClick={() => {
                                                if (item.collapse) {
                                                    handleSubMenuToggle(index);
                                                } else {
                                                    if (isMobile) setOpen(false);
                                                }
                                            }}
                                        >
                                            {item.collapse ? (
                                                <div className="flex items-center w-full">
                                                    {/* Icon */}
                                                    <div
                                                        className={`${open ? 'pl-4' : 'pl-[19.2px]'} min-w-10 transition-all duration-300`}
                                                        title={!open ? translatedText : ''}
                                                    >
                                                        {isActive
                                                            ? item.collapse
                                                                ? open
                                                                    ? item.icon
                                                                    : item.iconActive
                                                                : item.iconActive
                                                            : item.icon}
                                                    </div>

                                                    {/* Text */}
                                                    <div
                                                        className={`
                                                            ${open ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
                                                            transition-all duration-300 overflow-hidden
                                                        `}
                                                    >
                                                        <span
                                                            className={`
                                                                ${isActive
                                                                    ? item.collapse
                                                                        ? 'text-[#353535]'
                                                                        : 'text-[#FF336D]'
                                                                    : 'text-[#353535]'
                                                                }
                                                                whitespace-nowrap overflow-hidden text-ellipsis text-base font-medium font-helvetica
                                                            `}
                                                        >
                                                            {translatedText}
                                                        </span>
                                                    </div>

                                                    {/* Chip */}
                                                    {item.chip && open && (
                                                        <span className="ml-2 bg-[#FFE5EE] text-[#FF336D] px-2 py-0.5 rounded text-xs font-bold font-helvetica">
                                                            v1
                                                        </span>
                                                    )}

                                                    {/* Chevron */}
                                                    {item.collapse && (
                                                        <ChevronDown
                                                            size={20}
                                                            strokeWidth={2.5}
                                                            className={`
                                                                ${openSubmenus[index] ? 'rotate-180' : 'rotate-0'}
                                                                transition-transform duration-300
                                                                ${open ? 'ml-auto mr-4' : ''}
                                                            `}
                                                        />
                                                    )}
                                                </div>
                                            ) : (
                                                <Link to={item.path} className="flex items-center w-full">
                                                    {/* Icon */}
                                                    <div
                                                        className={`${open ? 'pl-4' : 'pl-[19.2px]'} min-w-10 transition-all duration-300`}
                                                        title={!open ? translatedText : ''}
                                                    >
                                                        {isActive ? item.iconActive : item.icon}
                                                    </div>

                                                    {/* Text */}
                                                    <div
                                                        className={`
                                                            ${open ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
                                                            transition-all duration-300 overflow-hidden
                                                        `}
                                                    >
                                                        <span
                                                            className={`
                                                                ${isActive ? 'text-[#FF336D]' : 'text-[#353535]'}
                                                                whitespace-nowrap overflow-hidden text-ellipsis text-base font-medium font-helvetica
                                                            `}
                                                        >
                                                            {translatedText}
                                                        </span>
                                                    </div>

                                                    {/* Chip */}
                                                    {item.chip && open && (
                                                        <span className="ml-2 bg-[#FFE5EE] text-[#FF336D] px-2 py-0.5 rounded text-xs font-bold font-helvetica">
                                                            v1
                                                        </span>
                                                    )}
                                                </Link>
                                            )}
                                        </div>

                                        {/* Divider after IA */}
                                        {item.text === 'ia' && (
                                            <div className="flex justify-center w-full px-4 my-2">
                                                <div className="w-full border-t border-[#E0E0E0]" />
                                            </div>
                                        )}

                                        {/* Submenu */}
                                        {item.collapse && (
                                            <div
                                                className={`
                                                    overflow-hidden transition-all duration-300
                                                    ${open && openSubmenus[index] ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
                                                `}
                                            >
                                                {item.subMenu?.map((subItem: SubMenuItem, subIndex: number) => {
                                                    const translatedSubText = getTranslatedText(subItem);

                                                    return (
                                                        <Link
                                                            key={subIndex}
                                                            to={subItem.path}
                                                            className={`
                                                                flex items-center pl-12 max-h-[45px] h-[45px]
                                                                ${location.pathname === subItem.path
                                                                    ? 'bg-[#F9F9FA]'
                                                                    : 'bg-transparent'
                                                                }
                                                                hover:bg-[#F0F0F0] transition-colors duration-300
                                                            `}
                                                            onClick={() => isMobile && setOpen(false)}
                                                        >
                                                            <div
                                                                className="min-w-8"
                                                                title={translatedSubText}
                                                            >
                                                                {location.pathname === subItem.path
                                                                    ? subItem.iconActive
                                                                    : subItem.icon}
                                                            </div>
                                                            <span
                                                                className={`
                                                                    ${location.pathname === subItem.path
                                                                        ? 'text-[#FF336D]'
                                                                        : 'text-[#353535]'
                                                                    }
                                                                    whitespace-nowrap overflow-hidden text-ellipsis text-sm font-medium font-helvetica
                                                                `}
                                                            >
                                                                {translatedSubText}
                                                            </span>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom Section - User Profile */}
                    <div className="flex flex-col gap-2 pb-4">
                        <div className="flex justify-center w-full px-4 my-2">
                            <div className="w-full border-t border-[#E0E0E0]" />
                        </div>

                        <Link to="/" className="no-underline">
                            <div
                                onClick={() => isMobile && setOpen(false)}
                                className={`flex items-center ${open ? 'px-[28.8px]' : 'px-6'} transition-all duration-300`}
                            >
                                <div
                                    className="w-10 h-10 rounded-full border-2 border-[#CCCCCC] bg-[#F9F9FA] text-[#353535] flex items-center justify-center font-medium text-sm"
                                    style={{
                                        backgroundImage: `url(/path-to-avatar-image.jpg)`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}
                                >
                                    {!authStore?.user?.firstName && !authStore?.user?.lastName
                                        ? 'U'
                                        : `${authStore?.user?.firstName?.charAt(0) || ''}${authStore?.user?.lastName?.charAt(0) || ''}`
                                    }
                                </div>
                                <div
                                    className={`
                                        ${open ? 'opacity-100 w-auto ml-2' : 'opacity-0 w-0'}
                                        transition-all duration-300 overflow-hidden
                                    `}
                                >
                                    <span className="text-[#353535] font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis font-helvetica">
                                        {authStore?.user?.firstName} {authStore?.user?.lastName}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;