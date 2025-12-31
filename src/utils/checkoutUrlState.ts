/**
 * Utility functions for managing checkout state in URL search params
 * This allows sharing URLs with pre-selected tickets, guestlists, etc.
 */

export type CategoryKey = 'tickets' | 'guestlists' | 'reservations' | 'products' | 'promotions';

export interface SelectedQuantities {
    tickets: Record<string, number>;
    guestlists: Record<string, number>;
    reservations: Record<string, number>;
    products: Record<string, number>;
    promotions: Record<string, number>;
}

/**
 * Parse a URL string of quantities into a Record
 * Format: "priceId1:quantity1,priceId2:quantity2"
 * Example: "abc123:2,def456:1" => { abc123: 2, def456: 1 }
 */
export const parseQuantitiesFromUrl = (urlString: string | undefined): Record<string, number> => {
    if (!urlString) return {};

    const quantities: Record<string, number> = {};
    const pairs = urlString.split(',').filter(Boolean);

    for (const pair of pairs) {
        const [id, qty] = pair.split(':');
        if (id && qty) {
            const quantity = parseInt(qty, 10);
            if (!isNaN(quantity) && quantity > 0) {
                quantities[id] = quantity;
            }
        }
    }

    return quantities;
};

/**
 * Serialize a Record of quantities to a URL string
 * Example: { abc123: 2, def456: 1 } => "abc123:2,def456:1"
 * Returns undefined if no quantities (to keep URL clean)
 */
export const serializeQuantitiesToUrl = (quantities: Record<string, number>): string | undefined => {
    const pairs = Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => `${id}:${qty}`);

    return pairs.length > 0 ? pairs.join(',') : undefined;
};

/**
 * Parse all category quantities from URL search params
 */
export const parseAllQuantitiesFromUrl = (searchParams: {
    tickets?: string;
    guestlists?: string;
    reservations?: string;
    products?: string;
    promotions?: string;
}): SelectedQuantities => {
    return {
        tickets: parseQuantitiesFromUrl(searchParams.tickets),
        guestlists: parseQuantitiesFromUrl(searchParams.guestlists),
        reservations: parseQuantitiesFromUrl(searchParams.reservations),
        products: parseQuantitiesFromUrl(searchParams.products),
        promotions: parseQuantitiesFromUrl(searchParams.promotions),
    };
};

/**
 * Create a shareable URL with the current selection state
 */
export const createShareableUrl = (
    baseUrl: string,
    params: {
        step?: number;
        tab?: CategoryKey;
        quantities: SelectedQuantities;
    }
): string => {
    const url = new URL(baseUrl);

    // Add step if not default (1)
    if (params.step && params.step !== 1) {
        url.searchParams.set('step', params.step.toString());
    }

    // Add tab if not default (tickets)
    if (params.tab && params.tab !== 'tickets') {
        url.searchParams.set('tab', params.tab);
    }

    // Add quantities for each category
    const categories: CategoryKey[] = ['tickets', 'guestlists', 'reservations', 'products', 'promotions'];

    for (const category of categories) {
        const serialized = serializeQuantitiesToUrl(params.quantities[category]);
        if (serialized) {
            url.searchParams.set(category, serialized);
        }
    }

    return url.toString();
};

/**
 * Calculate total price from selected quantities
 */
export const calculateTotalPrice = <T extends { prices?: Array<{ id: string; finalPrice: number }> }>(
    items: T[],
    quantities: Record<string, number>
): number => {
    let total = 0;

    items.forEach(item => {
        item.prices?.forEach(price => {
            const quantity = quantities[price.id] || 0;
            total += (price.finalPrice ?? 0) * quantity;
        });
    });

    return total;
};

/**
 * Get total quantity across all items
 */
export const getTotalQuantity = (quantities: Record<string, number>): number => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
};

/**
 * Get total quantity across all categories
 */
export const getTotalQuantityAllCategories = (quantities: SelectedQuantities): number => {
    return Object.values(quantities).reduce((sum, categoryQtys) => {
        return sum + Object.values(categoryQtys as Record<string, number>).reduce((catSum: number, qty: number) => catSum + qty, 0);
    }, 0);
};

/**
 * Check if there are any selected items
 */
export const hasSelectedItems = (quantities: SelectedQuantities): boolean => {
    return getTotalQuantityAllCategories(quantities) > 0;
};

/**
 * Update quantity for a specific price ID
 */
export const updateQuantity = (
    quantities: Record<string, number>,
    priceId: string,
    delta: number,
    maxQuantity?: number
): Record<string, number> => {
    const current = quantities[priceId] || 0;
    let newValue = Math.max(0, current + delta);

    // Apply max quantity constraint if provided
    if (maxQuantity !== undefined) {
        newValue = Math.min(newValue, maxQuantity);
    }

    const updated = { ...quantities };

    if (newValue > 0) {
        updated[priceId] = newValue;
    } else {
        delete updated[priceId];
    }

    return updated;
};