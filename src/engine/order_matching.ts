import { SQLDatabase } from "../database/sql_database";
import { Market } from "../database/sql_models";
import { OrderQueueNode, OrderQueue, OrderQueueTreeNode, OrderBST } from "./order_bst";
import { Mutex } from "async-mutex";
import { Result } from "../utils/result"
import { isReadonlyKeywordOrPlusOrMinusToken } from "typescript";

const database = new SQLDatabase();

export enum TransactionError {
    BuyerHasNotEnoughFunds = 10,
    SellerHasNotEnoughFunds = 11,
    InternalError = -1
}

export enum OrderFindStatus {
    Success = 0,
    NotFound = 4,
    InternalError = -1
}

export enum OrderStatus {
    Open = "Open",
    FilledPartially = "FilledPartially",
    Completed = "Completed",
    Cancelled = "Cancelled"
}

export interface Order extends OrderPending {
    id: number;
    filled: number;
    status: OrderStatus;
    updated_at: Date;
}

export interface OrderPending {
    owner_id: number;
    pair: string;
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
    private users_orders_ids: Map<number, number[]>

    constructor(market: Market) {
        this.mutex = new Mutex();
        this.uid = 0;
        this.market = market;
        this.buy_order_tree = new OrderBST();
        this.buy_order_map = new Map<number, Order>();
        this.sell_order_tree = new OrderBST();
        this.sell_order_map = new Map<number, Order>();
        this.users_orders_ids = new Map<number, number[]>();
    }

    public get_market(): Market {
        return this.market;
    }

    public get_buy_orders(): Order[] {
        return this.buy_order_tree.into_array();
    }

    public get_sell_orders(): Order[] {
        return this.sell_order_tree.into_array();
    }

    public get_order_by_id(id: number): Order | null {
        if(this.buy_order_map.has(id)) {
            return this.buy_order_map.get(id);
        } else if(this.sell_order_map.has(id)) {
            return this.sell_order_map.get(id);
        } else {
            return null;
        }
    }

    public get_orders_by_owner(user_id: number): Order[] {
        let orders: Order[] = [];
        const user_orders_ids = this.users_orders_ids.get(user_id);
        for(let i = 0; i < user_orders_ids.length; i++) {
            const order = this.get_order_by_id(user_orders_ids[i]);
            if(order != null) {
                orders.push(order);
            } else {
                console.error(`order with id ${user_orders_ids[i]} not found while it should exist`);
            }
        }
        return orders;
    }

    public async place_order(order_pending: OrderPending): Promise<Result<Order, TransactionError>> {
        const order = {
            ...order_pending,
            id: this.uid++,
            filled: 0,
            status: OrderStatus.Open,
            updated_at: new Date()
        }

        //check if user has enough funds
        const fetch_wallets_balance = await database.new_query({
            text: `SELECT * FROM wallets WHERE owner_id = $1 AND currency_id = $2`,
            values: [order.owner_id, order.side ? this.market.asset2_id : this.market.asset1_id]
        }).execute_queries();

        
        if(fetch_wallets_balance.is_err()) {
            console.error(fetch_wallets_balance.unwrap_err());
            return Result.Err(TransactionError.InternalError);
        }
        
        const wallet = fetch_wallets_balance.unwrap()[0].rows[0];
        const price_to_pay = order.side ? order.amount*order.price : order.amount;

        if(wallet?.balance < price_to_pay || wallet == undefined) {
            return Result.Err(order.side ? TransactionError.BuyerHasNotEnoughFunds : TransactionError.SellerHasNotEnoughFunds);
        }

        // add the order to the map of this user orders
        let user_orders = this.users_orders_ids.get(order.owner_id);
        if(user_orders == undefined) {user_orders = [];}
        user_orders.push(order.id);
        this.users_orders_ids.set(order.owner_id, user_orders);

        // assign the amount of the order to the user's wallet
        const currency_to_assign = order.side ? this.market.asset2_id : this.market.asset1_id;

        const result_assignement = await database.new_query({
            text: `UPDATE wallets SET assigned_to_order = assigned_to_order + $1 WHERE owner_id = $2 AND currency_id = $3`,
            values: [price_to_pay, order.owner_id, currency_to_assign]
        }).execute_queries();

        if(result_assignement.is_err()) {
            console.error(result_assignement.unwrap_err());
            return Result.Err(TransactionError.InternalError);
        }

        let result: Result<null, TransactionError>;
        if(order.side) {
            this.buy_order_map.set(order.id, order);
            result = await this.resolve_buy_order(order);
        } else {
            this.sell_order_map.set(order.id, order);
            result = await this.resolve_sell_order(order);
        }
    
        if (result.is_err()) {
            return Result.Err(result.unwrap_err());
        } else {
            return Result.Ok(order);
        }

    }

    private async resolve_buy_order(order: Order): Promise<Result<null, TransactionError>> {
        await this.mutex.acquire();

        let left: number = order.amount;
        const price = order.price;
        
        while(left > 0) { // could optimise without having to find min every time but to check if the min queue is empty and then find the next min queue if it is
            const min_order_queue: OrderQueue = this.sell_order_tree.find_min();
            if(min_order_queue == null) {
                break;
            }
            let min_order: Order = min_order_queue.peek();
            if(min_order.price > price) {
                break;
            }
            if(min_order.amount - min_order.filled > left) { // if the order found amount is greater than the left amount to fill
                const result_transaction = await perform_transaction(
                    order.owner_id,
                    min_order.owner_id,
                    this.market.id,
                    this.market.asset1_id,
                    this.market.asset2_id,
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
                    this.market.id,
                    this.market.asset1_id,
                    this.market.asset2_id,
                    min_order.amount - min_order.filled,
                    min_order.price
                );

                if(result_transaction.is_err()) {
                    console.error(result_transaction.unwrap_err());
                    this.mutex.release();
                    return Result.Err(result_transaction.unwrap_err());
                }
                
                left = left - (min_order.amount - min_order.filled);
                this.sell_order_tree.remove_min();
            }
        }

        if(left > 0) {
            this.buy_order_map.set(order.id, order);
            this.buy_order_tree.insert(order);
        }
        this.mutex.release();
        return Result.Ok(null);
    }

    private async resolve_sell_order(order: Order): Promise<Result<null, TransactionError>> {
        await this.mutex.acquire();

        let left: number = order.amount;
        const price = order.price;

        while(left > 0) {
            const max_order_queue: OrderQueue = this.buy_order_tree.find_max();
            if(max_order_queue == null) {
                break;
            }
            let max_order: Order = max_order_queue.peek();
            if(max_order.price < price) {
                break;
            }
            if(max_order.amount - max_order.filled > left) { // if the order found amount is greater than the left amount to fill
                const result_transaction = await perform_transaction(
                    max_order.owner_id,
                    order.owner_id,
                    this.market.id,
                    this.market.asset1_id,
                    this.market.asset2_id,
                    left,
                    max_order.price
                );

                if(result_transaction.is_err()) {
                    console.error(result_transaction.unwrap_err());
                    this.mutex.release();
                    return Result.Err(result_transaction.unwrap_err());
                }

                max_order.filled = max_order.filled + left;
                max_order.status = OrderStatus.FilledPartially;
                max_order.updated_at = new Date();
                this.buy_order_tree.replace_max(max_order);
                left = 0;

            } else {
                const result_transaction = await perform_transaction(
                    max_order.owner_id,
                    order.owner_id,
                    this.market.id,
                    this.market.asset1_id,
                    this.market.asset2_id,
                    max_order.amount - max_order.filled,
                    max_order.price
                );

                if(result_transaction.is_err()) {
                    console.error(result_transaction.unwrap_err());
                    this.mutex.release();
                    return Result.Err(result_transaction.unwrap_err());
                }

                left = left - (max_order.amount - max_order.filled);
                this.buy_order_tree.remove_max();
            }
        }

        if(left > 0) {
            this.sell_order_map.set(order.id, order);
            this.sell_order_tree.insert(order);
        }
        this.mutex.release();
        return Result.Ok(null);
    }

    public cancel_order(id: number, user_id: number): OrderFindStatus {
        const order = this.get_order_by_id(id);
        if(order == null) {
            return OrderFindStatus.NotFound;
        }
        if(order.owner_id != user_id) {
            return OrderFindStatus.NotFound;
        }
        if(order.side) {
            this.buy_order_tree.remove_order(order);
            this.buy_order_map.delete(order.id);
        }
        else {
            this.sell_order_tree.remove_order(order);
            this.sell_order_map.delete(order.id);
        }
        this.users_orders_ids.set(user_id, this.users_orders_ids.get(user_id).filter((value) => value != id));
        return OrderFindStatus.Success;
    }
}

/**
 * Performs a transaction between two users and two currencies (for example BTC/USDT, the buyer gets BTC and the seller gets USDT)
 * @param buyer_id the id of the buyer
 * @param seller_id the id of the seller 
 * @param.asset1_id the id of the currency the buyer is buying
 * @param.asset2_id the id of the currency the buyer if offering
 * @param amount the amount of.asset1 the buyer is buying
 * @param price the price per unit of.asset1 (ex 300 for BTC/USDT, the buyer is offering 300 USDT per BTC)
 */
export async function perform_transaction(
    buyer_id: number,
    seller_id: number,
    market_id: number,
    asset1_id: number,
    asset2_id: number,
    amount: number,
    price: number): Promise<Result<null, TransactionError>> {

    const fetch_currencies_names = await database.get_row('assets', 'id', asset1_id).get_row('assets', 'id', asset2_id).execute_queries();
    
    if(fetch_currencies_names.is_err()) {
        console.error(fetch_currencies_names.unwrap_err());
        return Result.Err(TransactionError.InternalError);
    }

    const asset1 = fetch_currencies_names.unwrap()[0].rows[0];
    const asset2 = fetch_currencies_names.unwrap()[1].rows[0];

    const fecth_wallets_balance = await database
        .new_query({
            text: `SELECT * FROM wallets WHERE owner_id = $1 AND currency_id = $2`,
            values: [buyer_id, asset2_id]
        })
        .new_query({
            text: `SELECT * FROM wallets WHERE owner_id = $1 AND currency_id = $2`,
            values: [seller_id, asset1_id]
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
            values: [buyer_id, asset1_id, amount, asset1.symbol, asset1.name]
        }
    ).new_query(
        {
            text: `UPDATE wallets SET balance = balance - $1, assigned_to_order = assigned_to_order - $1 WHERE owner_id = $2 AND currency_id = $3;`,
            values: [amount, seller_id, asset1_id]
        }
    ).new_query(
        {
            text: `INSERT INTO wallets (owner_id, currency_id, symbol, name, balance, assigned_to_order)
                    VALUES ($1, $2, $4, $5, $3, 0.0)
                    ON CONFLICT (owner_id, currency_id) DO UPDATE
                    SET balance = wallets.balance + EXCLUDED.balance;`,
            values: [seller_id, asset2_id, amount*price, asset2.symbol, asset2.name]
        }
    ).new_query(
        {
            text: `UPDATE wallets SET balance = balance - $1, assigned_to_order = assigned_to_order - $1 WHERE owner_id = $2 AND currency_id = $3;`,
            values: [amount*price, buyer_id, asset2_id]
        }
    ).new_query(
        {
            text: `INSERT INTO transactions (buyer_id, seller_id, market_id, price, amount, timestamp) VALUES ($1, $2, $3, $4, $5, $6);`,
            values: [buyer_id, seller_id, market_id, price, amount, new Date()]
        }
    ).execute_queries()

    if(result_transaction.is_err()) {
        console.error(result_transaction.unwrap_err());
        return Result.Err(TransactionError.InternalError);
    }

    return Result.Ok(null);
}