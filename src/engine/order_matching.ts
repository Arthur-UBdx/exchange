import { SQLDatabase } from "../database/sql_database";
import sql_database_connector from "../database/sql_database_connector";
import { Market } from "../database/sql_models";
import { OrderQueueNode, OrderQueue, OrderQueueTreeNode, OrderBST } from "./order_bst";
import { Mutex } from "async-mutex";
import { Result } from "../utils/result"
import { off } from "process";

const database = new SQLDatabase();

export enum TransactionError {
    BuyerHasNotEnoughFunds,
    SellerHasNotEnoughFunds,
    InternalError
}

enum OrderStatus {
    Open = 0,
    FilledPartially = 1,
    Completed = 2,
    Cancelled = 3
}

export interface Order extends OrderPending {
    id: number;
    filled: number;
    status: OrderStatus;
    updated_at: Date;
}

export interface OrderPending {
    owner_id: number;
    market_id: number;
    market_symbol: string;
    side: boolean; // true = buy, false = sell
    price: number;
    amount: number;
    created_at: Date;
}

export class OrderBook {
    public mutex: Mutex;
    private uid: number;
    private market: Market;
    private buy_order_tree: OrderBST;
    private sell_order_tree: OrderBST;
    private buy_order_map: Map<number, Order>;
    private sell_order_map: Map<number, Order>;

    constructor(market: Market) {
        this.mutex = new Mutex();
        this.uid = 0;
        this.market = market;
        this.buy_order_tree = new OrderBST();
        this.buy_order_map = new Map<number, Order>();
        this.sell_order_tree = new OrderBST();
        this.sell_order_map = new Map<number, Order>();
    }

    public get_market(): Market {
        return this.market;
    }

    public get_buy_order(): Order[] {
        return this.buy_order_tree.into_array();
    }

    public get_sell_order(): Order[] {
        return this.sell_order_tree.into_array();
    }

    public async add_order(order_pending: OrderPending): Promise<void> {
        const order = {
            id: this.uid++,
            filled: 0,
            status: OrderStatus.Open,
            updated_at: new Date(),
            ...order_pending
        }
    }

    public async resolve_buy_order(order: Order): Promise<Result<null, TransactionError>> {
        await this.mutex.acquire();

        let left: number = order.amount;
        const price = order.price;
        
        while(left > 0) { // could optimise without having to find min every time but to check if the min queue is empty and then find the next min queue if it is
            let min_order: Order = this.sell_order_tree.find_min().peek();
            if(min_order.price > price) {
                break;
            }
            if(min_order.amount - min_order.filled > left) { // if the order found amount is greater than the left amount to fill
                const result_transaction = await perform_transaction(
                    order.owner_id,
                    min_order.owner_id,
                    this.market.currency1_id,
                    this.market.currency2_id,
                    left,
                    min_order.price
                );

                if(result_transaction.is_err()) {
                    console.error(result_transaction.unwrap_err());
                    this.mutex.release();
                    return Result.Err(result_transaction.unwrap_err());
                }
                
                min_order.filled = min_order.filled + left;
                min_order.status = OrderStatus.FilledPartially;
                min_order.updated_at = new Date();
                this.sell_order_tree.replace_min(min_order);
                left = 0;
                
            } else { // if the order found amount is less or equal than the left amount to fill

                const result_transaction = await perform_transaction(
                    order.owner_id,
                    min_order.owner_id,
                    this.market.currency1_id,
                    this.market.currency2_id,
                    min_order.amount - min_order.filled,
                    min_order.price
                );

                if(result_transaction.is_err()) {
                    console.error(result_transaction.unwrap_err());
                    this.mutex.release();
                    return Result.Err(result_transaction.unwrap_err());
                }
                
                left = left - (min_order.amount - min_order.filled);
                this.sell_order_tree.delete_min();

                //update the users accounts
            }
        }

        this.buy_order_map.set(order.id, order);
        this.buy_order_tree.insert(order);

        this.mutex.release();
        return Result.Ok(null);
    }
}

/**
 * Performs a transaction between two users and two currencies (for example BTC/USDT, the buyer gets BTC and the seller gets USDT)
 * @param buyer_id the id of the buyer
 * @param seller_id the id of the seller 
 * @param currency1_id the id of the currency the buyer is buying
 * @param currency2_id the id of the currency the buyer if offering
 * @param amount the amount of currency1 the buyer is buying
 * @param price the price per unit of currency1 (ex 300 for BTC/USDT, the buyer is offering 300 USDT per BTC)
 */
export async function perform_transaction(
    buyer_id: number,
    seller_id: number,
    currency1_id: number,
    currency2_id: number,
    amount: number,
    price: number): Promise<Result<null, TransactionError>> {

    const fetch_currencies_names = await database.get_row('assets', 'id', currency1_id).get_row('assets', 'id', currency2_id).execute_queries();
    
    if(fetch_currencies_names.is_err()) {
        console.error(fetch_currencies_names.unwrap_err());
        return Result.Err(TransactionError.InternalError);
    }

    const currency1 = fetch_currencies_names.unwrap()[0].rows[0];
    const currency2 = fetch_currencies_names.unwrap()[1].rows[0];

    const fecth_wallets_balance = await database
        .new_query({
            text: `SELECT * FROM wallets WHERE owner_id = $1 AND currency_id = $2`,
            values: [buyer_id, currency2_id]
        })
        .new_query({
            text: `SELECT * FROM wallets WHERE owner_id = $1 AND currency_id = $2`,
            values: [seller_id, currency1_id]
        }).execute_queries();

    if(fecth_wallets_balance.is_err()) {
        console.error(fecth_wallets_balance.unwrap_err());
        return Result.Err(TransactionError.InternalError);
    }
    let buyer_wallet;
    let seller_wallet;

    try {
        buyer_wallet = fecth_wallets_balance.unwrap()[0].rows[0];
    } catch {
        return Result.Err(TransactionError.BuyerHasNotEnoughFunds);
    }

    try {
        seller_wallet = fecth_wallets_balance.unwrap()[1].rows[0];
    } catch {
        return Result.Err(TransactionError.SellerHasNotEnoughFunds);
    }

    if(buyer_wallet.balance < amount*price) {
        return Result.Err(TransactionError.BuyerHasNotEnoughFunds);
    }
    if(seller_wallet.balance < amount) {
        return Result.Err(TransactionError.SellerHasNotEnoughFunds);
    }
    
    const result_transaction = await database.new_query(
        {
            text: `INSERT INTO wallets (owner_id, currency_id, symbol, name, balance, assigned_to_order)
                    VALUES ($1, $2, $4, $5, $3, 0.0)
                    ON CONFLICT (owner_id, currency_id) DO UPDATE
                    SET balance = wallets.balance + EXCLUDED.balance;`,
            values: [buyer_id, currency1_id, amount, currency1.symbol, currency1.name]
        }
    ).new_query(
        {
            text: `UPDATE wallets SET balance = balance - $1 WHERE owner_id = $2 AND currency_id = $3`,
            values: [amount, seller_id, currency1_id]
        }
    ).new_query(
        {
            text: `INSERT INTO wallets (owner_id, currency_id, symbol, name, balance, assigned_to_order)
                    VALUES ($1, $2, $4, $5, $3, 0.0)
                    ON CONFLICT (owner_id, currency_id) DO UPDATE
                    SET balance = wallets.balance + EXCLUDED.balance;`,
            values: [seller_id, currency2_id, amount*price, currency2.symbol, currency2.name]
        }
    ).new_query(
        {
            text: `UPDATE wallets SET balance = balance - $1 WHERE owner_id = $2 AND currency_id = $3`,
            values: [amount*price, buyer_id, currency2_id]
        }
    ).execute_queries()

    if(result_transaction.is_err()) {
        console.error(result_transaction.unwrap_err());
        return Result.Err(TransactionError.InternalError);
    }

    return Result.Ok(null);
}