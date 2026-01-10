import ProductCard, { type Product } from '@/components/ProductCard';

interface ProductsListProps {
    products: Product[];
    selectedQuantities: Record<string, number>;
    onQuantityChange: (productId: string, delta: number) => void;
    onMoreInfo?: (product: Product) => void;
    isLoading?: boolean;
    className?: string;
}

const ProductsList = ({
    products,
    selectedQuantities,
    onQuantityChange,
    onMoreInfo,
    isLoading = false,
    className = '',
}: ProductsListProps) => {
    if (isLoading) {
        return (
            <div className={`flex flex-col gap-[16px] w-full ${className}`}>
                {[1, 2].map((index) => (
                    <ProductCard
                        key={index}
                        product={{} as Product}
                        quantity={0}
                        onQuantityChange={() => {}}
                        isLoading={true}
                    />
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return null;
    }

    return (
        <div className={`flex flex-col gap-[16px] w-full ${className}`}>
            {products.map(product => (
                <ProductCard
                    key={product.id}
                    product={product}
                    quantity={selectedQuantities[product.id] || 0}
                    onQuantityChange={onQuantityChange}
                    onMoreInfo={onMoreInfo}
                />
            ))}
        </div>
    );
};

export default ProductsList;
export type { Product, ProductsListProps };