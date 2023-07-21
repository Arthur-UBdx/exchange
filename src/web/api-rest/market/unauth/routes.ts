import { Router } from 'express';
import { OrderBooks, OrderBooksError } from '../../../../engine/markets';

const router_api_market_unauth: Router = Router();

router_api_market_unauth.get('/api/market/:pair/order_book', async (req, res) => {
    const market_symbol: string = req.params.pair;
    if(market_symbol == undefined) {
        res.status(400).json({success:"false", reason:"Bad request"});
        return;
    }
    const result = await OrderBooks.get_order_book(market_symbol);
    if(result.is_err()) {
        switch (result.unwrap_err()) {
            case OrderBooksError.MarketNotFound:
                res.status(404).json({success:"false", reason:"Market not found"});
                break;
            case OrderBooksError.InternalError:
                res.status(500).json({success:"false", reason:"Internal error"});
                break;
        }
        return;
    }
    const order_book = result.unwrap();
    res.status(200).json({success:"true", reason:"Order book found", order_book: order_book});
});

router_api_market_unauth.get('/api/market/:pair/order/:id', async (req, res) => {
    const market_symbol: string = req.params.pair;
    const order_id: number = parseInt(req.params.id);

    if(market_symbol == undefined || order_id == undefined) {
        res.status(400).json({success:"false", reason:"Bad request"});
        return;
    }

    const result = await OrderBooks.get_order_by_id(market_symbol, order_id);
    if(result.is_err()) {
        switch (result.unwrap_err()) {
            case OrderBooksError.MarketNotFound:
                res.status(404).json({success:"false", reason:"Market not found"});
                break;
            case OrderBooksError.OrderNotFound:
                res.status(404).json({success:"false", reason:"Order not found"});
                break;
            case OrderBooksError.InternalError:
                res.status(500).json({success:"false", reason:"Internal error"});
                break;
        }
        return;
    }

    const order = result.unwrap();
    res.status(200).json({success:"true", reason:"Order found", order: order});
})

module.exports = router_api_market_unauth;