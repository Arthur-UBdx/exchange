import { SQLDatabase } from "../database/sql_database";
import { Market } from "../database/sql_models";
import { Order, OrderPending, OrderBook, TransactionError, OrderFindStatus } from "./order_matching";
import { Result } from "../utils/result"

const database = new SQLDatabase();

export enum OrderBooksError {
    InternalError = -1,
    MarketNotFound = 3,
    OrderNotFound = 4,
}

export class OrderBooks {
    public static order_books: OrderBook[] = [];

    public static async init() {
        const markets: Market[] = (await database.new_query({
            text: 'SELECT * FROM markets',
            values: [],
        }).execute_queries()).unwrap()[0].rows as Market[];

        const reset_assigned_to_order = await database.new_query({
            text: 'UPDATE wallets SET assigned_to_order = 0',
            values: [],
        }).execute_queries();

        reset_assigned_to_order.unwrap();
        
        for(let market of markets) {
            const order_book: OrderBook = new OrderBook(market);
            this.order_books.push(order_book);
        }
    }

    /**
     * Returns the index of the order book in the array if found, null otherwise
     * @param pair
     * @returns
     */
    private static find_order_book(pair: string): number | null {
        for(let i = 0; i < this.order_books.length; i++) {
            if(this.order_books[i].get_market().pair_symbol == pair) {
                return i;
            }
        }
        return null;
    }

    /**
     * Returns the buy order book if found, null otherwise
     * @param pair 
     * @returns 
     */
    public static async get_buy_orders(pair: string): Promise<Result<Order[], OrderBooksError>> {
        const index = this.find_order_book(pair);
        if(index == null) {
            return Result.Err(OrderBooksError.MarketNotFound);
        }

        return Result.Ok(this.order_books[index].get_buy_orders());
    }

    /**
     * Returns the sell order book if found, null otherwise
     * @param pair
     * @returns
     */
    public static async get_sell_orders(pair: string): Promise<Result<Order[], OrderBooksError>> {
        const index = this.find_order_book(pair);
        if(index == null) {
            return Result.Err(OrderBooksError.MarketNotFound);
        }

        return Result.Ok(this.order_books[index].get_sell_orders());
    }
    
    /**
     * Returns the whole order book if found, null otherwise
     * @param pair 
     * @returns 
     */
    public static async get_order_book(pair: string): Promise<Result<Object, OrderBooksError>> {
        const index = this.find_order_book(pair);
        if(index == null) {
            return Result.Err(OrderBooksError.MarketNotFound);
        }

        const buy_order_book: Order[] = this.order_books[index].get_buy_orders();
        const sell_order_book: Order[] = this.order_books[index].get_sell_orders();

        return Result.Ok({buy_order_book: buy_order_book, sell_order_book: sell_order_book});
    }

    /**
     * Returns an order by its id
     * @param pair 
     * @param order_id 
     * @returns 
     */
    public static async get_order_by_id(pair: string, order_id: number): Promise<Result<Order, OrderBooksError>> {
        const index = this.find_order_book(pair);
        if(index == null) {
            return Result.Err(OrderBooksError.MarketNotFound);
        }

        const order: Order | null = this.order_books[index].get_order_by_id(order_id);
        if(order == null) {
            return Result.Err(OrderBooksError.OrderNotFound);
        }
        return Result.Ok(order);
    }

    /**
     * Gets all orders by a user id
     * @param pair 
     * @param user_id 
     * @returns 
     */
    public static async get_orders_by_owner(pair: string, user_id: number): Promise<Result<Order[], OrderBooksError>> {
        const index = this.find_order_book(pair);
        if(index == null) {
            return Result.Err(OrderBooksError.MarketNotFound);
        }

        return Result.Ok(this.order_books[index].get_orders_by_owner(user_id));
    }

    /**
     * Places an order in the order book
     * @param pair 
     * @param order 
     * @returns 
     */
    public static async place_order(pair: string, order: OrderPending): Promise<Result<Order, OrderBooksError | TransactionError>> {
        const index = this.find_order_book(pair);
        if(index == null) {
            return Result.Err(OrderBooksError.MarketNotFound);
        }
        
        return this.order_books[index].place_order(order);
    }

    /**
     * Removes an order from the order book
     * @param pair 
     * @param order_id 
     * @returns 
     */
    public static async cancel_order(pair: string, order_id: number, user_id: number): Promise<Result<OrderFindStatus, OrderBooksError>> {
        const index = this.find_order_book(pair);
        if(index == null) {
            return Result.Err(OrderBooksError.MarketNotFound);
        }

        return Result.Ok(this.order_books[index].cancel_order(order_id, user_id));
    }
}