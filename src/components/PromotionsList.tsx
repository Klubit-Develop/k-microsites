import PromotionCard, { type Promotion, type PromotionProduct } from '@/components/PromotionCard';

interface PromotionsListProps {
    promotions: Promotion[];
    selectedQuantities: Record<string, number>;
    onQuantityChange: (promotionId: string, delta: number) => void;
    onMoreInfo?: (promotion: Promotion) => void;
    isLoading?: boolean;
    eventStartDate?: string;
    eventStartTime?: string;
    className?: string;
}

const PromotionsList = ({
    promotions,
    selectedQuantities,
    onQuantityChange,
    onMoreInfo,
    isLoading = false,
    eventStartDate,
    eventStartTime,
    className = '',
}: PromotionsListProps) => {
    if (isLoading) {
        return (
            <div className={`flex flex-col gap-[16px] w-full ${className}`}>
                {[1, 2].map((index) => (
                    <PromotionCard
                        key={index}
                        promotion={{} as Promotion}
                        quantity={0}
                        onQuantityChange={() => {}}
                        isLoading={true}
                    />
                ))}
            </div>
        );
    }

    if (promotions.length === 0) {
        return null;
    }

    return (
        <div className={`flex flex-col gap-[16px] w-full ${className}`}>
            {promotions.map(promotion => (
                <PromotionCard
                    key={promotion.id}
                    promotion={promotion}
                    quantity={selectedQuantities[promotion.id] || 0}
                    onQuantityChange={onQuantityChange}
                    onMoreInfo={onMoreInfo}
                    eventStartDate={eventStartDate}
                    eventStartTime={eventStartTime}
                />
            ))}
        </div>
    );
};

export default PromotionsList;
export type { Promotion, PromotionProduct, PromotionsListProps };