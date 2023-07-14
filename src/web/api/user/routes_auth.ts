import { Router } from 'express';
import { token_authenticator } from './auth_middleware';
import { Result } from '../../../utils/result';
import { get_wallets, WalletError } from './auth/wallets';
import { CacheDatabase } from '../../../database/cache_database';
import { User, Wallet } from '../../../database/sql_models';

const router_api_user_auth: Router = Router();

router_api_user_auth.get('/logout', token_authenticator, async (req, res) => {
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

module.exports = router_api_user_auth;