import { Router } from 'express';
import { get_currencies, get_markets } from './assets_markets'
import { Asset, Market } from '../../../database/sql_models';
import { Result } from '../../../utils/result';
import { RequestError } from '../../user_errors';

const router_api_platform: Router = Router();

interface AssetPublic { //remove the reserve and assigned fields
    id: number; // PK serial
    symbol: string; // varchar(8)
    name: string; // varchar(32)
    reserve?: number; // float (double precision)
    assigned?: number; // float (double precision)
}

router_api_platform.get('/api/platform/currencies', async (req, res) => {
    const result: Result<AssetPublic[],string> = await get_currencies();
    if(result.is_err()) {
        res.status(500).json({success:"false", reason:RequestError.InternalError});
        return;
    }
    const currencies: AssetPublic[] = result.unwrap();
    for(let currency of currencies) {
        delete currency.reserve;
        delete currency.assigned;
    }
    res.status(200).json({success:"true", reason:"Currencies found", currencies: currencies});
})

router_api_platform.get('/api/platform/markets', async (req, res) => {
    const result: Result<Market[],string> = await get_markets();
    if(result.is_err()) {
        res.status(500).json({success:"false", reason:RequestError.InternalError});
        return;
    }
    const currencies: Market[] = result.unwrap();
    res.status(200).json({success:"true", reason:"Markets found", markets: currencies});
})

module.exports = router_api_platform;