import { useTranslation } from 'react-i18next';

// ============================================
// TYPES
// ============================================

interface Product {
    id: string;
    name: string;
    description: string | null;
    sku: string | null;
    iconName: string | null;
    price: number;
    isActive: boolean;
}

interface ProductCardProps {
    product: Product;
    quantity: number;
    onQuantityChange: (productId: string, delta: number) => void;
    showHotBadge?: boolean;
}

interface ProductsListProps {
    products: Product[];
    selectedQuantities: Record<string, number>;
    onQuantityChange: (productId: string, delta: number) => void;
    isLoading?: boolean;
}

// ============================================
// ICONS
// ============================================

const MinusIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 10H16" stroke="#F6F6F6" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const PlusIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 10H16" stroke="#F6F6F6" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 4V16" stroke="#F6F6F6" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

// Color coral para productos (mismo que promociones)
const PRODUCT_COLOR = '#ff336d';

// ============================================
// PRODUCT CARD
// ============================================

const ProductCard = ({
    product,
    quantity,
    onQuantityChange,
    showHotBadge = false,
}: ProductCardProps) => {
    const { t } = useTranslation();
    const isSelected = quantity > 0;
    const borderColor = isSelected ? '#e5ff88' : '#232323';

    return (
        <div
            className="relative flex flex-col bg-[#141414] rounded-[16px] cursor-pointer"
            style={{ width: '183px' }}
        >
            {/* Top section - Header & Price Info */}
            <div
                className="flex flex-col px-[16px] pt-[16px] pb-[10px] rounded-t-[16px] border-2 border-b-0"
                style={{ borderColor }}
            >
                {/* Header with indicator and name */}
                <div className="flex items-center gap-[6px] h-[48px]">
                    <div
                        className="w-[6px] h-[6px] rounded-full shrink-0"
                        style={{ backgroundColor: PRODUCT_COLOR }}
                    />
                    <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica leading-tight flex-1 min-w-0">
                        {product.name}
                    </span>
                </div>

                {/* Price info section */}
                <div className="flex flex-col gap-[10px] pt-[12px] border-t-[1.5px] border-[#232323]">
                    <div className="flex items-center gap-[6px]">
                        <span className="text-[#f6f6f6] text-[16px] font-bold font-helvetica">
                            {product.price.toFixed(2).replace('.', ',')}€
                        </span>
                        {showHotBadge && (
                            <div className="flex items-center px-[8px] py-[2px] bg-[#232323] rounded-[25px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                                <span className="text-[#f6f6f6] text-[12px] font-medium font-helvetica">
                                    Hot 🔥
                                </span>
                            </div>
                        )}
                    </div>
                    <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                        {t('event.more_info', 'Más información')}
                    </span>
                </div>
            </div>

            {/* Divider section - contiene los semicírculos y la línea punteada */}
            <div 
                className="relative h-[16px] w-full border-l-2 border-r-2"
                style={{ borderColor }}
            >
                {/* Left semicircle notch - corta el borde izquierdo */}
                <div
                    className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-[10px] h-[20px] bg-[#050505] rounded-r-full"
                    style={{
                        boxShadow: `inset -2px 0 0 0 ${borderColor}`,
                    }}
                />

                {/* Right semicircle notch - corta el borde derecho */}
                <div
                    className="absolute right-[-2px] top-1/2 -translate-y-1/2 w-[10px] h-[20px] bg-[#050505] rounded-l-full"
                    style={{
                        boxShadow: `inset 2px 0 0 0 ${borderColor}`,
                    }}
                />

                {/* Dashed horizontal line */}
                <div className="absolute left-[12px] right-[12px] top-1/2 -translate-y-1/2 h-0 border-t-[1.5px] border-dashed border-[#232323]" />
            </div>

            {/* Bottom section - Quantity Selector */}
            <div
                className="flex flex-col px-[16px] pt-[10px] pb-[16px] rounded-b-[16px] border-2 border-t-0"
                style={{ borderColor }}
            >
                <div className="flex items-center gap-[6px] justify-center w-full">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onQuantityChange(product.id, -1);
                        }}
                        disabled={quantity === 0}
                        className={`
                            flex-1 flex items-center justify-center h-[36px] bg-[#232323] rounded-[8px]
                            ${quantity === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                    >
                        <MinusIcon />
                    </button>
                    <span className={`
                        w-[32px] text-center text-[24px] font-bold font-helvetica leading-none
                        ${isSelected ? 'text-[#e5ff88]' : 'text-[#f6f6f6]'}
                    `}>
                        {quantity}
                    </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onQuantityChange(product.id, 1);
                        }}
                        className="flex-1 flex items-center justify-center h-[36px] bg-[#232323] rounded-[8px] cursor-pointer"
                    >
                        <PlusIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================
// SKELETON CARD
// ============================================

const ProductCardSkeleton = () => (
    <div className="flex flex-col bg-[#141414] rounded-[16px] border-2 border-[#232323] overflow-hidden animate-pulse" style={{ width: '183px' }}>
        {/* Header skeleton */}
        <div className="px-[16px] pt-[16px] pb-[10px]">
            <div className="flex items-center gap-[6px] h-[48px]">
                <div className="w-[6px] h-[6px] rounded-full bg-[#232323]" />
                <div className="h-4 w-24 bg-[#232323] rounded" />
            </div>
            <div className="pt-[12px] border-t-[1.5px] border-[#232323]">
                <div className="h-4 w-16 bg-[#232323] rounded mb-[10px]" />
                <div className="h-3 w-20 bg-[#232323] rounded" />
            </div>
        </div>
        {/* Divider skeleton */}
        <div className="h-[16px] border-x-2 border-[#232323]" />
        {/* Footer skeleton */}
        <div className="px-[16px] pt-[10px] pb-[16px]">
            <div className="flex items-center gap-[6px]">
                <div className="flex-1 h-[36px] bg-[#232323] rounded-[8px]" />
                <div className="w-[32px] h-6 bg-[#232323] rounded" />
                <div className="flex-1 h-[36px] bg-[#232323] rounded-[8px]" />
            </div>
        </div>
    </div>
);

// ============================================
// PRODUCTS LIST
// ============================================

const ProductsList = ({
    products,
    selectedQuantities,
    onQuantityChange,
    isLoading = false,
}: ProductsListProps) => {
    if (isLoading) {
        return (
            <div className="flex flex-wrap gap-4 justify-center">
                {[1, 2, 3, 4].map(i => (
                    <ProductCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-wrap gap-4 justify-center">
            {products.map((product, index) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    quantity={selectedQuantities[product.id] || 0}
                    onQuantityChange={onQuantityChange}
                    showHotBadge={index < 2} // Show badge on first 2 items as example
                />
            ))}
        </div>
    );
};

export default ProductsList;
export type { Product, ProductsListProps };