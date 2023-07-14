import { Router } from 'express';
import { get_currencies, Currency } from './get_currencies'
import { Result } from '../../../utils/result';

const router_api_platform: Router = Router();

router_api_platform.get('/api/platform/currencies', async (req, res) => {
    const result: Result<Currency[],string> = await get_currencies();
    if(result.is_err()) {
        res.status(500).json({success:"false", message:"Internal server error"});
        return;
    }
    const currencies: Currency[] = result.unwrap();
    for(let currency of currencies) {
        delete currency.reserve;
        delete currency.assigned;
    }
    res.status(200).json({success:"true", message:"Currencies found", currencies: currencies});
})

module.exports = router_api_platform;