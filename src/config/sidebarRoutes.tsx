import type { JSX } from 'react/jsx-runtime';
import {
    KlaudiaMenuIcon,
    DashboardMenuIcon,
    CalendarMenuIcon,
    EventMenuIcon,
    TicketMenuIcon,
    ProductMenuIcon,
    FlagMenuIcon,
    StartBenefitMenuIcon,
    UserMenuIcon,
    RRPPMenuIcon,
    CRMMenuIcon,
    AccountingMenuIcon,
    SettingMenuIcon
} from '@/components/icons';

interface SubMenuItem {
    text: string;
    path: string;
    icon?: JSX.Element;
    iconActive?: JSX.Element;
}

interface MenuItem {
    text: string;
    icon: JSX.Element;
    iconActive: JSX.Element;
    path: string;
    collapse: boolean;
    chip: boolean;
    subMenu?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
    {
        text: 'ia',
        icon: <KlaudiaMenuIcon />,
        iconActive: <KlaudiaMenuIcon color="#FF336D" />,
        path: '/manager/ia',
        collapse: false,
        chip: true
    },
    {
        text: 'dashboard',
        icon: <DashboardMenuIcon />,
        iconActive: <DashboardMenuIcon color="#FF336D" />,
        path: '/manager/dashboard',
        collapse: false,
        chip: false
    },
    {
        text: 'calendar',
        icon: <CalendarMenuIcon />,
        iconActive: <CalendarMenuIcon color="#FF336D" />,
        path: '/manager/calendar',
        collapse: false,
        chip: false
    },
    {
        text: 'events',
        icon: <EventMenuIcon />,
        iconActive: <EventMenuIcon color="#FF336D" />,
        path: '/manager/events',
        collapse: true,
        chip: false,
        subMenu: [
            {
                text: 'events',
                path: '/manager/events/events'
            },
            {
                text: 'templates',
                path: '/manager/events/templates'
            },
            {
                text: 'collaborators',
                path: '/manager/events/kolaboradores'
            }
        ]
    },
    {
        text: 'rates',
        icon: <TicketMenuIcon />,
        iconActive: <TicketMenuIcon color="#FF336D" />,
        path: '/manager/rates',
        collapse: false,
        chip: false
    },
    {
        text: 'products',
        icon: <ProductMenuIcon />,
        iconActive: <ProductMenuIcon color="#FF336D" />,
        path: '/manager/products',
        collapse: false,
        chip: false
    },
    {
        text: 'challenges_and_promotions',
        icon: <FlagMenuIcon />,
        iconActive: <FlagMenuIcon color="#FF336D" />,
        path: '/manager/challenges-promotions',
        collapse: false,
        chip: false
    },
    {
        text: 'client_kards',
        icon: <StartBenefitMenuIcon />,
        iconActive: <StartBenefitMenuIcon color="#FF336D" />,
        path: '/manager/client-kards',
        collapse: false,
        chip: false
    },
    /*
    {
        text: 'pages',
        icon: <File strokeWidth={2.5} size={20} color="#353535" />,
        iconActive: <File strokeWidth={2.5} size={20} color="#FF336D" />,
        path: '/manager/pages',
        collapse: true,
        chip: false,
        subMenu: [
            {
                text: 'page_not_found',
                icon: <FileX strokeWidth={2.5} size={20} color="#353535" />,
                iconActive: <FileX strokeWidth={2.5} size={20} color="#FF336D" />,
                path: '/manager/pages/404'
            },
            {
                text: 'maintenance',
                icon: <FileX strokeWidth={2.5} size={20} color="#353535" />,
                iconActive: <FileX strokeWidth={2.5} size={20} color="#FF336D" />,
                path: '/manager/pages/maintenance'
            },
            {
                text: 'suscription',
                icon: <FileX strokeWidth={2.5} size={20} color="#353535" />,
                iconActive: <FileX strokeWidth={2.5} size={20} color="#FF336D" />,
                path: '/manager/pages/suscription'
            },
            {
                text: 'server_error',
                icon: <FileX strokeWidth={2.5} size={20} color="#353535" />,
                iconActive: <FileX strokeWidth={2.5} size={20} color="#FF336D" />,
                path: '/manager/pages/500'
            },
            {
                text: 'feature_block',
                icon: <FileX strokeWidth={2.5} size={20} color="#353535" />,
                iconActive: <FileX strokeWidth={2.5} size={20} color="#FF336D" />,
                path: '/manager/pages/blocking'
            },
            {
                text: 'coming_soon',
                icon: <FileX strokeWidth={2.5} size={20} color="#353535" />,
                iconActive: <FileX strokeWidth={2.5} size={20} color="#FF336D" />,
                path: '/manager/pages/coming-soon'
            }
        ]
    },
    */
    {
        text: 'users_and_permissions',
        icon: <UserMenuIcon />,
        iconActive: <UserMenuIcon color="#FF336D" />,
        path: '/manager/users',
        collapse: false,
        chip: false
    },
    {
        text: 'rrpp',
        icon: <RRPPMenuIcon />,
        iconActive: <RRPPMenuIcon color="#FF336D" />,
        path: '/manager/rrpp',
        collapse: true,
        chip: false,
        subMenu: [
            {
                text: 'organization',
                path: '/manager/rrpp/organization-chart'
            },
            {
                text: 'kard',
                path: '/manager/rrpp/kards'
            },
            {
                text: 'configuration_kpi',
                path: '/manager/rrpp/kpi-configuration'
            }
        ]
    },
    {
        text: 'crm',
        icon: <CRMMenuIcon />,
        iconActive: <CRMMenuIcon color="#FF336D" />,
        path: '/manager/crm',
        collapse: true,
        chip: false,
        subMenu: [
            {
                text: 'clients',
                path: '/manager/crm/clients'
            },
            {
                text: 'marketing',
                path: '/manager/crm/marketing'
            },
            {
                text: 'shipping',
                path: '/manager/crm/shipping'
            }
        ]
    },
    {
        text: 'accounting',
        icon: <AccountingMenuIcon />,
        iconActive: <AccountingMenuIcon color="#FF336D" />,
        path: '/manager/accounting',
        collapse: false,
        chip: false
    },
    {
        text: 'settings',
        icon: <SettingMenuIcon />,
        iconActive: <SettingMenuIcon color="#FF336D" />,
        path: '/manager/configuration',
        collapse: true,
        chip: false,
        subMenu: [
            {
                text: 'club_settings',
                path: '/manager/configuration/klub'
            },
            {
                text: 'zones',
                path: '/manager/configuration/zones-terminals'
            },
            {
                text: 'sales_channels',
                path: '/manager/sales-channel'
            }
        ]
    }
];

export default menuItems;
export type { MenuItem, SubMenuItem };