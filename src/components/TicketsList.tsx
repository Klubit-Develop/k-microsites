import TicketCard, { type Ticket } from '@/components/TicketCard';

interface TicketsListProps {
    tickets: Ticket[];
    selectedQuantities: Record<string, number>;
    onQuantityChange: (priceId: string, delta: number) => void;
    isLoading?: boolean;
    className?: string;
}

const TicketsList = ({
    tickets,
    selectedQuantities,
    onQuantityChange,
    isLoading = false,
    className = '',
}: TicketsListProps) => {
    if (isLoading) {
        return (
            <div className={`flex flex-col gap-[16px] w-full ${className}`}>
                {[1, 2].map((index) => (
                    <TicketCard
                        key={index}
                        ticket={{} as Ticket}
                        selectedQuantities={{}}
                        onQuantityChange={() => { }}
                        isLoading={true}
                    />
                ))}
            </div>
        );
    }

    if (tickets.length === 0) {
        return null;
    }

    return (
        <div className={`flex flex-col gap-[16px] w-full ${className}`}>
            {tickets.map(ticket => (
                <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    selectedQuantities={selectedQuantities}
                    onQuantityChange={onQuantityChange}
                />
            ))}
        </div>
    );
};

export default TicketsList;