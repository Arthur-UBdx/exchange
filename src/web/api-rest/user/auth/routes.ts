import { Router } from 'express';
import { token_authenticator } from '../auth_middleware';
import { Result } from '../../../../utils/result';
import { get_wallets, WalletError,  deposit, DepositError } from './assets';
import { CacheDatabase } from '../../../../database/cache_database';
import { User, Wallet } from '../../../../database/sql_models';

const router_api_user_auth: Router = Router();

router_api_user_auth.delete('/api/user/logout', token_authenticator, async (req, res) => {
    CacheDatabase.set(req.user.id, null);
    res.clearCookie('auth_token');
    res.status(200).json({success:"true", message:"User logged out"});
});

router_api_user_auth.get('/api/user/wallet', token_authenticator, async (req, res) => {
    const user: User = req.user
    if(user == null) {
        res.status(401).json({success:"false", message:"Unauthorized"});
    }
    const result: Result<Wallet[], WalletError> = await get_wallets(user.id);
    if(result.is_err()) {
        switch (result.unwrap_err()) {
            case WalletError.InternalError:
                res.status(500).json({success:"false", message:"Internal server error"});
                break;
        }
        return;
    }
    const wallets: Wallet[] = result.unwrap();

    res.status(200).json({success:"true", message:"Wallet found", wallets: wallets});
})

router_api_user_auth.post('/api/user/deposit', token_authenticator, async (req, res) => {
    const user = req.user;
    if(user == null) {
        res.status(401).json({success:"false", message:"Unauthorized"});
        return;
    }
    const currency_symbol: string = req.body.currency_symbol;
    const amount: number = req.body.amount;
    if(currency_symbol == undefined || amount == undefined) {
        res.status(400).json({success:"false", message:"Bad request", required_params: ["currency_symbol", "amount"]});
        return;
    }

    const result: Result<Wallet, DepositError> = await deposit(user.id, currency_symbol, amount);
    if(result.is_err()) {
        switch (result.unwrap_err()) {
            case DepositError.InternalError:
                res.status(500).json({success:"false", message:"Internal server error"});
                break;
            case DepositError.BadRequest:
                res.status(400).json({success:"false", message:"Bad request", required_params: ["currency_symbol", "amount"]});
                break;
            case DepositError.NotFound:
                res.status(404).json({success:"false", message:"Currency not found"});
                break;
            case DepositError.NotEnoughReserve:
                res.status(400).json({success:"false", message:"Not enough reserve"});
                break;
        }
        return;
    }

    const wallet: Wallet = result.unwrap();
    res.status(200).json({success:"true", message:"Deposit successful", wallet: wallet});
});

module.exports = router_api_user_auth;