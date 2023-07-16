import { OrderBST } from "./order_bst";

export interface Order {
    id: number;
    owner_id: number;
    market_id: number;
    market_symbol: string;
    side: boolean; // true = buy, false = sell
    price: number;
    amount: number;
    filled: number;
    status: number;
    created_at: Date;
    updated_at: Date;
}

export class OrderBook {
    private pair: string;
    private bids: OrderBST;
    private asks: OrderBST;

    constructor(pair: string) {
        this.pair = pair;
        this.bids = new OrderBST();
        this.asks = new OrderBST();
    }

    public get_pair(): string {
        return this.pair;
    }

    public get_bids(): Order[] {
        return this.bids.into_array();
    }

    public get_asks(): Order[] {
        return this.asks.into_array();
    }

    public add_order(order: Order) {
        if (order.side) {
            this.add_bid(order);
        } else {
            this.add_ask(order);
        }
    }

    private add_bid(order: Order) {

    }

    private add_ask(order: Order) {
        
    }
}