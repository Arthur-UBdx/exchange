import { Router } from 'express';
import { token_authenticator } from '../../user/auth_middleware';
import { OrderPending, Order, TransactionError, OrderFindStatus } from '../../../../engine/order_matching';
import { OrderBooks, OrderBooksError } from '../../../../engine/markets';
import { Result } from '../../../../utils/result';
import { SQLDatabase } from '../../../../database/sql_database';
import { RequestError } from '../../../user_errors';

const database = new SQLDatabase();

const router_api_auth_market = Router();

/**
 * arguments:
 * side:string
 * amount: number,
 * price: number,
 */
router_api_auth_market.post('/api/market/:pair/order', token_authenticator, async (req, res) => {
    const user = req.user;
    if(user == null) {
        res.status(401).json({success:"false", reason: RequestError.Unauthorized});
        return;
    }

    if(req.params.pair == null) {
        res.status(400).json({success:"false", reason:RequestError.BadRequest});
        return;
    }

    if( req.body.side == null ||
        req.body.amount == null ||
        req.body.amount <= 0 ||
        req.body.price <= 0 || 
        req.body.price == null || 
        req.body.side != 'buy' && req.body.side != 'sell') 
        {
            res.status(400).json(
                {success:"false",
                reason:RequestError.BadRequest,
                required_params: {
                    "side":"'buy' or 'sell'",
                    "amount":"number (float) > 0",
                    "price":"number (float) > 0"
                }
            });
            return;
    }

    let side: boolean = req.body.side == 'buy' ? true : false;
    let market: string = req.params.pair;

    const result_check_market = await database
        .get_row('markets', 'pair_symbol', market)
        .execute_queries();
    
    if(result_check_market.is_err()) {
        console.error(result_check_market.unwrap_err());
        res.status(500).json({success:"false", reason:RequestError.InternalError});
        return;
    }

    if(result_check_market.unwrap()[0].rowCount == 0) {
        res.status(404).json({success:"false", reason:RequestError.MarketNotFound});
        return;
    }

    if(req.body.side == "buy") {
        side = true;
    } else if(req.body.side == "sell") {
        side = false;
    } else {
        side = null;
    }

    if(side == null || req.body.amount == null || req.body.amount <= 0 || req.body.price <= 0 || req.body.price == null) {
        res.status(400).json(
            {success:"false",
            reason:RequestError.BadRequest,
            required_params: {
                "side":"'buy' or 'sell'",
                "amount":"number (float) > 0",
                "price":"number (float) > 0"
            }
        });
        return;
    }

    let order: OrderPending = {
        owner_id: user.id,
        pair: market,
        side: side,
        price: req.body.price,
        amount: req.body.amount,
        created_at: new Date(),
    }
    
    const result: Result<Order, TransactionError | OrderBooksError> = await OrderBooks.place_order(req.params.pair, order);
    if(result.is_err()) {
        switch (result.unwrap_err()) {
            case TransactionError.InternalError:
                res.status(500).json({success:"false", reason:RequestError.InternalError});
                break;
            case OrderBooksError.InternalError:
                res.status(500).json({success:"false", reason:RequestError.InternalError});
                break;
            case TransactionError.BuyerHasNotEnoughFunds:
                res.status(400).json({success:"false", reason:RequestError.NotEnoughBalance});
                break;
            case TransactionError.SellerHasNotEnoughFunds:
                res.status(400).json({success:"false", reason:RequestError.NotEnoughBalance});
                break;
            case OrderBooksError.MarketNotFound:
                res.status(404).json({success:"false", reason:RequestError.MarketNotFound});
                break;
        }
        return;
    }

    res.status(200).json({success:"true", reason:"Order placed", order: result.unwrap()});
});

router_api_auth_market.delete('/api/market/:pair/order/:id', token_authenticator, async (req, res) => {
    const user = req.user;
    if(user == null) {
        res.status(401).json({success:"false", reason: RequestError.Unauthorized});
        return;
    }

    if(req.params.id == null || req.params.pair == null) {
        res.status(400).json({success:"false", reason:RequestError.BadRequest});
        return;
    }

    const result = await OrderBooks.cancel_order(req.params.pair, parseInt(req.params.id), user.id);
    if(result.is_err()) {
        switch (result.unwrap_err()) {
            case OrderBooksError.InternalError:
                res.status(500).json({success:"false", reason:RequestError.InternalError});
                break;
            case OrderBooksError.OrderNotFound:
                res.status(404).json({success:"false", reason:RequestError.OrderNotFound});
                break;
        }
    }
    res.status(200).json({success:"true", reason:"Order cancelled"});
})

router_api_auth_market.get('/api/market/:pair/myorders/', token_authenticator, async (req, res) => {
    const user = req.user;
    if(user == null) {
        res.status(401).json({success:"false", reason: RequestError.Unauthorized});
        return;
    }

    const result: Result<Order[], OrderBooksError> = await OrderBooks.get_orders_by_owner(req.params.pair, user.id); 

    if (result.is_err()) {
        switch (result.unwrap_err()) {
            case OrderBooksError.InternalError:
                res.status(500).json({success:"false", reason:RequestError.InternalError});
                break;
            case OrderBooksError.MarketNotFound:
                res.status(404).json({success:"false", reason:RequestError.MarketNotFound});
                break;
            case OrderBooksError.OrderNotFound:
                res.status(404).json({success:"false", reason:RequestError.OrderNotFound});
                break;
        }
    }
});

module.exports = router_api_auth_market;