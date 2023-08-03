import { Router } from 'express';
import { getPairPrice } from './tempapp';

const router_api_tempapp: Router = Router();

router_api_tempapp.get('/api/tempapp/:pair/price', (req, res) => {
    const pair: string = req.params.pair;
    if(pair == undefined) {
        res.status(400).json({success:"false", reason:"Bad request"});
        return;
    }
    getPairPrice(pair).then((price) => {
        if(price == null) {
            res.status(500).json({success:"false", reason:"Internal error"});
            return;
        }
        res.status(200).json({success:"true", reason:"Price found", price: price});
    });
})

module.exports = router_api_tempapp;