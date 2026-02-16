export type GroupedTransaction<T> = T & {
    transactionIds: string[];
};

export const groupTransactionsByEvent = <
    T extends {
        id: string;
        event: { id: string };
        _count: { items: number };
    },
>(
    transactions: T[]
): GroupedTransaction<T>[] => {
    const map = new Map<string, T[]>();

    for (const tx of transactions) {
        const key = tx.event.id;
        const existing = map.get(key);
        if (existing) {
            existing.push(tx);
        } else {
            map.set(key, [tx]);
        }
    }

    return Array.from(map.values()).map((txs) => ({
        ...txs[0],
        transactionIds: txs.map((tx) => tx.id),
        _count: {
            items: txs.reduce((sum, tx) => sum + tx._count.items, 0),
        },
    }));
};