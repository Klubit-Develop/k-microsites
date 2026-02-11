interface Product {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    currency?: string;
    isActive?: boolean;
}

interface ProductCardProps {
    product: Product;
    quantity: number;
    onQuantityChange: (productId: string, delta: number) => void;
    onMoreInfo?: (product: Product) => void;
    isLoading?: boolean;
    className?: string;
}

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

const PRODUCT_COLOR = '#ff336d';

const ProductCard = ({
    product,
    quantity,
    onQuantityChange,
    onMoreInfo,
    isLoading = false,
    className = '',
}: ProductCardProps) => {
    if (isLoading) {
        return (
            <div className={`relative flex flex-col bg-[#141414] border-2 border-[#232323] rounded-[16px] w-full overflow-visible animate-pulse ${className}`}>
                <div
                    className="absolute right-[140px] top-[-2px] w-[18px] h-[10px] bg-[#050505] rounded-b-full z-10"
                    style={{
                        borderLeft: '2px solid #232323',
                        borderRight: '2px solid #232323',
                        borderBottom: '2px solid #232323',
                    }}
                />

                <div
                    className="absolute right-[140px] bottom-[-2px] w-[18px] h-[10px] bg-[#050505] rounded-t-full z-10"
                    style={{
                        borderLeft: '2px solid #232323',
                        borderRight: '2px solid #232323',
                        borderTop: '2px solid #232323',
                    }}
                />

                <div className="absolute right-[148px] top-[8px] bottom-[8px] w-0 border-l-[1.5px] border-dashed border-[#232323] z-0" />

                <div className="flex items-center h-[56px] px-[16px] border-b-[1.5px] border-[#232323]">
                    <div className="h-5 w-32 bg-[#232323] rounded" />
                </div>

                <div className="flex items-center justify-between px-[16px] py-[12px]">
                    <div className="flex flex-col gap-[10px]">
                        <div className="h-5 w-20 bg-[#232323] rounded" />
                        <div className="h-4 w-24 bg-[#232323] rounded" />
                    </div>
                    <div className="flex items-center gap-[6px]">
                        <div className="w-[36px] h-[36px] bg-[#232323] rounded-[8px]" />
                        <div className="w-[32px] h-6 bg-[#232323] rounded" />
                        <div className="w-[36px] h-[36px] bg-[#232323] rounded-[8px]" />
                    </div>
                </div>
            </div>
        );
    }

    const isSelected = quantity > 0;
    const borderColor = isSelected ? '#e5ff88' : '#232323';

    return (
        <div
            className={`
                relative flex flex-col bg-[#141414] border-2 rounded-[16px] w-full overflow-visible
                ${isSelected ? 'border-[#e5ff88]' : 'border-[#232323]'}
                ${className}
            `}
        >
            <div
                className="absolute right-[140px] top-[-2px] w-[18px] h-[10px] bg-[#050505] rounded-b-full z-10"
                style={{
                    borderLeft: `2px solid ${borderColor}`,
                    borderRight: `2px solid ${borderColor}`,
                    borderBottom: `2px solid ${borderColor}`,
                }}
            />

            <div
                className="absolute right-[140px] bottom-[-2px] w-[18px] h-[10px] bg-[#050505] rounded-t-full z-10"
                style={{
                    borderLeft: `2px solid ${borderColor}`,
                    borderRight: `2px solid ${borderColor}`,
                    borderTop: `2px solid ${borderColor}`,
                }}
            />

            <div className="absolute right-[148px] top-[8px] bottom-[8px] w-0 border-l-[1.5px] border-dashed border-[#232323] z-0" />

            <div
                className="flex items-center h-[56px] px-[16px] border-b-[1.5px] border-[#232323] cursor-pointer"
                onClick={() => onMoreInfo?.(product)}
            >
                <div className="flex items-center gap-[6px]">
                    <div
                        className="w-[6px] h-[6px] rounded-full shrink-0"
                        style={{ backgroundColor: PRODUCT_COLOR }}
                    />
                    <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">
                        {product.name}
                    </span>
                </div>
            </div>

            <div
                className="flex items-center justify-between px-[16px] py-[12px] cursor-pointer"
                onClick={() => onMoreInfo?.(product)}
            >
                <div className="flex flex-col gap-[10px]">
                    <div className="flex items-center gap-[8px]">
                        <span className="text-[#f6f6f6] text-[16px] font-bold font-helvetica">
                            {product.price.toFixed(2).replace('.', ',')}€
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-[6px]">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onQuantityChange(product.id, -1);
                        }}
                        disabled={quantity === 0}
                        className={`
                            flex items-center justify-center w-[36px] h-[36px] bg-[#232323] rounded-[8px]
                            ${quantity === 0 ? 'opacity-50' : 'cursor-pointer'}
                        `}
                    >
                        <MinusIcon />
                    </button>
                    <span className={`
                        w-[32px] text-center text-[32px] font-semibold font-borna leading-none
                        ${isSelected ? 'text-[#e5ff88]' : 'text-[#f6f6f6]'}
                    `}>
                        {quantity}
                    </span>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onQuantityChange(product.id, 1);
                        }}
                        className="flex items-center justify-center w-[36px] h-[36px] bg-[#232323] rounded-[8px] cursor-pointer"
                    >
                        <PlusIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
export type { Product, ProductCardProps };