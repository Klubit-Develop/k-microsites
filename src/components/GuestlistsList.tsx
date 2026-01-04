import GuestlistCard, { type Guestlist, type GuestlistPrice } from '@/components/GuestlistCard';

interface GuestlistsListProps {
    guestlists: Guestlist[];
    selectedQuantities: Record<string, number>;
    onQuantityChange: (priceId: string, delta: number) => void;
    onMoreInfo?: (guestlist: Guestlist, price: GuestlistPrice) => void;
    isLoading?: boolean;
    className?: string;
}

const GuestlistsList = ({
    guestlists,
    selectedQuantities,
    onQuantityChange,
    onMoreInfo,
    isLoading = false,
    className = '',
}: GuestlistsListProps) => {
    if (isLoading) {
        return (
            <div className={`flex flex-col gap-[16px] w-full ${className}`}>
                {[1, 2].map((index) => (
                    <GuestlistCard
                        key={index}
                        guestlist={{} as Guestlist}
                        selectedQuantities={{}}
                        onQuantityChange={() => { }}
                        isLoading={true}
                    />
                ))}
            </div>
        );
    }

    if (guestlists.length === 0) {
        return null;
    }

    return (
        <div className={`flex flex-col gap-[16px] w-full ${className}`}>
            {guestlists.map(guestlist => (
                <GuestlistCard
                    key={guestlist.id}
                    guestlist={guestlist}
                    selectedQuantities={selectedQuantities}
                    onQuantityChange={onQuantityChange}
                    onMoreInfo={onMoreInfo}
                />
            ))}
        </div>
    );
};

export default GuestlistsList;