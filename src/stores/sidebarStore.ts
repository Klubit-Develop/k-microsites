import { create } from 'zustand';

interface SidebarStore {
    open: boolean;
    isMobile: boolean;
    setOpen: (open: boolean) => void;
    setIsMobile: (isMobile: boolean) => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
    open: true,
    isMobile: false,
    setOpen: (open) => set({ open }),
    setIsMobile: (isMobile) => set({ isMobile })
}));