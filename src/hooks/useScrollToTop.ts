import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from '@tanstack/react-router';

interface ScrollToTopOptions {
    behavior?: ScrollBehavior;
}

export const scrollToTop = (options: ScrollToTopOptions = {}) => {
    const { behavior = 'smooth' } = options;
    window.scrollTo({ top: 0, left: 0, behavior });
};

export const useScrollToTop = (options: ScrollToTopOptions = {}) => {
    const location = useLocation();
    const prevPathnameRef = useRef(location.pathname);

    useEffect(() => {
        if (prevPathnameRef.current !== location.pathname) {
            scrollToTop(options);
            prevPathnameRef.current = location.pathname;
        }
    }, [location.pathname, options]);

    return useCallback((overrideOptions?: ScrollToTopOptions) => {
        scrollToTop(overrideOptions ?? options);
    }, [options]);
};

export default useScrollToTop;