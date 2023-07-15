import { Router } from 'express';
import { get_currencies } from './get_currencies'
import { Asset } from '../../../database/sql_models';
import { Result } from '../../../utils/result';

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
        res.status(500).json({success:"false", message:"Internal server error"});
        return;
    }
    const currencies: AssetPublic[] = result.unwrap();
    for(let currency of currencies) {
        delete currency.reserve;
        delete currency.assigned;
    }
    res.status(200).json({success:"true", message:"Currencies found", currencies: currencies});
})

module.exports = router_api_platform;